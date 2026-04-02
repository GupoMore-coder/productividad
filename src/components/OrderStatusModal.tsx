import React, { useState, useEffect } from 'react';
import { ServiceOrder } from '../context/OrderContext';

interface OrderStatusModalProps {
  order: ServiceOrder | null;
  targetStatus: 'completada' | 'cancelada' | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export default function OrderStatusModal({ isOpen, onClose, order, targetStatus, onConfirm }: OrderStatusModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen || !order || !targetStatus) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetStatus === 'cancelada' && !reason.trim()) return;
    onConfirm(reason);
  };

  const isCancel = targetStatus === 'cancelada';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-color-secondary)',
        border: `1px solid ${isCancel ? 'var(--danger-color)' : 'var(--success-color)'}`,
        borderRadius: '24px', width: '90%', maxWidth: '400px',
        padding: '24px', boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '16px' }}>
          {isCancel ? (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger-color)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          )}
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 600 }}>
          {isCancel ? 'Cancelar Orden' : 'Completar Orden'}
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          ¿Estás seguro que deseas mover la orden <strong>{order.id}</strong> a {isCancel ? 'Cancelada' : 'Completada'}?<br/>
          Esta acción la volverá inactiva.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isCancel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
               <label style={{ fontSize: '0.85rem', color: 'var(--danger-color)' }}>Motivo de la cancelación *</label>
               <textarea 
                 value={reason} onChange={e => setReason(e.target.value)} required
                 placeholder="Ej. El cliente ya no la necesita..." rows={3}
                 style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--danger-color)', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical' }}
               />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              type="button" onClick={onClose}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Cerrar
            </button>
            <button 
              type="submit"
              disabled={isCancel && !reason.trim()}
              style={{
                 flex: 1, padding: '12px', borderRadius: '12px',
                 background: isCancel ? 'var(--danger-color)' : 'var(--success-color)',
                 color: isCancel ? 'white' : 'black', fontWeight: 600, border: 'none', cursor: (isCancel && !reason.trim()) ? 'not-allowed' : 'pointer', opacity: (isCancel && !reason.trim()) ? 0.5 : 1
              }}
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>

      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
