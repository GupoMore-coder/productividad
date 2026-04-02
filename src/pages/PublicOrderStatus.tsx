import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PublicOrderStatus() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const { data, error } = await supabase
          .from('service_orders')
          .select(`*, order_history(*)`)
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err: any) {
        console.error('Error fetching public order:', err);
        setError('No pudimos encontrar la orden solicitada. Verifica el código o escanea el QR nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff' }}>
        <div className="animate-pulse" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p>Localizando tu pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ color: '#f87171' }}>Orden no encontrada</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{error}</p>
          <Link to="/" style={{ background: '#a855f7', color: '#fff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600 }}>Volver al Inicio</Link>
        </div>
      </div>
    );
  }

  const getStatusData = (status: string) => {
    const data: Record<string, { label: string, color: string, icon: string, step: number }> = {
      'recibida': { label: 'Recibida', color: '#3b82f6', icon: '📩', step: 1 },
      'en_proceso': { label: 'En Elaboración', color: '#eab308', icon: '⚙️', step: 2 },
      'pendiente_entrega': { label: 'Lista para Entrega', color: '#a855f7', icon: '🎁', step: 3 },
      'completada': { label: 'Entregada', color: '#22c55e', icon: '✅', step: 4 },
      'cancelada': { label: 'Cancelada', color: '#ef4444', icon: '❌', step: 0 },
      'vencida': { label: 'Vencida', color: '#ff4d4d', icon: '⚠️', step: 1.5 }
    };
    return data[status] || { label: status, color: '#94a3b8', icon: '📌', step: 0 };
  };

  const statusInfo = getStatusData(order.status);
  const steps = [
    { label: 'Recibida', step: 1 },
    { label: 'Elaboración', step: 2 },
    { label: 'Lista', step: 3 },
    { label: 'Entregada', step: 4 }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', padding: '40px 20px' }} className="animate-fade-in">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Branding */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#d4bc8f' }}>Grupo More</h1>
          <p style={{ color: '#94a3b8', letterSpacing: '2px', fontSize: '0.9rem' }}>PORTAL DE SEGUIMIENTO</p>
        </header>

        {/* Order Identifier */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', textAlign: 'center', marginBottom: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>CÓDIGO DE ORDEN</span>
          <h2 style={{ fontSize: '2.5rem', margin: '8px 0', color: '#fff' }}>#{order.id}</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '20px', background: `${statusInfo.color}22`, border: `1px solid ${statusInfo.color}44`, color: statusInfo.color, fontWeight: 700, marginTop: '16px' }}>
            <span>{statusInfo.icon}</span>
            <span>{statusInfo.label.toUpperCase()}</span>
          </div>
        </div>

        {/* Progress Tracker */}
        {order.status !== 'cancelada' && (
          <div style={{ marginBottom: '40px', padding: '0 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '10px' }}>
              {/* Connector Line */}
              <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: '15px', left: '10%', width: `${Math.min(100, Math.max(0, (statusInfo.step - 1) * 26.6 + 10))}%`, height: '2px', background: statusInfo.color, zIndex: 2, transition: 'width 1s ease' }} />
              
              {steps.map((s, i) => (
                <div key={i} style={{ zIndex: 3, textAlign: 'center', width: '25%' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: statusInfo.step >= s.step ? statusInfo.color : '#1e1e2e', border: `3px solid ${statusInfo.step >= s.step ? statusInfo.color : '#333'}`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: statusInfo.step >= s.step ? '#000' : '#666', fontWeight: 800, transition: '0.3s' }}>
                    {statusInfo.step >= s.step ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: statusInfo.step >= s.step ? '#fff' : '#666', fontWeight: 600 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>CLIENTE</span>
            <span style={{ fontWeight: 600 }}>{order.customer_name}</span>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ENTREGA ESTIMADA</span>
            <span style={{ fontWeight: 600 }}>{format(new Date(order.delivery_date), 'dd MMM, HH:mm', { locale: es })}</span>
          </div>
        </div>

        {/* Services List */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#d4bc8f', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>DETALLES DEL TRABAJO</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {order.services.map((s: string, i: number) => (
              <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}>{s}</span>
            ))}
          </div>
          {order.notes && (
            <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px' }}>
              "{order.notes}"
            </p>
          )}
        </div>

        {/* Footer info */}
        <footer style={{ textAlign: 'center', padding: '40px 0', color: '#4b5563', fontSize: '0.8rem' }}>
          <p>© {new Date().getFullYear()} Grupo More - Diseño & Calidad</p>
          <p style={{ marginTop: '8px' }}>Para cualquier duda, contacta al +57 {order.customer_phone}</p>
        </footer>
      </div>
    </div>
  );
}
