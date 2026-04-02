import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Fingerprint, Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const { user, signInWithEmail, signInWithUsername, signInWithPasskey } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (identifier.includes('@')) {
        const { error: authError } = await signInWithEmail(identifier, password);
        if (authError) throw authError;
      } else {
        await signInWithUsername(identifier, password);
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '16px' }} className="animate-fade-in relative overflow-hidden">
      
      {/* Dynamic Background Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80vw', height: '80vh', background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: -10, opacity: 0.5 }} />

      <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '32px', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }} className="animate-fade-in">
          <img 
            src="/logo.png" 
            alt="Grupo More" 
            style={{ height: '70px', margin: '0 auto 16px', display: 'block', objectFit: 'contain' }} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
          />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 10px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Sistema de gestión
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
            para actividades personales y Operatividad del{' '}
            <strong style={{ color: 'var(--accent-color)' }}>Grupo More</strong>
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Correo o Usuario</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
              <input 
                id="identifier"
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toLowerCase())}
                placeholder="Ej: pablo22 o correo"
                style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
              <input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--glass-border)', zIndex: 1 }}></div>
          <span style={{ position: 'relative', zIndex: 2, background: 'var(--bg-color)', padding: '0 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Opcional
          </span>
        </div>

        <button 
          type="button" 
          onClick={signInWithPasskey}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}
          className="hover:bg-white/5"
        >
          <Fingerprint size={16} />
          Ingresar con Huella / FaceID
        </button>

        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
          ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--accent-color)', fontWeight: '500' }}>Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
