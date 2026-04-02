import React, { useState, useEffect } from 'react';
import { Task } from './TaskCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpiredTeamTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (taskId: string, reason: string, decision: 'reprogramar' | 'terminar', newDate?: string) => void;
}

export default function ExpiredTeamTaskModal({ isOpen, task, onClose, onSubmit }: ExpiredTeamTaskModalProps) {
  const [reason, setReason] = useState('');
  const [decision, setDecision] = useState<'reprogramar' | 'terminar' | null>(null);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDecision(null);
      setNewDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !decision) return;
    onSubmit(task.id, reason, decision, decision === 'reprogramar' ? newDate : undefined);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fadeIn 0.3s'
    }}>
      <div style={{
        background: 'var(--bg-color)', border: '1px solid var(--danger-color)',
        borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px',
        boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--danger-color)', margin: '0 auto 16px' }}>
            ⚠️
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--danger-color)' }}>Incumplimiento de Plazo</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '0.9rem' }}>
            La tarea grupal <strong>"{task.title}"</strong> ha caducado sin haber sido completada por el equipo.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vencimiento original:</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{format(new Date(`${task.date}T${task.time}`), "EEEE, d 'de' MMMM, HH:mm", { locale: es })}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Justificación Obligatoria <span style={{ color: 'var(--danger-color)' }}>*</span></label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Como creador, debes registrar la razón por la cual el equipo no finalizó a tiempo.</p>
            <textarea 
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Ej. El cliente aplazó la reunión, falta de insumos..." required rows={3}
              style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Resolución</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" onClick={() => setDecision('reprogramar')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${decision === 'reprogramar' ? 'var(--accent-color)' : 'var(--glass-border)'}`, background: decision === 'reprogramar' ? 'var(--accent-glow)' : 'transparent', color: decision === 'reprogramar' ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', transition: '0.2s' }}
              >
                📅 Postponer
              </button>
              <button 
                type="button" onClick={() => setDecision('terminar')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${decision === 'terminar' ? 'var(--danger-color)' : 'var(--glass-border)'}`, background: decision === 'terminar' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: decision === 'terminar' ? 'var(--danger-color)' : 'var(--text-secondary)', cursor: 'pointer', transition: '0.2s' }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>

          {decision === 'reprogramar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nueva Fecha Propuesta</label>
              <input 
                type="date" required value={newDate} onChange={e => setNewDate(e.target.value)}
                style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', colorScheme: 'dark' }}
              />
            </div>
          )}

          <button 
            type="submit" disabled={!reason.trim() || !decision}
            style={{ marginTop: '8px', padding: '16px', borderRadius: '12px', background: (!reason.trim() || !decision) ? 'var(--glass-bg)' : 'var(--danger-color)', color: (!reason.trim() || !decision) ? 'var(--text-secondary)' : 'white', fontWeight: 'bold', border: 'none', cursor: (!reason.trim() || !decision) ? 'not-allowed' : 'pointer', transition: '0.3s' }}
          >
            Registrar Incumplimiento
          </button>
        </form>

      </div>
    </div>
  );
}
