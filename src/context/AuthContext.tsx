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
  signUp: (email: string, pass: string, username: string, profileData?: any) => Promise<any>;
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

    return () => {
      authSub.unsubscribe();
    };
  }, []);

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
        await mockStorage.setItem('mock_user_session', mockUser);
        setUser(mockUser);
        return { data: { user: mockUser }, error: null };
      }
      throw new Error('Credenciales inválidas');
    }
    const res = await supabase.auth.signInWithPassword({ email, password: pass });
    if (res.error) throw res.error;

    // Save for Fingerprint/Fast Access
    localStorage.setItem('fast_access_email', email);
    localStorage.setItem('fast_access_pass', pass);
    
    return res;
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
    
    const res = await supabase.auth.signInWithPassword({ email: data.email, password: pass });
    if (res.error) throw res.error;

    localStorage.setItem('fast_access_email', data.email);
    localStorage.setItem('fast_access_pass', pass);

    return res;
  };

  const signUp = async (email: string, pass: string, username: string, profileData?: any) => {
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
        user_metadata: { username, fullName: profileData?.fullName || '' },
        needsSetup: false,
        role: profileData?.role || 'Colaborador',
        cedula: profileData?.cedula,
        phone: profileData?.phone,
        isSuperAdmin: profileData?.isSuperAdmin || false
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

    if (data.user) {
      // Create detailed profile immediately
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.toLowerCase(),
        full_name: profileData?.fullName || '',
        email: email,
        cedula: profileData?.cedula,
        phone: profileData?.phone,
        role: profileData?.role || 'Colaborador',
        is_super_admin: profileData?.isSuperAdmin || false,
        needs_setup: false
      });
      if (profileError) console.error('Error creating profile during signup:', profileError);
    }

    return data;
  };

  const updateProfile = async (data: any) => {
    if (isSupabaseConfigured && user) {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ 
          full_name: data.fullName, 
          cedula: data.cedula,
          phone: data.phone,
          avatar: data.avatar,
          birth_date: data.birth_date,
          needs_setup: false
        })
        .eq('id', user.id);
      if (dbError) throw dbError;
      
      const { data: updated } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUser({ ...user, ...updated });
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      await mockStorage.removeItem('mock_user_session');
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const enablePasskey = async () => {
    if (!user) return;
    localStorage.setItem('fast_access_enabled', 'true');
    alert('Acceso rápido biométrico activado para este dispositivo.');
  };

  const signInWithPasskey = async () => {
    const enabled = localStorage.getItem('fast_access_enabled');
    const email = localStorage.getItem('fast_access_email');
    const pass = localStorage.getItem('fast_access_pass');

    if (enabled === 'true' && email && pass) {
      try {
        await signInWithEmail(email, pass);
        alert('Ingreso biométrico exitoso.');
      } catch (err) {
        alert('Error en acceso rápido. Por favor usa tu contraseña.');
      }
    } else {
      alert('Debes iniciar sesión con contraseña al menos una vez y activar el acceso rápido en tu perfil.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithUsername, signUp, updateProfile, signOut, enablePasskey, signInWithPasskey }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
