import { useState, useEffect } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  History, 
  Bell, 
  PartyPopper, 
  Clock, 
  AlertTriangle,
  CalendarDays,
  LayoutGrid,
  Loader2,
  ClipboardList,
  Smartphone
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';
import { usePageTitle } from '../hooks/usePageTitle';
import { useGroups } from '../context/GroupContext';
import { useTasks, Task } from '../context/TaskContext';
import { 
  scheduleTaskNotifications, 
  cancelTaskNotifications, 
  scheduleLocalNotification,
  requestNotificationPermission,
  getNotificationPermissionStatus 
} from '../services/NotificationsService';

import { useOrders } from '../context/OrderContext';
import { usePWA } from '../hooks/usePWA';

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
import ExecutiveSummaryModal from '../components/ExecutiveSummaryModal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Skeleton, TaskCardSkeleton } from '../components/ui/Skeleton';

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
    green: 'bg-emerald-400 shadow-emerald-400/50',
    gold:  'bg-amber-400 shadow-amber-400/50',
    red:   'bg-red-400 shadow-red-400/50',
  }[color];

  const label = { green: 'En línea', gold: 'Admin', red: 'Cierre' }[color];

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-black/20 rounded-full border border-white/5">
      <div className={`w-2 h-2 rounded-full ${palette} shadow-sm animate-pulse`} />
      <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
    </div>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  usePageTitle('Mi Agenda');
  const { groups, memberships } = useGroups();
  const { tasks, addTask, updateTask, loading: tasksLoading, hasMore, loadMore } = useTasks();
  const { orders, loading: ordersLoading } = useOrders();
  const { isInstallable, installApp } = usePWA();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // Infinite Scroll Trigger
  const [scrollInView, setScrollInView] = useState(false);
  useEffect(() => {
    if (scrollInView && hasMore && !tasksLoading) {
      loadMore();
    }
  }, [scrollInView, hasMore, tasksLoading, loadMore]);
  
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
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermissionStatus());

  // Executive Summary Modal State
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryType, setSummaryType] = useState<'task' | 'order'>('task');

  // Monitor Notification permissions
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    const check = () => setPermissionStatus(getNotificationPermissionStatus());
    const interval = setInterval(check, 2000); 
    return () => clearInterval(interval);
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : getNotificationPermissionStatus());
    if (granted) triggerHaptic('success');
  };

  const myUserId = user?.id;
  const avatar = user?.avatar || '👤';
  const fullName = user?.full_name || user?.username || 'Usuario';
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Birthday Alerts & Global Users Logic
  useEffect(() => {
    async function checkBirthdays() {
      let usersData: any[] = [];
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('profiles').select('*');
        if (data) usersData = data;
      } else {
        usersData = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
      }
      setAllUsers(usersData);

      const today = new Date();
      const in7Days = addDays(today, 7);
      const in1Day = addDays(today, 1);
      
      const newAlerts: string[] = [];
      usersData.forEach(u => {
          if (!u.birth_date || u.id === user?.id) return;
          const bday = parseISO(u.birth_date);
          const bdayThisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
          if (isSameDay(bdayThisYear, in7Days)) newAlerts.push(`🎉 Cumpleaños de ${u.full_name || u.username} en 1 semana`);
          if (isSameDay(bdayThisYear, in1Day)) newAlerts.push(`🎂 ¡Mañana es el cumpleaños de ${u.full_name || u.username}!`);
      });
      setBirthdayAlerts(newAlerts);
    }
    checkBirthdays();
  }, [user?.id]);

  // FAB & Zoom Listeners
  useEffect(() => {
    const handleOpen = () => setShowCreateModal(true);
    const handleZoom = (e: any) => setZoomedImg(e.detail);
    window.addEventListener('open-create-task', handleOpen);
    window.addEventListener('zoom-image', handleZoom);
    return () => {
      window.removeEventListener('open-create-task', handleOpen);
      window.removeEventListener('zoom-image', handleZoom);
    };
  }, []);

  const myApprovedGroupIds = groups
    .filter(g => memberships.some(m => m.groupId === g.id && m.userId === myUserId && m.status === 'approved'))
    .map(g => g.id);

  const pendingInvitations = tasks.filter((t) => t.status === 'pending_acceptance');
  const acceptTask = async (id: string) => {
    const updated = await updateTask(id, { status: 'accepted' });
    scheduleTaskNotifications(updated);
    scheduleLocalNotification(`✅ Tarea aceptada. Recordatorios programados para "${updated.title}".`);
  };

  const declineTask = async (id: string) => {
    cancelTaskNotifications(id);
    await updateTask(id, { status: 'declined' });
  };

  const dailyTasks = tasks.filter((t) => 
    t.date.startsWith(dateStr) && 
    t.status !== 'pending_acceptance' && 
    !t.completed && 
    t.status !== 'declined' &&
    t.status !== 'cancelled_with_reason' &&
    t.status !== 'expired'
  );
  
  const dailyOrders = orders.filter((o) => 
    o.deliveryDate.startsWith(dateStr) && 
    ['recibida', 'en_proceso', 'pendiente_entrega'].includes(o.status)
  );

  const activityDates = Array.from(new Set([
    ...tasks.filter(t => !t.completed && t.status !== 'cancelled_with_reason' && t.status !== 'expired').map(t => t.date),
    ...orders.filter(o => ['recibida', 'en_proceso', 'pendiente_entrega'].includes(o.status)).map(o => o.deliveryDate.split('T')[0])
  ]));

  // Scanner for alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(t => {
        if (!t.groupId || t.completed || t.status === 'cancelled_with_reason' || t.status === 'expired') return;
        const deadline = new Date(`${t.date}T${t.time}`);
        const diffMs = deadline.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 0 && diffHours <= 2.0 && !alertedTasks.includes(t.id)) {
          scheduleLocalNotification(`🚨 La tarea grupal "${t.title}" vence pronto.`);
          setAlertedTasks(a => [...a, t.id]);
        }
        if (diffMs < 0) updateTask(t.id, { status: 'expired' });
      });
    }, 60000); 
    return () => clearInterval(interval);
  }, [alertedTasks, tasks, updateTask]);

  const toggleTask = async (id: string, completed: boolean) => {
    const t = await updateTask(id, { completed, status: completed ? 'completed' : 'accepted' });
    if (completed) {
      cancelTaskNotifications(id);
      if (t.isShared) scheduleLocalNotification(`¡${fullName} completó la tarea!`);
    } else {
      scheduleTaskNotifications(t);
    }
  };

  const handleAddTask = async (newTask: Partial<Task>) => {
    const taskData = await addTask({ ...newTask, createdBy: myUserId });
    scheduleTaskNotifications(taskData);
  };

  const loading = tasksLoading || ordersLoading;

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-32 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <Skeleton width={56} height={56} circle />
          <div className="space-y-2">
            <Skeleton width={120} height={20} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton width={40} height={40} />
          <Skeleton width={40} height={40} />
        </div>
      </header>

      <div className="space-y-8">
        <section>
          <Skeleton width={180} height={24} className="mb-4" />
          <div className="grid grid-cols-1 gap-3">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="group relative w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-500 shadow-lg shadow-purple-500/20 bg-slate-900 flex items-center justify-center text-xl cursor-pointer"
            onClick={() => { if (avatar.length > 10) setZoomedImg(avatar); }}
          >
            {avatar.length > 10 ? <img src={avatar} className="w-full h-full object-cover" alt="avatar" /> : avatar}
            {isSameDay(parseISO(user?.birth_date || ''), new Date()) && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-400" />
            )}
          </motion.div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-1.5 tracking-tight line-clamp-1">
              Hola, {String(fullName).split(' ')[0]}
              {isSameDay(parseISO(user?.birth_date || ''), new Date()) && <PartyPopper size={18} className="text-amber-400" />}
            </h2>
            <LedIndicator user={user} onLateAlert={() => setLateAlert(true)} />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {isInstallable && (
            <button 
              onClick={installApp}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-black text-[0.6rem] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg active:scale-95"
            >
              <Smartphone size={12} className="animate-bounce" /> Instalar
            </button>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDirectory(true)} className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-400 hover:text-purple-400 transition-all">
              <Users size={18} />
            </button>
            <button onClick={() => setShowHistory(true)} className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-400 hover:text-purple-400 transition-all">
              <History size={18} />
            </button>
            <button onClick={() => setIsHelpOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500 text-slate-900 font-black transition-all">
              ?
            </button>
          </div>
        </div>
      </header>

      {/* Announcements Section */}
      <AnimatePresence>
        {birthdayAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 mb-6">
            {birthdayAlerts.map((msg, i) => (
              <div key={i} className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs font-bold flex items-center gap-3">
                <PartyPopper size={16} /> {msg}
              </div>
            ))}
          </motion.div>
        )}

        {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-slate-900/50 border border-amber-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                 <Bell size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Aviso de Sistema</p>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  {permissionStatus === 'denied' 
                    ? 'Notificaciones bloqueadas por el navegador. Habilítalas manualmente.' 
                    : 'Alertas desactivadas para recordatorios importantes.'}
                </p>
              </div>
            </div>
            {permissionStatus === 'default' && (
              <button 
                onClick={handleRequestPermission}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-900 text-[0.6rem] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
              >
                Activar Alertas
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Views */}
      <div className="grid gap-8">
        {/* Invitations */}
        {pendingInvitations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 rounded-md">Invitaciones Pendientes ({pendingInvitations.length})</h3>
            </div>
            <div className="grid gap-3">
              {pendingInvitations.map((task) => (
                <TaskCard key={task.id} task={task} onAccept={acceptTask} onDecline={declineTask} />
              ))}
            </div>
          </section>
        )}

        {/* Calendar Widget */}
        <section className="bg-slate-900/40 border border-white/10 rounded-3xl p-4 backdrop-blur-md shadow-2xl">
          <CalendarView selectedDate={selectedDate} onSelectDate={setSelectedDate} activities={activityDates} />
        </section>

        {/* Daily Tasks */}
        <section className="mb-0">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <h3 className="text-base font-black text-white flex items-center gap-2 tracking-tight">
              <CalendarDays size={18} className="text-purple-500" />
              Agenda del Día
            </h3>
            <button onClick={() => setShowAnalytics(true)} className="text-[0.6rem] font-bold text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/5">
              <LayoutGrid size={10} className="inline mr-1" /> Análisis
            </button>
          </div>

          {dailyTasks.length === 0 && dailyOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-center">
              <Clock className="mb-3 opacity-10" size={32} />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
                Sin actividades para hoy
              </p>
              <p className="text-[0.65rem] text-slate-600 mt-1">
                {format(selectedDate, 'PPP', { locale: es })}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Service Orders - Highlighted style */}
              {dailyOrders.map(order => (
                <div 
                  key={order.id} 
                  className="relative group cursor-pointer"
                  onClick={() => {
                    setSummaryData(order);
                    setSummaryType('order');
                    setShowSummary(true);
                    triggerHaptic('light');
                  }}
                >
                   <div className="absolute inset-0 bg-amber-500/5 rounded-2xl border border-amber-500/20 group-hover:bg-amber-500/10 transition-colors" />
                   <div className="relative p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                            <ClipboardList size={20} />
                         </div>
                         <div>
                            <span className="text-[0.6rem] font-black text-amber-500 uppercase tracking-widest block mb-0.5">Orden de Servicio · {order.id}</span>
                            <h4 className="text-sm font-bold text-white truncate">{order.customerName}</h4>
                            <div className="flex items-center gap-2 text-[0.6rem] text-slate-500 font-medium uppercase mt-1">
                               <span>{order.services.join(' + ')}</span>
                               <span>•</span>
                               <span className="text-amber-500/80">{order.status.replace('_', ' ')}</span>
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-black text-white">$ {order.totalCost.toLocaleString()}</div>
                         <div className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">{order.deliveryDate.split('T')[1]}</div>
                      </div>
                   </div>
                </div>
              ))}

              {dailyTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggleComplete={toggleTask} 
                  onSelect={(t) => {
                    setSummaryData(t);
                    setSummaryType('task');
                    setShowSummary(true);
                    triggerHaptic('light');
                  }}
                />
              ))}
              
              {/* Infinite Scroll Sentinel */}
              {hasMore && (
                <div 
                  ref={(el) => {
                    if (!el) return;
                    const observer = new IntersectionObserver(([entry]) => {
                      setScrollInView(entry.isIntersecting);
                    }, { threshold: 0.1 });
                    observer.observe(el);
                  }}
                  className="py-10 flex justify-center"
                >
                  <Loader2 className="animate-spin text-purple-500" size={24} />
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Late Alert Modal */}
      <AnimatePresence>
        {lateAlert && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-slate-900 border border-red-500/30 rounded-3xl p-8 max-w-sm text-center shadow-2xl">
              <div className="text-4xl mb-4">🌙</div>
              <h3 className="text-xl font-bold text-red-400 mb-4 tracking-tight">Zona de Cierre Operativo</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light mb-8 italic">
                Las órdenes generadas después de las <span className="text-white font-bold">20:30 hrs</span> serán gestionadas por <span className="text-purple-400 font-bold">Grupo More</span> a partir de las <span className="text-white font-bold">07:00 hrs</span> del día siguiente.
              </p>
              <button onClick={() => setLateAlert(false)} className="w-full bg-red-500 text-slate-900 font-black py-3 rounded-2xl hover:bg-red-400 transition-all active:scale-95 shadow-lg shadow-red-500/20">
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Other Modals (History, Analytics, Directory, monthly, zoom) are handled by individual component views already */}
      {showHistory && <HistoryView tasks={tasks} onClose={() => setShowHistory(false)} onGoToDate={(d) => { setSelectedDate(new Date(d + 'T12:00:00')); setShowHistory(false); }} />}
      {showAnalytics && <TaskAnalytics tasks={tasks} onClose={() => setShowAnalytics(false)} />}
      {showDirectory && <UserDirectory onClose={() => setShowDirectory(false)} />}
      
      <CreateTaskModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSave={handleAddTask} 
        initialDate={dateStr}
      />
      <HelpManualModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <WelcomeDailyModal isOpen={showDailyModal} onClose={() => setShowDailyModal(false)} personalTasks={tasks.filter(t => !t.groupId && t.userId === myUserId && !t.completed && t.date < todayKey)} groupTasks={tasks.filter(t => t.groupId && myApprovedGroupIds.includes(t.groupId) && !t.completed && t.status !== 'cancelled_with_reason' && t.status !== 'expired')} onMigrateToToday={(tid) => updateTask(tid, { date: todayKey })} onReschedule={(tid, d) => updateTask(tid, { date: d })} />
      <ExpiredTeamTaskModal isOpen={!!expiredModalTask} task={expiredModalTask} onClose={() => setExpiredModalTask(null)} onSubmit={(tid, reason, decision, newDate) => {
        if (decision === 'reprogramar') updateTask(tid, { failureReason: reason, status: 'accepted', date: newDate! });
        else updateTask(tid, { failureReason: reason, status: 'cancelled_with_reason', completed: true });
        setExpiredModalTask(null);
      }} />
      
      {showMonthlyReport && <MonthlyReportModal tasks={tasks} onClose={() => setShowMonthlyReport(false)} />}
      {zoomedImg && <ImageZoomModal src={zoomedImg} onClose={() => setZoomedImg(null)} />}
      
      <ExecutiveSummaryModal 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)} 
        data={summaryData} 
        type={summaryType} 
        users={allUsers}
        onUpdate={async (id, fields) => {
          if (summaryType === 'task') {
             await updateTask(id, fields);
          } else {
             // Logic for orders if needed
          }
        }}
      />
    </div>
  );
}
