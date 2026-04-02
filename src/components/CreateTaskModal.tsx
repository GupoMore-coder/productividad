import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task } from './TaskCard';
import { useGroups } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
}

export default function CreateTaskModal({ isOpen, onClose, onSave }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [groupIds, setGroupIds] = useState<string[]>([]);

  const { groups, memberships } = useGroups();
  const { user } = useAuth();

  // Obtener solo los grupos donde el usuario está aprobado
  const myApprovedGroups = groups.filter(g => 
    memberships.some(m => m.groupId === g.id && m.userId === (user?.id || user?.email) && m.status === 'approved')
  );

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));
      setPriority('media');
      setGroupIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleGroup = (id: string) => {
    setGroupIds(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: Date.now().toString(),
      title,
      description,
      date,
      time,
      priority,
      status: 'accepted',
      isShared: groupIds.length > 0,
      groupId: groupIds[0] || undefined, // Fallback for legacy
      group_ids: groupIds 
    } as any);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-color-secondary)',
        borderTop: '1px solid var(--glass-border)',
        borderRadius: '24px 24px 0 0',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Nueva Actividad</h3>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Título</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Revisión de proyecto"
              required
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descripción (opcional)</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalles de la actividad..."
              rows={2}
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fecha</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  colorScheme: 'dark'
                }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hora</label>
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  colorScheme: 'dark'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prioridad</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['alta', 'media', 'baja'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p as any)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: priority === p 
                      ? `2px solid var(--${p === 'alta' ? 'danger' : p === 'media' ? 'warning' : 'success'}-color)` 
                      : '1px solid var(--glass-border)',
                    background: priority === p ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: 'var(--text-primary)',
                    textTransform: 'capitalize',
                    fontWeight: priority === p ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Group Selector */}
          {myApprovedGroups.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Asignar a Grupos (Sincronización compartida)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                {myApprovedGroups.map(g => {
                  const isSelected = groupIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroup(g.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                        background: isSelected ? 'var(--accent-glow)' : 'transparent',
                        color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '} {g.name}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                La tarea aparecerá en la agenda de todos los integrantes de los grupos seleccionados.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--accent-color)',
                color: '#000',
                fontWeight: 600,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              Guardar Tarea
            </button>
          </div>
        </form>
      </div>

      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
