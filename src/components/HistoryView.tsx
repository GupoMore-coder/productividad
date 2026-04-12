import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task } from '../context/TaskContext';

interface HistoryViewProps {
  tasks: Task[];
  onClose: () => void;
  onGoToDate: (date: string) => void;
}

export default function HistoryView({ tasks, onClose, onGoToDate }: HistoryViewProps) {
  const historyTasks = tasks
    .filter(t => t.completed || t.status === 'cancelled_with_reason' || t.status === 'declined' || parseISO(t.date) < new Date())
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  // Group by date
  const grouped = historyTasks.reduce((acc: any, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {});

  const formatHeaderDate = (dateStr: string) => {
    try {
      // Split to avoid UTC shift
      const [y, m, d] = dateStr.split('-').map(Number);
      return format(new Date(y, m-1, d), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="glass-panel" style={{ position: 'fixed', inset: '20px', zIndex: 1000, padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>📜</span> Historial de Actividades
        </h2>
        <button onClick={onClose} className="btn-primary" style={{ padding: '8px 16px', background: 'var(--bg-color-secondary)', color: 'var(--text-primary)' }}>
          Cerrar
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No hay actividades en el historial.
          </div>
        ) : (
          Object.keys(grouped).map(date => (
            <div key={date} style={{ marginBottom: '24px' }}>
              <div style={{ 
                position: 'sticky', 
                top: 0, 
                background: 'var(--bg-color-secondary)', 
                padding: '8px 12px', 
                borderRadius: '8px', 
                marginBottom: '12px',
                borderLeft: '4px solid var(--accent-color)',
                fontSize: '0.9rem',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {formatHeaderDate(date)}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {grouped[date].map((task: Task) => (
                  <div 
                    key={task.id} 
                    onClick={() => onGoToDate(task.date)}
                    style={{ 
                      padding: '12px', 
                      background: 'rgba(255,255,255,0.03)', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <div>
                      <div style={{ fontWeight: '500', color: task.completed ? 'var(--success-color)' : 'var(--text-primary)' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        🕒 {task.time}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)' }}>
                      {task.completed ? '✅ Completada' : (task.status === 'cancelled_with_reason' ? '❌ Cancelada' : '⏳ Pasada')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
