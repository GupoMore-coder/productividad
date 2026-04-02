import { useState } from 'react';

interface HelpManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpManualModal({ isOpen, onClose }: HelpManualModalProps) {
  const [activeTab, setActiveTab] = useState<'inicio' | 'agenda' | 'grupos' | 'ordenes' | 'admin'>('inicio');

  if (!isOpen) return null;

  const NavButton = ({ id, label, icon }: { id: any, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
        background: activeTab === id ? 'var(--accent-glow)' : 'transparent',
        border: `1px solid ${activeTab === id ? 'var(--accent-color)' : 'transparent'}`,
        color: activeTab === id ? 'var(--accent-color)' : 'var(--text-secondary)',
        fontWeight: activeTab === id ? 600 : 400, cursor: 'pointer', transition: 'var(--transition-fast)'
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-color)', zIndex: 99999, /* Full screen takeover */
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <header style={{ 
        padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-color-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '32px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Manual de Operaciones</h2>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}
        >
          Cerrar ✕
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Nav (scrollable) */}
        <aside style={{ 
          width: '240px', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid var(--glass-border)',
          padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto'
        }}>
          <NavButton id="inicio" label="Empezar" icon="🚀" />
          <NavButton id="agenda" label="Agenda y Tareas" icon="📋" />
          <NavButton id="grupos" label="Grupos de Trabajo" icon="👥" />
          <NavButton id="ordenes" label="Órdenes (ERP)" icon="📦" />
          <NavButton id="admin" label="Administración" icon="👑" />
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: 'transparent' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
            
            {activeTab === 'inicio' && (
              <div className="animate-fade-in">
                <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-color)' }}>Bienvenido a Grupo More</h1>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Esta aplicación híbrida progresiva ha sido diseñada exclusivamente para administrar las operaciones internas, desde la programación de compromisos hasta el estado de facturación de servicios.
                </p>
                
                <div style={{ background: 'rgba(179, 157, 219, 0.1)', borderLeft: '4px solid var(--info-color)', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--info-color)' }}>💡 Primeros Pasos</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Registra una cuenta nueva si aún no tienes acceso.</li>
                    <li>Navega usando los íconos de la barra inferior (Actividades, Grupo, Órdenes).</li>
                    <li>Mantén la aplicación abierta (o instalada en tu pantalla de inicio) para recibir notificaciones sonoras.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'agenda' && (
              <div className="animate-fade-in">
                <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-color)' }}>Gestión de Actividades</h1>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Usa el botón central (<strong>+</strong>) en tu barra de navegación para agendar tareas. Cada tarea activará un sistema de notificaciones silenciosas.
                </p>

                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px' }}>Sistema de Prioridades y Alarmas</h3>
                <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
                   <div style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--danger-color)' }}>
                     <strong style={{ color: 'var(--danger-color)' }}>Alta Prioridad</strong>
                     <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fijará alarmas autónomas restando: 72h, 48h, 24h, 12h, 6h y 3h antes de su vencimiento.</p>
                   </div>
                   <div style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--warning-color)' }}>
                     <strong style={{ color: 'var(--warning-color)' }}>Media Prioridad</strong>
                     <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fijará alarmas autónomas restando: 48h, 24h y 12h antes de su vencimiento.</p>
                   </div>
                   <div style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--info-color)' }}>
                     <strong style={{ color: 'var(--info-color)' }}>Baja Prioridad</strong>
                     <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fijará alarmas autónomas restando: 12h y 6h antes de su vencimiento.</p>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'grupos' && (
              <div className="animate-fade-in">
                <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-color)' }}>Grupos Corporativos</h1>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Para que todo tu equipo vea una actividad, debes asignarla a un Grupo. Quien no pertenezca a un grupo no verá ni recibirá alertas de dicho grupo.
                </p>

                <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: '16px' }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Flujo de Participación</h3>
                  
