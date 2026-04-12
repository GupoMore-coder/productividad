import { forwardRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ServiceOrder } from '../context/OrderContext';

interface PdfInvoiceTemplateProps {
  order: ServiceOrder;
}

export const PdfInvoiceTemplate = forwardRef<HTMLDivElement, PdfInvoiceTemplateProps>(({ order }, ref) => {
  return (
    <div 
      ref={ref} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '800px',
        background: '#0f172a', // Deep slate for premium feel
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: '0',
        boxSizing: 'border-box',
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: -9999,
      }}
    >
      {/* Watermark for Test Documents */}
      {order.isTest && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden'
        }}>
          <div style={{
            color: 'rgba(245, 158, 11, 0.08)',
            fontSize: '8rem',
            fontWeight: 900,
            transform: 'rotate(-45deg)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            border: '20px solid rgba(245, 158, 11, 0.08)',
            padding: '40px',
            borderRadius: '40px'
          }}>
            DOCUMENTO DE PRUEBA
          </div>
        </div>
      )}

      {/* Decorative Gradient Header */}
      <div style={{
        height: '10px',
        background: 'linear-gradient(90deg, #8b5cf6, #f59e0b, #10b981)',
      }} />

      <div style={{ padding: '50px' }}>
        {/* Main Brand Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '50px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #1a1622 100%)',
              borderRadius: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 900, color: '#fff',
              boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.3)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>M</div>
            <div>
              <h1 style={{ margin: 0, color: '#fff', fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>More Paper & Design</h1>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '1rem', fontWeight: 500, letterSpacing: '0.1em' }}>PRECISIÓN · CALIDAD · IDENTIDAD</p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px 24px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <span style={{ display: 'block', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Orden de Servicio</span>
              <h2 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '1.8rem', fontWeight: 900 }}>#{order.id}</h2>
            </div>
          </div>
        </div>

        {/* Content Body with Glassmorphism bits */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.2fr 0.8fr', 
          gap: '30px' 
        }}>
          {/* Left Column: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <section style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
              <h3 style={{ color: '#8b5cf6', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👤 Cliente y Responsable
              </h3>
              <p style={{ margin: '8px 0', fontSize: '1.1rem' }}><strong style={{ color: '#64748b' }}>Nombre:</strong> <span style={{ fontWeight: 600 }}>{order.customerName}</span></p>
              <p style={{ margin: '8px 0', fontSize: '1.1rem' }}><strong style={{ color: '#64748b' }}>Contacto:</strong> <span style={{ fontWeight: 600 }}>{order.customerPhone}</span></p>
              <p style={{ margin: '8px 0', fontSize: '1.1rem' }}><strong style={{ color: '#64748b' }}>Responsable:</strong> <span style={{ color: '#f59e0b', fontWeight: 800 }}>{order.responsible}</span></p>
            </section>

            <section style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ color: '#8b5cf6', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
                🛠️ Servicios Especializados
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {order.services.map(svc => (
                  <div key={svc} style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#a78bfa', fontSize: '0.9rem', fontWeight: 600 }}>
                    ✓ {svc}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Status & Time */}
          <div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
              <h3 style={{ color: '#8b5cf6', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>
                ⏳ Tiempos de Control
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>Ingreso</label>
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>{format(new Date(order.createdAt), "PPP, p", { locale: es })}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>Entrega Programada</label>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f59e0b' }}>{format(new Date(order.deliveryDate), "PPP, p", { locale: es })}</span>
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>Estado de Gestión</label>
                  <div style={{ display: 'inline-block', marginTop: '4px', background: '#334155', color: '#fff', padding: '6px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {order.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes (Premium Quote Style) */}
        {order.notes && (
          <div style={{ marginTop: '30px', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '24px', borderLeft: '4px solid #8b5cf6', fontStyle: 'italic', color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6' }}>
            "{order.notes}"
          </div>
        )}

        {/* Financial Settlement */}
        <div style={{ marginTop: '40px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '32px', padding: '40px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '50%' }} />
          <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '30px', textAlign: 'center' }}>
            Liquidación Financiera
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Valor Total</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0 }}>$ {order.totalCost.toLocaleString()}</h2>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Abono Recibido ({order.paymentStatus})</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', margin: 0 }}>$ {order.depositAmount.toLocaleString()}</h2>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Saldo Restante</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: order.pendingBalance > 0 ? '#f59e0b' : '#fff', margin: 0 }}>$ {order.pendingBalance.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Legal & Responsible Footer */}
        <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
             <div style={{ width: '200px', height: '1px', background: 'rgba(255,255,255,0.1)', marginTop: '40px' }} />
             <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{order.responsible.toUpperCase()}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Firma Autorizada</p>
             </div>
             <div style={{ width: '200px', height: '1px', background: 'rgba(255,255,255,0.1)', marginTop: '40px' }} />
          </div>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.7rem', fontWeight: 500 }}>
            Este documento es un comprobante de servicio generado por la plataforma <strong style={{ color: '#64748b' }}>More Paper & Design Cloud</strong>. 
            Válido como soporte de entrega y recepción técnica.
          </p>
        </div>
      </div>
    </div>
  );
});
