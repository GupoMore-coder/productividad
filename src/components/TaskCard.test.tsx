import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '@/components/TaskCard';
import type { Task } from '@/context/TaskContext';
import { format } from 'date-fns';

vi.mock('@/utils/haptics', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('./CalendarExportMenu', () => ({
  default: () => <div data-testid="calendar-menu">Calendar Menu</div>,
}));

vi.mock('@/components/WhatsAppButton', () => ({
  default: vi.fn(() => null),
}));

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  time: '12:00:00',
  date: format(new Date(), 'yyyy-MM-dd'),
  priority: 'alta',
  completed: false,
  isShared: true,
  status: 'accepted'
};

describe('TaskCard Component', () => {
  it('renders task title and description', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('displays task time', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText(/12:00/i)).toBeInTheDocument();
  });

  it('displays priority badge', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText(/alta/i)).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(<TaskCard task={mockTask} />);
    expect(container).toBeTruthy();
  });

  it('handles empty optional fields gracefully', () => {
    const minimalTask: Task = {
      id: '2',
      title: 'Minimal Task',
      time: '09:00',
      date: format(new Date(), 'yyyy-MM-dd'),
      priority: 'media',
      completed: false,
      isShared: false,
      status: 'pending_acceptance'
    };
    const { container } = render(<TaskCard task={minimalTask} />);
    expect(container).toBeTruthy();
  });
});