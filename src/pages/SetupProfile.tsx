import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { ChevronLeft, Camera, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { optimizeImage } from '../utils/imageOptimizer';

export default function SetupProfile() {
  const { user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.needsSetup === false) {
      navigate('/');
    } else if (user.email) {
      setEmail(user.email);
    }
  }, [user, navigate]);

  if (!user || user.needsSetup === false) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const optimized = await optimizeImage(file, 400, 400, 0.6); // Profile avatar doesn't need to be huge
        setAvatar(optimized);
        triggerHaptic('success');
      } catch (err) {
        console.error('Error optimizing image:', err);
        // Fallback to original if optimization fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await (supabase as any).auth.getSession();
      if (!session && !user?.isBypass) {
        throw new Error('Tu sesión ha expirado o no es válida. Por favor, inicia sesión de nuevo.');
      }

      const isSuper = user?.isSuperAdmin || user?.role === 'Administrador maestro';

      if (!isSuper) {
        if (password.length < 8) throw new Error('Crea una contraseña segura de al menos 8 caracteres.');
        if (password === '123456') throw new Error('Debes crear una contraseña distinta a la genérica.');
        if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden. Por favor verifica.');
      }
      
      if (!email.includes('@')) throw new Error('Introduce un correo válido como principal.');
      if (!fullName.trim()) throw new Error('El nombre completo es requerido.');
      if (!cedula.trim()) throw new Error('El número de cédula es requerido.');
      if (!phone.trim()) throw new Error('El número de celular es requerido.');
      if (!birthDate) throw new Error('La fecha de nacimiento es requerida.');

      await updateProfile({ 
        email, 
        fullName, 
        cedula, 
        phone, 
        secondaryPhone,
        secondaryEmail,
        emergencyName,
        emergencyRelationship,
        emergencyPhone,
        birth_date: birthDate, 
        avatar 
      });
      
      if (password) {
        const { error: passErr } = await supabase.auth.updateUser({ password });
        if (passErr) console.warn('No se pudo actualizar la contraseña física:', passErr.message);
      }

      triggerHaptic('success');
      navigate('/');
    } catch (err: any) {
      triggerHaptic('error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1622] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10 relative">
          <button 
            type="button" 
            onClick={() => { signOut?.(); navigate('/login'); }}
            className="absolute -left-2 -top-2 p-2 text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-[0.65rem] font-black uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Salir
          </button>
          
          <div className="inline-block relative mb-6">
            <div className="w-24 h-24 bg-black/40 rounded-[32px] border-4 border-[#d4bc8f] flex items-center justify-center text-3xl font-black shadow-2xl overflow-hidden shadow-amber-500/10 transition-all duration-500">
              {avatar.length > 10 ? (
                <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#d4bc8f] to-[#b39063] flex items-center justify-center text-slate-950">
                  {(fullName || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 p-2 bg-[#d4bc8f] text-slate-900 rounded-xl shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all border-4 border-[#1a1622]">
              <Camera size={16} />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Configura tu Perfil</h2>
          <p className="text-slate-500 text-sm font-medium">
            Hola <span className="text-[#d4bc8f] font-black uppercase tracking-wider">{user.username}</span>, completa tu registro corporativo.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 flex items-center gap-3 text-xs font-bold"
          >
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSetup} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Cédula (Obligatorio)</label>
              <input 
                type="text" 
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                placeholder="N° Documento"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all placeholder:text-slate-700"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Nombre Completo</label>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ej. Nayelis Puerta"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all placeholder:text-slate-700"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Celular Principal</label>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Principal (Oblig)"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white border-l-4 border-l-[#d4bc8f]/40"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1 opacity-50">Celular Secundario</label>
              <input 
                type="tel" 
                value={secondaryPhone}
                onChange={e => setSecondaryPhone(e.target.value)}
                placeholder="Alternativo (Opc)"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Correo Principal</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white border-l-4 border-l-[#d4bc8f]/40"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1 opacity-50">Correo Secundario</label>
              <input 
                type="email" 
                value={secondaryEmail}
                onChange={e => setSecondaryEmail(e.target.value)}
                placeholder="Opcional"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={14} className="text-red-400" />
               </div>
               <span className="text-[0.6rem] uppercase tracking-[0.2em] font-black text-slate-400">Contacto de Emergencia (Opcional)</span>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Nombre del contacto</label>
              <input 
                type="text" 
                value={emergencyName}
                onChange={e => setEmergencyName(e.target.value)}
                placeholder="Persona de confianza"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Parentesco</label>
                <select 
                  value={emergencyRelationship}
                  onChange={e => setEmergencyRelationship(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Hijo/a">Hijo/a</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Esposo/a">Esposo/a</option>
                  <option value="Amigo/a">Amigo/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Celular de Emergencia</label>
                <input 
                  type="tel" 
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  placeholder="3xx xxxxxxx"
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Fecha Nacimiento</label>
              <input 
                type="date" 
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white color-scheme-dark"
                required 
              />
            </div>
            <div className="flex flex-col justify-end">
               <p className="text-[0.55rem] text-slate-600 italic px-2 mb-1">
                 * El correo principal es el que usaste para registrarte inicialmente.
               </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Contraseña Nueva</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Crea tu clave"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-[#d4bc8f] font-black ml-1">Confirmar Clave</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite tu clave"
                className={`w-full bg-black/30 border rounded-2xl px-5 py-3.5 text-sm text-white transition-all ${password && confirmPassword ? (password === confirmPassword ? 'border-emerald-500/50' : 'border-red-500/50') : 'border-white/10'}`}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#d4bc8f] text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {loading ? 'Sincronizando...' : 'Finalizar Registro Vital'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