                  {/* CSS Flowchart */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      1. Líder crea un Grupo
                    </div>
                    <span style={{ color: 'var(--accent-color)' }}>➔</span>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      2. Miembro solicita unirse
                    </div>
                    <span style={{ color: 'var(--accent-color)' }}>➔</span>
                    <div style={{ padding: '12px', background: 'var(--accent-glow)', borderRadius: '8px', border: '1px solid var(--accent-color)' }}>
                      3. Líder Aprueba
                    </div>
                  </div>
                  
                  <p style={{ margin: '16px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sólo con el Paso 3 completado, el usuario comenzará a ver la agenda compartida de ese grupo en su listado principal.</p>
                </div>
              </div>
            )}

            {activeTab === 'ordenes' && (
              <div className="animate-fade-in">
                <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-color)' }}>Órdenes de Servicio (Mini-ERP)</h1>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Este módulo especializado permite llevar la secuencia de facturación, estado operativo y adjuntos gráficos de cada pedido creado.
                </p>

                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px' }}>Ciclo de Vida de una Orden</h3>
                
                {/* Visual Lifecycle Flow */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ width: '4px', background: 'var(--info-color)', borderRadius: '4px', marginRight: '16px' }}></div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', flex: 1, borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <strong style={{ color: 'var(--info-color)' }}>1. Estado: RECIBIDA</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Por defecto al crear la orden. Se programan alarmas a -24h y -12h previas a la entrega pactada. Se envía una notificación en tiempo real a todo el equipo.</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ width: '4px', background: 'var(--warning-color)', borderRadius: '4px', marginRight: '16px' }}></div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', flex: 1, borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <strong style={{ color: 'var(--warning-color)' }}>2. Estado: EN ELABORACIÓN / PTE ENTREGA</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>El equipo usa los botones de la tarjeta para informar que la pieza se está fabricando o ya está lista esperando al cliente. (Cualquiera puede transitar esto).</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ width: '4px', background: 'var(--success-color)', borderRadius: '4px', marginRight: '16px' }}></div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', flex: 1, borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <strong style={{ color: 'var(--success-color)' }}>3. INACTIVACIÓN: COMPLETADA o CANCELADA</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>La tarjeta se traslada a la pestaña Historial y <strong style={{color: 'var(--danger-color)'}}>las alarmas de entrega se apagan automáticamente</strong>.</p>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(229, 115, 115, 0.1)', borderLeft: '4px solid var(--danger-color)', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--danger-color)' }}>⚠️ Reglas Estrictas</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    <li>Solo el <strong>Usuario Creador</strong> de la orden (o el Administrador) visualizará el botón ✏️ Editar para modificar montos de dinero o servicios.</li>
                    <li>Solo el <strong>Usuario Creador</strong> (o Administrador) puede Reactivar (🔄) una orden inactiva (lo que encenderá nuevamente sus alarmas asociadas).</li>
                    <li>Cancelar una orden siempre requerirá justificación de texto.</li>
                  </ul>
                </div>

                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '16px' }}>Generación de PDFs y Filtros</h3>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li><strong>Motor de Búsqueda:</strong> En la vista principal de órdenes tienes una barra predictiva. Puedes buscar por nombre de cliente, nombre del creador, número de orden, notas o servicios.</li>
                  <li><strong>Filtro de Calendario:</strong> Usa el ícono 📅 para acotar resultados buscando órdenes entre dos fechas específicas de "Entrega".</li>
                  <li><strong>Factura PDF:</strong> Tras crear una Orden Activa, oprime el botón <span style={{color: 'var(--accent-color)'}}>📄 PDF</span> en la tarjeta para descargar e imprimir en formato A4 con membrete oficial un resumen del costo, abono y saldo.</li>
                </ul>

              </div>
            )}

            {activeTab === 'admin' && (
              <div className="animate-fade-in">
                <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-color)' }}>Controles de Administración 👑</h1>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  El usuario raíz del sistema tiene acceso panóptico ilimitado para mitigar errores del personal y asegurar la continuidad de negocio.
                </p>

                <div style={{ background: 'var(--glass-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--accent-color)' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Privilegios Exclusivos Súper-Admin</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li><strong style={{color: '#fff'}}>Edición Universal:</strong> Puede editar o reactivar cualquier Orden de Servicio sin importar si la creó él u otro operador.</li>
                    <li><strong style={{color: '#fff'}}>Ojo Omnisciente:</strong> En Actividades, visualizará absolutamente las tareas de todo el personal, incluso en grupos donde no participa.</li>
                    <li><strong style={{color: '#fff'}}>Onboarding de Usuarios:</strong> La aplicación creará registros vacíos/default, pero el Administrador guiará qué usuario retoma qué cuenta o generará invitaciones ilimitadas.</li>
                  </ul>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}
      </style>
    </div>
  );
}
