import { useMemo } from 'react';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

// ── Custom SVG Bar Component ──────────────────────────────────────
const BarChart = ({ data, color }: { data: { label: string, value: number }[], color: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: '1 0 100px', fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.label}
          </div>
          <div style={{ flex: '3 1 200px', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', background: color, borderRadius: '6px' }}
            />
          </div>
          <div style={{ flex: '0 0 80px', fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>
            ${d.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Custom SVG Pie Component (Simplified) ──────────────────────────
const MiniPie = ({ percent, color, label }: { percent: number, color: string, label: string }) => {
  const radius = 18;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (percent / 100) * circum;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <motion.circle
          cx="24" cy="24" r={radius} fill="transparent" stroke={color} strokeWidth="6"
          strokeDasharray={circum}
          initial={{ strokeDashoffset: circum }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      </svg>
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{percent.toFixed(0)}%</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { orders } = useOrders();
  const { user } = useAuth();

  // Metrics Logic
  const stats = useMemo(() => {
    // Lista de usuarios excluidos de las métricas financieras (Administración/Socios)
    const excludedUsers = ['miguel', 'flor', 'fernando', 'admin'];
    
    const financialOrders = orders.filter(o => 
      !excludedUsers.some(ex => (o.responsible || '').toLowerCase().includes(ex))
    );

    const totalSales = financialOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const totalCollected = financialOrders.reduce((acc, o) => acc + (o.depositAmount || 0), 0);
    const totalPending = financialOrders.reduce((acc, o) => acc + (o.pendingBalance || 0), 0);
    
    // Revenue by Service (Financial only)
    const serviceMap: Record<string, number> = {};
    financialOrders.forEach(o => {
      o.services.forEach(s => {
        serviceMap[s] = (serviceMap[s] || 0) + (o.totalCost / (o.services.length || 1));
      });
    });
    const serviceRanking = Object.entries(serviceMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Productivity by Responsible (All users for operational overview)
    const respMap: Record<string, number> = {};
    orders.forEach(o => {
      respMap[o.responsible] = (respMap[o.responsible] || 0) + 1;
    });
    const productivityData = Object.entries(respMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    // Order status breakdown
    const activeCount = orders.filter(o => ['recibida', 'en_proceso', 'pendiente_entrega'].includes(o.status)).length;
    const completedCount = orders.filter(o => o.status === 'completada').length;
    const totalCount = orders.length || 1;

    return { totalSales, totalCollected, totalPending, serviceRanking, productivityData, activeCount, completedCount, totalCount };
  }, [orders]);

  if (!user?.isSuperAdmin) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Acceso Denegado</h2>
        <p>Esta sección es solo para administradores.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px 100px 16px', maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#d4bc8f' }}>Inteligencia de Negocio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Análisis financiero y operativo de Grupo More</p>
      </header>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-color)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>VENTAS TOTALES</span>
          <h3 style={{ fontSize: '1.5rem', margin: 0 }}>$ {stats.totalSales.toLocaleString()}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--success-color)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>CAJA (RECAUDADO)</span>
          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--success-color)' }}>$ {stats.totalCollected.toLocaleString()}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--warning-color)', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>SALDOS POR COBRAR (CARTERA)</span>
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--warning-color)' }}>$ {stats.totalPending.toLocaleString()}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CARTERA CERRADA</span>
               <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{((stats.totalCollected / (stats.totalSales || 1)) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <MiniPie percent={(stats.activeCount / stats.totalCount) * 100} color="#3b82f6" label="Órdenes Activas" />
        <MiniPie percent={(stats.completedCount / stats.totalCount) * 100} color="var(--success-color)" label="Completadas" />
      </div>

      {/* Services Ranking Section */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#d4bc8f' }}>⭐ Ranking de Servicios (Ingresos)</h4>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ACTUALIZADO AHORA</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Basado en el valor total de las órdenes creadas.</p>
        <BarChart data={stats.serviceRanking} color="var(--accent-color)" />
      </section>

      {/* Productivity Section */}
      <section className="glass-panel" style={{ padding: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: '#d4bc8f', marginBottom: '20px' }}>👥 Productividad del Equipo</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stats.productivityData.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                  {p.label.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.9rem' }}>{p.label}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{p.value} órdenes</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{((p.value / stats.totalCount) * 100).toFixed(1)}% del total</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
        Documento analítico dinámico basado en datos de Supabase Cloud.
      </footer>
    </div>
  );
}
