import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStorage } from '../lib/storageService';
import { Task } from '../context/TaskContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Trash2, 
  Lock, 
  Unlock, 
  ChevronLeft,
  Calendar,
  Mail,
  Phone,
  Cake,
  XCircle,
  AlertOctagon,
  Bell
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { triggerHaptic } from '../utils/haptics';
import { usePresence } from '../context/PresenceContext';

interface AppUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  full_name?: string;
  is_super_admin: boolean;
  blocked: boolean;
  needs_setup: boolean;
  needs_approval?: boolean;
  cedula?: string;
  phone?: string;
  birth_date?: string;
  role?: string;
  avatar?: string;
  last_seen?: string;
  emergency_name?: string;
  emergency_relationship?: string;
  emergency_phone?: string;
}

const ROLE_HIERARCHY: Record<string, number> = {
  'Administrador maestro': 1,
  'Director General (CEO)': 2,
  'Gestor Administrativo': 3,
  'Analista Contable': 4,
  'Supervisora Puntos de Venta': 5,
  'Consultora de Ventas': 6,
  'Colaborador': 7
};

function getRoleWeight(role?: string) {
  return ROLE_HIERARCHY[role || 'Colaborador'] || 99;
}

// ── Admin Agenda Modal ───────────────────────────────────────────────
function AdminUserAgendaModal({ userId, username, onClose }: { userId: string; username: string; onClose: () => void }) {
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('tasks').select('*').eq('user_id', userId).order('date', { ascending: true });
        if (data) setUserTasks(data);
      } else {
        const allTasks = JSON.parse(localStorage.getItem('tasks_db') || '[]');
        setUserTasks(allTasks.filter((t: any) => t.userId === userId));
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-xl bg-[#1a1622] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-3">
             <Calendar className="text-purple-400" size={20} />
             <h3 className="text-white font-bold tracking-tight">Agenda de @{username}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
          {loading ? (
            <div className="space-y-3">
              <Skeleton width="100%" height={60} className="rounded-2xl" />
              <Skeleton width="100%" height={60} className="rounded-2xl" />
              <Skeleton width="100%" height={60} className="rounded-2xl" />
            </div>
          ) : userTasks.length === 0 ? (
            <div className="text-center py-12">
               <Calendar className="mx-auto mb-4 text-slate-700 opacity-20" size={48} />
               <p className="text-sm font-medium text-slate-500">Sin actividades agendadas.</p>
            </div>
          ) : (
            userTasks.map(t => (
              <div key={t.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="text-sm font-bold text-white mb-1">{t.title}</div>
                <div className="text-[0.7rem] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                  <span>📅 {t.date}</span>
                  <span>•</span>
                  <span>🕒 {t.time}</span>
                  <span className="ml-auto text-purple-400">{t.completed ? '✅ Completada' : '⏳ Pendiente'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-purple-500/5 border-t border-white/5 text-center">
            <p className="text-[0.65rem] font-black text-purple-500 uppercase tracking-widest">⚠️ Vista de supervisión (Solo lectura)</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function AdminUsers() {
  const { user } = useAuth();
  usePageTitle('Administración de Usuarios');
  const navigate = useNavigate();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<{ userId: string; field: keyof AppUser } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AppUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuditUser, setSelectedAuditUser] = useState<AppUser | null>(null);
  const [expandedEmergency, setExpandedEmergency] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState('');
  const { onlineUsers } = usePresence();

  useEffect(() => {
    if (!user?.isSuperAdmin) navigate('/', { replace: true });
    loadUsers();
    loadNotifications();
  }, [user, navigate]);

  function loadNotifications() {
    const data = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    setNotifications(data.sort((a: any, b: any) => b.id - a.id));
  }

  async function loadUsers() {
    setLoading(true);
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data) {
        const sorted = data.sort((a, b) => {
          const weightA = getRoleWeight(a.role);
          const weightB = getRoleWeight(b.role);
          if (weightA !== weightB) return weightA - weightB;
          return (a.username || '').localeCompare(b.username || '');
        });
        setUsers(sorted);
      }
      if (error) console.error(error);
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const mapped = db.map((u: any) => ({ ...u, full_name: u.user_metadata?.fullName || u.full_name }));
      const sorted = mapped.sort((a, b) => {
        const weightA = getRoleWeight(a.role);
        const weightB = getRoleWeight(b.role);
        if (weightA !== weightB) return weightA - weightB;
        return (a.username || '').localeCompare(b.username || '');
      });
      setUsers(sorted);
    }
    setLoading(false);
  }

  const handleAction = (type: 'success' | 'light' | 'warning' | 'error') => triggerHaptic(type);

  const startEdit = (userId: string, field: keyof AppUser, currentValue: string) => {
    handleAction('light');
    setEditingField({ userId, field });
    setEditValue(currentValue || '');
  };

  const commitEdit = async () => {
    if (!editingField) return;
    const { userId, field } = editingField;
    
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').update({ [field]: editValue }).eq('id', userId);
      if (error) { handleAction('error'); alert(error.message); }
      else { handleAction('success'); loadUsers(); }
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const index = db.findIndex((u: any) => u.id === userId);
      if (index !== -1) {
        if (field === 'username') {
          const val = editValue.trim().toLowerCase();
          if (!/^[a-zA-Z]/.test(val)) {
            handleAction('error');
            alert('El nombre de usuario debe iniciar obligatoriamente con una letra.');
            setEditingField(null);
            return;
          }
          db[index].username = val;
        }
        else if (field === 'full_name') db[index].user_metadata.fullName = editValue;
        else if (field === 'password') db[index].password = editValue;
        else (db[index] as any)[field] = editValue;
        await mockStorage.setItem('mock_users_db', db);
        handleAction('success');
        loadUsers();
      }
    }
    setEditingField(null);
  };

  const deletePhoto = async (targetUser: AppUser) => {
    handleAction('warning');
    if (!confirm('¿Deseas eliminar la foto de perfil?')) return;
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ avatar: null }).eq('id', targetUser.id);
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const index = db.findIndex((u: any) => u.id === targetUser.id);
      if (index !== -1) {
        db[index].avatar = null;
        await mockStorage.setItem('mock_users_db', db);
      }
    }
    handleAction('success');
    loadUsers();
  };

  const deleteUser = async (targetUser: AppUser) => {
    handleAction('error');
    setIsDeleting(true);
    setDeleteStep('Iniciando limpieza de registros...');

    try {
      if (isSupabaseConfigured) {
        // 1. Fase Grupos: Cerrar grupos donde es líder y notificar
        setDeleteStep('Clausurando grupos liderados...');
        const { data: leadGroups } = await supabase.from('groups').select('id, name').eq('creator_id', targetUser.id);
        
        if (leadGroups && leadGroups.length > 0) {
          for (const g of leadGroups) {
            // Obtener miembros para notificar
            const { data: members } = await supabase.from('group_memberships').select('user_id').eq('group_id', g.id).eq('status', 'approved');
            if (members && members.length > 0) {
              const notifications = members
                .filter(m => m.user_id !== targetUser.id)
                .map(m => ({
                  user_id: m.user_id,
                  title: '🚨 Grupo Clausurado',
                  message: `El grupo "${g.name}" ha sido eliminado definitivamente debido a la baja del administrador del mismo: @${targetUser.username}.`,
                  type: 'critical'
                }));
              if (notifications.length > 0) await supabase.from('realtime_notifications').insert(notifications);
            }
            // Borrar membresías del grupo
            await supabase.from('group_memberships').delete().eq('group_id', g.id);
            // Borrar el grupo
            await supabase.from('groups').delete().eq('id', g.id);
          }
        }

        // 2. Fase Tareas: Borrar agenda personal y tareas asignadas/creadas por él
        setDeleteStep('Limpiando agendas y tareas compartidas...');
        // Borrar donde sea el dueño (su agenda)
        await supabase.from('tasks').delete().eq('user_id', targetUser.id);
        // Borrar tareas que él creó/compartió para otros
        await supabase.from('tasks').delete().eq('created_by', targetUser.id);

        // 3. Fase Membresías Generales: Salir de grupos ajenos
        setDeleteStep('Removiendo participaciones en otros grupos...');
        await supabase.from('group_memberships').delete().eq('user_id', targetUser.id);

        // 4. Fase Final: Borrar Perfil
        setDeleteStep('Borrando perfil definitivo...');
        const { error: pErr } = await supabase.from('profiles').delete().eq('id', targetUser.id);
        if (pErr) throw pErr;

        handleAction('success');
        alert(`¡LIMPIEZA DE BASE DE DATOS EXITOSA!\n\nSe han borrado todas las tareas, grupos y el perfil de @${targetUser.username}.\n\n⚠️ IMPORTANTE: Para liberar el correo electrónico, ahora debes borrar manualmente al usuario desde el Dashboard de Supabase (Sección Authentication).`);
      } else {
        // Mock logic
        const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
        const updated = db.filter((u: any) => u.id !== targetUser.id);
        await mockStorage.setItem('mock_users_db', updated);
      }
      
      loadUsers();
    } catch (err: any) {
      console.error('Error en borrado en cascada:', err);
      handleAction('error');
      alert(`Error crítico durante la limpieza: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteStep('');
      setConfirmDelete(null);
    }
  };

  const toggleBlock = async (targetUser: AppUser) => {
    handleAction('warning');
    if (targetUser.is_super_admin) return;
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ blocked: !targetUser.blocked }).eq('id', targetUser.id);
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const index = db.findIndex((u: any) => u.id === targetUser.id);
      if (index !== -1) {
        db[index].blocked = !db[index].blocked;
        await mockStorage.setItem('mock_users_db', db);
      }
    }
    handleAction('success');
    loadUsers();
  };

  const filtered = users.filter(u =>
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 pt-8 pb-32 space-y-8 animate-pulse">
       <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton width={300} height={32} />
            <Skeleton width={200} height={16} />
          </div>
          <Skeleton width={100} height={40} className="rounded-xl" />
       </div>
       <Skeleton width="100%" height={50} className="rounded-2xl" />
       <div className="border border-white/5 rounded-[32px] overflow-hidden">
          <Skeleton width="100%" height={400} />
       </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pt-8 pb-32 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck className="text-slate-900" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gestión de Personal</h1>
            <p className="text-sm text-slate-500 font-medium">Panel de Control de Acceso y Roles</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => { handleAction('light'); navigate(-1); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
            aria-label="Volver"
          >
            <ChevronLeft size={16} /> Volver
          </button>
        </div>
      </header>

      {notifications.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-purple-500/5 border border-purple-500/20 rounded-[32px] relative overflow-hidden"
          >
              <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                    <Bell className="animate-bounce" size={14} /> Alertas Administrativas
                  </h3>
                  <button onClick={() => { handleAction('light'); localStorage.removeItem('admin_notifications'); setNotifications([]); }} className="text-[0.65rem] font-bold text-slate-500 uppercase hover:text-purple-400 transition-colors">Limpiar Base</button>
              </div>
              <div className="max-h-[120px] overflow-y-auto space-y-2 no-scrollbar relative z-10">
                  {notifications.map(n => (
                      <div key={n.id} className="text-xs text-slate-400 border-b border-white/5 pb-2 flex justify-between">
                          <span className="font-medium"><strong className="text-white">@{n.user}</strong> | {n.details}</span>
                          <span className="text-[0.6rem] font-black text-slate-600 uppercase ml-4">{n.timestamp.split('T')[1].substring(0, 5)}</span>
                      </div>
                  ))}
              </div>
          </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative mb-8 group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, usuario, rol o correo..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/10 rounded-[24px] pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all placeholder:text-slate-700 font-medium shadow-inner"
          aria-label="Buscar usuarios"
        />
      </div>

      <div className="bg-[#1a1622]/50 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-black/40 border-b border-white/5">
                {['Avatar', 'Usuario', 'Nombre Completo', 'Contacto', 'Acceso', 'Nac.', 'Clave', ''].map(h => (
                  <th key={h} className="px-2 py-3 text-left text-[0.6rem] font-black uppercase tracking-[0.12em] text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filtered.map((u) => (
                <tr key={u.id} className={`group hover:bg-white/[0.02] transition-colors ${u.blocked ? 'opacity-40 grayscale' : ''}`}>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => deletePhoto(u)}
                      className="w-10 h-10 mx-auto rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-purple-500/40 transition-all"
                      aria-label="Ver o quitar foto"
                    >
                      {u.avatar && u.avatar.length > 10 ? (
                        <img src={u.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#d4bc8f] to-[#b39063] flex items-center justify-center text-slate-950 text-xs font-black">
                          {(u.full_name || u.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>
                    <div className="mt-1.5 flex items-center justify-center gap-1 text-[0.5rem] font-bold uppercase text-slate-500">
                      {onlineUsers.includes(u.id) ? (
                        <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />En línea</>
                      ) : (
                        <><span className="w-1.5 h-1.5 rounded-full bg-slate-700" />N/A</>
                      )}
                    </div>
                  </td>
                  {/* ── USUARIO + Emergency Toggle ── */}
                  <td className="px-2 py-3">
                    <div className="text-xs font-black text-white tracking-tight">@{u.username}</div>
                    <div className="text-[0.6rem] text-slate-700 font-bold uppercase mt-0.5">ID: {u.cedula || '—'}</div>
                    <div className={`text-[0.55rem] font-black uppercase mt-0.5 flex items-center gap-1 ${u.blocked ? 'text-red-500' : 'text-slate-600'}`}>
                      {u.blocked ? <Lock size={9} /> : <Unlock size={9} />} {u.blocked ? 'BLOQUEADO' : 'ACTIVA'}
                    </div>
                    {/* Emergency Toggle Button */}
                    <button
                      onClick={() => setExpandedEmergency(expandedEmergency === u.id ? null : u.id)}
                      className={`mt-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[0.5rem] font-black uppercase tracking-wide transition-all border ${
                        expandedEmergency === u.id
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-amber-500/5 border-amber-500/20 text-amber-800 hover:text-amber-600 hover:border-amber-500/40'
                      }`}
                      title="Ver información de emergencia"
                    >
                      <span className="text-[0.65rem]">🆘</span>
                      <span>Emergencia</span>
                      {(u.emergency_name || u.emergency_phone) && <span className="w-1 h-1 rounded-full bg-amber-500 inline-block ml-0.5" />}
                      <span className="ml-1 opacity-40">{expandedEmergency === u.id ? '▲' : '▼'}</span>
                    </button>
                  </td>
                  
                  {/* ── COL 3: Nombre Completo ── */}
                  <td className="px-2 py-3 min-w-[140px]">
                    <div className="flex flex-col gap-1.5">
                      {/* Normal Content */}
                      {editingField?.userId === u.id && editingField?.field === 'full_name' ? (
                        <input
                          autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit()} onBlur={commitEdit}
                          className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-2 py-1 text-white text-sm outline-none w-full min-w-[160px]"
                          title="Cambiar nombre completo" placeholder="Nombre completo..."
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(u.id, 'full_name', u.full_name || '')}
                          className="text-sm text-slate-300 hover:text-purple-400 transition-colors border-b border-dashed border-white/10 text-left leading-snug font-bold"
                          title="Haga clic para editar nombre completo"
                        >
                          {u.full_name || <span className="text-slate-700 italic">Sin nombre</span>}
                        </button>
                      )}

                      {/* Emergency Info Below */}
                      <AnimatePresence>
                        {expandedEmergency === u.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 pt-2 border-t border-amber-500/10 flex flex-col gap-0.5">
                              <span className="text-[0.5rem] font-bold uppercase tracking-wider text-amber-700/80">Nombre Emergencia</span>
                              {editingField?.userId === u.id && editingField?.field === 'emergency_name' ? (
                                <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit()} onBlur={commitEdit}
                                  className="bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 text-white outline-none w-full text-[0.65rem]"
                                  title="Nombre del contacto de emergencia" placeholder="Nombre..."
                                />
                              ) : (
                                <button onClick={() => startEdit(u.id, 'emergency_name', u.emergency_name || '')} className="text-[0.65rem] text-amber-400/90 hover:text-amber-300 transition-colors border-b border-dashed border-amber-500/20 text-left truncate font-bold" title="Editar nombre de emergencia">
                                  {u.emergency_name || <span className="text-amber-900/40 italic font-black">Agregar nombre</span>}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>

                  {/* ── COL 4: Contacto ── */}
                  <td className="px-2 py-3 min-w-[150px]">
                    <div className="flex flex-col gap-1">
                      {/* Normal Contact Info */}
                      <div className="flex flex-col gap-1">
                        {editingField?.userId === u.id && editingField?.field === 'phone' ? (
                          <div className="flex items-center gap-1.5 border-b border-purple-500/30">
                            <Phone size={10} className="text-purple-400 shrink-0" />
                            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit()} onBlur={commitEdit} className="bg-purple-500/20 rounded px-1 text-white outline-none w-full text-xs" title="Editar teléfono" placeholder="300..." />
                          </div>
                        ) : (
                          <button onClick={() => startEdit(u.id, 'phone', u.phone || '')} className="text-[0.7rem] text-slate-500 hover:text-purple-400 transition-all flex items-center gap-1.5 border-b border-dashed border-white/5 w-full text-left" title="Editar teléfono">
                            <Phone size={10} className="text-slate-700 shrink-0" />
                            {u.phone || '—'}
                          </button>
                        )}
                        {editingField?.userId === u.id && editingField?.field === 'email' ? (
                          <div className="flex items-center gap-1.5 border-b border-purple-500/30">
                            <Mail size={10} className="text-purple-400 shrink-0" />
                            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit()} onBlur={commitEdit} className="bg-purple-500/20 rounded px-1 text-white outline-none w-full text-[0.6rem]" title="Editar correo" placeholder="email@..." />
                          </div>
                        ) : (
                          <button onClick={() => startEdit(u.id, 'email', u.email || '')} className="text-[0.6rem] text-slate-600 hover:text-purple-400 transition-all flex items-center gap-1.5 border-b border-dashed border-white/5 w-full text-left truncate" title="Editar correo">
                            <Mail size={10} className="text-slate-800 shrink-0" />
                            {u.email || '—'}
                          </button>
                        )}
                      </div>

                      {/* Emergency Phone Below */}
                      <AnimatePresence>
                        {expandedEmergency === u.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 pt-2 border-t border-amber-500/10 flex flex-col gap-0.5">
                              <span className="text-[0.5rem] font-bold uppercase tracking-wider text-amber-700/80">Tel. Emergencia</span>
                              {editingField?.userId === u.id && editingField?.field === 'emergency_phone' ? (
                                <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit()} onBlur={commitEdit}
                                  className="bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 text-white outline-none w-full text-[0.65rem]"
                                  title="Teléfono del contacto de emergencia" placeholder="Tel..."
                                />
                              ) : (
                                <button onClick={() => startEdit(u.id, 'emergency_phone', u.emergency_phone || '')} className="text-[0.65rem] text-amber-400/90 hover:text-amber-300 transition-colors border-b border-dashed border-amber-500/20 text-left font-bold" title="Editar teléfono de emergencia">
                                  {u.emergency_phone || <span className="text-amber-900/40 italic font-black">Sin número</span>}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>

                  {/* ── COL 5: Acceso ── */}
                  <td className="px-2 py-3">
                    <div className="flex flex-col gap-1">
                      <select 
                        value={u.role || (u.is_super_admin ? 'Administrador maestro' : 'Colaborador')} 
                        onChange={async (e) => {
                            const val = e.target.value;
                            const isSuperValue = val === 'Administrador maestro';
                            handleAction('warning');
                            if (isSupabaseConfigured) {
                                const { error } = await supabase.from('profiles').update({ role: val, is_super_admin: isSuperValue }).eq('id', u.id);
                                if (error) {
                                  handleAction('error');
                                  const isBypass = !supabase.auth.getSession();
                                  alert(`Error al actualizar rol: ${error.message}${isBypass ? '\n\n⚠️ Nota: El acceso por BYPASS es solo de lectura. Por favor, inicia sesión con tu contraseña real para realizar cambios.' : ''}`);
                                } else {
                                  handleAction('success');
                                  loadUsers();
                                }
                            } else {
                                const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
                                const i = db.findIndex((x: any) => x.id === u.id);
                                if (i !== -1) { db[i].role = val; db[i].is_super_admin = isSuperValue; await mockStorage.setItem('mock_users_db', db); }
                                handleAction('success');
                                loadUsers();
                            }
                        }}
                        className="bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-[0.6rem] font-bold text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer hover:border-purple-500/30 transition-all uppercase tracking-tight max-w-[160px]"
                        aria-label={`Cambiar rol de @${u.username}`}
                        title="Seleccionar nivel de acceso"
                      >
                          {Object.keys(ROLE_HIERARCHY).map(role => (
                            <option key={role} className="bg-[#1a1622]" value={role}>{role}</option>
                          ))}
                      </select>

                      {/* Emergency Relationship Below */}
                      <AnimatePresence>
                        {expandedEmergency === u.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 pt-2 border-t border-amber-500/10 flex flex-col gap-0.5">
                              <span className="text-[0.5rem] font-bold uppercase tracking-wider text-amber-700/80">Parentesco</span>
                              {editingField?.userId === u.id && editingField?.field === 'emergency_relationship' ? (
                                <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit()} onBlur={commitEdit}
                                  className="bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 text-white outline-none w-full text-[0.65rem]"
                                  title="Parentesco del contacto de emergencia" placeholder="Ej: Madre..."
                                />
                              ) : (
                                <button onClick={() => startEdit(u.id, 'emergency_relationship', u.emergency_relationship || '')} className="text-[0.65rem] text-amber-400/90 hover:text-amber-300 transition-colors border-b border-dashed border-amber-500/20 text-left font-bold" title="Editar parentesco">
                                  {u.emergency_relationship || <span className="text-amber-900/40 italic font-black">Parentesco</span>}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>

                  <td className="px-2 py-3">
                    {editingField?.userId === u.id && editingField?.field === 'birth_date' ? (
                      <div className="flex items-center gap-1 border-b border-purple-500/50">
                        <Cake size={12} className="text-purple-400 shrink-0" />
                        <input
                          autoFocus
                          type="date"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && commitEdit()}
                          onBlur={commitEdit}
                          className="bg-purple-500/20 rounded px-1 text-white outline-none text-xs"
                          title="Fecha de nacimiento"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(u.id, 'birth_date', u.birth_date || '')}
                        className="text-[0.7rem] text-slate-500 hover:text-purple-400 transition-colors flex items-center gap-1 border-b border-dashed border-white/10 whitespace-nowrap"
                        title="Haga clic para editar fecha de nacimiento"
                      >
                        <Cake size={12} className="text-slate-700 shrink-0" />
                        {u.birth_date || '—'}
                      </button>
                    )}
                  </td>

                  <td className="px-2 py-3 font-mono text-[0.6rem] text-slate-600">
                    {editingField?.userId === u.id && editingField?.field === 'password' ? (
                       <input
                         autoFocus
                         value={editValue}
                         onChange={e => setEditValue(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && commitEdit()}
                         onBlur={() => setEditingField(null)}
                         className="bg-purple-500/20 border border-purple-500/50 rounded px-1 text-white outline-none w-16"
                         title="Cambiar contraseña"
                         placeholder="••••••"
                       />
                    ) : (
                      <button
                        onClick={() => startEdit(u.id, 'password', u.password || '')}
                        className="hover:text-purple-400 transition-colors"
                        title="Haga clic para cambiar contraseña"
                      >
                        ••••••
                      </button>
                    )}
                  </td>

                  <td className="px-2 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { handleAction('light'); setSelectedAuditUser(u); }} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-purple-400 hover:bg-purple-500/10 transition-all font-bold" aria-label={`Ver Agenda de @${u.username}`}>
                        <Calendar size={16} aria-hidden="true" />
                      </button>
                      {!u.is_super_admin && (
                        <>
                          <button onClick={() => toggleBlock(u)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${u.blocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`} aria-label={`${u.blocked ? "Desbloquear" : "Bloquear"} usuario @${u.username}`}>
                            {u.blocked ? <Unlock size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                          </button>
                          <button onClick={() => setConfirmDelete(u)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-700 hover:bg-red-500/20 hover:text-red-500 transition-all" aria-label={`Eliminar colaborador @${u.username}`}>
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedAuditUser && (
          <AdminUserAgendaModal 
            userId={selectedAuditUser.id} 
            username={selectedAuditUser.username} 
            onClose={() => setSelectedAuditUser(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDelete(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-[#1a1622] border border-red-500/30 rounded-[32px] p-8 text-center shadow-2xl overflow-hidden">
              {isDeleting && (
                <div className="absolute inset-0 bg-[#1a1622]/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6">
                  <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-6" />
                  <p className="text-white font-black uppercase text-[0.65rem] tracking-[0.2em] animate-pulse">{deleteStep}</p>
                </div>
              )}
              
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
                <AlertOctagon size={40} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mb-2">Eliminar Colaborador</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">¿Estás seguro de eliminar a <strong className="text-white">@{confirmDelete.username}</strong>? Esta acción es irreversible y borrará todo su rastro (Agenda, Tareas Compartidas y Grupos Liderados).</p>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button 
                  disabled={isDeleting}
                  onClick={() => deleteUser(confirmDelete)} 
                  className="py-4 rounded-2xl bg-red-500 text-white font-black text-[0.65rem] uppercase tracking-[0.15em] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  Confirmar
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(null)} 
                  className="py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[0.65rem] uppercase tracking-[0.15em] hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
