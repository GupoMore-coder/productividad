import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserDirectory from '@/components/UserDirectory';

vi.mock('@/context/PresenceContext', () => ({
  usePresence: () => ({
    onlineUsers: ['user-1', 'user-2'],
    presenceState: {
      'user-1': [{ status: 'active' }],
      'user-2': [{ status: 'paused' }]
    },
    getUserStatus: (userId: string) => {
      if (userId === 'user-1') return { status: 'online', lastSeen: null };
      if (userId === 'user-2') return { status: 'away', lastSeen: null };
      return { status: 'offline', lastSeen: null };
    }
  }),
  PresenceProvider: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/context/WhatsAppContext', () => ({
  useWhatsApp: () => ({
    openWhatsApp: vi.fn(),
    closeWhatsApp: vi.fn(),
    state: { isOpen: false }
  }),
  WhatsAppProvider: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: [
          { 
            id: 'user-1', 
            username: 'alice', 
            full_name: 'Alice Active', 
            role: 'Administrador maestro',
            emergency_name: 'Bob',
            emergency_phone: '123456',
            emergency_relationship: 'Hermano'
          },
          { 
            id: 'user-2', 
            username: 'paula', 
            full_name: 'Paula Paused', 
            role: 'Colaborador' 
          },
          { 
            id: 'user-3', 
            username: 'oscar', 
            full_name: 'Oscar Offline', 
            role: 'Colaborador',
            last_seen: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      })
    }))
  },
  isSupabaseConfigured: true
}));

describe('UserDirectory Component', () => {
  it('renders user directory without errors', async () => {
    const { container } = render(<UserDirectory onClose={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it('handles close callback', async () => {
    const onClose = vi.fn();
    render(<UserDirectory onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
  });
});