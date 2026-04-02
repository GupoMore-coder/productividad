import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStorage } from '../lib/storageService';
import { Task } from '../context/TaskContext';

interface AppUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  full_name?: string;
  is_super_admin: boolean;
  blocked: boolean;
  needs_setup: boolean;
  needs_approval?: boolean;
  cedula?: string;
  phone?: string;
  birth_date?: string;
  role?: string;
  avatar?: string;
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

// ── Admin Agenda Modal ───────────────────────────────────────────────
function AdminUserAgendaModal({ userId, username, onClose }: { userId: string; username: string; onClose: () => void }) {
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('tasks').select('*').eq('user_id', userId).order('date', { ascending: true });
        if (data) setUserTasks(data);
      } else {
        const allTasks = JSON.parse(localStorage.getItem('tasks_db') || '[]');
        setUserTasks(allTasks.filter((t: any) => t.userId === userId));
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Agenda de @{username}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <p>Cargando actividades...</p> : (
            userTasks.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Sin actividades agendadas.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {userTasks.map(t => (
                  <div key={t.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📅 {t.date} | 🕒 {t.time} | <strong>{t.completed ? '✅ Completada' : '⏳ Pendiente'}</strong></div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
        <div style={{ marginTop: '20px', padding: '12px', borderRadius: '8px', background: 'rgba(212,188,143,0.1)', color: 'var(--accent-color)', fontSize: '0.8rem', textAlign: 'center' }}>
          ⚠️ Vista de supervisión (Solo lectura).
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<{ userId: string; field: keyof AppUser } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AppUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuditUser, setSelectedAuditUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!user?.isSuperAdmin) navigate('/', { replace: true });
    loadUsers();
    loadNotifications();
  }, [user, navigate]);

  function loadNotifications() {
    const data = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    setNotifications(data.sort((a: any, b: any) => b.id - a.id));
  }

  async function loadUsers() {
    setLoading(true);
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data) {
        const sorted = data.sort((a, b) => {
          const weightA = getRoleWeight(a.role);
          const weightB = getRoleWeight(b.role);
          if (weightA !== weightB) return weightA - weightB;
          return (a.username || '').localeCompare(b.username || '');
        });
        setUsers(sorted);
      }
      if (error) console.error(error);
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const mapped = db.map((u: any) => ({ ...u, full_name: u.user_metadata?.fullName || u.full_name }));
      const sorted = mapped.sort((a, b) => {
        const weightA = getRoleWeight(a.role);
        const weightB = getRoleWeight(b.role);
        if (weightA !== weightB) return weightA - weightB;
        return (a.username || '').localeCompare(b.username || '');
      });
      setUsers(sorted);
    }
    setLoading(false);
  }

  const startEdit = (userId: string, field: keyof AppUser, currentValue: string) => {
    setEditingField({ userId, field });
    setEditValue(currentValue || '');
  };

  const commitEdit = async () => {
    if (!editingField) return;
    const { userId, field } = editingField;
    
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').update({ [field]: editValue }).eq('id', userId);
      if (error) alert(error.message);
      else loadUsers();
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const index = db.findIndex((u: any) => u.id === userId);
      if (index !== -1) {
        if (field === 'username') {
          const val = editValue.trim().toLowerCase();
          if (!/^[a-zA-Z]/.test(val)) {
            alert('El nombre de usuario debe iniciar obligatoriamente con una letra.');
            setEditingField(null);
            return;
          }
          db[index].username = val;
        }
        else if (field === 'full_name') db[index].user_metadata.fullName = editValue;
        else if (field === 'password') db[index].password = editValue;
        else (db[index] as any)[field] = editValue;
        await mockStorage.setItem('mock_users_db', db);
        loadUsers();
      }
    }
    setEditingField(null);
  };


  const deletePhoto = async (targetUser: AppUser) => {
    if (!confirm('¿Deseas eliminar la foto de perfil?')) return;
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ avatar: null }).eq('id', targetUser.id);
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const index = db.findIndex((u: any) => u.id === targetUser.id);
      if (index !== -1) {
        db[index].avatar = null;
        await mockStorage.setItem('mock_users_db', db);
      }
    }
    loadUsers();
  };

  const deleteUser = async (targetUser: AppUser) => {
    if (isSupabaseConfigured) {
      alert('Eliminación en Supabase requiere llamar a auth.admin.deleteUser.');
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const updated = db.filter((u: any) => u.id !== targetUser.id);
      await mockStorage.setItem('mock_users_db', updated);
      loadUsers();
    }
    setConfirmDelete(null);
  };

  const toggleBlock = async (targetUser: AppUser) => {
    if (targetUser.is_super_admin) return;
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ blocked: !targetUser.blocked }).eq('id', targetUser.id);
    } else {
      const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
      const index = db.findIndex((u: any) => u.id === targetUser.id);
      if (index !== -1) {
        db[index].blocked = !db[index].blocked;
        await mockStorage.setItem('mock_users_db', db);
      }
    }
    loadUsers();
  };

  const clearNotifications = () => {
      localStorage.removeItem('admin_notifications');
      setNotifications([]);
  };

  const filtered = users.filter(u =>
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const weightA = getRoleWeight(a.role);
    const weightB = getRoleWeight(b.role);
    if (weightA !== weightB) return weightA - weightB;
    return (a.username || '').localeCompare(b.username || '');
  });

  const TH = (label: string) => (
    <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' }}>{label}</th>
  );

  const EditableCell = ({ userId, field, value, type = 'text' }: { userId: string; field: keyof AppUser; value: string; type?: string }) => {
    const isEditing = editingField?.userId === userId && editingField?.field === field;
    return isEditing ? (
      <td style={{ padding: '8px 14px' }}>
        <input autoFocus type={type} value={editValue} onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingField(null); }}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--accent-color)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 8px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
        />
      </td>
    ) : (
      <td style={{ padding: '8px 14px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => startEdit(userId, field, value)}>
        <span style={{ borderBottom: '1px dashed var(--glass-border)' }}>{value || '—'}</span>
      </td>
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Sincronizando con base de datos...</div>;

  return (
    <div style={{ padding: '24px 16px 100px', maxWidth: 1200, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>👥 Gestión de Personal</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.88rem' }}>Panel de Control Total de Usuarios</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>← Volver</button>
      </div>

      {notifications.length > 0 && (
          <div style={{ marginBottom: 24, padding: 16, background: 'rgba(212, 188, 143, 0.05)', borderRadius: 16, border: '1px solid var(--accent-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-color)' }}>🔔 Notificaciones de Cambios</h3>
                  <button onClick={clearNotifications} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>Limpiar</button>
              </div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notifications.map(n => (
                      <div key={n.id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 4 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>@{n.user}</strong> | {n.details} <span style={{ float: 'right', fontSize: '0.7rem' }}>{n.timestamp.split('T')[1].substring(0, 5)}</span>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="🔍  Buscar por nombre, usuario, rol o correo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {TH('Avatar')}
              {TH('Usuario / ID')}
              {TH('Nombre')}
              {TH('Contacto')}
              {TH('Admin')}
              {TH('Bday')}
              {TH('Pass')}
              {TH('Acciones')}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, idx) => (
              <tr key={u.id} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: '1px solid var(--glass-border)', opacity: u.blocked ? 0.55 : 1 }}>
                <td style={{ padding: '8px 14px' }}>
                   <div onClick={() => deletePhoto(u)} title="Eliminar Foto" style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', fontSize: 20, cursor: 'pointer' }}>
                      {u.avatar && u.avatar.length > 10 ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.avatar || u.username.charAt(0).toUpperCase())}
                   </div>
                </td>
                <td style={{ padding: '8px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>@{u.username}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {u.cedula || '—'}</div>
                    <div style={{ fontSize: '0.7rem', color: u.blocked ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 700 }}>{u.blocked ? 'BLOQUEADO' : 'ACTIVO'}</div>
                </td>
                <EditableCell userId={u.id} field="full_name" value={u.full_name || ''} />
                <td style={{ padding: '8px 14px' }}>
                    <div style={{ fontSize: '0.85rem' }}>📞 {u.phone || '—'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                </td>
                <td style={{ padding: '8px 14px' }}>
                  <select 
                    value={u.role || (u.is_super_admin ? 'Administrador' : 'Colaborador')} 
                    onChange={async (e) => {
                        const val = e.target.value;
                        const isSuperValue = val === 'Administrador maestro';
                        if (isSupabaseConfigured) {
                            await supabase.from('profiles').update({ role: val, is_super_admin: isSuperValue }).eq('id', u.id);
                        } else {
                            const db = await mockStorage.getItem<any[]>('mock_users_db') || [];
                            const i = db.findIndex((x: any) => x.id === u.id);
                            if (i !== -1) {
                                db[i].role = val;
                                db[i].is_super_admin = isSuperValue;
                                await mockStorage.setItem('mock_users_db', db);
                            }
                        }
                        loadUsers();
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 8, padding: '4px', fontSize: '0.8rem' }}
                  >
                      <option style={{color:'black'}} value="Administrador maestro">Administrador maestro</option>
                      <option style={{color:'black'}} value="Director General (CEO)">Director General (CEO)</option>
                      <option style={{color:'black'}} value="Gestor Administrativo">Gestor Administrativo</option>
                      <option style={{color:'black'}} value="Supervisora Puntos de Venta">Supervisora Puntos de Venta</option>
                      <option style={{color:'black'}} value="Consultora de Ventas">Consultora de Ventas</option>
                      <option style={{color:'black'}} value="Analista Contable">Analista Contable</option>
                      <option style={{color:'black'}} value="Colaborador">Colaborador</option>
                  </select>
                </td>
                <EditableCell userId={u.id} field="birth_date" value={u.birth_date || ''} type="date" />
                <EditableCell userId={u.id} field="password" value={u.password || '******'} />
                <td style={{ padding: '8px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setSelectedAuditUser(u)} title="Ver Agenda" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'var(--accent-color)', cursor: 'pointer' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </button>
                    {!u.is_super_admin && (
                      <>
                        <button onClick={() => toggleBlock(u)} title={u.blocked ? "Activar" : "Bloquear"} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', color: u.blocked ? 'var(--success-color)' : 'var(--danger-color)', cursor: 'pointer' }}>
                          {u.blocked ? '🔓' : '🔒'}
                        </button>
                        <button onClick={() => setConfirmDelete(u)} title="Eliminar" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'var(--danger-color)', cursor: 'pointer' }}>
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAuditUser && (
        <AdminUserAgendaModal 
          userId={selectedAuditUser.id} 
          username={selectedAuditUser.username} 
          onClose={() => setSelectedAuditUser(null)} 
        />
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h3>Eliminar Usuario</h3>
            <p>¿Estás completamente seguro de eliminar a <strong>@{confirmDelete.username}</strong>? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => deleteUser(confirmDelete)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--danger-color)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Eliminar Definivamente</button>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Bajar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

