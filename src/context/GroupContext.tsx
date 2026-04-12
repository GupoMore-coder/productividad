import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Group {
  id: string;
  name: string;
  creatorId: string;
  creator_details?: {
    full_name: string;
    avatar?: string;
  };
}

export interface GroupMembership {
  groupId: string;
  userId: string;
  status: 'pending' | 'invited' | 'approved';
  user_details?: {
    full_name: string;
    avatar?: string;
    role?: string;
  };
}

interface GroupContextType {
  groups: Group[];
  memberships: GroupMembership[];
  createGroup: (name: string) => Promise<void>;
  requestJoin: (groupId: string) => Promise<void>;
  approveJoin: (groupId: string, userId: string) => Promise<void>;
  rejectJoin: (groupId: string, userId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  removeUser: (groupId: string, targetUserId: string) => Promise<void>;
  inviteUser: (groupId: string, userEmail: string) => Promise<void>;
  acceptInvitation: (groupId: string) => Promise<void>;
  rejectInvitation: (groupId: string) => Promise<void>;
  fetchAllProfiles: () => Promise<{ id: string; email: string; full_name: string }[]>;
  loading: boolean;
}

const GroupContext = createContext<GroupContextType>({} as GroupContextType);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load & Real-time Sync
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setGroups(JSON.parse(localStorage.getItem('mock_groups') || '[]'));
      setMemberships(JSON.parse(localStorage.getItem('mock_memberships') || '[]'));
      setLoading(false);
      return;
    }

    const loadGroups = async () => {
      setLoading(true);
      const { data: gData } = await supabase.from('groups').select('*, profiles!creator_id(full_name, avatar)');
      const { data: mData } = await supabase.from('group_memberships').select('*, profiles!user_id(full_name, avatar, role)');
      
      if (gData) {
        setGroups(gData.map(g => ({ 
          id: g.id, 
          name: g.name, 
          creatorId: g.creator_id,
          creator_details: g.profiles ? {
            full_name: g.profiles.full_name,
            avatar: g.profiles.avatar
          } : undefined
        })));
      }
      if (mData) {
        setMemberships(mData.map(m => ({ 
          groupId: m.group_id, 
          userId: m.user_id, 
          status: m.status,
          user_details: m.profiles ? {
            full_name: m.profiles.full_name,
            avatar: m.profiles.avatar,
            role: m.profiles.role
          } : undefined
        })));
      }
      setLoading(false);
    };

    loadGroups();

    if (isSupabaseConfigured && user?.id) {
       const channel = supabase.channel(`group-sync-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => loadGroups())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_memberships' }, () => loadGroups())
        .subscribe();

       return () => { supabase.removeChannel(channel).catch(console.error); };
    }
  }, [isSupabaseConfigured, user?.id]);

  // 2. Local Fallback Sync
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('mock_groups', JSON.stringify(groups));
      localStorage.setItem('mock_memberships', JSON.stringify(memberships));
    }
  }, [groups, memberships, isSupabaseConfigured]);

  const createGroup = async (name: string) => {
    if (!user) return;
    const gId = crypto.randomUUID(); // Usando UUID real para Supabase
    const uId = user.id;

    if (isSupabaseConfigured) {
      try {
        const { error: gErr } = await supabase.from('groups').insert({ id: gId, name, creator_id: uId });
        if (gErr) throw gErr;
        const { error: mErr } = await supabase.from('group_memberships').insert({ group_id: gId, user_id: uId, status: 'approved' });
        if (mErr) throw mErr;

        // Sincronización proactiva inmediata
        setGroups(prev => [...prev, { 
          id: gId, 
          name, 
          creatorId: uId,
          creator_details: user ? {
            full_name: user.full_name || user.username,
            avatar: user.avatar
          } : undefined
        }]);
        setMemberships(prev => [...prev, { 
          groupId: gId, 
          userId: uId, 
          status: 'approved' as const,
          user_details: user ? {
            full_name: user.full_name || user.username,
            avatar: user.avatar,
            role: user.role
          } : undefined
        }]);
      } catch (err: any) {
        console.error('Error al crear grupo:', err);
        alert(`FALLO AL CREAR GRUPO: ${err.message || 'Error de permisos RLS o conexión de red'}`);
        throw err;
      }
    } else {
      const newGroup = { id: gId, name, creatorId: uId };
      const newMembership = { groupId: gId, userId: uId, status: 'approved' as const };
      setGroups(prev => [...prev, newGroup]);
      setMemberships(prev => [...prev, newMembership]);
    }
  };

  const requestJoin = async (groupId: string) => {
    if (!user) return;
    if (isSupabaseConfigured) {
      await supabase.from('group_memberships').insert({ group_id: groupId, user_id: user.id, status: 'pending' });
    } else {
      setMemberships(prev => [...prev, { groupId, userId: user.id, status: 'pending' }]);
    }
  };

  const approveJoin = async (groupId: string, userId: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('group_memberships').update({ status: 'approved' }).match({ group_id: groupId, user_id: userId });
    } else {
      setMemberships(prev => prev.map(m => (m.groupId === groupId && m.userId === userId) ? { ...m, status: 'approved' } : m));
    }
  };

  const rejectJoin = async (groupId: string, userId: string) => {
    if (isSupabaseConfigured) {
      try {
        // Optimistic update
        setMemberships(prev => prev.filter(m => !(m.groupId === groupId && m.userId === userId)));
        
        const { error } = await supabase.from('group_memberships').delete().match({ group_id: groupId, user_id: userId });
        if (error) throw error;
      } catch (err: any) {
        console.error('Error rejecting/canceling membership:', err);
        // Rollback if needed (though realtime sync would typically fix this)
        alert(`No se pudo completar la acción: ${err.message}`);
      }
    } else {
      setMemberships(prev => prev.filter(m => !(m.groupId === groupId && m.userId === userId)));
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    await rejectJoin(groupId, user.id);
  };

  const deleteGroup = async (groupId: string) => {
    if (!user) return;
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const isAdmin = user.isSuperAdmin || group.creatorId === user.id;
    if (!isAdmin) {
      alert("No tienes permisos suficientes para eliminar este grupo.");
      return;
    }

    if (isSupabaseConfigured) {
      try {
        // 1. Convert shared tasks to private for the leader (remove group reference)
        const { data: grpTasks } = await supabase.from('tasks').select('id, group_ids').contains('group_ids', [groupId]);
        if (grpTasks && grpTasks.length > 0) {
          for (const t of grpTasks) {
            const updatedIds = (t.group_ids || []).filter((id: string) => id !== groupId);
            await supabase.from('tasks').update({ group_ids: updatedIds }).eq('id', t.id);
          }
        }

        // 2. Delete memberships
        const { error: mErr } = await supabase.from('group_memberships').delete().eq('group_id', groupId);
        if (mErr) throw mErr;

        // 3. Delete group
        const { error: gErr } = await supabase.from('groups').delete().eq('id', groupId);
        if (gErr) throw gErr;

        setGroups(prev => prev.filter(g => g.id !== groupId));
        setMemberships(prev => prev.filter(m => m.groupId !== groupId));
      } catch (err: any) {
        console.error('Error deleting group:', err);
        alert(`Error al eliminar grupo: ${err.message}`);
      }
    } else {

      setGroups(prev => prev.filter(g => g.id !== groupId));
      setMemberships(prev => prev.filter(m => m.groupId !== groupId));
    }
  };

  const removeUser = async (groupId: string, targetUserId: string) => {
    if (!user) return;
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const isAdmin = user.isMaster || user.isSuperAdmin || group.creatorId === user.id;
    if (!isAdmin) {
      alert("Solo el creador o el administrador maestro pueden expulsar usuarios.");
      return;
    }

    if (isSupabaseConfigured) {
      try {
        // Optimistic update
        setMemberships(prev => prev.filter(m => !(m.groupId === groupId && m.userId === targetUserId)));

        // Log the expulsion for notification purposes before deleting (non-blocking)
        supabase.from('audit_logs').insert({
          action: 'user_expelled',
          details: { group_id: groupId, user_id: targetUserId },
          created_by: user.id
        }).then(({ error }) => { if (error) console.warn('Audit log skip:', error.message); });

        // notify via a dedicated table if available (realtime fallback)
        supabase.from('realtime_notifications').insert({
          user_id: targetUserId,
          title: 'Aviso de Grupo',
          message: `Recientemente dejaste de pertenecer al grupo "${group.name}" ponte en contacto con el administrador o el lider del grupo`,
          type: 'group_expulsion'
        }).then(({ error }) => { if (error) console.warn('Notification skip:', error.message); });


        const { error } = await supabase.from('group_memberships').delete().match({ group_id: groupId, user_id: targetUserId });
        if (error) throw error;
      } catch (err: any) {
        console.error('Error removing user:', err);
        alert(`Error al expulsar usuario: ${err.message}`);
      }
    } else {
      setMemberships(prev => prev.filter(m => !(m.groupId === groupId && m.userId === targetUserId)));
    }
  };

  const inviteUser = async (groupId: string, userEmail: string) => {
    let targetId = userEmail;
    if (isSupabaseConfigured) {
      try {
        const { data: profile } = await supabase.from('profiles').select('id, full_name, avatar, role').eq('email', userEmail).single();
        if (!profile) throw new Error('Usuario no encontrado');
        targetId = profile.id;
        
        // 1. Check if already a member or invited
        const alreadyMember = memberships.find(m => m.groupId === groupId && m.userId === targetId);
        if (alreadyMember) {
          triggerHaptic('warning');
          alert(`El usuario "${profile.full_name}" ya es miembro o tiene una invitación pendiente.`);
          return;
        }

        // 2. Optimistic update
        const newInvitation: GroupMembership = {
          groupId,
          userId: targetId,
          status: 'invited',
          user_details: {
            full_name: profile.full_name,
            avatar: profile.avatar,
            role: profile.role
          }
        };
        setMemberships(prev => [...prev, newInvitation]);

        // 3. Insert in DB
        const { error } = await supabase.from('group_memberships').insert({ group_id: groupId, user_id: targetId, status: 'invited' });
        
        if (error) {
          if (error.code === '23505') { // Duplicate key
             alert(`Este usuario ya tiene una invitación registrada en la base de datos.`);
             return;
          }
          throw error;
        }
      } catch (err: any) {
        console.error('Error inviting user:', err);
        alert(`Error al invitar: ${err.message}`);
        // Refresh to sync state on error
        const { data: mData } = await supabase.from('group_memberships').select('*, profiles!user_id(full_name, avatar, role)');
        if (mData) {
          setMemberships(mData.map(m => ({ 
            groupId: m.group_id, 
            userId: m.user_id, 
            status: m.status,
            user_details: m.profiles ? {
              full_name: m.profiles.full_name,
              avatar: m.profiles.avatar,
              role: m.profiles.role
            } : undefined
          })));
        }
      }
    } else {
      setMemberships(prev => [...prev, { groupId, userId: targetId, status: 'invited' }]);
    }
  };

  const acceptInvitation = async (groupId: string) => {
    if (!user) return;
    await approveJoin(groupId, user.id);
  };

  const rejectInvitation = async (groupId: string) => {
    await leaveGroup(groupId);
  };

  const fetchAllProfiles = async () => {
    if (!isSupabaseConfigured) {
      return JSON.parse(localStorage.getItem('mock_users_db') || '[]').map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || u.username
      }));
    }
    const { data, error } = await supabase.from('profiles').select('id, email, full_name, avatar').order('full_name');
    if (error) throw error;
    return data || [];
  };

  return (
    <GroupContext.Provider value={{ 
      groups, 
      memberships, 
      createGroup, 
      requestJoin, 
      approveJoin, 
      rejectJoin, 
      leaveGroup, 
      deleteGroup,
      removeUser, 
      inviteUser, 
      acceptInvitation, 
      rejectInvitation, 
      fetchAllProfiles,
      loading 
    }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => useContext(GroupContext);
