import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PresenceContextType {
  onlineUsers: string[];
  presenceState: Record<string, any>;
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: [], presenceState: {} });

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [presenceState, setPresenceState] = useState<Record<string, any>>({});

  // Función para actualizar "Última vez visto" en la base de datos
  const updateLastSeen = async () => {
    if (!user || !isSupabaseConfigured) return;
    try {
      await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
    } catch (err) {
      console.warn("Failed to update last_seen:", err);
    }
  };

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setOnlineUsers([]);
      setPresenceState({});
      return;
    }

    const channel = supabase.channel('global:presence', {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setPresenceState(state);
      const onlineIds = Object.keys(state);
      setOnlineUsers(onlineIds);
    });

    channel.on('presence', { event: 'join' }, ({ key, currentPresences }) => {
      setOnlineUsers((prev) => Array.from(new Set([...prev, key])));
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== key));
    });

    const trackStatus = async () => {
      const status = document.visibilityState === 'visible' ? 'active' : 'paused';
      await channel.track({ 
        online_at: new Date().toISOString(),
        status
      });
      if (status === 'active') updateLastSeen();
    };

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await trackStatus();
      }
    });

    // En PWA moviles, es mejor escuchar visibilitychange
    const handleVisibilityChange = () => {
      trackStatus();
    };

    window.addEventListener('beforeunload', updateLastSeen);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', updateLastSeen);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, presenceState }}>
      {children}
    </PresenceContext.Provider>
  );
}

export const usePresence = () => useContext(PresenceContext);
