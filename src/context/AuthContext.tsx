import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStorage } from '@/lib/storageService';

const DEFAULT_USERS = [
  { id: 'u1', username: 'miguel', email: 'miguel@grupomore.local', password: '123456', user_metadata: { fullName: 'Miguel', username: 'miguel' }, role: 'Gestor Administrativo', needsSetup: true },
  { id: 'u2', username: 'flor', email: 'flor@grupomore.local', password: '123456', user_metadata: { fullName: 'Flor', username: 'flor' }, role: 'Director General (CEO)', needsSetup: true },
  { id: 'u3', username: 'shaira', email: 'shaira@grupomore.local', password: '123456', user_metadata: { fullName: 'Shaira', username: 'shaira' }, role: 'Supervisora Puntos de Venta', needsSetup: true },
  { id: 'u4', username: 'nayelis', email: 'nayelis@grupomore.local', password: '123456', user_metadata: { fullName: 'Nayelis', username: 'nayelis' }, role: 'Consultora de Ventas', needsSetup: true },
  { id: 'u5', username: 'maidi', email: 'maidi@grupomore.local', password: '123456', user_metadata: { fullName: 'Maidi', username: 'maidi' }, role: 'Consultora de Ventas', needsSetup: true },
  { id: 'u6', username: 'ines', email: 'ines@grupomore.local', password: '123456', user_metadata: { fullName: 'Ines', username: 'ines' }, role: 'Analista Contable', needsSetup: true },
  { id: 'admin', username: 'fernando', email: 'fernando830609@gmail.com', password: '123456', user_metadata: { fullName: 'Fernando Marulanda', username: 'fernando' }, role: 'Administrador maestro', needsSetup: false, isSuperAdmin: true }
];

interface AuthContextType {
  user: any;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signInWithUsername: (username: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, username: string) => Promise<any>;
  updateProfile: (data: { email: string, password: string, fullName: string, cedula?: string, phone?: string, avatar?: string, birth_date?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  enablePasskey: () => Promise<void>;
  signInWithPasskey: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndSetUser = async (authUser: any) => {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.warn('Error fetching profile:', error);
        }

        const isSuper = profile?.is_super_admin || profile?.role === 'Administrador' || profile?.role === 'Administrador maestro' || false;

        setUser({
          ...authUser,
          ...profile,
          isSuperAdmin: isSuper,
          needsSetup: profile?.needs_setup ?? true,
          username: profile?.username || authUser.user_metadata?.username || 'usuario'
        });
      } catch (err) {
        console.error('Auth sync error:', err);
        setUser(authUser);
      } finally {
        setLoading(false);
      }
    };

    const initMock = async () => {
      await mockStorage.syncFromLocalStorage('mock_users_db');
      await mockStorage.syncFromLocalStorage('mock_user_session');

      let db = await mockStorage.getItem<any[]>('mock_users_db');
      if (!db) {
        await mockStorage.setItem('mock_users_db', DEFAULT_USERS);
      } else {
        // Asegurarse de que usuarios nuevos (como Ines) se agreguen si no existen
        let updated = false;
        DEFAULT_USERS.forEach(defUser => {
          if (!db!.some(u => u.username === defUser.username)) {
            db!.push(defUser);
            updated = true;
          }
        });
        if (updated) await mockStorage.setItem('mock_users_db', db);
      }
      
      const mockSession = await mockStorage.getItem<any>('mock_user_session');
      if (mockSession) {
        setUser(mockSession);
      }
      setLoading(false);
    };

