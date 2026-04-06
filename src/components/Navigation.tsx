import { useState, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import HelpManualModal from './HelpManualModal';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, Calendar, Users, BookOpen, LayoutDashboard, ShieldCheck, Box, FileText, Lightbulb } from 'lucide-react';

/**
 * v12.3: Elite Navigation Resilience
 * Features a horizontally scrollable center section pinned between 
 * fixed specialized action buttons (+ and Logout).
 * Optimized for high-density navigation on mobile devices.
 */
export default function Navigation() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

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
    } else if (location.pathname === '/inventory') {
       window.dispatchEvent(new CustomEvent('open-create-item'));
    }
  };

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    window.dispatchEvent(new CustomEvent('force-close-modals'));
    (window as any).__activeModal = undefined;
    setShowLogoutConfirm(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center gap-1 min-w-[56px] transition-all duration-300 ${isActive ? 'text-purple-400 scale-110 drop-shadow-glow' : 'text-slate-500 hover:text-slate-300'}`;

  const activeModal = getActiveModalLabel();

  return (
    <>
      <nav
        className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-[max(16px,env(safe-area-inset-left))] right-[max(16px,env(safe-area-inset-right))] z-50 flex items-center justify-between p-1.5 bg-[#0f0a15]/80 border border-white/10 backdrop-blur-3xl rounded-full shadow-2xl overflow-hidden"
      >
        {/* ── Fixed: Create Trigger ── */}
        <button
          onClick={handleAddClick}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/10 hover:border-purple-500 transition-all active:scale-95 shadow-lg shadow-purple-500/5 shrink-0"
          title="Crear nuevo"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>

        {/* ── Scrollable Area: Main Nav ── */}
        <div 
          ref={scrollRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto px-4 no-scrollbar touch-pan-x"
        >
          <NavLink to="/" className={getNavClass} end>
            <Calendar size={20} />
            <span className="text-[0.6rem] font-black uppercase tracking-widest hidden sm:block">Agenda</span>
          </NavLink>

          <NavLink to="/group" className={getNavClass}>
            <Users size={20} />
            <span className="text-[0.6rem] font-black uppercase tracking-widest hidden sm:block">Grupo</span>
          </NavLink>

          <NavLink to="/orders" className={getNavClass}>
            <BookOpen size={20} />
            <span className="text-[0.6rem] font-black uppercase tracking-widest hidden sm:block">Órdenes</span>
          </NavLink>

          <NavLink to="/profile" className={getNavClass}>
             <div className="relative w-5 h-5 rounded-md overflow-hidden border border-purple-500/30">
                {user?.avatar && user.avatar.length > 10 ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="p" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[0.55rem] font-black text-purple-400">
                    {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
             </div>
             <span className="text-[0.6rem] font-black uppercase tracking-widest hidden sm:block">Perfil</span>
          </NavLink>

          {(user?.isAccountant || user?.role === 'Gestor Administrativo' || user?.isMaster) && (
            <NavLink to="/accounting" className={getNavClass}>
              <FileText size={20} />
              <span className="text-[0.6rem] font-black uppercase tracking-widest hidden sm:block">Balance</span>
            </NavLink>
          )}

          {(user?.isMaster || user?.role === 'Director General (CEO)' || user?.isSupervisor || user?.isConsultant) && (
            <NavLink to="/inventory" className={getNavClass}>
              <Box size={20} />
              <span className="text-[0.6rem] font-black uppercase tracking-widest hidden sm:block">Stock</span>
            </NavLink>
          )}

          {(user?.isColaborador || user?.isMaster) && (
             <NavLink to="/sugerencias" className={getNavClass}>
               <Lightbulb size={20} />
               <span className="text-[0.6rem] font-black uppercase tracking-widest hidden sm:block">Hallazgos</span>
             </NavLink>
          )}

          {(user?.role === 'Director General (CEO)' || user?.isMaster) && (
            <NavLink to="/dashboard" className={getNavClass}>
              <LayoutDashboard size={20} />
              <span className="text-[0.6rem] font-black uppercase tracking-widest hidden sm:block">CEO</span>
            </NavLink>
          )}

          {user?.isMaster && (
            <NavLink to="/admin" className={getNavClass}>
              <ShieldCheck size={20} />
              <span className="text-[0.6rem] font-black uppercase tracking-widest hidden sm:block">Master</span>
            </NavLink>
          )}
        </div>

        {/* ── Fixed: Logout ── */}
        <button
          onClick={handleLogoutClick}
          className="w-11 h-11 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 transition-all hover:text-slate-900 active:scale-95 shrink-0"
          title="Salir"
        >
          <LogOut size={18} strokeWidth={2.5} />
        </button>
      </nav>

      <HelpManualModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* ── Logout confirmation modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/5 max-w-sm w-full p-8 rounded-[32px] shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">¿Cerrar sesión?</h3>
              <p className="text-sm text-slate-500 font-light leading-relaxed">
                {activeModal
                  ? <>⚠️ Tienes <strong className="text-white">{activeModal}</strong> abierta. Al salir, perderás los datos ingresados.<br/><br/>¿Confirmas el cierre?</>
                  : <>Identificado como <strong className="text-purple-400">{user?.username || user?.email}</strong>. ¿Confirmas tu salida del sistema?</>
                }
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmLogout}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-red-400 transition-all active:scale-95 shadow-lg shadow-red-500/20"
              >
                Sí, Salir
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-widest border border-white/5 hover:bg-slate-700 transition-all active:scale-95"
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
