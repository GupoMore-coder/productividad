import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { HoneypotField } from '../components/HoneypotField';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export default function Login() {
  const { user, signInWithEmail, signInWithUsername } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hpValue, setHpValue] = useState('');

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
        const { error: authError } = await signInWithEmail(identifier, password);
        if (authError) throw authError;
      } else {
        await signInWithUsername(identifier, password);
      }
      triggerHaptic('success');
    } catch (err: any) {
      triggerHaptic('error');
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
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
          <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
             <ShieldCheck size={32} className="text-[#d4bc8f]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Acceso al Sistema
          </h1>
          <p className="text-sm text-slate-400">
            Inteligencia Operativa del <span className="text-[#d4bc8f] font-bold">Grupo More</span>
          </p>
        </div>

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
            className="w-full bg-[#d4bc8f] text-slate-900 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50 mt-4 flex items-center justify-center gap-2" 
            disabled={loading}
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <ShieldCheck size={18} />
              </motion.div>
            ) : 'Iniciar Sesión'}
            {loading ? 'Validando...' : ''}
          </button>
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
