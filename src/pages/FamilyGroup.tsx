import { useState, useMemo, useEffect, useRef } from 'react';

import { useAuth } from '../context/AuthContext';
import { useGroups, Group } from '../context/GroupContext';
import CreateGroupModal from '../components/CreateGroupModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  ChevronRight, 
  Bell, 
  Check, 
  X, 
  LogOut, 
  Trash2, 
  Mail, 
  ShieldCheck, 
  ArrowLeft
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { triggerHaptic } from '../utils/haptics';
import { usePageTitle } from '../hooks/usePageTitle';

export default function FamilyGroup() {
  const { user } = useAuth();
  usePageTitle('Nuestro Equipo');
  const { 
    groups, 
    memberships, 
    requestJoin, 
    approveJoin, 
    rejectJoin, 
    leaveGroup,
    deleteGroup,
    removeUser,
    inviteUser,
    acceptInvitation,
    rejectInvitation,
    loading
  } = useGroups();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [userDirectory, setUserDirectory] = useState<{ id: string; email: string; full_name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { fetchAllProfiles } = useGroups();

  const myUserId = user?.id || user?.email || 'unknown';

  const handleAction = (type: 'success' | 'light' | 'warning' | 'error') => triggerHaptic(type);

  useEffect(() => {
    const handleOpen = () => setShowCreateModal(true);
    window.addEventListener('open-create-group', handleOpen);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const loadProfiles = async () => {
      try {
        const profiles = await fetchAllProfiles();
        setUserDirectory(profiles);
      } catch (err) {
        console.error('Error loading profiles:', err);
      }
    };
    loadProfiles();

    return () => {
      window.removeEventListener('open-create-group', handleOpen);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const myInvitations = useMemo(() => {
    return memberships.filter(m => m.userId === myUserId && m.status === 'invited');
  }, [memberships, myUserId]);

  const groupsWithStatus = useMemo(() => {
    return groups.map(g => {
      const membership = memberships.find(m => m.groupId === g.id && m.userId === myUserId);
      const leader = userDirectory.find(u => u.id === g.creatorId);
      
      return {
        ...g,
        status: membership ? membership.status : 'none',
        memberCount: memberships.filter(m => m.groupId === g.id && m.status === 'approved').length,
        // Fallback to userDirectory if creator_details is missing
        creator_details: leader ? {
          full_name: leader.full_name,
          avatar: leader.avatar
        } : g.creator_details
      };
    });
  }, [groups, memberships, myUserId, userDirectory]);

  const pendingRequests = useMemo(() => {
    if (!selectedGroup) return [];
    return memberships.filter(m => m.groupId === selectedGroup.id && m.status === 'pending');
  }, [selectedGroup, memberships]);

  const invitedUsers = useMemo(() => {
    if (!selectedGroup) return [];
    return memberships.filter(m => m.groupId === selectedGroup.id && m.status === 'invited');
  }, [selectedGroup, memberships]);

  const approvedMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return memberships.filter(m => m.groupId === selectedGroup.id && m.status === 'approved');
  }, [selectedGroup, memberships]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedGroup) return;
    handleAction('light');
    inviteUser(selectedGroup.id, inviteEmail.trim());
    setInviteEmail('');
    setSearchQuery('');
    setShowDropdown(false);
  };

  const filteredUsers = useMemo(() => {
    const pool = searchQuery.trim() 
      ? userDirectory.filter(u => 
          (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : userDirectory;

    return pool.filter(u => 
      !memberships.some(m => m.groupId === selectedGroup?.id && m.userId === u.id)
    ).slice(0, 5);
  }, [searchQuery, userDirectory, memberships, selectedGroup]);

  const GroupCardSkeleton = () => (
    <div className="p-5 rounded-[28px] bg-white/[0.02] border border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton width={48} height={48} className="rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
           <Skeleton width={140} height={18} />
           <Skeleton width={100} height={12} />
        </div>
      </div>
      <Skeleton width={80} height={32} className="rounded-xl" />
    </div>
  );

  if (loading) return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
           <Skeleton width={200} height={32} />
           <Skeleton width={150} height={16} />
        </div>
        <Skeleton width={80} height={44} className="rounded-2xl" />
      </div>
      <div className="space-y-4">
        <GroupCardSkeleton />
        <GroupCardSkeleton />
        <GroupCardSkeleton />
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 animate-in fade-in duration-700">
      
      <AnimatePresence mode="wait">
        {!selectedGroup ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <header className="flex justify-between items-end">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Users size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Equipos</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium">Colaboración compartida de More Paper & Design</p>
              </div>
              <button
                 onClick={() => { handleAction('light'); setShowCreateModal(true); }}
                 className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-slate-900 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
              >
                <Plus size={18} strokeWidth={3} /> NUEVO
              </button>
            </header>

            {myInvitations.length > 0 && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-[32px] overflow-hidden"
              >
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-2 mb-4">
                  <Bell className="animate-pulse" size={14} /> Invitaciones a grupos
                </h3>
                <div className="space-y-3">
                  {myInvitations.map(inv => {
                    const grp = groups.find(g => g.id === inv.groupId);
                    if (!grp) return null;
                    return (
                      <div key={grp.id} className="flex justify-between items-center bg-[#1a1622]/50 p-4 rounded-2xl border border-white/5">
                        <div>
                          <strong className="text-white text-sm block mb-0.5">{grp.name}</strong>
                          <span className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">
                            Creado por {userDirectory.find(u => u.id === grp.creatorId)?.full_name || grp.creatorId.split('@')[0]}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { handleAction('success'); acceptInvitation(grp.id); }} className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-slate-900 hover:brightness-110 active:scale-90 transition-all font-black"><Check size={18} /></button>
                          <button onClick={() => { handleAction('warning'); rejectInvitation(grp.id); }} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-red-500 hover:bg-red-500/10 active:scale-90 transition-all"><X size={18} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            <div className="grid gap-4">
              {groupsWithStatus.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.01] border border-dashed border-white/10 rounded-[40px] flex flex-col items-center">
                   <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center text-slate-800 mb-6"><Users size={40} /></div>
                   <p className="text-sm font-black text-slate-600 uppercase tracking-widest leading-loose">Ecosistema Vacío · Inicia un Equipo</p>
                </div>
              ) : (
                groupsWithStatus.map(g => (
                  <motion.div 
                    layoutId={g.id}
                    key={g.id} 
                    onClick={() => { handleAction('light'); setSelectedGroup(g); }}
                    className={`
                      p-6 rounded-[32px] flex items-center justify-between border cursor-pointer backdrop-blur-md transition-all duration-500 relative overflow-hidden group
                      ${g.status === 'invited' 
                          ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/10' 
                          : 'bg-white/[0.02] border-white/5 active:scale-[0.98] hover:bg-white/[0.05] hover:border-white/10'}
                    `}
                  >
                    {/* Inner highlight */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none opacity-50" />
                    
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="relative">
                         <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/10 flex items-center justify-center text-purple-400 text-xl font-black shadow-inner shadow-white/5 group-hover:scale-105 transition-transform overflow-hidden relative">
                            {g.creator_details?.avatar ? (
                              <img src={g.creator_details.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (g.creator_details?.full_name || g.name || 'G').charAt(0).toUpperCase()
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                         <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-amber-500 border-4 border-[#0a0b14] flex items-center justify-center shadow-lg" title="Líder del Grupo">
                            <ShieldCheck size={12} className="text-slate-950" />
                         </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white leading-tight tracking-tight mb-1">{g.name}</h4>
                        <div className="flex flex-col gap-1">
                           <span className="text-[0.6rem] text-slate-500 font-black uppercase tracking-[0.15em]">
                             Líder: <span className="text-slate-300">{g.creator_details?.full_name || g.creatorId.split('@')[0]}</span>
                           </span>
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40" />
                             <span className="text-[0.6rem] text-purple-400 font-black uppercase tracking-widest">{g.memberCount} Miembros</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    
                    <div className="flex items-center gap-4 relative z-10">
                      {g.status === 'approved' && (
                         <div className="flex flex-col items-end">
                            <span className="bg-emerald-500/10 text-emerald-500 text-[0.55rem] font-black tracking-widest px-3 py-1 rounded-full border border-emerald-500/20 uppercase shadow-lg shadow-emerald-500/5">Activo</span>
                         </div>
                      )}
                      {g.status === 'pending' && <span className="bg-amber-500/10 text-amber-500 text-[0.55rem] font-black tracking-widest px-3 py-1 rounded-full border border-amber-500/20 uppercase">En Espera</span>}
                      {g.status === 'invited' && <span className="bg-purple-500 text-slate-950 text-[0.55rem] font-black tracking-widest px-3 py-1 rounded-full uppercase animate-pulse shadow-lg shadow-purple-500/20">Invitado</span>}
                      {g.status === 'none' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAction('light'); requestJoin(g.id); }}
                          className="bg-white/10 text-white text-[0.6rem] font-black tracking-widest px-5 py-2.5 rounded-xl uppercase hover:bg-white/20 transition-all active:scale-90 border border-white/10"
                        >
                          Unirse
                        </button>
                      )}
                      <ChevronRight className="text-slate-700 group-hover:text-purple-500 transition-colors" size={20} />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          /* VISTA DETALLE DEL GRUPO */
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <button 
                onClick={() => { handleAction('light'); setSelectedGroup(null); }}
                className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-widest"
              >
                <ArrowLeft size={16} /> Volver
              </button>
              {(selectedGroup.creatorId === myUserId || user?.isMaster || user?.isSuperAdmin) && (
                <div className="flex items-center gap-2 text-amber-400 text-[0.6rem] font-black uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-sm shadow-amber-500/10">
                   <ShieldCheck size={12} /> {user?.isMaster ? 'Modo Administración Maestro' : 'Eres el Propietario'}
                </div>
              )}
            </div>
            
            <header className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 overflow-hidden shrink-0">
                {selectedGroup.creator_details?.avatar ? (
                  <img src={selectedGroup.creator_details.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (selectedGroup.creator_details?.full_name || 'L').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-1">{selectedGroup.name}</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[0.65rem]">
                  Líder: <span className="text-slate-300">{selectedGroup.creator_details?.full_name || selectedGroup.creatorId.split('@')[0]}</span>
                </p>
              </div>
            </header>
            
            <div className="relative" ref={dropdownRef}>
                  <form onSubmit={handleInvite} className="flex gap-2">

                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={e => {
                          setSearchQuery(e.target.value);
                          setShowDropdown(true);
                        }} 
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Buscar por nombre o correo..." 
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/20 placeholder:text-slate-700"
                      />
                      <AnimatePresence>
                        {showDropdown && filteredUsers.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 left-0 right-0 top-full mt-2 bg-[#1a1622] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                          >
                            {filteredUsers.map(u => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setInviteEmail(u.email);
                                  setSearchQuery(`${u.full_name || u.email}`);
                                  setShowDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex flex-col border-b border-white/5 last:border-0"
                              >
                                <span className="text-white text-sm font-bold">{u.full_name}</span>
                                <span className="text-[0.6rem] text-slate-500 uppercase tracking-widest">{u.email}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button 
                      type="submit" 
                      disabled={!inviteEmail}
                      className={`px-6 py-3 rounded-2xl font-black text-[0.65rem] uppercase tracking-widest active:scale-95 transition-all ${inviteEmail ? 'bg-purple-500 text-slate-900 shadow-lg shadow-purple-500/20' : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'}`}
                    >
                      Invitar
                    </button>
                  </form>
                </div>

            {/* Pending Requests */}
            {(selectedGroup.creatorId === myUserId || user?.isMaster || user?.isSuperAdmin) && pendingRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2">
                   <Bell className="animate-bounce" size={14} /> Solicitudes Pendientes
                </h3>
                <div className="space-y-2">
                  {pendingRequests.map(req => (
                    <div key={req.userId} className="flex justify-between items-center bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl shadow-sm">
                      <span className="text-sm font-bold text-slate-200">@{req.userId.split('@')[0]}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { handleAction('success'); approveJoin(selectedGroup.id, req.userId); }} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-900 text-[0.6rem] font-black uppercase tracking-widest">Aprobar</button>
                        <button onClick={() => { handleAction('warning'); rejectJoin(selectedGroup.id, req.userId); }} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-amber-500 text-[0.6rem] font-black uppercase tracking-widest">Rechazar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members Section */}
          <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-slate-600">Personal del Equipo</h3>
                <span className="bg-purple-500/10 text-[0.6rem] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-purple-400 border border-purple-500/20">{approvedMembers.length} Miembros</span>
              </div>
              <div className="grid gap-3">
                {approvedMembers.map(m => (
                  <div key={m.userId} className="bg-white/[0.02] border border-white/5 p-5 rounded-[32px] flex items-center gap-5 hover:bg-white/[0.05] hover:border-white/10 transition-all group relative overflow-hidden backdrop-blur-sm">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${m.userId === selectedGroup.creatorId ? 'bg-amber-500' : 'bg-purple-500/30'}`} />
                    
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 flex items-center justify-center text-purple-400 text-[0.8rem] font-black group-hover:scale-110 transition-transform shadow-inner shadow-white/5 overflow-hidden">
                      { (m.user_details?.avatar || userDirectory.find(u => u.id === m.userId)?.avatar) ? (
                        <img src={m.user_details?.avatar || userDirectory.find(u => u.id === m.userId)?.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (m.user_details?.full_name || userDirectory.find(u => u.id === m.userId)?.full_name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                         <span className="text-base font-black text-white tracking-tight">
                           {m.user_details?.full_name || userDirectory.find(u => u.id === m.userId)?.full_name || m.userId.split('@')[0]}
                         </span>
                         {m.userId === selectedGroup.creatorId && (
                           <div className="bg-amber-500/20 text-amber-500 text-[0.5rem] font-black px-2 py-0.5 rounded-md border border-amber-500/30 uppercase tracking-tighter">Líder</div>
                         )}
                      </div>
                      <div className="text-[0.65rem] font-black uppercase tracking-widest text-slate-500 mt-0.5">
                        {m.userId === selectedGroup.creatorId ? 'Coordinador General' : 'Colaborador de Grupo'}
                      </div>
                    </div>
                    {(selectedGroup.creatorId === myUserId || user?.isMaster || user?.isSuperAdmin) && m.userId !== myUserId && (
                      <button 
                        onClick={() => { 
                          handleAction('error'); 
                          if (confirm(`¿Estás seguro de expulsar a este usuario del grupo "${selectedGroup.name}"?`)) {
                            removeUser(selectedGroup.id, m.userId); 
                          }
                        }} 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Expulsar Miembro"
                      >
                         <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Waiting List */}
            {(selectedGroup.creatorId === myUserId || user?.isMaster || user?.isSuperAdmin) && invitedUsers.length > 0 && (
              <div className="pt-4 border-t border-white/5 space-y-4">
                <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-slate-600">Invitaciones Pendientes ({invitedUsers.length})</h3>
                <div className="grid grid-cols-1 gap-2">
                  {invitedUsers.map(u => (
                    <div key={u.userId} className="flex justify-between items-center px-5 py-3 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 overflow-hidden">
                           {u.user_details?.avatar ? (
                             <img src={u.user_details.avatar} alt="" className="w-full h-full object-cover opacity-80" />
                           ) : (
                             <Mail size={14} />
                           )}
                         </div>
                         <span className="text-xs font-bold text-slate-400">{u.user_details?.full_name || u.userId}</span>
                      </div>
                      <button 
                        onClick={() => { 
                          handleAction('warning'); 
                          if (confirm('¿Eliminar esta invitación?')) {
                            rejectJoin(selectedGroup.id, u.userId); 
                          }
                        }} 
                        className="flex items-center gap-2 text-red-500/60 hover:text-red-500 text-[0.6rem] font-black uppercase tracking-widest transition-colors"
                      >
                        <X size={12} strokeWidth={3} /> Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="pt-12 text-center">
              <button 
                  onClick={() => {
                    handleAction('error');
                    const isOwner = selectedGroup.creatorId === myUserId || user?.isSuperAdmin;
                    const msg = isOwner ? '¿Eliminar grupo por completo? Esta acción es irreversible y borrará todas las tareas del equipo.' : '¿Quieres salir de este grupo?';
                    
                    if (confirm(msg)) {
                      if (isOwner) {
                        deleteGroup(selectedGroup.id);
                      } else {
                        leaveGroup(selectedGroup.id);
                      }
                      setSelectedGroup(null);
                      handleAction('success');
                    }
                  }}
                  className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl border border-red-500/20 text-red-500 text-[0.6rem] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 active:scale-95 transition-all"
                >
                  <LogOut size={16} /> { (selectedGroup.creatorId === myUserId || user?.isSuperAdmin) ? 'Eliminar Grupo' : 'Abandonar Equipo'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateGroupModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
