import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStorage } from '../lib/storageService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ImageZoomModal from './ImageZoomModal';

interface AppUser {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  cedula?: string;
  phone?: string;
  avatar?: string;
  birth_date?: string;
  role?: string;
  status?: 'Activo' | 'Segundo Plano' | 'Inactivo';
}

const ROLE_HIERARCHY: Record<string, number> = {
  'Administrador maestro': 1,
  'Director General (CEO)': 2,
  'Gestor Administrativo': 3,
  'Analista Contable': 4,
  'Supervisora Puntos de Venta': 5,
  'Consultora de Ventas': 6,
  'Colaborador': 7
};

function getRoleWeight(role?: string) {
  return ROLE_HIERARCHY[role || 'Colaborador'] || 99;
}

export default function UserDirectory({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
          const sorted = data.sort((a, b) => {
            const weightA = getRoleWeight(a.role);
            const weightB = getRoleWeight(b.role);
            if (weightA !== weightB) return weightA - weightB;
            return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '');
          });
          setUsers(sorted);
        }
      } else {
        const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
        const mapped = db.map((u: any) => ({
            ...u,
            full_name: u.user_metadata?.fullName || u.full_name
        }));
        const sorted = mapped.sort((a, b) => {
          const weightA = getRoleWeight(a.role);
          const weightB = getRoleWeight(b.role);
          if (weightA !== weightB) return weightA - weightB;
          return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '');
        });
        setUsers(sorted);
      }
      setLoading(false);
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const weightA = getRoleWeight(a.role);
    const weightB = getRoleWeight(b.role);
    if (weightA !== weightB) return weightA - weightB;
    return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '');
  });

  const isBirthdayToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const birthday = parseISO(dateStr);
    const today = new Date();
    return birthday.getDate() === today.getDate() && birthday.getMonth() === today.getMonth();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>👥 Directorio de Personal</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <input 
          type="text" 
          placeholder="Buscar personal por nombre, usuario o rol..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', marginBottom: '20px', outline: 'none' }}
        />

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>Sincronizando personal...</p> : (
            filteredUsers.length === 0 ? <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>No se encontraron resultados.</p> : (
              filteredUsers.map(u => {
                const isBday = isBirthdayToday(u.birth_date);
                const isOnline = u.status === 'Activo';
                const isAway = u.status === 'Segundo Plano';

                return (
                  <div key={u.id} className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', background: isBday ? 'rgba(212, 188, 143, 0.1)' : 'rgba(255,255,255,0.02)' }}>
                    <div 
                      onClick={() => { if (u.avatar && u.avatar.length > 10) setZoomedImg(u.avatar); }}
                      style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '25px', overflow: 'hidden', border: `2px solid ${isBday ? 'var(--accent-color)' : 'var(--glass-border)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', fontSize: '24px', cursor: (u.avatar && u.avatar.length > 10) ? 'pointer' : 'default' }}
                    >
                      {u.avatar && u.avatar.length > 10 ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.avatar || (u.full_name || u.username || 'U').charAt(0).toUpperCase())}
                      {isBday && (
                        <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', fontSize: '18px' }} title="¡Cumpleaños!">👑</div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {u.full_name || u.username}
                        <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>@{u.username}</span>
                        {(isOnline || isAway) && (
                          <div title={isOnline ? 'En línea' : 'Sesión activa (Segundo plano)'} style={{ width: 8, height: 8, borderRadius: 4, background: isOnline ? 'var(--success-color)' : 'var(--warning-color)', boxShadow: `0 0 5px ${isOnline ? 'var(--success-color)' : 'var(--warning-color)'}` }} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600, marginBottom: '4px' }}>{u.role || 'Colaborador'}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <div>🆔 {u.cedula || '—'}</div>
                        <div>📞 {u.phone || '—'}</div>
                        <div style={{ gridColumn: 'span 2' }}>✉️ {u.email}</div>
                        <div style={{ gridColumn: 'span 2' }}>🎂 {u.birth_date ? format(parseISO(u.birth_date), 'dd MMMM', { locale: es }) : 'No registrada'}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
        {zoomedImg && <ImageZoomModal src={zoomedImg} onClose={() => setZoomedImg(null)} />}
      </div>
    </div>
  );
}
