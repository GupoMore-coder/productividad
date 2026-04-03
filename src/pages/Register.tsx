import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft, UserPlus, Mail, User, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { HoneypotField } from '../components/HoneypotField';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hpValue, setHpValue] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    // Honeypot check
    if (hpValue) {
      console.warn('Bot detected');
      setTimeout(() => setLoading(false), 2000);
      return;
    }
    
    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = email.trim();

      if(cleanUsername.includes(' ') || cleanUsername.includes('@')) {
        throw new Error('El usuario debe ser corto, sin espacios ni @.');
      }

      if (!/^[a-zA-Z]/.test(cleanUsername)) {
        throw new Error('El nombre de usuario debe iniciar obligatoriamente con una letra.');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error('El correo electrónico no es válido.');
      }

      const isSuper = cleanUsername === 'fernando';

      if (!isSuper && password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      }

      // SIGN UP (Auth) - Minimal data
      await signUp(cleanEmail, password, cleanUsername, {
        role: isSuper ? 'Administrador maestro' : 'Colaborador',
        isSuperAdmin: isSuper,
        needsSetup: true // Enforce setup on first login
      });

      triggerHaptic('success');
      alert(isSuper 
        ? '¡Bienvenido Fernando! Tu cuenta de Administrador Maestro ha sido creada. Ya puedes iniciar sesión.' 
        : 'Registro exitoso. Tu cuenta ha sido creada. Por favor inicia sesión para completar tu perfil.'
      );
      navigate('/login');
    } catch (err: any) {
      triggerHaptic('error');
      if (err.message?.includes('already registered')) {
        setError('Este correo o usuario ya está registrado. Por favor intenta Iniciar Sesión.');
      } else {
        setError(err.message || 'Error al registrar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1622] relative overflow-hidden animate-fade-in">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[var(--accent-glow)] rounded-full blur-[100px] pointer-events-none z-0 opacity-40" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-[460px] p-8 z-10 border border-white/10 relative"
      >
        <div className="text-center mb-8 relative">
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            className="absolute left-0 top-0 text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-[0.65rem] font-black uppercase tracking-widest"
            aria-label="Volver al inicio"
          >
            <ChevronLeft size={14} /> Volver
          </button>
          
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
             <UserPlus size={28} className="text-[#d4bc8f]" />
          </div>
          
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Crear Cuenta</h1>
          <p className="text-sm text-slate-400">Únete al equipo de <span className="text-[#d4bc8f] font-bold">Grupo More</span></p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6 text-xs text-red-500 flex items-start gap-3"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <HoneypotField value={hpValue} onChange={(e) => setHpValue(e.target.value)} />
          
          <div className="space-y-2">
            <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-12 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all placeholder:text-slate-700"
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Alias o Usuario</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: pablo22"
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
            className="w-full bg-[#d4bc8f] text-slate-900 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50 mt-4 flex items-center justify-center gap-2" 
            disabled={loading}
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <ShieldCheck size={18} />
              </motion.div>
            ) : 'Finalizar Registro'}
            {loading ? 'Procesando...' : ''}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500">
            ¿Ya tienes cuenta? <Link to="/login" className="text-[#d4bc8f] font-black uppercase tracking-widest hover:underline ml-1">Inicia sesión</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
