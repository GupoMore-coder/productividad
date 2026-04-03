import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Group {
  id: string;
  name: string;
  creatorId: string;
}

export interface GroupMembership {
  groupId: string;
  userId: string;
  status: 'pending' | 'invited' | 'approved';
}

interface GroupContextType {
  groups: Group[];
  memberships: GroupMembership[];
  createGroup: (name: string) => Promise<void>;
  requestJoin: (groupId: string) => Promise<void>;
  approveJoin: (groupId: string, userId: string) => Promise<void>;
  rejectJoin: (groupId: string, userId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  removeUser: (groupId: string, targetUserId: string) => Promise<void>;
  inviteUser: (groupId: string, userEmail: string) => Promise<void>;
  acceptInvitation: (groupId: string) => Promise<void>;
  rejectInvitation: (groupId: string) => Promise<void>;
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
      const { data: gData } = await supabase.from('groups').select('*');
      const { data: mData } = await supabase.from('group_memberships').select('*');
      
      if (gData) setGroups(gData.map(g => ({ id: g.id, name: g.name, creatorId: g.creator_id })));
      if (mData) setMemberships(mData.map(m => ({ groupId: m.group_id, userId: m.user_id, status: m.status })));
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
        setGroups(prev => [...prev, { id: gId, name, creatorId: uId }]);
        setMemberships(prev => [...prev, { groupId: gId, userId: uId, status: 'approved' as const }]);
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
      await supabase.from('group_memberships').delete().match({ group_id: groupId, user_id: userId });
    } else {
      setMemberships(prev => prev.filter(m => !(m.groupId === groupId && m.userId === userId)));
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    await rejectJoin(groupId, user.id);
  };

  const removeUser = async (groupId: string, targetUserId: string) => {
    await rejectJoin(groupId, targetUserId);
  };

  const inviteUser = async (groupId: string, userEmail: string) => {
    // In real Supabase, we would need to map email to user_id first.
    // For now, let's assume user_id is the same as email if Supabase isn't here,
    // but in real mode, the user must already exist in 'profiles'.
    let targetId = userEmail;
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('profiles').select('id').eq('email', userEmail).single();
      if (!data) throw new Error('Usuario no encontrado');
      targetId = data.id;
      await supabase.from('group_memberships').insert({ group_id: groupId, user_id: targetId, status: 'invited' });
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

  return (
    <GroupContext.Provider value={{ groups, memberships, createGroup, requestJoin, approveJoin, rejectJoin, leaveGroup, removeUser, inviteUser, acceptInvitation, rejectInvitation, loading }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => useContext(GroupContext);
