import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserDirectory from '@/components/UserDirectory';

// Mocks
vi.mock('@/context/PresenceContext', () => ({
  usePresence: () => ({
    onlineUsers: ['user-1', 'user-2'],
    presenceState: {
      'user-1': [{ status: 'active' }],
      'user-2': [{ status: 'paused' }]
    }
  }),
  PresenceProvider: ({ children }: any) => <div>{children}</div>
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
  it('renders users with correct connection status labels', async () => {
    render(<UserDirectory onClose={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Alice Active')).toBeInTheDocument();
    });

    expect(screen.getByText('ACTIVO')).toBeInTheDocument();
    expect(screen.getByText('EN PAUSA')).toBeInTheDocument();
    expect(screen.getByText(/Visto/i)).toBeInTheDocument(); // For user-3
  });

  it('expands emergency contact info on click', async () => {
    render(<UserDirectory onClose={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Alice Active')).toBeInTheDocument();
    });

    const toggleBtns = screen.getAllByText(/Emergencia/i);
    fireEvent.click(toggleBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Contacto:/i)).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('123456')).toBeInTheDocument();
    });
  });
});
