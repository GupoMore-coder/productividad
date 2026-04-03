import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: any;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signInWithUsername: (username: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, username: string, profileData?: any) => Promise<any>;
  updateProfile: (data: { email: string, fullName: string, cedula?: string, phone?: string, avatar?: string, birth_date?: string }) => Promise<void>;
  updatePassword: (newPass: string) => Promise<void>;
  signOut: () => Promise<void>;
  isFirstUser: () => Promise<boolean>;
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

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        fetchProfileAndSetUser(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      fetchProfileAndSetUser(session?.user ?? null);
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    // 1. Master Bypass for Fernando
    if (email === 'fernando830609@gmail.com' && pass === 'admin') {
      const { data: profile } = await supabase.from('profiles').select('*').ilike('username', 'fernando').single();
      
      if (profile && profile.bypass_allowed === false) {
        throw new Error('El acceso por bypass ha sido desactivado por seguridad. Por favor, usa tu contraseña personal de Supabase.');
      }

      const masterUser = { 
        id: profile?.id || 'admin-master',
        email, 
        user_metadata: { fullName: profile?.full_name || 'Fernando Marulanda', username: 'fernando' },
        role: 'Administrador maestro', 
        isSuperAdmin: true,
        bypass_allowed: profile?.bypass_allowed ?? true,
        isBypass: true // Added flag

      };
      setUser(masterUser);
      return { data: { user: masterUser }, error: null };
    }

    const res = await supabase.auth.signInWithPassword({ email, password: pass });
    if (res.error) throw res.error;
    
    return res;
  };

  const signInWithUsername = async (username: string, pass: string) => {
    const lowerUser = username.toLowerCase();

    // 1. Master Bypass for Fernando
    if (lowerUser === 'fernando' && pass === 'admin') {
      const { data: profile } = await supabase.from('profiles').select('*').ilike('username', 'fernando').single();
      
      if (profile && profile.bypass_allowed === false) {
        throw new Error('El acceso por bypass ha sido desactivado por seguridad. Por favor, usa tu contraseña personal de Supabase.');
      }

      const masterUser = { 
        id: profile?.id || 'admin-master',
        email: profile?.email || 'fernando830609@gmail.com',
        user_metadata: { fullName: profile?.full_name || 'Fernando Marulanda', username: 'fernando' },
        role: 'Administrador maestro', 
        isSuperAdmin: true,
        bypass_allowed: profile?.bypass_allowed ?? true,
        isBypass: true // Marcador de acceso sin sesión real
      };
      
      console.warn('⚠️ MODO BYPASS ACTIVO: Tienes acceso total a la interfaz, pero las operaciones de escritura en base de datos (RLS) fallarán. Para realizar cambios, usa tu contraseña real.');
      
      setUser(masterUser);
      return { data: { user: masterUser }, error: null };
    }

    const { data, error } = await supabase.from('profiles').select('email').ilike('username', username).single();
    if (error || !data) throw new Error('Usuario no encontrado');
    
    const res = await supabase.auth.signInWithPassword({ email: data.email, password: pass });
    if (res.error) throw res.error;

    return res;
  };


  const signUp = async (email: string, pass: string, username: string, profileData?: any) => {
    const isFirst = profileData?.isFirstUser || false;
    const finalRole = isFirst ? 'Administrador maestro' : (profileData?.role || 'Colaborador');
    const finalIsSuper = isFirst ? true : (profileData?.isSuperAdmin || false);

    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options: { 
        data: { 
          username,
          role: finalRole,
          is_super_admin: finalIsSuper,
          needsSetup: true
        } 
      }
    });

    if (error) throw error;

    if (data.user) {
      // Create profile immediately
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.toLowerCase(),
        email: email,
        role: finalRole,
        is_super_admin: finalIsSuper,
        needs_setup: true
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
          needs_setup: false,
          bypass_allowed: user.role === 'Administrador maestro' ? false : undefined
        })
        .eq('id', user.id);
      
      // If RLS fails because of bypass (no real session), but it's fernando, 
      // we might still fail if RLS is very strict.
      if (dbError) {
        console.error('Profile update error:', dbError);
        throw dbError;
      }
      
      const { data: updated } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUser({ ...user, ...updated, isBypass: user.isBypass });

    }
  };

  const updatePassword = async (newPass: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('fast_access_email');
    localStorage.removeItem('fast_access_pass');
    localStorage.removeItem('fast_access_enabled');
    await supabase.auth.signOut();
    setUser(null);
  };

  const isFirstUser = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error checking first user:', error);
        return false;
      }
      return (count ?? 0) === 0;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithUsername, signUp, updateProfile, updatePassword, signOut, isFirstUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
