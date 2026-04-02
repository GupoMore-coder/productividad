import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroups, Group } from '../context/GroupContext';
import CreateGroupModal from '../components/CreateGroupModal';

export default function FamilyGroup() {
  const { user } = useAuth();
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
    rejectInvitation
  } = useGroups();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const myUserId = user?.id || user?.email || 'unknown';

  useEffect(() => {
    const handleOpen = () => setShowCreateModal(true);
    window.addEventListener('open-create-group', handleOpen);
    return () => window.removeEventListener('open-create-group', handleOpen);
  }, []);

  // Invitaciones que ME han enviado a mí
  const myInvitations = useMemo(() => {
    return memberships.filter(m => m.userId === myUserId && m.status === 'invited');
  }, [memberships, myUserId]);

  // Compute status for all groups
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

  // Derived state for selected group
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
    inviteUser(selectedGroup.id, inviteEmail.trim());
    setInviteEmail('');
  };

  return (
    <div style={{ padding: '24px 16px 100px 16px', maxWidth: '600px', margin: '0 auto' }} className="animate-fade-in">
      
      {!selectedGroup ? (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Grupos Corporativos</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                Colabora compartiendo tareas exclusivas.
              </p>
            </div>
            <button
               onClick={() => setShowCreateModal(true)}
               style={{ 
                 background: 'var(--accent-color)', color: '#000', border: 'none', 
                 padding: '8px 16px', borderRadius: '12px', fontWeight: 600, 
                 cursor: 'pointer', boxShadow: 'var(--shadow-glow)'
               }}
            >
              + Nuevo
            </button>
          </header>

          {/* Sección de invitaciones directas */}
          {myInvitations.length > 0 && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(212, 188, 143, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--accent-color)' }}>🔔 Tienes Invitaciones</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myInvitations.map(inv => {
                  const grp = groups.find(g => g.id === inv.groupId);
                  if (!grp) return null;
                  return (
                    <div key={grp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '12px', borderRadius: '8px' }}>
                      <div>
                        <strong style={{ display: 'block' }}>{grp.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Creado por {grp.creatorId.split('@')[0]}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => acceptInvitation(grp.id)} style={{ padding: '6px 12px', background: 'var(--success-color)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Aceptar</button>
                        <button onClick={() => rejectInvitation(grp.id)} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '6px' }}>Rechazar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {groupsWithStatus.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>
                No hay grupos en la red.
              </p>
            ) : (
              groupsWithStatus.map(g => (
                <div 
                  key={g.id} 
                  className="glass-panel"
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: g.status === 'invited' ? '1px solid var(--accent-color)' : '' }}
                >
                  <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => setSelectedGroup(g)}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{g.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {g.memberCount} miembro{g.memberCount !== 1 && 's'} · Creado por {g.creatorId.split('@')[0]}
                    </p>
                  </div>
                  
                  <div>
                    {g.status === 'approved' && (
                       <span style={{ fontSize: '0.8rem', color: 'var(--success-color)', background: 'rgba(46, 160, 67, 0.1)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>Miembro</span>
                    )}
                    {g.status === 'pending' && (
                       <span style={{ fontSize: '0.8rem', color: 'var(--warning-color)', background: 'rgba(210, 153, 34, 0.1)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>Solicitud enviada</span>
                    )}
                    {g.status === 'invited' && (
                       <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', background: 'var(--accent-glow)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>Invitado</span>
                    )}
                    {g.status === 'none' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); requestJoin(g.id); }}
                        style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--accent-color)', background: 'transparent', color: 'var(--accent-color)', cursor: 'pointer' }}
                      >
                        Pedir Unión
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* VISTA DETALLE DEL GRUPO */
        <div className="animate-fade-in">
          <button 
            onClick={() => setSelectedGroup(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', marginBottom: '16px', padding: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Volver
          </button>
          
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{selectedGroup.name}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Creado por {selectedGroup.creatorId.split('@')[0]}
          </p>
          
          {/* Si eres el creador (o Admin), puedes invitar */}
          {(selectedGroup.creatorId === myUserId || user?.isSuperAdmin) && (
            <div style={{ marginBottom: '24px', background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Invitar por Correo</h3>
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="email" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                  placeholder="ejemplo@correo.com" 
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
                <button type="submit" style={{ padding: '0 16px', borderRadius: '8px', background: 'var(--accent-color)', color: '#000', fontWeight: 'bold' }}>
                  Invitar
                </button>
              </form>
            </div>
          )}

          {/* Admin / Creator Only: Solicitudes Entrantes */}
          {(selectedGroup.creatorId === myUserId || user?.isSuperAdmin) && pendingRequests.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--warning-color)', marginBottom: '12px' }}>Quieren entrar a tu grupo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingRequests.map(req => (
                  <div key={req.userId} className="glass-panel" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem' }}>{req.userId}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => approveJoin(selectedGroup.id, req.userId)} style={{ padding: '6px 12px', background: 'rgba(46,160,67,0.2)', color: 'var(--success-color)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        Aprobar
                      </button>
                      <button onClick={() => rejectJoin(selectedGroup.id, req.userId)} style={{ padding: '6px 12px', background: 'rgba(255,59,48,0.2)', color: 'var(--danger-color)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members List */}
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Miembros 
            <span style={{ float: 'right', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'10px' }}>
              {approvedMembers.length} activos
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {approvedMembers.map(m => (
              <div key={m.userId} className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                  {m.userId.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem' }}>{m.userId}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {m.userId === selectedGroup.creatorId ? 'Administrador' : 'Miembro'}
                  </div>
                </div>
                {(selectedGroup.creatorId === myUserId || user?.isSuperAdmin) && m.userId !== myUserId && (
                  <button onClick={() => removeUser(selectedGroup.id, m.userId)} style={{ padding: '4px 8px', background: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '6px', fontSize: '0.8rem' }}>Expulsar</button>
                )}
              </div>
            ))}
          </div>

          {/* Invitados pendientes de aceptar */}
          {(selectedGroup.creatorId === myUserId || user?.isSuperAdmin) && invitedUsers.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Invitaciones en espera ({invitedUsers.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {invitedUsers.map(u => (
                  <div key={u.userId} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', border: '1px dashed var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{u.userId}</span>
                    <button onClick={() => rejectJoin(selectedGroup.id, u.userId)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leave/Delete Group Action */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button 
                onClick={() => {
                  leaveGroup(selectedGroup.id);
                  setSelectedGroup(null);
                }}
                style={{ padding: '10px 20px', background: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {selectedGroup.creatorId === myUserId ? 'Eliminar Grupo' : 'Salir del grupo'}
            </button>
          </div>
        </div>
      )}

      <CreateGroupModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
