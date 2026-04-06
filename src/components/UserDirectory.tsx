import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStorage } from '../lib/storageService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ImageZoomModal from './ImageZoomModal';

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

export default function UserDirectory({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);

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
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
               </div>
               <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Directorio de Personal</h2>
                  <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Grupo More · Conectividad Asistida</p>
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
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map(u => {
                  const isBday = isBirthdayToday(u.birth_date);
                  const isOnline = u.status === 'Activo';
                  const isAway = u.status === 'Segundo Plano';

                  return (
                    <motion.div 
                      key={u.id} 
                      whileHover={{ y: -4 }}
                      className={`relative overflow-hidden p-6 gap-6 rounded-[32px] border transition-all duration-500 group flex flex-col justify-between ${
                        isBday ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 shadow-xl shadow-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div 
                          onClick={() => { if (u.avatar && u.avatar.length > 10) setZoomedImg(u.avatar); }}
                          className={`relative w-16 h-16 rounded-[22px] overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-xl shadow-2xl transition-transform duration-500 group-hover:scale-110 ${
                            isBday ? 'bg-amber-500 text-slate-900 ring-4 ring-amber-500/20' : 'bg-slate-800 text-slate-400 border border-white/10'
                          } ${u.avatar && u.avatar.length > 10 ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          {u.avatar && u.avatar.length > 10 ? <img src={u.avatar} className="w-full h-100 object-cover" /> : (u.avatar || (u.full_name || u.username || 'U').charAt(0).toUpperCase())}
                          {isBday && (
                            <div className="absolute -top-1 -right-1 text-base filter drop-shadow-[0_0_4px_gold] animate-bounce">🎂</div>
                          )}
                          {(isOnline || isAway) && (
                            <div 
                              className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#1a1622] shadow-[0_0_8px_currentColor] ${isOnline ? 'bg-emerald-500 text-emerald-500' : 'bg-amber-500 text-amber-500'}`}
                              title={isOnline ? 'En línea' : 'Ausente'} 
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className={`text-[0.6rem] font-black uppercase tracking-[0.2em] mb-1 block transition-colors ${isBday ? 'text-amber-500' : 'text-blue-400 group-hover:text-blue-300'}`}>
                            {u.role || 'Colaborador'}
                          </span>
                          <h3 className="text-base font-black text-white leading-tight uppercase truncate">
                            {u.full_name || u.username}
                          </h3>
                          <p className="text-[0.65rem] font-bold text-slate-500 uppercase mt-1">ID: <span className="text-slate-400">{u.cedula || '—'}</span></p>
                        </div>
                      </div>

                      <div className="h-px bg-white/5 w-full my-1" />

                      {/* Info & Quick Actions */}
                      <div className="flex items-center justify-between gap-4 mt-2">
                        <div className="flex flex-col gap-1 min-w-0">
                           <div className="flex items-center gap-2 text-[0.7rem] font-bold text-slate-400 truncate group-hover:text-white transition-colors">
                              <span className="opacity-40">✉️</span> {u.email}
                           </div>
                           {u.birth_date && (
                             <div className="flex items-center gap-2 text-[0.7rem] font-black text-amber-500/80 uppercase tracking-tighter">
                                <span className={isBday ? 'animate-pulse' : ''}>🎁</span> {format(parseISO(u.birth_date), 'dd MMMM', { locale: es }).toUpperCase()}
                             </div>
                           )}
                        </div>

                        {/* Adaptive Quick Actions */}
                        <div className="flex items-center gap-2">
                           {u.phone && (
                             <>
                               <a 
                                 href={`tel:${u.phone}`}
                                 className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-500/30 transition-all shadow-lg active:scale-95"
                                 aria-label="Llamar"
                               >
                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                               </a>
                               <a 
                                 href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500/30 transition-all shadow-lg active:scale-95"
                                 aria-label="WhatsApp"
                               >
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-14 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>
                               </a>
                             </>
                           )}
                        </div>
                      </div>

                      {/* Emergency Contact Display (v4) */}
                      {u.emergency_name && (
                        <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col gap-1.5 transition-all group-hover:bg-amber-500/10">
                           <div className="flex items-center gap-2 text-[0.55rem] font-black text-amber-500 uppercase tracking-widest opacity-80">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                              Contacto de Emergencia
                           </div>
                           <div className="flex justify-between items-center text-[0.65rem] text-slate-400 font-bold uppercase tracking-tighter">
                              <span className="truncate">{String(u.emergency_name)} ({String(u.emergency_relationship)})</span>
                              <a href={`tel:${u.emergency_phone}`} className="text-amber-500 hover:text-amber-400 font-black">{String(u.emergency_phone)}</a>
                           </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )
          )}
        </div>
        {zoomedImg && <ImageZoomModal src={zoomedImg} onClose={() => setZoomedImg(null)} />}
      </motion.div>
    </div>
  );
}
