import type { Task } from '../context/TaskContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WelcomeDailyModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalTasks: Task[];
  groupTasks: Task[];
  onMigrateToToday: (taskId: string) => void;
  onReschedule: (taskId: string, newDate: string) => void;
}

export default function WelcomeDailyModal({ isOpen, onClose, personalTasks, groupTasks, onMigrateToToday, onReschedule }: WelcomeDailyModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fadeIn 0.3s'
    }}>
      <div style={{
        background: 'var(--bg-color-secondary)', border: '1px solid var(--glass-border)',
        borderRadius: '24px', width: '100%', maxWidth: '600px', padding: '24px',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🌅</div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Resumen Matutino</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>

        {/* Notificaciones Relevantes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {groupTasks.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--warning-color)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👥 Tareas de Grupo Pendientes ({groupTasks.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupTasks.map(t => (
                  <div key={t.id} style={{ padding: '12px', background: 'rgba(210, 153, 34, 0.1)', border: '1px solid rgba(210, 153, 34, 0.3)', borderRadius: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Límite: {format(new Date(`${t.date}T${t.time}`), "dd MMM, HH:mm", { locale: es })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {personalTasks.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-color)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📌 Tus Actividades Vencidas ({personalTasks.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Estas tareas de días anteriores no fueron completadas. ¿Qué deseas hacer con ellas?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {personalTasks.map(t => (
                  <div key={t.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Fecha original: {t.date}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button 
                        onClick={() => onMigrateToToday(t.id)}
                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '8px', background: 'var(--accent-color)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      >
                        Mover a Hoy
                      </button>
                      <input 
                        type="date" 
                        onChange={(e) => {
                          if(e.target.value) onReschedule(t.id, e.target.value);
                        }}
                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '8px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupTasks.length === 0 && personalTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--success-color)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
              No tienes actividades vencidas. ¡Excelente trabajo!
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          style={{ width: '100%', marginTop: '32px', padding: '16px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
        >
          Continuar a la Agenda
        </button>
      </div>
    </div>
  );
}
