import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PresenceContextType {
  onlineUsers: string[];
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: [] });

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

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
      const onlineIds = Object.keys(state);
      setOnlineUsers(onlineIds);
    });

    channel.on('presence', { event: 'join' }, ({ key }) => {
      setOnlineUsers((prev) => Array.from(new Set([...prev, key])));
    });

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== key));
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Enviar nuestra presencia a la red
        await channel.track({ online_at: new Date().toISOString() });
        // También actualizamos el last_seen en base de datos al entrar
        await updateLastSeen();
      }
    });

    // Registrar "last_seen" cuando cerramos la app
    const handleBeforeUnload = () => {
      // Intentar actualizar de forma sincrona mediante beacon (no viable en todos los browsers) o update
      // supabase.from ya no se garantiza acá, pero se despacha.
      updateLastSeen();
    };
    
    // En PWA moviles, es mejor escuchar visibilitychange
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateLastSeen();
      } else if (document.visibilityState === 'visible') {
        updateLastSeen();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Intentar marcar salida normal
      updateLastSeen();
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
}

export const usePresence = () => useContext(PresenceContext);
