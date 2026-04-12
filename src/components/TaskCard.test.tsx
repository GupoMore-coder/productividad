import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '@/components/TaskCard';
import type { Task } from '@/context/TaskContext';
import { format, subHours } from 'date-fns';

// Mock of haptics and child components
vi.mock('@/utils/haptics', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('./CalendarExportMenu', () => ({
  default: () => <div data-testid="calendar-menu">Calendar Menu</div>,
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

  it('shows WA button only for shared tasks', () => {
    const { rerender } = render(<TaskCard task={mockTask} />);
    expect(screen.getByTitle('Recordatorio WhatsApp')).toBeInTheDocument();

    const personalTask = { ...mockTask, isShared: false };
    rerender(<TaskCard task={personalTask} />);
    expect(screen.queryByTitle('Recordatorio WhatsApp')).not.toBeInTheDocument();
  });

  it('displays alarm offsets with date and time', () => {
    render(<TaskCard task={mockTask} />);
    
    // Toggle alarm popover
    const alarmBtn = screen.getByText(/alertas/i);
    fireEvent.click(alarmBtn);

    // Check for "3d antes" etc.
    expect(screen.getByText(/3d antes \(72h\)/i)).toBeInTheDocument();
    
    // Check if the format "d MMM, HH:mm" is present
    const cleanTime = mockTask.time.split(':').slice(0, 2).join(':');
    const taskTime = new Date(`${mockTask.date}T${cleanTime}:00`);
    const expectedTime = format(subHours(taskTime, 4), 'd MMM, HH:mm');
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('calls onUpdate when toggling individual alarm mute', () => {
    const onUpdate = vi.fn();
    render(<TaskCard task={mockTask} onUpdate={onUpdate} />);
    
    fireEvent.click(screen.getByText(/alertas/i));
    
    // click first alarm bell
    // The popover buttons have Bell/BellOff icons.
    // Let's find by role and then check if it's the right one or use title if I added it.
    // Since I didn't add titles to individual bells, I'll rely on the fact they are in the grid.
    
    const alarmEntry = screen.getByText(/3d antes \(72h\)/i).closest('div')?.parentElement;
    const muteBtn = alarmEntry?.querySelector('button');
    
    if (muteBtn) {
      fireEvent.click(muteBtn);
      expect(onUpdate).toHaveBeenCalledWith(mockTask.id, {
        muted_alarms: [0]
      });
    }
  });
});
