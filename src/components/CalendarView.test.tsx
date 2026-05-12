import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalendarView from '@/components/CalendarView';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

vi.mock('@/utils/haptics', () => ({
  triggerHaptic: vi.fn(),
}));

describe('CalendarView Component', () => {
  const selectedDate = new Date(2026, 3, 10); // April 10, 2026
  const onSelectDate = vi.fn();

  beforeEach(() => {
    onSelectDate.mockClear();
  });

  it('renders correctly with month title', () => {
    render(<CalendarView selectedDate={selectedDate} onSelectDate={onSelectDate} />);
    expect(screen.getByText(/abril 2026/i)).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<CalendarView selectedDate={selectedDate} onSelectDate={onSelectDate} />);
    
    expect(screen.getByTitle(/Mes Anterior/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Siguiente Mes/i)).toBeInTheDocument();
    expect(screen.getByText(/Hoy/i)).toBeInTheDocument();
  });

  it('calls onSelectDate with previous month when clicking prev button', () => {
    render(<CalendarView selectedDate={selectedDate} onSelectDate={onSelectDate} />);
    
    const prevBtn = screen.getByTitle(/Mes Anterior/i);
    fireEvent.click(prevBtn);
    
    expect(onSelectDate).toHaveBeenCalled();
    const callDate = onSelectDate.mock.calls[0][0];
    expect(format(callDate, 'MMMM', { locale: es })).toBe('marzo');
  });

  it('calls onSelectDate with next month when clicking next button', () => {
    render(<CalendarView selectedDate={selectedDate} onSelectDate={onSelectDate} />);
    
    const nextBtn = screen.getByTitle(/Siguiente Mes/i);
    fireEvent.click(nextBtn);
    
    expect(onSelectDate).toHaveBeenCalled();
    const callDate = onSelectDate.mock.calls[0][0];
    expect(format(callDate, 'MMMM', { locale: es })).toBe('mayo');
  });

  it('calls onSelectDate with today when clicking Today button', () => {
    render(<CalendarView selectedDate={selectedDate} onSelectDate={onSelectDate} />);
    
    const todayBtn = screen.getByText(/Hoy/i);
    fireEvent.click(todayBtn);
    
    expect(onSelectDate).toHaveBeenCalledWith(expect.any(Date));
  });
});