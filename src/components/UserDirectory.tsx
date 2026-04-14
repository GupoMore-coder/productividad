import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStorage } from '../lib/storageService';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ImageZoomModal from './ImageZoomModal';
import { usePresence } from '../context/PresenceContext';
import { useWhatsApp } from '../context/WhatsAppContext';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Flag, Eye } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface AppUser {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  cedula?: string;
  phone?: string;
  avatar?: string;
  birth_date?: string;
  role?: string;
  status?: 'Activo' | 'Segundo Plano' | 'Inactivo';
  emergency_name?: string;
  emergency_relationship?: string;
  emergency_phone?: string;
  secondary_phone?: string;
  secondary_email?: string;
  last_seen?: string;
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

const ROLE_ABBREVIATIONS: Record<string, string> = {
  'Administrador maestro': 'Admin. Maestro',
  'Director General (CEO)': 'CEO',
  'Gestor Administrativo': 'Gest. Admin.',
  'Analista Contable': 'An. Contable',
  'Supervisora Puntos de Venta': 'Admin. Pto Venta',
  'Consultora de Ventas': 'Consul. Venta',
  'Colaborador': 'Colaborador'
};

function getRoleWeight(role?: string) {
  return ROLE_HIERARCHY[role || 'Colaborador'] || 99;
}

function getAbbreviatedRole(role?: string) {
  return ROLE_ABBREVIATIONS[role || 'Colaborador'] || role || 'Colaborador';
}

function getShortName(fullName?: string, username?: string): string {
  if (!fullName) return username || 'Usuario';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName;
  return `${parts[0]} ${parts[Math.ceil(parts.length / 2)]}`;
}

export default function UserDirectory({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const { onlineUsers, presenceState } = usePresence();
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [currentUser] = useState(useAuth().user);
  const { openWhatsApp } = useWhatsApp();
  const [oversightUser, setOversightUser] = useState<AppUser | null>(null);

  useEffect(() => {
    async function loadUsers() {
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
          const sorted = data.sort((a, b) => {
            const weightA = getRoleWeight(a.role);
            const weightB = getRoleWeight(b.role);
            if (weightA !== weightB) return weightA - weightB;
            return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '');
          });
          setUsers(sorted);
        }
      } else {
        const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
        const mapped = db.map((u: any) => ({
            ...u,
            full_name: u.user_metadata?.fullName || u.full_name
        }));
        const sorted = mapped.sort((a, b) => {
          const weightA = getRoleWeight(a.role);
          const weightB = getRoleWeight(b.role);
          if (weightA !== weightB) return weightA - weightB;
          return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '');
        });
        setUsers(sorted);
      }
      setLoading(false);
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const weightA = getRoleWeight(a.role);
    const weightB = getRoleWeight(b.role);
    if (weightA !== weightB) return weightA - weightB;
    return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '');
  });

  const isBirthdayToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const birthday = parseISO(dateStr);
    const today = new Date();
    return birthday.getDate() === today.getDate() && birthday.getMonth() === today.getMonth();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-4xl bg-[#1a1622] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
               </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Directorio de Personal</h2>
                  <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">More Paper & Design · EST. 2024</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="relative group">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Buscar personal por nombre, usuario o rol..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
               <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
               <p className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando personal de élite...</p>
            </div>
          ) : (
            filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                <svg className="mb-4 opacity-20" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-sm font-bold uppercase tracking-widest">No se encontraron resultados</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredUsers.map(u => {
                  const isBday = isBirthdayToday(u.birth_date);
                  const isOnline = onlineUsers.includes(u.id);
                  return (
                    <motion.button
                      key={u.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedUser(u)}
                      className={`relative overflow-hidden p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1.5 text-center cursor-pointer ${
                        isBday ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-xl ${
                        isBday ? 'bg-amber-500 text-slate-900 ring-2 ring-amber-500/20' : 'bg-slate-800 text-slate-400 border border-white/5'
                      }`}>
                        {u.avatar && u.avatar.length > 10 ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : (u.avatar || (u.full_name || u.username || 'U').charAt(0).toUpperCase())}
                        {isOnline && (
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1622] ${presenceState[u.id]?.[0]?.status === 'paused' ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`} />
                        )}
                        {isBday && <div className="absolute -top-0.5 -right-0.5 text-[10px]">🎂</div>}
                      </div>

                      {/* ID below avatar */}
                      <span className="text-[0.5rem] font-bold text-slate-600 uppercase tracking-wider">
                        {u.cedula ? `ID: ${u.cedula}` : '\u2014'}
                      </span>

                      {/* Abbreviated Role */}
                      <span className={`text-[0.5rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-md leading-tight ${
                        isBday ? 'text-amber-500 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10'
                      }`}>
                        {getAbbreviatedRole(u.role)}
                      </span>

                      {/* Short Name */}
                      <h3 className="text-[0.7rem] font-bold text-white leading-tight uppercase w-full truncate">
                        {getShortName(u.full_name, u.username)}
                      </h3>

                      {/* Status dot */}
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        <span className={`text-[0.45rem] font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-slate-600'}`}>
                          {isOnline ? (presenceState[u.id]?.[0]?.status === 'paused' ? 'Pausa' : 'Activo') : 'Offline'}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Detail Modal (Zoom Effect) */}
        <AnimatePresence>
          {selectedUser && (() => {
            const u = selectedUser;
            const isBday = isBirthdayToday(u.birth_date);
            const isOnline = onlineUsers.includes(u.id);
            return (
              <motion.div
                key="detail-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
                onClick={() => setSelectedUser(null)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  className="w-full max-w-sm bg-[#1a1622] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl my-auto"
                >
                  {/* Header with avatar */}
                  <div className="relative p-6 pb-4 flex flex-col items-center bg-gradient-to-b from-purple-500/10 to-transparent">
                    <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>

                    <div
                      onClick={() => { if (u.avatar && u.avatar.length > 10) setZoomedImg(u.avatar); }}
                      className={`w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center font-black text-3xl mb-3 ${
                        isBday ? 'bg-amber-500 text-slate-900 ring-4 ring-amber-500/20' : 'bg-slate-800 text-slate-400 border-2 border-white/10'
                      } ${u.avatar && u.avatar.length > 10 ? 'cursor-pointer' : ''}`}
                    >
                      {u.avatar && u.avatar.length > 10 ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : (u.avatar || (u.full_name || u.username || 'U').charAt(0).toUpperCase())}
                    </div>

                    <span className={`text-[0.55rem] font-black uppercase tracking-widest px-3 py-1 rounded-lg mb-2 ${
                      isBday ? 'text-amber-500 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10'
                    }`}>
                      {getAbbreviatedRole(u.role)}
                    </span>

                    <h3 className="text-base font-black text-white uppercase tracking-tight text-center">
                      {u.full_name || u.username}
                    </h3>
                    <p className="text-[0.6rem] text-slate-500 font-bold uppercase">@{u.username}</p>
                  </div>

                  {/* Info Grid */}
                  <div className="px-6 pb-6 space-y-3">
                    {/* Status */}
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                      <span className={`text-[0.6rem] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {isOnline ? (presenceState[u.id]?.[0]?.status === 'paused' ? 'En Pausa' : 'Activo') : (
                          u.last_seen ? `Visto ${formatDistanceToNow(new Date(u.last_seen), { addSuffix: true, locale: es })}` : 'Sin conexión'
                        )}
                      </span>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Data rows */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">Cédula</span>
                        <span className="text-xs font-black text-white">{u.cedula || '\u2014'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">Correo</span>
                        <span className="text-[0.6rem] font-medium text-slate-300 truncate max-w-[60%] text-right">{u.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">Celular</span>
                        <span className="text-xs font-bold text-white">{u.phone || '\u2014'}</span>
                      </div>
                      {u.secondary_phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">Cel. Sec.</span>
                          <span className="text-xs font-bold text-slate-300">{u.secondary_phone}</span>
                        </div>
                      )}
                      {u.secondary_email && (
                        <div className="flex items-center justify-between">
                          <span className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">Email Sec.</span>
                          <span className="text-[0.6rem] font-medium text-slate-300 truncate max-w-[55%] text-right">{u.secondary_email}</span>
                        </div>
                      )}
                      {u.birth_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">Cumpleaños</span>
                          <span className={`text-xs font-bold ${isBday ? 'text-amber-500' : 'text-slate-300'}`}>
                            {isBday ? '🎂 ¡Hoy!' : format(parseISO(u.birth_date), 'dd MMM', { locale: es }).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Emergency Contact */}
                    <div className="h-px bg-white/5 mt-1" />
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-1.5">
                      <p className="text-[0.55rem] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                        Contacto de Emergencia
                      </p>
                      {u.emergency_name ? (
                        <>
                          <div className="text-[0.6rem] text-slate-400 font-medium">{u.emergency_name} · <span className="text-slate-500">{u.emergency_relationship || 'N/A'}</span></div>
                          {u.emergency_phone && (
                            <a href={`tel:${u.emergency_phone}`} className="text-[0.6rem] font-black text-amber-500 hover:text-amber-400">{u.emergency_phone}</a>
                          )}
                        </>
                      ) : (
                        <p className="text-[0.55rem] text-slate-600 italic">Sin datos registrados</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {/* Master Admin Special Powers — Agenda Oversight */}
                    {currentUser?.isMaster && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            triggerHaptic('medium');
                            setOversightUser(u);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[0.65rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/5 hover:bg-purple-500/20 transition-all active:scale-95"
                        >
                          <Eye size={16} /> Ver Agenda de Usuario
                        </button>
                      </div>
                    )}

                    {u.phone && (
                      <div className="flex gap-2 pt-1">
                        <a href={`tel:${u.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.6rem] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all active:scale-95">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          Llamar
                        </a>
                        <button
                          onClick={() => {
                            const name = u.full_name || u.username;
                            const message = `Hola *${name}*, te contacto desde el aplicativo *Antigravity* \u2728.\n\nSoy *${currentUser?.full_name || currentUser?.username}*, \u00bfpuedes ayudarme con lo siguiente?`;
                            openWhatsApp(u.phone!, message);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[0.6rem] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-14 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {zoomedImg && <ImageZoomModal photos={[zoomedImg]} initialIndex={0} onClose={() => setZoomedImg(null)} />}
        <AnimatePresence>
          {oversightUser && (
            <UserAgendaOversight 
              targetUser={oversightUser} 
              onClose={() => setOversightUser(null)} 
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Master Oversight Component ─────────────────────────────────────
function UserAgendaOversight({ targetUser, onClose }: { targetUser: AppUser; onClose: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTargetAgenda() {
      // Direct supabase query bypassing normal filtered contexts for the Master Admin session
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', targetUser.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (!error && data) {
        setTasks(data);
      }
      setLoading(false);
    }
    loadTargetAgenda();
  }, [targetUser.id]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-4 z-[60] bg-[#1a1622] border-2 border-purple-500/40 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col"
    >
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-purple-500/5">
        <div>
           <h3 className="text-sm font-black text-white uppercase tracking-widest">Agenda de {targetUser.full_name?.split(' ')[0] || targetUser.username}</h3>
           <p className="text-[0.6rem] text-purple-400 font-bold uppercase tracking-widest">Modo Supervisión Maestro</p>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-3 opacity-50">
             <div className="w-5 h-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
             <span className="text-[0.6rem] font-bold uppercase tracking-widest text-slate-500">Leyendo registros...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
             <Calendar className="mb-2" size={32} />
             <p className="text-[0.6rem] font-bold uppercase tracking-wider">No hay actividades agendadas</p>
          </div>
        ) : (
          tasks.map((t: any) => (
            <div key={t.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-start">
               <div className={`p-2 rounded-xl text-slate-900 ${t.priority === 'alta' ? 'bg-red-500' : t.priority === 'media' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                  <Flag size={14} strokeWidth={3} />
               </div>
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest">{t.date} · {t.time}</span>
                     <span className={`text-[0.5rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${t.is_shared ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/10 text-slate-600'}`}>
                        {t.is_shared ? 'Compartida' : 'Privada'}
                     </span>
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1">{t.title}</h4>
                  <p className="text-[0.65rem] text-slate-500 leading-relaxed line-clamp-2">{t.description || 'Sin descripción'}</p>
               </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-6 bg-black/40 text-center">
         <p className="text-[0.55rem] text-slate-600 font-medium italic">* Esta vista es de solo lectura y no afecta las métricas ni notificaciones del usuario.</p>
      </div>
    </motion.div>
  );
}
