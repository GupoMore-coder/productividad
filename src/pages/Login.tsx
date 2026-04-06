import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Eye, EyeOff, CheckCircle2, Fingerprint, Loader2 } from 'lucide-react';
import { WebAuthnService } from '../services/WebAuthnService';
import { HoneypotField } from '../components/HoneypotField';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export default function Login() {
  const { user, signInWithEmail, signInWithUsername, signInWithBiometrics } = useAuth();
  const location = useLocation();
  const showWelcome = location.state?.welcome;
  
  const [identifier, setIdentifier] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hpValue, setHpValue] = useState('');
  const [biometricLoading, setBiometricLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');

    // Honeypot check
    if (hpValue) {
      console.warn('Honeypot triggered');
      setTimeout(() => setLoading(false), 2000); // Fake delay
      return;
    }
    
    try {
      if (identifier.includes('@')) {
        const { data, error: authError } = await signInWithEmail(identifier, password);
        if (authError) throw authError;
        
        // v11: Inicializar sesión biométrica vinculando el dispositivo tras login exitoso
        if (data?.user?.id) {
          localStorage.setItem(`antigravity_bio_pass_${data.user.id}`, password);
        }
      } else {
        const { data } = await signInWithUsername(identifier, password);
        if (data?.user?.id) {
          localStorage.setItem(`antigravity_bio_pass_${data.user.id}`, password);
        }
      }
      triggerHaptic('success');
    } catch (err: any) {
      triggerHaptic('error');
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError('');
    
    try {
      // 1. Authenticate with WebAuthn (Discoverable Credential Flow)
      // Pass identifier if user already typed it (optional optimization)
      const authResult = await WebAuthnService.authenticate(identifier || undefined); 
      
      if (authResult?.success) {
        triggerHaptic('success');
        
        // 2. Perform real login with the identified userId
        const { error: signInError } = await signInWithBiometrics(authResult.userId);
        
        if (signInError) throw signInError;
      } else if (authResult === null) {
        // User cancelled or no credentials found
        if (!identifier) {
          setError('No se encontraron llaves de acceso en este dispositivo. Por favor, inicia sesión con contraseña para vincular la biometría.');
        } else {
          setError('La llave de acceso no es válida para este usuario.');
        }
      }
    } catch (err: any) {
      triggerHaptic('error');
      setError(err.message || 'Error en autenticación biométrica');
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1622] relative overflow-hidden animate-fade-in">
      
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[var(--accent-glow)] rounded-full blur-[100px] pointer-events-none z-0 opacity-40" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-[400px] p-8 z-10 border border-white/10 relative"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5 overflow-hidden shadow-2xl shadow-amber-500/10">
             <img 
               src="/logo.png" 
               alt="Logo Grupo More" 
               className="w-full h-full object-contain p-2"
             />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Acceso al Sistema
          </h1>
          <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-[0.3em]">
            <span className="text-[#d4bc8f]">Regalos auténticos</span> / Grupo More
          </p>
        </div>

        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-[#d4bc8f]/5 border border-[#d4bc8f]/20 p-5 rounded-[28px] mb-8 flex flex-col items-center gap-3 text-center backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4bc8f]/40 to-transparent" />
            <div className="w-12 h-12 rounded-2xl bg-[#d4bc8f]/10 flex items-center justify-center text-[#d4bc8f] shadow-lg shadow-amber-500/10 border border-[#d4bc8f]/20">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-[0.7rem] font-black text-slate-200 leading-relaxed uppercase tracking-[0.15em]">
              Bienvenid@ al <span className="text-[#d4bc8f]">Grupo More</span>. 💎<br/>
              Ya puedes <span className="text-white">completar tu formulario</span> de registro.
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm text-red-500"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <HoneypotField value={hpValue} onChange={(e) => setHpValue(e.target.value)} />
          
          <div className="space-y-2">
            <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Correo o Usuario</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                id="identifier"
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toLowerCase())}
                placeholder="pablo22 o correo..."
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-12 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all placeholder:text-slate-700"
                required 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                id="password"
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-12 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all placeholder:text-slate-700"
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 rounded-[24px] bg-[#d4bc8f] text-slate-950 font-black text-xs uppercase tracking-[0.25em] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>

          {/* v11: Vanguard Biometric Access */}
          <div className="pt-4 flex flex-col items-center gap-4">
            <div className="w-full h-px bg-white/5 relative">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1622] px-4 text-[0.55rem] font-black text-slate-700 uppercase tracking-widest italic">
                O utiliza
              </span>
            </div>
            
            <button 
              type="button"
              onClick={handleBiometricLogin}
              disabled={biometricLoading}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-3 backdrop-blur-md group shadow-2xl"
            >
              {biometricLoading ? <Loader2 className="animate-spin" size={18} /> : <Fingerprint className="text-[#d4bc8f] group-hover:scale-110 transition-transform" size={18} />}
              Acceso biométrico
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500">
            ¿No tienes cuenta? <Link to="/register" className="text-[#d4bc8f] font-black uppercase tracking-widest hover:underline ml-1">Regístrate</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
