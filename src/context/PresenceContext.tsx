import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

/**
 * Presence Status Types:
 * - 'online'  → App is in the foreground (visible)
 * - 'away'    → App is in the background (hidden/minimized)
 * - 'offline' → No active presence (disconnected/closed)
 */
export type PresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresenceInfo {
  status: PresenceStatus;
  lastSeen: string | null;
}

interface PresenceContextType {
  onlineUsers: string[];
  presenceState: Record<string, any>;
  /** Returns the full presence info for a given user ID */
  getUserStatus: (userId: string, lastSeenFromDB?: string | null) => UserPresenceInfo;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  presenceState: {},
  getUserStatus: () => ({ status: 'offline', lastSeen: null }),
});

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

  /**
   * Returns the presence status and last-seen timestamp for a user.
   * Checks the real-time presence channel first, then falls back to DB last_seen.
   */
  const getUserStatus = useCallback((userId: string, lastSeenFromDB?: string | null): UserPresenceInfo => {
    const isOnline = onlineUsers.includes(userId);
    
    if (isOnline) {
      const presenceData = presenceState[userId]?.[0];
      const channelStatus = presenceData?.status;
      
      return {
        status: channelStatus === 'paused' ? 'away' : 'online',
        lastSeen: presenceData?.online_at || new Date().toISOString(),
      };
    }
    
    return {
      status: 'offline',
      lastSeen: lastSeenFromDB || null,
    };
  }, [onlineUsers, presenceState]);

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

    channel.on('presence', { event: 'join' }, ({ key }) => {
      setOnlineUsers((prev) => Array.from(new Set([...prev, key])));
    });

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== key));
      // When a user leaves, update their last_seen if we are the user leaving
      // (handled by beforeunload and visibilitychange)
    });

    const trackStatus = async () => {
      const status = document.visibilityState === 'visible' ? 'active' : 'paused';
      await channel.track({ 
        online_at: new Date().toISOString(),
        status
      });
      // Always update last_seen so the DB timestamp stays recent
      updateLastSeen();
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
    <PresenceContext.Provider value={{ onlineUsers, presenceState, getUserStatus }}>
      {children}
    </PresenceContext.Provider>
  );
}

export const usePresence = () => useContext(PresenceContext);
