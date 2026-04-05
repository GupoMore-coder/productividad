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
                  <div 
                    key={u.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '12px 16px', 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center', 
                      background: isBday ? 'rgba(212, 188, 143, 0.08)' : 'rgba(255,255,255,0.01)',
                      border: isBday ? '1px solid rgba(212, 188, 143, 0.3)' : '1px solid var(--glass-border)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <div 
                      onClick={() => { if (u.avatar && u.avatar.length > 10) setZoomedImg(u.avatar); }}
                      style={{ 
                        position: 'relative', 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '14px', 
                        overflow: 'hidden', 
                        border: `2px solid ${isBday ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'}`, 
                        flexShrink: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        background: 'rgba(0,0,0,0.3)', 
                        fontSize: '18px', 
                        cursor: (u.avatar && u.avatar.length > 10) ? 'pointer' : 'default',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    >
                      {u.avatar && u.avatar.length > 10 ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.avatar || (u.full_name || u.username || 'U').charAt(0).toUpperCase())}
                      {isBday && (
                        <div style={{ position: 'absolute', top: -4, right: -4, fontSize: '12px', filter: 'drop-shadow(0 0 2px gold)' }} title="¡Es su cumpleaños!">🎂</div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u.full_name || u.username}
                          {(isOnline || isAway) && (
                            <div title={isOnline ? 'Activo' : 'Ausente'} style={{ width: 6, height: 6, borderRadius: 3, background: isOnline ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--accent-color)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{u.role || 'Colaborador'}</div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '12px', rowGap: '1px', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>ID: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{u.cedula || '—'}</span></div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>📞 <span style={{ color: 'rgba(255,255,255,0.7)' }}>{u.phone || '—'}</span></div>
                        
                        <div style={{ gridColumn: 'span 2', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          ✉️ <span style={{ color: 'rgba(255,255,255,0.6)' }}>{u.email}</span>
                        </div>
                        
                        {u.birth_date && (
                          <div style={{ gridColumn: 'span 2', fontSize: '0.65rem', color: 'var(--accent-color)', opacity: 0.8, fontWeight: 600 }}>
                            🎁 Celebra el {format(parseISO(u.birth_date), 'dd MMMM', { locale: es })}
                          </div>
                        )}
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
