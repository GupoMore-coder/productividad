import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Camera, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export default function SetupProfile() {
  const { user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emoticons = ['👤', '👔', '👩‍💼', '👨‍💻', '👩‍🎨', '👷', '👨‍⚕️', '👸', '🤴', '🚀', '⭐', '🌈'];

  useEffect(() => {
    if (!user || user.needsSetup === false) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.needsSetup === false) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        triggerHaptic('success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isSuper = user?.isSuperAdmin || user?.role === 'Administrador maestro';

      if (!isSuper) {
        if (password.length < 8) throw new Error('Crea una contraseña segura de al menos 8 caracteres.');
        if (password === '123456') throw new Error('Debes crear una contraseña distinta a la genérica.');
      }
      if (!email.includes('@')) throw new Error('Introduce un correo válido.');
      if (!fullName.trim()) throw new Error('El nombre completo es requerido.');
      if (!cedula.trim()) throw new Error('El número de cédula es requerido.');
      if (!phone.trim()) throw new Error('El número de celular es requerido.');
      if (!birthDate) throw new Error('La fecha de nacimiento es requerida.');

      await updateProfile({ 
        email, 
        fullName, 
        cedula, 
        phone, 
        birth_date: birthDate, 
        avatar 
      });
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
            <div className="w-24 h-24 bg-black/40 rounded-[32px] border-4 border-[#d4bc8f] flex items-center justify-center text-4xl shadow-2xl overflow-hidden shadow-amber-500/10">
              {avatar.length > 10 ? <img src={avatar} className="w-full h-full object-cover" alt="Avatar" /> : avatar}
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
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Cédula</label>
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
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Celular</label>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="3xx xxxxxxx"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all placeholder:text-slate-700"
                required 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Nombre Completo</label>
            <input 
              type="text" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ej. Miguel Rodríguez"
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all placeholder:text-slate-700"
              required 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Fecha Nacimiento</label>
              <input 
                type="date" 
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all color-scheme-dark"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Correo Real</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all placeholder:text-slate-700"
                required 
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Nueva Contraseña (8+ caracteres)</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Seguridad alta recomendada"
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4bc8f]/20 focus:border-[#d4bc8f]/50 transition-all placeholder:text-slate-700"
              required 
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Elige un Identificador Visual</label>
            <div className="flex flex-wrap justify-center gap-2">
              {emoticons.map(e => (
                <button 
                  key={e} 
                  type="button"
                  onClick={() => { setAvatar(e); triggerHaptic('light'); }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90 border-2 ${avatar === e ? 'border-[#d4bc8f] bg-[#d4bc8f]/10 shadow-lg shadow-amber-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#d4bc8f] text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {loading ? 'Finalizando...' : 'Completar Registro Vital'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
