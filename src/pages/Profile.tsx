import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFile, base64ToBlob } from '@/lib/supabase';
import { compressImage } from '../utils/imageCompressor';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.full_name || user?.user_metadata?.fullName || '');
  const [password, setPassword] = useState(user?.password || '');
  const [cedula, setCedula] = useState(user?.cedula || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.birth_date || '');
  const [avatar, setAvatar] = useState(user?.avatar || '👤');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const emoticons = ['👤', '👔', '👩‍💼', '👨‍💻', '👩‍🎨', '👷', '👨‍⚕️', '👸', '🤴', '🚀', '⭐', '🌈'];

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
      } catch (err) {
        console.error('Avatar upload error:', err);
        setError('Error al subir el avatar.');
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
      const isSuper = user?.isSuperAdmin || user?.role === 'Administrador maestro';
      if (!isSuper && password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      }
      
      await updateProfile({ 
        email, 
        password, 
        fullName, 
        cedula, 
        phone, 
        birth_date: birthDate, 
        avatar 
      });
      setSuccess('¡Perfil actualizado con éxito!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '24px 16px 100px 16px', maxWidth: '500px', margin: '0 auto' }} className="animate-fade-in padding-safe">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Tu Perfil</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Gestiona tu información personal</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
          Volver
        </button>
      </header>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
           <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', border: '2px solid var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 16px', color: 'var(--accent-color)', overflow: 'hidden' }}>
              {avatar.length > 10 ? <img src={avatar} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : avatar}
           </div>
           <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{user.username}</h3>
           <p style={{ color: 'var(--accent-color)', fontSize: '0.85rem', margin: '4px 0 0', fontWeight: 600 }}>{user.role || 'Colaborador'}</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', color: 'var(--success-color)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Cédula</label>
              <input 
                type="text" 
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Celular</label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Nombre Completo</label>
            <input 
              type="text" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Fecha de Nacimiento</label>
            <input 
              type="date" 
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
              required 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Avatar</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {emoticons.map(e => (
                <button 
                  key={e} 
                  type="button"
                  onClick={() => setAvatar(e)}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', border: avatar === e ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {e}
                </button>
              ))}
            </div>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '14px' }} disabled={loading || uploadingAvatar}>
            {loading ? 'Actualizando...' : (uploadingAvatar ? 'Subiendo imagen...' : 'Guardar Cambios')}
          </button>
        </form>
      </div>
    </div>
  );
}
