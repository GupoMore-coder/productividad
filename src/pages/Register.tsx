import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const cleanUsername = username.trim();
      const cleanEmail = email.trim();

      if(cleanUsername.includes(' ') || cleanUsername.includes('@')) {
        throw new Error('El usuario debe ser corto, sin espacios ni @.');
      }

      if (!/^[a-zA-Z]/.test(cleanUsername)) {
        throw new Error('El nombre de usuario debe iniciar obligatoriamente con una letra (sin números, espacios ni caracteres especiales al inicio).');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error('El correo electrónico no es válido.');
      }

      const isSuper = cleanUsername === 'fernando';

      if (!isSuper) {
        if (password.length < 8) {
          throw new Error('La contraseña debe tener al menos 8 caracteres.');
        }
        if (!/[A-Z]/.test(password)) {
          throw new Error('La contraseña debe incluir al menos una letra mayúscula.');
        }
        if (!/[0-9]/.test(password)) {
          throw new Error('La contraseña debe incluir al menos un número.');
        }
      }

      await signUp(cleanEmail, password, cleanUsername);
      alert('Solicitud enviada. Tu cuenta esta pendiente de aprobacion por el administrador. Se te notificara cuando puedas iniciar sesion.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '16px' }} className="animate-fade-in">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }} className="animate-fade-in">
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            style={{ position: 'absolute', left: 0, top: 0, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg> Volver
          </button>
          <img 
            src="/logo.png" 
            alt="Grupo More" 
            style={{ height: '60px', margin: '0 auto 16px', display: 'block', objectFit: 'contain' }} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
          />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Crear Cuenta</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Únete al equipo de <strong style={{color: 'var(--accent-color)'}}>Grupo More</strong></p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(248,81,73,0.1)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Alias o Nombre de Usuario Corto</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Ej: pablo22"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'white', outline: 'none' }}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: pablo@correo.com"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'white', outline: 'none' }}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'white', outline: 'none' }}
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>
        
        <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: '500' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
