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
    if (isSupabaseConfigured) {
      alert('Eliminación en Supabase requiere llamar a auth.admin.deleteUser.');
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const updated = db.filter((u: any) => u.id !== targetUser.id);
      await mockStorage.setItem('mock_users_db', updated);
      loadUsers();
    }
    setConfirmDelete(null);
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
            onClick={() => { handleAction('success'); navigate('/dashboard'); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#d4bc8f] text-slate-900 text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-amber-500/10 transition-all active:scale-95"
            aria-label="Ir al Dashboard Global"
          >
            <ShieldCheck size={16} /> Ver Dashboard v2
          </button>
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
                {['Avatar', 'Usuario', 'Nombre Completo', 'Contacto', 'Nivel de Acceso', 'Nacimiento', 'Clave', 'Acciones'].map(h => (
                  <th key={h} className="px-6 py-5 text-left text-[0.65rem] font-black uppercase tracking-[0.15em] text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filtered.map((u) => (
                <tr key={u.id} className={`group hover:bg-white/[0.02] transition-colors ${u.blocked ? 'opacity-40 grayscale' : ''}`}>
                  <td className="px-6 py-4">
                     <button 
                       onClick={() => deletePhoto(u)} 
                       className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-xl text-purple-400 overflow-hidden group-hover:border-purple-500/40 transition-all font-black"
                       aria-label="Ver o quitar foto"
                     >
                        {u.avatar && u.avatar.length > 10 ? <img src={u.avatar} className="w-full h-full object-cover" /> : (u.avatar || u.username.charAt(0).toUpperCase())}
                     </button>
                  </td>
                  <td className="px-6 py-4">
                      <div className="text-sm font-black text-white tracking-tight">@{u.username}</div>
                      <div className="text-[0.65rem] text-slate-600 font-bold uppercase tracking-widest mt-1">ID: {u.cedula || '—'}</div>
                      <div className={`text-[0.6rem] font-black uppercase tracking-tighter mt-1 flex items-center gap-1 ${u.blocked ? 'text-red-500' : 'text-emerald-500'}`}>
                        {u.blocked ? <Lock size={10} /> : <Unlock size={10} />} {u.blocked ? 'BLOQUEADO' : 'ACTIVO'}
                      </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => startEdit(u.id, 'full_name', u.full_name || '')}
                      className="text-sm text-slate-300 hover:text-purple-400 transition-colors border-b border-dashed border-white/10"
                    >
                      {editingField?.userId === u.id && editingField?.field === 'full_name' ? (
                        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit()} onBlur={() => setEditingField(null)} className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-2 text-white outline-none w-full" />
                      ) : (u.full_name || 'Sin nombre')}
                    </button>
                  </td>

                  <td className="px-6 py-4">
                      <div className="text-xs text-slate-400 flex items-center gap-1.5"><Phone size={12} className="text-slate-600" /> {u.phone || '—'}</div>
                      <div className="text-[0.65rem] text-slate-600 flex items-center gap-1.5 mt-1 truncate max-w-[160px]"><Mail size={12} className="text-slate-700" /> {u.email}</div>
                  </td>

                  <td className="px-6 py-4">
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
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[0.7rem] font-bold text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer hover:border-purple-500/30 transition-all uppercase tracking-tight"
                      aria-label={`Cambiar rol de @${u.username}`}
                    >
                        {Object.keys(ROLE_HIERARCHY).map(role => (
                          <option key={role} className="bg-[#1a1622]" value={role}>{role}</option>
                        ))}
                    </select>
                  </td>

                  <td className="px-6 py-4">
                      <div className="text-[0.7rem] text-slate-500 flex items-center gap-1.5">
                        <Cake size={14} className="text-slate-700" />
                        {u.birth_date || '—'}
                      </div>
                  </td>

                  <td className="px-6 py-4 font-mono text-[0.65rem] text-slate-600">
                    <button onClick={() => startEdit(u.id, 'password', u.password || '')} className="hover:text-purple-400 transition-colors">
                       {editingField?.userId === u.id && editingField?.field === 'password' ? (
                          <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit()} onBlur={() => setEditingField(null)} className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-2 text-white outline-none w-20" />
                       ) : '••••••'}
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-[#1a1622] border border-red-500/30 rounded-[32px] p-8 text-center shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
                <AlertOctagon size={40} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mb-2">Eliminar Colaborador</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">¿Estás seguro de eliminar a <strong className="text-white">@{confirmDelete.username}</strong>? Esta acción es irreversible y borrará todo su historial.</p>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button onClick={() => deleteUser(confirmDelete)} className="py-4 rounded-2xl bg-red-500 text-white font-black text-[0.65rem] uppercase tracking-[0.15em] hover:brightness-110 active:scale-95 transition-all">Eliminar</button>
                <button onClick={() => setConfirmDelete(null)} className="py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[0.65rem] uppercase tracking-[0.15em] hover:bg-white/10 active:scale-95 transition-all">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
