import { useMemo } from 'react';
import { Task } from '../context/TaskContext';

interface TaskAnalyticsProps {
  tasks: Task[];
  onClose: () => void;
}

export default function TaskAnalytics({ tasks, onClose }: TaskAnalyticsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTasks = tasks.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const completed = monthTasks.filter(t => t.completed).length;
    const cancelled = monthTasks.filter(t => t.status === 'cancelled_with_reason').length;
    const total = monthTasks.length;
    
    const efficiency = total > 0 ? (completed / total) * 100 : 0;
    const productivity = total > 0 ? (completed / (total - cancelled || 1)) * 100 : 0;

    return { total, completed, cancelled, efficiency, productivity };
  }, [tasks]);

  return (
    <div className="glass-panel" style={{ position: 'fixed', inset: '20px', zIndex: 1000, padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>📊</span> Eficacia y Productividad Mensual
        </h2>
        <button onClick={onClose} className="btn-primary" style={{ padding: '8px 16px', background: 'var(--bg-color-secondary)', color: 'var(--text-primary)' }}>
          Cerrar
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <StatCard label="Tareas Totales" value={stats.total} icon="📋" />
          <StatCard label="Completadas" value={stats.completed} icon="✅" color="var(--success-color)" />
          <StatCard label="Canceladas" value={stats.cancelled} icon="❌" color="var(--danger-color)" />
          <StatCard label="Eficacia" value={`${stats.efficiency.toFixed(1)}%`} icon="🎯" color="var(--accent-color)" />
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Análisis de Productividad</h3>
          <div style={{ height: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom: '12px' }}>
            <div style={{ width: `${stats.efficiency}%`, background: 'var(--success-color)', height: '100%', transition: 'width 1s ease-out' }} />
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Has completado el <strong>{stats.efficiency.toFixed(1)}%</strong> de tus tareas agendadas este mes. 
            Tu índice de productividad real (excluyendo cancelaciones justificadas) es del <strong>{stats.productivity.toFixed(1)}%</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', border: '1px dotted var(--glass-border)', background: 'rgba(212,188,143,0.05)', color: 'var(--accent-color)', fontSize: '0.9rem' }}>
            🔔 El 1er día del próximo mes recibirás un reporte detallado en PDF con tu rendimiento histórico directamente en tu correo.
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'var(--text-primary)' }: any) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: '700', color, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
    </div>
  );
}
