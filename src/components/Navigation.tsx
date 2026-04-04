import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import HelpManualModal from './HelpManualModal';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // ── Detect active modal via a lightweight flag on window ──────────
  // Each create-modal sets window.__activeModal = 'task'|'group'|'order' on open
  // and clears it on close / cancel.
  const getActiveModalLabel = (): string | null => {
    const m = (window as any).__activeModal as string | undefined;
    if (!m) return null;
    if (m === 'task')  return 'la creación de actividad';
    if (m === 'group') return 'la creación de grupo';
    if (m === 'order') return 'la orden de servicio';
    return 'la acción en curso';
  };

  const handleAddClick = () => {
    if (location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('open-create-task'));
    } else if (location.pathname === '/group') {
      window.dispatchEvent(new CustomEvent('open-create-group'));
    } else if (location.pathname.startsWith('/orders')) {
      window.dispatchEvent(new CustomEvent('open-create-order'));
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    // Close any open modal first
    window.dispatchEvent(new CustomEvent('force-close-modals'));
    (window as any).__activeModal = undefined;
    setShowLogoutConfirm(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const getNavStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
    transition: 'var(--transition-fast)',
    fontSize: '0.75rem',
    fontWeight: isActive ? 600 : 400,
  });

  const activeModal = getActiveModalLabel();

  return (
    <>
      <nav
        className="glass-panel"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          padding: '8px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
          borderRadius: 'var(--radius-full)'
        }}
      >
        {/* ── Create button ── */}
        <button
          onClick={handleAddClick}
          style={{
            width: '56px', height: '56px', borderRadius: '28px',
            backgroundColor: 'var(--bg-color)', color: 'var(--accent-color)',
            border: '1px solid var(--accent-color)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer', transition: 'transform 0.2s ease',
            boxShadow: '0 4px 12px rgba(196, 167, 119, 0.2)'
          }}
          className="hover:scale-105"
          title="Crear nuevo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </button>

        {/* ── Nav links ── */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <NavLink to="/" style={getNavStyle} end title="Actividades">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
            <span style={{ fontSize: '0.65rem' }}>Agenda</span>
          </NavLink>

          <NavLink to="/group" style={getNavStyle} title="Grupo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span style={{ fontSize: '0.65rem' }}>Grupo</span>
          </NavLink>

          <NavLink to="/orders" style={getNavStyle} title="Órdenes">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <span style={{ fontSize: '0.65rem' }}>Órdenes</span>
          </NavLink>

          <NavLink to="/profile" style={getNavStyle} title="Mi Perfil">
             <div style={{ 
               position: 'relative', width: '22px', height: '22px', borderRadius: '11px', 
               overflow: 'hidden', border: '1px solid var(--accent-color)', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', 
               fontSize: '9px', fontWeight: 900,
               background: user?.avatar && user.avatar.length > 10 ? 'transparent' : 'linear-gradient(135deg, #d4bc8f, #b39063)'
             }}>
                {user?.avatar && user.avatar.length > 10 ? (
                  <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#1a1622' }}>
                    {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
                {(() => {
                    if (!user?.birth_date) return false;
                    const bday = new Date(user.birth_date + 'T12:00:00');
                    const today = new Date();
                    if (bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth()) {
                        return <div style={{ position: 'absolute', top: -3, right: -3, fontSize: '8px' }}>👑</div>;
                    }
                    return null;
                })()}
             </div>
             <span style={{ fontSize: '0.65rem' }}>Perfil</span>
          </NavLink>

          {user?.isSuperAdmin && (
            <NavLink to="/admin" style={getNavStyle} title="Administración">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><line x1="19" y1="8" x2="23" y2="12"/><line x1="23" y1="8" x2="19" y2="12"/></svg>
              <span style={{ fontSize: '0.65rem' }}>Admin</span>
            </NavLink>
          )}
        </div>

        {/* ── Logout button ── */}
        <button
          onClick={handleLogoutClick}
          style={{
            width: '44px', height: '44px', borderRadius: '22px',
            backgroundColor: 'rgba(248,113,113,0.1)',
            color: '#f87171',
            border: '1px solid rgba(248,113,113,0.3)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          title="Salir"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </nav>

      <HelpManualModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* ── Logout confirmation modal ── */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ maxWidth: 360, width: '100%', padding: '28px 24px', borderRadius: 20 }}>
            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>Cerrar sesión</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.55 }}>
                {activeModal
                  ? <>⚠️ Tienes <strong style={{ color: 'var(--text-primary)' }}>{activeModal}</strong> abierta. Al salir, perderás los datos ingresados sin guardar.<br/><br/>¿Deseas continuar y cerrar sesión?</>
                  : <>¿Confirmas que deseas cerrar la sesión de <strong style={{ color: 'var(--accent-color)' }}>{user?.username || user?.email}</strong>?</>
                }
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                  background: '#f87171', color: '#fff'
                }}
              >
                Sí, cerrar sesión
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer', background: 'transparent',
                  color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
