import { useState, useMemo, useEffect } from 'react';
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

  const { fetchAllProfiles } = useGroups();

  const myUserId = user?.id || user?.email || 'unknown';

  const handleAction = (type: 'success' | 'light' | 'warning' | 'error') => triggerHaptic(type);

  useEffect(() => {
    const handleOpen = () => setShowCreateModal(true);
    window.addEventListener('open-create-group', handleOpen);
    
    const loadProfiles = async () => {
      try {
        const profiles = await fetchAllProfiles();
        setUserDirectory(profiles);
      } catch (err) {
        console.error('Error loading profiles:', err);
      }
    };
    loadProfiles();

    return () => window.removeEventListener('open-create-group', handleOpen);
  }, []);

  const myInvitations = useMemo(() => {
    return memberships.filter(m => m.userId === myUserId && m.status === 'invited');
  }, [memberships, myUserId]);

  const groupsWithStatus = useMemo(() => {
    return groups.map(g => {
      const membership = memberships.find(m => m.groupId === g.id && m.userId === myUserId);
      return {
        ...g,
        status: membership ? membership.status : 'none',
        memberCount: memberships.filter(m => m.groupId === g.id && m.status === 'approved').length
      };
    });
  }, [groups, memberships, myUserId]);

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
                <p className="text-sm text-slate-500 font-medium">Colaboración compartida de Grupo More</p>
              </div>
              <button
                 onClick={() => { handleAction('light'); setShowCreateModal(true); }}
                 className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-slate-900 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
              >
                <Plus size={16} /> Nuevo
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
                          <span className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">Creado por {grp.creatorId.split('@')[0]}</span>
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

            <div className="space-y-3">
              {groupsWithStatus.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.01] border border-dashed border-white/10 rounded-[32px]">
                   <Users className="mx-auto mb-4 text-slate-800" size={48} />
                   <p className="text-sm font-medium text-slate-500">No hay grupos registrados en este momento.</p>
                </div>
              ) : (
                groupsWithStatus.map(g => (
                  <motion.div 
                    layoutId={g.id}
                    key={g.id} 
                    onClick={() => { handleAction('light'); setSelectedGroup(g); }}
                    className={`
                      p-5 rounded-[28px] flex items-center justify-between border cursor-pointer hover:bg-white/[0.04] active:scale-[0.98] transition-all
                      ${g.status === 'invited' ? 'bg-purple-500/5 border-purple-500/30' : 'bg-white/[0.02] border-white/5'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-purple-400 text-lg font-black">
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-white font-bold leading-tight tracking-tight">{g.name}</h4>
                        <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                          {g.memberCount} Miem.{g.memberCount !== 1 && 's'} · @{g.creatorId.split('@')[0]}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {g.status === 'approved' && <span className="bg-emerald-500/10 text-emerald-500 text-[0.6rem] font-black tracking-widest px-2 py-1 rounded-lg border border-emerald-500/20 uppercase">Miembro</span>}
                      {g.status === 'pending' && <span className="bg-amber-500/10 text-amber-500 text-[0.6rem] font-black tracking-widest px-2 py-1 rounded-lg border border-amber-500/20 uppercase">Pendiente</span>}
                      {g.status === 'invited' && <span className="bg-purple-500/20 text-purple-400 text-[0.6rem] font-black tracking-widest px-2 py-1 rounded-lg border border-purple-500/30 uppercase animate-pulse">Invitado</span>}
                      {g.status === 'none' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAction('light'); requestJoin(g.id); }}
                          className="bg-white/5 border border-white/10 text-white text-[0.6rem] font-black tracking-widest px-3 py-2 rounded-xl uppercase hover:bg-white/10 transition-colors"
                        >
                          Unirse
                        </button>
                      )}
                      <ChevronRight className="text-slate-700" size={18} />
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
              {(selectedGroup.creatorId === myUserId || user?.isSuperAdmin) && (
                <div className="flex items-center gap-2 text-amber-400 text-[0.6rem] font-black uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-sm shadow-amber-500/10">
                   <ShieldCheck size={12} /> Eres el Propietario
                </div>
              )}
            </div>
            
            <header>
              <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-1">{selectedGroup.name}</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[0.65rem]">Creado por @{selectedGroup.creatorId.split('@')[0]}</p>
            </header>
            
                <div className="relative">
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
            {(selectedGroup.creatorId === myUserId || user?.isSuperAdmin) && pendingRequests.length > 0 && (
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">Lista de Participantes</h3>
                <span className="bg-white/5 text-[0.6rem] font-black uppercase tracking-widest px-3 py-1 rounded-full text-slate-600 border border-white/5">{approvedMembers.length} activos</span>
              </div>
              <div className="space-y-2">
                {approvedMembers.map(m => (
                  <div key={m.userId} className="bg-white/[0.02] border border-white/5 p-4 rounded-[28px] flex items-center gap-4 hover:border-white/10 transition-colors group">
                    <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-purple-400/50 text-[0.65rem] font-black group-hover:text-purple-400 transition-colors">
                      {m.userId.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white tracking-tight">@{m.userId.split('@')[0]}</div>
                      <div className="text-[0.6rem] font-bold uppercase tracking-widest text-slate-500">
                        {m.userId === selectedGroup.creatorId ? 'Líder de Grupo' : 'Analista Colaborador'}
                      </div>
                    </div>
                    {(selectedGroup.creatorId === myUserId || user?.isSuperAdmin) && m.userId !== myUserId && (
                      <button onClick={() => { handleAction('error'); removeUser(selectedGroup.id, m.userId); }} className="p-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Waiting List */}
            {(selectedGroup.creatorId === myUserId || user?.isSuperAdmin) && invitedUsers.length > 0 && (
              <div className="pt-4 border-t border-white/5 space-y-4">
                <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-slate-600">Invitaciones Enviadas ({invitedUsers.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {invitedUsers.map(u => (
                    <div key={u.userId} className="flex justify-between items-center px-4 py-2.5 bg-white/[0.01] border border-dashed border-white/10 rounded-xl">
                      <span className="text-[0.65rem] font-bold text-slate-500 flex items-center gap-2"><Mail size={12} /> {u.userId}</span>
                      <button onClick={() => { handleAction('light'); rejectJoin(selectedGroup.id, u.userId); }} className="text-red-500/50 hover:text-red-500 transition-colors"><X size={14} /></button>
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
                    if (confirm(selectedGroup.creatorId === myUserId ? '¿Eliminar grupo por completo?' : '¿Quieres salir de este grupo?')) {
                      leaveGroup(selectedGroup.id);
                      setSelectedGroup(null);
                      handleAction('success');
                    }
                  }}
                  className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl border border-red-500/20 text-red-500 text-[0.6rem] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 active:scale-95 transition-all"
                >
                  <LogOut size={16} /> {selectedGroup.creatorId === myUserId ? 'Eliminar Grupo' : 'Abandonar Equipo'}
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
