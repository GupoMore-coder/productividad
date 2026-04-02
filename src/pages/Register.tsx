import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Camera, User, ChevronLeft } from 'lucide-react';
import { uploadFile, base64ToBlob } from '@/lib/supabase';
import { compressImage } from '../utils/imageCompressor';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  
  // Storage for local preview only
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create local preview URL - works without Supabase
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
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

      // 1. SIGN UP (Auth)
      const res = await signUp(cleanEmail, password, cleanUsername, {
        fullName,
        cedula,
        phone,
        role: isSuper ? 'Administrador maestro' : 'Colaborador',
        isSuperAdmin: isSuper
      });

      // 2. NOW THAT WE HAVE AN AUTH SESSION, UPLOAD AVATAR (if chosen)
      if (avatarFile && res?.user) {
        try {
          const compressedBase64 = await compressImage(avatarFile);
          const blob = base64ToBlob(compressedBase64);
          const fileName = `avatar-${res.user.id}.jpg`;
          const publicUrl = await uploadFile('avatars', fileName, blob);
          
          // Update the profile with the URL
          const { supabase } = await import('@/lib/supabase');
          await supabase.from('profiles').update({ avatar: publicUrl }).eq('id', res.user.id);
        } catch (uploadErr) {
          console.warn('Silent avatar upload error:', uploadErr);
          // Don't fail registration if only the photo fails
        }
      }

      alert(isSuper 
        ? '¡Bienvenido Fernando! Tu cuenta de Administrador Maestro ha sido creada. Ya puedes iniciar sesión.' 
        : 'Registro exitoso. Tu cuenta ha sido creada con el rol de Colaborador.'
      );
      navigate('/login');
    } catch (err: any) {
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '40px 16px' }} className="animate-fade-in relative overflow-hidden">
      
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '300px', height: '300px', background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(100px)', zIndex: -1, opacity: 0.3 }} />
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            style={{ position: 'absolute', left: 0, top: 0, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
          >
            <ChevronLeft size={16} /> Volver
          </button>
          <img 
            src="/logo.png" 
            alt="Grupo More" 
            style={{ height: '50px', margin: '0 auto 12px', display: 'block', objectFit: 'contain' }} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
          />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px 0' }}>Crear Cuenta</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Únete al equipo de <strong style={{color: 'var(--accent-color)'}}>Grupo More</strong></p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(248,81,73,0.1)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', border: '1px solid rgba(248,81,73,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Avatar Upload (PREVIEW ONLY) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '40px', background: 'rgba(255,255,255,0.05)', border: '2px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {avatarPreview ? (
                <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} style={{ color: 'var(--text-secondary)' }} />
              )}
            </div>
            <label style={{ marginTop: '8px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Camera size={14} /> {avatarPreview ? 'Cambiar foto' : 'Escoger foto (opcional)'}
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
            {avatarPreview && <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>La foto se subirá al finalizar el registro.</p>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nombre Completo</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Fernando Marulanda"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cédula</label>
              <input 
                type="text" 
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="ID / CC"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Teléfono</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Móvil"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Alias o Usuario</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: pablo22"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Correo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '14px' }} disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Finalizar Registro'}
          </button>
        </form>
        
        <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: '500' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
