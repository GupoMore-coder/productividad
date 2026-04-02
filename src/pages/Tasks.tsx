import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupContext';
import { useTasks, Task } from '../context/TaskContext';
import { hasNotificationPermission, scheduleTaskNotifications, cancelTaskNotifications, scheduleLocalNotification } from '../services/NotificationsService';
import CreateTaskModal from '../components/CreateTaskModal';
import WelcomeDailyModal from '../components/WelcomeDailyModal';
import HelpManualModal from '../components/HelpManualModal';
import ExpiredTeamTaskModal from '../components/ExpiredTeamTaskModal';
import ImageZoomModal from '../components/ImageZoomModal';
import CalendarView from '../components/CalendarView';
import TaskCard from '../components/TaskCard';
import HistoryView from '../components/HistoryView';
import TaskAnalytics from '../components/TaskAnalytics';
import MonthlyReportModal from '../components/MonthlyReportModal';
import UserDirectory from '../components/UserDirectory';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { addDays, isSameDay, parseISO } from 'date-fns';

// ── Smart LED indicator ────────────────────────────────────────────
function LedIndicator({ user, onLateAlert }: { user: any; onLateAlert: () => void }) {
  const [color, setColor] = useState<'green' | 'gold' | 'red'>('green');
  const [alerted, setAlerted] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const isLate = h > 20 || (h === 20 && m >= 30);
      const isAdmin = user?.isSuperAdmin;

      const next: 'green' | 'gold' | 'red' = isLate ? 'red' : isAdmin ? 'gold' : 'green';
      setColor(prev => {
        if (next === 'red' && prev !== 'red' && !alerted) {
          onLateAlert();
          setAlerted(true);
        }
        return next;
      });
    };
    check();
    const t = setInterval(check, 30000); 
    return () => clearInterval(t);
  }, [user, alerted, onLateAlert]);

  const palette = {
    green: { bg: '#4ade80', glow: '#4ade80' },
    gold:  { bg: '#d4bc8f', glow: '#d4bc8f' },
    red:   { bg: '#f87171', glow: '#f87171' },
  }[color];

  const labels = { green: 'En línea', gold: 'Administrador', red: 'Fuera de horario' };

  return (
    <div
      title={labels[color]}
      style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: palette.bg,
        boxShadow: `0 0 6px 2px ${palette.glow}88`,
        transition: 'background 0.4s, box-shadow 0.4s',
        position: 'relative'
      }}
    />
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const { groups, memberships } = useGroups();
  const { tasks, addTask, updateTask, loading: tasksLoading } = useTasks();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [lateAlert, setLateAlert] = useState(false);
  const [alertedTasks, setAlertedTasks] = useState<string[]>([]);
  const [expiredModalTask, setExpiredModalTask] = useState<Task | null>(null);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [birthdayAlerts, setBirthdayAlerts] = useState<string[]>([]);
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);

  const myUserId = user?.id || user?.email;
  
  const isMyBirthday = () => {
    if (!user?.birth_date) return false;
    const bday = parseISO(user.birth_date);
    const today = new Date();
    return bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth();
  };

  // Birthday Alerts Logic
  useEffect(() => {
    async function checkBirthdays() {
      let allUsers: any[] = [];
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('profiles').select('*');
        if (data) allUsers = data;
      } else {
        allUsers = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
      }

      const today = new Date();
      const in7Days = addDays(today, 7);
      const in1Day = addDays(today, 1);
      
      const newAlerts: string[] = [];
      allUsers.forEach(u => {
          if (!u.birth_date || u.id === user?.id) return;
          const bday = parseISO(u.birth_date);
          const bdayThisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
          
          if (isSameDay(bdayThisYear, in7Days)) {
              newAlerts.push(`🎉 En 1 semana es el cumpleaños de ${u.full_name || u.username}.`);
          }
          if (isSameDay(bdayThisYear, in1Day)) {
              newAlerts.push(`🎂 ¡Mañana es el cumpleaños de ${u.full_name || u.username}!`);
          }
      });
      setBirthdayAlerts(newAlerts);
    }
    checkBirthdays();
  }, [user?.id]);

  const myApprovedGroupIds = groups
    .filter(g => memberships.some(m => m.groupId === g.id && m.userId === myUserId && m.status === 'approved'))
    .map(g => g.id);

  // Filter tasks for current user
  const myTasks = tasks; 

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const pendingInvitations = myTasks.filter((t) => t.status === 'pending_acceptance');
  
  const pastIncompletePersonal = myTasks.filter(t => !t.groupId && t.userId === myUserId && !t.completed && t.date < todayKey);
  const pendingGroupTasks = myTasks.filter(t => t.groupId && myApprovedGroupIds.includes(t.groupId) && !t.completed && t.status !== 'cancelled_with_reason' && t.status !== 'expired');

  // Trigger Daily Modal
  useEffect(() => {
    if (!myUserId) return;
    const lastCheck = localStorage.getItem(`lastDailyCheck_${myUserId}`);
    if (lastCheck !== todayKey && (pastIncompletePersonal.length > 0 || pendingGroupTasks.length > 0)) {
      setShowDailyModal(true);
      localStorage.setItem(`lastDailyCheck_${myUserId}`, todayKey);
    }
  }, [myUserId, pastIncompletePersonal.length, pendingGroupTasks.length, todayKey]);

  // Trigger Monthly Performance Report (1st of month)
  useEffect(() => {
    if (!myUserId) return;
    const now = new Date();
    if (now.getDate() === 1) {
      const monthKey = format(now, 'yyyy-MM');
      const lastReportMonth = localStorage.getItem(`lastReportMonth_${myUserId}`);
      if (lastReportMonth !== monthKey) {
        setShowMonthlyReport(true);
        localStorage.setItem(`lastReportMonth_${myUserId}`, monthKey);
      }
    }
  }, [myUserId]);

  // Background Scanner for 2h Alert and Expirations
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      myTasks.forEach(t => {
        if (!t.groupId || t.completed || t.status === 'cancelled_with_reason' || t.status === 'expired') return;
        try {
          const deadline = new Date(`${t.date}T${t.time}`);
          const diffMs = deadline.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          if (diffHours > 0 && diffHours <= 2.0 && !alertedTasks.includes(t.id)) {
            alert(`⚠️ ALERTA: La tarea grupal "${t.title}" vence en menos de 2 horas.`);
            scheduleLocalNotification(`🚨 La tarea grupal "${t.title}" vence pronto.`);
            setAlertedTasks(a => [...a, t.id]);
          }

          if (diffMs < 0) {
            updateTask(t.id, { status: 'expired' });
          }
        } catch (err) {
          console.warn('[Tasks] Error en escaneo de vencimientos:', err);
        }
      });
    }, 60000); 
    return () => clearInterval(interval);
  }, [alertedTasks, myTasks, updateTask]);

  // Show Expired Modal to Creator
  useEffect(() => {
    if (!myUserId) return;
    const expiredForMe = myTasks.find(t => t.groupId && t.userId === myUserId && t.status === 'expired' && !t.failureReason);
    if (expiredForMe && !expiredModalTask) {
      setExpiredModalTask(expiredForMe);
    }
  }, [myTasks, myUserId, expiredModalTask]);

  const handleAddTask = async (newTask: Partial<Task>) => {
    const taskData = await addTask({ ...newTask, createdBy: myUserId });
    
    if (!taskData.groupId || myApprovedGroupIds.includes(taskData.groupId)) {
      scheduleTaskNotifications(taskData);
      scheduleLocalNotification(`✅ Actividad "${taskData.title}" agregada exitosamente.`);
    } else {
      scheduleLocalNotification(`✅ Actividad "${taskData.title}" agregada al grupo.`);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    const t = await updateTask(id, { completed, status: completed ? 'completed' : 'accepted' });
    if (completed) {
      cancelTaskNotifications(id);
      if (t.isShared) {
        scheduleLocalNotification(`¡${user?.email?.split('@')[0] ?? 'Tú'} completó: ${t.title}!`);
      }
    } else {
      scheduleTaskNotifications(t);
    }
  };

  const acceptTask = async (id: string) => {
    const updated = await updateTask(id, { status: 'accepted' });
    scheduleTaskNotifications(updated);
    scheduleLocalNotification(`✅ Tarea aceptada. Recordatorios programados para "${updated.title}".`);
  };

  const declineTask = async (id: string) => {
    cancelTaskNotifications(id);
    await updateTask(id, { status: 'declined' });
  };

  const handleMigrateToToday = (taskId: string) => updateTask(taskId, { date: todayKey });
  const handleReschedule = (taskId: string, newDate: string) => updateTask(taskId, { date: newDate });
  const handleExpiredResolution = (taskId: string, reason: string, decision: 'reprogramar' | 'terminar', newDate?: string) => {
    if (decision === 'reprogramar') {
      updateTask(taskId, { failureReason: reason, status: 'accepted', date: newDate! });
    } else {
      updateTask(taskId, { failureReason: reason, status: 'cancelled_with_reason', completed: true });
    }
    setExpiredModalTask(null);
  };

  const dailyTasks = myTasks.filter((t) => t.date === dateStr && t.status !== 'pending_acceptance');
  const notifGranted = hasNotificationPermission();

  if (tasksLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-color)' }}>Cargando agenda...</div>;

  return (
    <div style={{ padding: '24px 16px 100px 16px', maxWidth: '600px', margin: '0 auto' }} className="animate-fade-in padding-safe">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div 
              onClick={() => { if (user?.avatar && user.avatar.length > 10) setZoomedImg(user.avatar); }}
              style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '25px', overflow: 'hidden', border: '2px solid var(--accent-color)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', fontSize: '24px', cursor: (user?.avatar && user.avatar.length > 10) ? 'pointer' : 'default' }}
            >
              {user?.avatar && user.avatar.length > 10 ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.avatar || (user?.full_name || user?.username || 'U').charAt(0).toUpperCase())}
              {isMyBirthday() && (
                <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', fontSize: '18px' }} title="¡Es tu cumpleaños!">👑</div>
              )}
           </div>
           <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {user?.username}
                {isMyBirthday() && <span style={{ fontSize: '1.2rem' }}>🎂</span>}
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.8rem' }}>{user?.role || 'Colaborador'}</p>
           </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowDirectory(true)} title="Directorio Corporativo" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-color)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
          <button onClick={() => setShowHistory(true)} title="Historial" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-color)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          </button>
          <LedIndicator user={user} onLateAlert={() => setLateAlert(true)} />
          <button onClick={() => setIsHelpOpen(true)} title="Manual de usuario" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-color)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>?</button>
        </div>
      </header>

      {/* Birthday Alerts */}
      {birthdayAlerts.length > 0 && (
          <div style={{ marginBottom: '16px', animation: 'fadeIn 0.5s' }}>
              {birthdayAlerts.map((msg, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: 'rgba(212, 188, 143, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '12px', color: 'var(--warning-color)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🎉</span> {msg}
                  </div>
              ))}
          </div>
      )}

      {showHistory && <HistoryView tasks={myTasks} onClose={() => setShowHistory(false)} onGoToDate={(d: string) => { setSelectedDate(new Date(d + 'T12:00:00')); setShowHistory(false); }} />}
      {showAnalytics && <TaskAnalytics tasks={myTasks} onClose={() => setShowAnalytics(false)} />}
      {showDirectory && <UserDirectory onClose={() => setShowDirectory(false)} />}

      {lateAlert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="glass-panel" style={{ maxWidth: 360, width: '100%', padding: '28px 24px', borderRadius: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🌙</div>
            <h3 style={{ margin: '0 0 10px', color: '#f87171' }}>Hora de cierre operativo</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              Las órdenes generadas a partir de las <strong style={{ color: 'var(--text-primary)' }}>20:30 hrs</strong> serán valoradas por el <strong style={{ color: 'var(--accent-color)' }}>Grupo More</strong> el día inmediatamente siguiente a partir de las <strong style={{ color: 'var(--text-primary)' }}>07:00 hrs</strong>.
            </p>
            <button onClick={() => setLateAlert(false)} style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, background: 'var(--accent-color)', color: '#000' }}>Entendido</button>
          </div>
        </div>
      )}

      <HelpManualModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {!notifGranted && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(210, 153, 34, 0.08)', border: '1px solid rgba(210, 153, 34, 0.25)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🔔</span>
          <div>
            <strong style={{ color: 'var(--warning-color)' }}>Notificaciones desactivadas</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', marginTop: 2 }}>Ve a Configuración de tu dispositivo para activar notificaciones de esta app.</p>
          </div>
        </div>
      )}

      {pendingInvitations.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--warning-color)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            Invitaciones Pendientes ({pendingInvitations.length})
          </h3>
          {pendingInvitations.map((task) => (
            <TaskCard key={task.id} task={task} onAccept={acceptTask} onDecline={declineTask} />
          ))}
        </div>
      )}

      <CalendarView selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Agenda del Día</h3>
        {dailyTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', backgroundColor: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
            <p>No tienes tareas agendadas para este día.</p>
          </div>
        ) : (
          dailyTasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggleComplete={toggleTask} />
          ))
        )}
      </div>

      <CreateTaskModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSave={handleAddTask} />
      <WelcomeDailyModal isOpen={showDailyModal} onClose={() => setShowDailyModal(false)} personalTasks={pastIncompletePersonal} groupTasks={pendingGroupTasks} onMigrateToToday={handleMigrateToToday} onReschedule={handleReschedule} />
      <ExpiredTeamTaskModal isOpen={!!expiredModalTask} task={expiredModalTask} onClose={() => setExpiredModalTask(null)} onSubmit={handleExpiredResolution} />
      
      {showMonthlyReport && <MonthlyReportModal tasks={myTasks} onClose={() => setShowMonthlyReport(false)} />}
      {zoomedImg && <ImageZoomModal src={zoomedImg} onClose={() => setZoomedImg(null)} />}
    </div>
  );
}
