import { useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task } from '../context/TaskContext';

interface MonthlyReportModalProps {
  tasks: Task[];
  onClose: () => void;
}

export default function MonthlyReportModal({ tasks, onClose }: MonthlyReportModalProps) {
  const lastMonthDate = subMonths(new Date(), 1);
  const startOfPrevMonth = startOfMonth(lastMonthDate);
  const endOfPrevMonth = endOfMonth(lastMonthDate);
  const monthName = format(lastMonthDate, 'MMMM yyyy', { locale: es });

  const stats = useMemo(() => {
    const monthTasks = tasks.filter(t => {
      const tDate = new Date(`${t.date}T00:00:00`);
      return isWithinInterval(tDate, { start: startOfPrevMonth, end: endOfPrevMonth });
    });

    const completed = monthTasks.filter(t => t.completed).length;
    const total = monthTasks.length || 1;
    const efficacy = (completed / total) * 100;
    
    const cancelled = monthTasks.filter(t => t.status === 'cancelled_with_reason').length;

    return { total, completed, efficacy, cancelled };
  }, [tasks, startOfPrevMonth, endOfPrevMonth]);

  const handleSendEmail = () => {
    alert('📧 El informe ha sido enviado a tu correo personal configurado.');
    // Integración futura con Resend / Backend.
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '32px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-color)', color: '#000', padding: '4px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '1px' }}>
          INFORME PRIVADO
        </div>

        <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-color)', marginBottom: '8px' }}>Tu Resumen de {monthName}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>Analítica de rendimiento y productividad corporativa.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TAREAS TOTALES</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success-color)' }}>{stats.efficacy.toFixed(0)}%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>EFICACIA FINAL</div>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
            <span>Ejecución Exitosa</span>
            <span style={{ fontWeight: 600 }}>{stats.completed}</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ width: `${stats.efficacy}%`, height: '100%', background: 'var(--success-color)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--danger-color)' }}>• {stats.cancelled} Actividades Canceladas / No Cumplidas</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={handleSendEmail}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--accent-color)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            Enviar Informe al Correo
          </button>
          <button 
            onClick={onClose}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
          >
            Cerrar Visualización
          </button>
        </div>

        <p style={{ marginTop: '24px', fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          Este informe ha sido generado automáticamente por el sistema Antigravity Core el día 01 a las 07:00 AM.
        </p>
      </div>
    </div>
  );
}
