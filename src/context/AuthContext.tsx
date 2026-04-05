import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { triggerHaptic } from '@/utils/haptics';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: string;
  avatar?: string;
  birth_date?: string;
  cedula?: string;
  phone?: string;
  isMaster: boolean;
  isAdmin: boolean;
  isAccountant: boolean;
  isSupervisor: boolean;
  isConsultant: boolean;
  isColaborador: boolean;
  isSuperAdmin: boolean;
  isBypass?: boolean;
  sandboxExpiry?: string;
  needsSetup: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signInWithUsername: (username: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, username: string, profileData?: any) => Promise<any>;
  updateProfile: (data: any) => Promise<void>;
  updatePassword: (newPass: string) => Promise<void>;
  signOut: () => Promise<void>;
  isFirstUser: () => Promise<boolean>;
  extendSandbox: (userId: string, days: number) => Promise<void>;
  deleteUserSandbox: (userId: string) => Promise<void>;
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

        const role = profile?.role || 'Colaborador';
        const isMaster = role === 'Administrador maestro';
        const isAdmin = role === 'Director General (CEO)' || role === 'Gestor Administrativo';
        const isAccountant = role === 'Analista Contable';
        const isSupervisor = role === 'Supervisora Puntos de Venta';
        const isConsultant = role === 'Consultora de Ventas';
        const isColaborador = role === 'Colaborador';
        
        const isSuper = profile?.is_super_admin || isMaster || isAdmin || false;

        setUser({
          ...authUser,
          ...profile,
          role,
          isMaster,
          isAdmin,
          isAccountant,
          isSupervisor,
          isConsultant,
          isColaborador,
          isSuperAdmin: isSuper,
          sandboxExpiry: profile?.sandbox_expiry,
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
        isMaster: true,
        isAdmin: false,
        isAccountant: false,
        isSupervisor: false,
        isConsultant: false,
        isColaborador: false,
        isSuperAdmin: true,
        bypass_allowed: profile?.bypass_allowed ?? true,
        isBypass: true 
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
    // REGLA DE EMERGENCIA: Excepción para Fernando o primer usuario
    const isFernando = email.trim().toLowerCase() === 'fernando830609@gmail.com';
    const isFirst = profileData?.isFirstUser || false;
    
    const finalRole = (isFirst || isFernando) ? 'Administrador maestro' : (profileData?.role || 'Colaborador');
    const finalIsSuper = (isFirst || isFernando) ? true : (profileData?.isSuperAdmin || false);

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
      // Set 72h sandbox expiry for new Colaboradores
      const sandboxExpiry = finalRole === 'Colaborador' 
        ? new Date(Date.now() + 72 * 3600 * 1000).toISOString() 
        : null;

      // Create profile immediately
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.toLowerCase(),
        email: email,
        role: finalRole,
        is_super_admin: finalIsSuper,
        needs_setup: true,
        sandbox_expiry: sandboxExpiry
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
          secondary_phone: data.secondaryPhone,
          secondary_email: data.secondaryEmail,
          emergency_name: data.emergencyName,
          emergency_relationship: data.emergencyRelationship,
          emergency_phone: data.emergencyPhone,
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

  const extendSandbox = async (userId: string, days: number) => {
    if (!user?.isMaster && user?.role !== 'Director General (CEO)') {
      throw new Error('Solo el administrador puede extender periodos de prueba.');
    }
    
    if (isSupabaseConfigured) {
      const newExpiry = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({ sandbox_expiry: newExpiry })
        .eq('id', userId);
      
      if (error) throw error;
      triggerHaptic('success');
    }
  };

  const deleteUserSandbox = async (userId: string) => {
    if (!user?.isMaster) throw new Error('Acceso restringido.');

    if (isSupabaseConfigured) {
      // 1. Eliminar órdenes y su historial (vía cascada o manual)
      const { data: userOrders } = await supabase.from('service_orders').select('id').eq('created_by', userId);
      
      if (userOrders && userOrders.length > 0) {
        const orderIds = userOrders.map(o => o.id);
        await supabase.from('order_history').delete().in('order_id', orderIds);
        await supabase.from('service_orders').delete().eq('created_by', userId);
      }

      // 2. Eliminar ítems faltantes
      await supabase.from('missing_items').delete().eq('reported_by_id', userId);

      // 3. Eliminar perfil
      await supabase.from('profiles').delete().eq('id', userId);
      
      triggerHaptic('warning');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, signInWithEmail, signInWithUsername, signUp, 
      updateProfile, updatePassword, signOut, isFirstUser,
      extendSandbox, deleteUserSandbox 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