    if (!isSupabaseConfigured) {
      initMock();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      fetchProfileAndSetUser(session?.user ?? null);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      fetchProfileAndSetUser(session?.user ?? null);
    });

    let profileChannel: any = null;
    if (user?.id) {
       profileChannel = supabase.channel(`profile-sync-${user.id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${user.id}` 
        }, (payload) => {
          if (payload.new.blocked) {
            signOut();
          } else {
            setUser((prev: any) => ({ ...prev, ...payload.new }));
          }
        })
        .subscribe();
    }

    // ── PAGE VISIBILITY / STATUS DETECTION ──
    const updateMockStatus = async (status: 'Activo' | 'Segundo Plano' | 'Inactivo') => {
      if (!isSupabaseConfigured && user?.id) {
        const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
        const idx = db.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          db[idx].status = status;
          await mockStorage.setItem('mock_users_db', db);
        }
      }
    };

    const handleVisibilityChange = () => {
      const status = document.visibilityState === 'visible' ? 'Activo' : 'Segundo Plano';
      updateMockStatus(status);
    };

    if (!isSupabaseConfigured && user?.id) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      // Initial status
      updateMockStatus(document.visibilityState === 'visible' ? 'Activo' : 'Segundo Plano');
    }

    return () => {
      authSub.unsubscribe();
      if (profileChannel) supabase.removeChannel(profileChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      let mockUser = db.find((u: any) => u.email === email && u.password === pass);

      if (!mockUser && email === 'fernando830609@gmail.com' && (pass === '123456' || pass === 'admin')) {
        mockUser = DEFAULT_USERS.find(u => u.id === 'admin');
        if (mockUser) mockUser.password = pass;
      }

      if (mockUser) {
        if (mockUser.blocked) throw new Error('Esta cuenta ha sido bloqueada.');
        if (mockUser.pendingApproval) throw new Error('Cuenta pendiente de aprobación.');
        await mockStorage.setItem('mock_user_session', mockUser);
        setUser(mockUser);
        return { data: { user: mockUser }, error: null };
      }
      throw new Error('Credenciales inválidas');
    }
    return supabase.auth.signInWithPassword({ email, password: pass });
  };

  const signInWithUsername = async (username: string, pass: string) => {
    if (!isSupabaseConfigured) {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      let mockUser = db.find((u: any) => u.username === username.toLowerCase() && u.password === pass);

      if (!mockUser && username.toLowerCase() === 'fernando' && (pass === '123456' || pass === 'admin')) {
        mockUser = DEFAULT_USERS.find(u => u.id === 'admin');
        if (mockUser) mockUser.password = pass;
      }

      if (mockUser) {
        await mockStorage.setItem('mock_user_session', mockUser);
        setUser(mockUser);
        return { data: { user: mockUser }, error: null };
      }
      throw new Error('Credenciales inválidas');
    }
    const { data, error } = await supabase.from('profiles').select('email').eq('username', username).single();
    if (error || !data) throw new Error('Usuario no encontrado');
    return supabase.auth.signInWithPassword({ email: data.email, password: pass });
  };

  const signUp = async (email: string, pass: string, username: string) => {
    if (!isSupabaseConfigured) {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      if (db.some((u: any) => u.username === username || u.email === email)) {
        throw new Error('El usuario o correo ya está registrado');
      }
      const mockUser = {
        id: Math.random().toString(36).substring(7),
        username: username.toLowerCase(),
        email,
        password: pass,
        user_metadata: { username, fullName: '' },
        needsSetup: true,
        pendingApproval: false,
        role: 'Colaborador'
      };
      db.push(mockUser);
      await mockStorage.setItem('mock_users_db', db);
      return mockUser;
    }

    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options: { data: { username } }
    });
    if (error) throw error;
    return data;
  };

  const updateProfile = async (data: { email: string, password: string, fullName: string, cedula?: string, phone?: string, avatar?: string, birth_date?: string }) => {
    if (isSupabaseConfigured && user) {
      const { password, email, fullName, cedula, phone, avatar, birth_date } = data;
      const { error: authError } = await supabase.auth.updateUser({ password, email });
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName, 
          email: email, 
          needs_setup: false,
          cedula,
          phone,
          avatar,
          birth_date
        })
        .eq('id', user.id);
      if (dbError) throw dbError;

      const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUser({
        ...user,
        ...updatedProfile,
        isSuperAdmin: updatedProfile?.is_super_admin || updatedProfile?.role === 'Administrador' || false,
        needsSetup: updatedProfile?.needs_setup ?? false
      });
      return;
    }

    if (!isSupabaseConfigured && user) {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const index = db.findIndex((u: any) => u.id === user.id);
      if (index !== -1) {
        db[index].email = data.email;
        db[index].password = data.password;
        db[index].user_metadata.fullName = data.fullName;
        db[index].cedula = data.cedula;
        db[index].phone = data.phone;
        db[index].avatar = data.avatar;
        db[index].birth_date = data.birth_date;
        db[index].needsSetup = false;
        await mockStorage.setItem('mock_users_db', db);
        await mockStorage.setItem('mock_user_session', db[index]);
        setUser(db[index]);

        // Audit Admin notification
        if (!user.isSuperAdmin) {
          const notifications = await mockStorage.getItem<any[]>('admin_notifications') || [];
          notifications.push({
            id: Date.now(),
            user: user.username,
            type: 'profile_update',
            timestamp: new Date().toISOString(),
            details: `El usuario @${user.username} actualizó su perfil.`
          });
          await mockStorage.setItem('admin_notifications', notifications);
        }
      }
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      // Set status to Inactive before clearing
      if (user?.id) {
        const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
        const idx = db.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          db[idx].status = 'Inactivo';
          await mockStorage.setItem('mock_users_db', db);
        }
      }
      await mockStorage.removeItem('mock_user_session');
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const enablePasskey = async () => alert('Registro biométrico iniciado.');
  const signInWithPasskey = async () => alert('Ingreso biométrico escaneando.');

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithUsername, signUp, updateProfile, signOut, enablePasskey, signInWithPasskey }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
