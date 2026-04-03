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
        background: '#1a1622',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '40px',
        boxSizing: 'border-box',
        visibility: 'hidden',   // hidden but renderable by html2canvas
        pointerEvents: 'none',
        zIndex: -9999,
      }}
    >
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid #d4bc8f',
        borderRadius: '16px',
        padding: '30px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #d4bc8f', paddingBottom: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Logo text — avoids html2canvas CORS issues with server images */}
            <div style={{
              width: 60, height: 60,
              background: '#d4bc8f',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', fontWeight: 800, color: '#1a1622'
            }}>M</div>
            <div>
              <h1 style={{ margin: 0, color: '#d4bc8f', fontSize: '1.8rem' }}>Grupo More</h1>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>More Paper | Design</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>ORDEN SUPERIOR</h2>
            <p style={{ margin: 0, color: '#d4bc8f', fontSize: '1.2rem', fontWeight: 'bold' }}>#{order.id}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ color: '#d4bc8f', fontSize: '1rem', borderBottom: '1px solid rgba(212, 188, 143, 0.3)', paddingBottom: '4px', marginBottom: '10px' }}>📝 Datos del Cliente</h3>
            <p style={{ margin: '4px 0' }}><strong>Nombre:</strong> {order.customerName}</p>
            <p style={{ margin: '4px 0' }}><strong>Teléfono:</strong> {order.customerPhone}</p>
            <p style={{ margin: '4px 0' }}><strong>Responsable:</strong> {order.responsible}</p>
          </div>
          <div>
            <h3 style={{ color: '#d4bc8f', fontSize: '1rem', borderBottom: '1px solid rgba(212, 188, 143, 0.3)', paddingBottom: '4px', marginBottom: '10px' }}>🕒 Tiempos Operativos</h3>
            <p style={{ margin: '4px 0' }}><strong>Fecha Emisión:</strong> {format(new Date(order.createdAt), "dd MMM yyyy, p", { locale: es })}</p>
            <p style={{ margin: '4px 0' }}><strong>Fecha Entrega:</strong> {format(new Date(order.deliveryDate), "dd MMM yyyy, p", { locale: es })}</p>
            <p style={{ margin: '4px 0' }}>
              <strong>Estado Actual:</strong> <span style={{ padding: '2px 8px', background: 'rgba(212, 188, 143, 0.2)', color: '#d4bc8f', borderRadius: '4px' }}>{order.status.toUpperCase().replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        {/* Servicios */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#d4bc8f', fontSize: '1rem', borderBottom: '1px solid rgba(212, 188, 143, 0.3)', paddingBottom: '4px', marginBottom: '10px' }}>📋 Servicios Requeridos</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {order.services.map(svc => (
              <span key={svc} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                ✓ {svc}
              </span>
            ))}
          </div>
        </div>

        {/* Notas */}
        {order.notes && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#d4bc8f', fontSize: '1rem', borderBottom: '1px solid rgba(212, 188, 143, 0.3)', paddingBottom: '4px', marginBottom: '10px' }}>📌 Notas Adicionales</h3>
            <p style={{ margin: 0, fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>"{order.notes}"</p>
          </div>
        )}

        {/* Resumen Financiero */}
        <div>
          <h3 style={{ color: '#d4bc8f', fontSize: '1rem', borderBottom: '1px solid rgba(212, 188, 143, 0.3)', paddingBottom: '4px', marginBottom: '10px' }}>💰 Liquidación Financiera</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>COSTO TOTAL</p>
              <h2 style={{ margin: '4px 0 0 0', color: '#fff' }}>$ {order.totalCost.toLocaleString()}</h2>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>ABONADO ({order.paymentStatus.toUpperCase()})</p>
              <h2 style={{ margin: '4px 0 0 0', color: '#4ade80' }}>$ {order.depositAmount.toLocaleString()}</h2>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>SALDO PENDIENTE</p>
              <h2 style={{ margin: '4px 0 0 0', color: order.pendingBalance > 0 ? '#fbbf24' : '#fff' }}>$ {order.pendingBalance.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', color: '#aaa', fontSize: '0.8rem' }}>
          <p style={{ margin: '2px 0' }}>Documento generado electrónicamente a través de la red corporativa de <strong>Grupo More</strong>.</p>
          <p style={{ margin: '2px 0' }}>Preparado por: {order.createdBy.split('@')[0]}</p>
        </div>

      </div>
    </div>
  );
});
