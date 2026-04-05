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
                      padding: '20px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '16px', 
                      background: isBday ? 'rgba(212, 188, 143, 0.12)' : 'rgba(255,255,255,0.02)',
                      border: isBday ? '2px solid rgba(212, 188, 143, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: '24px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header: Avatar, Name and Role */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div 
                        onClick={() => { if (u.avatar && u.avatar.length > 10) setZoomedImg(u.avatar); }}
                        style={{ 
                          position: 'relative', 
                          width: '64px', 
                          height: '64px', 
                          borderRadius: '20px', 
                          overflow: 'hidden', 
                          border: `2px solid ${isBday ? 'var(--accent-color)' : 'rgba(255,255,255,0.15)'}`, 
                          flexShrink: 0, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          background: 'rgba(0,0,0,0.4)', 
                          fontSize: '24px', 
                          cursor: (u.avatar && u.avatar.length > 10) ? 'pointer' : 'default',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                          zIndex: 2
                        }}
                      >
                        {u.avatar && u.avatar.length > 10 ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.avatar || (u.full_name || u.username || 'U').charAt(0).toUpperCase())}
                        {isBday && (
                          <div style={{ position: 'absolute', top: -6, right: -6, fontSize: '18px', filter: 'drop-shadow(0 0 4px gold)', zIndex: 3 }} title="¡Es su cumpleaños!">🎂</div>
                        )}
                        {(isOnline || isAway) && (
                          <div 
                            title={isOnline ? 'En línea' : 'Ausente'} 
                            style={{ 
                              position: 'absolute', 
                              bottom: 2, 
                              right: 2, 
                              width: 12, 
                              height: 12, 
                              borderRadius: 6, 
                              background: isOnline ? '#10b981' : '#f59e0b', 
                              border: '2px solid #1a1622',
                              boxShadow: `0 0 8px ${isOnline ? '#10b981' : '#f59e0b'}`
                            }} 
                          />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px', opacity: 0.9 }}>
                          {u.role || 'Colaborador'}
                        </div>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', color: 'white', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                          {u.full_name || u.username}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginTop: '4px', letterSpacing: '0.05em' }}>
                          ID: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{u.cedula || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                    {/* Footer: Contacts and B-Day */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ opacity: 0.6 }}>📞</span> <span style={{ color: 'white', fontWeight: 600 }}>{u.phone || '—'}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ opacity: 0.6 }}>✉️</span> <span style={{ color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                        </div>
                      </div>

                      {u.birth_date && (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '12px' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                            Cumpleaños
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🎁 {format(parseISO(u.birth_date), 'dd/MMM', { locale: es }).toUpperCase()}
                          </div>
                        </div>
                      )}
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
