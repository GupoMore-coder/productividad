import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  // If user somehow lands here without needing setup
  useEffect(() => {
    if (!user || user.needsSetup === false) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.needsSetup === false) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
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
        password, 
        fullName, 
        cedula, 
        phone, 
        birth_date: birthDate, 
        avatar 
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '24px 16px' }} className="animate-fade-in relative overflow-hidden">
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80vw', height: '80vh', background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: -10, opacity: 0.5 }} />

      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '32px', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
          <button 
            type="button" 
            onClick={() => { signOut?.(); navigate('/login'); }}
            style={{ position: 'absolute', left: 0, top: 0, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg> Salir
          </button>
          
          <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '40px', border: '2px solid var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px', color: 'var(--accent-color)', overflow: 'hidden' }}>
            {avatar.length > 10 ? <img src={avatar} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : avatar}
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Configura tu Perfil</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Hola <strong style={{color: 'var(--accent-color)', textTransform: 'capitalize'}}>{user.username}</strong>, completa tu registro corporativo.
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Cédula</label>
              <input 
                type="text" 
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                placeholder="N° de Documento"
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
                placeholder="Ej: 310..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Nombre y Apellido</label>
            <input 
              type="text" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ej: Miguel Rodríguez"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Correo Real</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Nueva Contraseña (8+ caracteres)</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 caracteres"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Elige un Avatar o Emoticon</label>
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
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>O sube tu propia foto:</div>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '14px' }} disabled={loading}>
            {loading ? 'Finalizando Registro...' : 'Completar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
}
