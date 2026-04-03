import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFile, base64ToBlob } from '@/lib/supabase';
import { compressImage } from '../utils/imageCompressor';
import { 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  Save, 
  Camera, 
  User, 
  BadgeCheck, 
  Loader2, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2,
  Settings,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { Skeleton } from '../components/ui/Skeleton';

export default function Profile() {
  const { user, updateProfile, updatePassword, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [cedula, setCedula] = useState(user?.cedula || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.birth_date || '');
  const [avatar, setAvatar] = useState(user?.avatar || '👤');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const showNewPass = false;
  const showConfirmPass = false;

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const emoticons = ['👤', '👔', '👩‍💼', '👨‍💻', '👩‍🎨', '👷', '👨‍⚕️', '👸', '🤴', '🚀', '⭐', '🌈'];

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.full_name || '');
      setCedula(user.cedula || '');
      setPhone(user.phone || '');
      setBirthDate(user.birth_date || '');
      setAvatar(user.avatar || '👤');
    }
  }, [user]);

  const handleAction = (type: 'success' | 'light' | 'warning' | 'error') => triggerHaptic(type);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      setUploadingAvatar(true);
      setError('');
      try {
        const compressedBase64 = await compressImage(file);
        const blob = base64ToBlob(compressedBase64);
        const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
        const publicUrl = await uploadFile('avatars', fileName, blob);
        setAvatar(publicUrl);
        handleAction('success');
      } catch (err: any) {
        console.error('Avatar upload error:', err);
        setError('Error al subir el avatar.');
        handleAction('error');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!fullName || !cedula || !phone) {
        throw new Error('Todos los campos básicos son obligatorios.');
      }

      if (newPassword) {
        if (!currentPassword) {
          throw new Error('Debes ingresar tu contraseña actual para realizar cambios de seguridad.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('La nueva contraseña y su confirmación no coinciden.');
        }
        if (newPassword.length < 8) {
          throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
        }

        try {
          await signInWithEmail(user.email, currentPassword);
        } catch (err) {
          throw new Error('La contraseña actual es incorrecta.');
        }

        await updatePassword(newPassword);
      }
      
      await updateProfile({ 
        email, 
        fullName, 
        cedula, 
        phone, 
        birth_date: birthDate, 
        avatar 
      });

      handleAction('success');
      setSuccess('¡Perfil actualizado con éxito!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      handleAction('error');
      setError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-[#1a1622] pb-32 animate-in fade-in duration-700 relative overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-purple-500/5 blur-[120px] pointer-events-none" />
      
      <header className="sticky top-0 z-40 bg-[#1a1622]/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 safe-top flex items-center justify-between">
        <button 
          onClick={() => { handleAction('light'); navigate(-1); }} 
          className="p-2 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
          aria-label="Volver"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Mi Perfil</h2>
          <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest mt-0.5 flex items-center justify-center gap-1">
            <Settings size={10} className="text-purple-500" /> Configuración Global
          </p>
        </div>
        <div className="w-10 h-10" />
      </header>

      <div className="max-w-xl mx-auto p-6 space-y-10 relative z-10">
        
        {/* Avatar Section */}
        <section className="flex flex-col items-center">
          <div className="relative group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-32 h-32 bg-black/40 rounded-[40px] border-4 border-purple-500/30 flex items-center justify-center text-6xl shadow-2xl overflow-hidden shadow-purple-500/10 group-hover:border-purple-500 transition-colors"
            >
              {avatar.length > 10 ? (
                <img src={avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span>{avatar}</span>
              )}
            </motion.div>
            <label className="absolute -bottom-2 -right-2 p-3 bg-purple-500 text-slate-900 rounded-2xl shadow-xl cursor-pointer hover:scale-110 active:scale-90 transition-all border-4 border-[#1a1622]">
              {uploadingAvatar ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={uploadingAvatar} />
            </label>
          </div>
          
          <div className="mt-6 text-center">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              @{user.username}
              <BadgeCheck size={24} className="text-purple-400" />
            </h3>
            <span className="inline-block px-4 py-1.5 bg-white/5 text-slate-400 rounded-full text-[0.6rem] font-black uppercase tracking-widest mt-2 border border-white/5">
              {user.role || 'Colaborador Grupo More'}
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 mt-8 max-w-[280px]">
            {emoticons.map(e => (
              <button 
                key={e} 
                onClick={() => { setAvatar(e); handleAction('light'); }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all active:scale-90 border-2 ${avatar === e ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 bg-red-500/5 border border-red-500/20 rounded-[28px] flex items-center gap-4 text-red-500 text-xs font-bold shadow-xl">
              <AlertCircle size={24} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-[28px] flex items-center gap-4 text-emerald-500 text-xs font-bold shadow-xl">
              <CheckCircle2 size={24} className="shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleUpdate} className="space-y-10">
          
          <div className="space-y-4">
            <h4 className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-600 font-black ml-1 flex items-center gap-2">
              <User size={14} className="text-purple-500" /> Perfil del Profesional
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-2 leading-none">Cédula</label>
                <div className="relative">
                  <input type="text" value={cedula} onChange={e => setCedula(e.target.value)} required 
                    className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/40 transition-all font-medium" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-2 leading-none">Celular</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required 
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/40 transition-all font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-2 leading-none">Nombre Completo</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required 
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/40 transition-all font-medium" />
            </div>

            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-2 leading-none">Correo Electrónico Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/40 transition-all font-medium" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-600 font-black ml-1 flex items-center gap-2">
              <KeyRound size={14} className="text-purple-500" /> Seguridad Crítica
            </h4>

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-2 leading-none">Contraseña Actual *</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-purple-500 transition-colors" size={18} />
                  <input 
                    type={showCurrentPass ? 'text' : 'password'} 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Confirma para aplicar cambios..." 
                    className="w-full bg-black/40 border border-white/10 rounded-[24px] pl-12 pr-12 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all placeholder:text-slate-800 font-medium" 
                  />
                  <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-white transition-colors">
                    {showCurrentPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.02] p-8 rounded-[40px] space-y-6 border border-white/5">
                <p className="text-[0.65rem] font-black text-purple-400 uppercase tracking-widest text-center">Protocolo de Cambio de Clave</p>
                
                <div className="grid gap-4">
                  <input 
                    type={showNewPass ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nueva Contraseña..." 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40" 
                  />
                  <input 
                    type={showConfirmPass ? 'text' : 'password'} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar Nueva..." 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40" 
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || uploadingAvatar}
            className="w-full py-5 rounded-[24px] bg-purple-500 text-slate-950 font-black text-xs uppercase tracking-[0.25em] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? 'Procesando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#1a1622] p-8 space-y-12 animate-pulse">
      <div className="flex justify-between items-center">
        <Skeleton width={44} height={44} className="rounded-2xl" />
        <Skeleton width={120} height={20} />
        <div className="w-11" />
      </div>
      <div className="flex flex-col items-center space-y-6">
        <Skeleton width={128} height={128} className="rounded-[40px]" />
        <div className="space-y-2 flex flex-col items-center">
           <Skeleton width={180} height={32} />
           <Skeleton width={120} height={16} />
        </div>
      </div>
      <div className="space-y-8 pt-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton width={100} height={12} />
            <Skeleton width="100%" height={56} className="rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
