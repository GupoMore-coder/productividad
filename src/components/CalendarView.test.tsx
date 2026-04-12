import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalendarView from '@/components/CalendarView';
import { es } from 'date-fns/locale';
import { format, addMonths } from 'date-fns';

describe('CalendarView Component', () => {
  const selectedDate = new Date(2026, 3, 10); // April 10, 2026
  const onSelectDate = vi.fn();

  it('renders correctly in strip view by default', () => {
    render(<CalendarView selectedDate={selectedDate} onSelectDate={onSelectDate} />);
    expect(screen.getByText(/Abril 2026/i)).toBeInTheDocument();
    // Check if some days of the strip are present
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('switches to month view and shows correct month title', () => {
    render(<CalendarView selectedDate={selectedDate} onSelectDate={onSelectDate} />);
    
    const viewBtn = screen.getByText(/Mes/i);
    fireEvent.click(viewBtn);
    
    expect(screen.getByText(/Tira/i)).toBeInTheDocument();
    expect(screen.getByText(/Abril 2026/i)).toBeInTheDocument();
  });

  it('navigates to next month and updates title', () => {
    render(<CalendarView selectedDate={selectedDate} onSelectDate={onSelectDate} />);
    
    // Switch to month view first
    fireEvent.click(screen.getByText(/Mes/i));
    
    const nextBtn = screen.getByTitle(/Siguiente Mes/i);
    fireEvent.click(nextBtn);
    
    // onSelectDate should have been called with May
    expect(onSelectDate).toHaveBeenCalled();
    const callDate = onSelectDate.mock.calls[0][0];
    expect(format(callDate, 'MMMM', { locale: es })).toBe('mayo');
  });

  it('maintains consistent header title in month view', () => {
     const { rerender } = render(<CalendarView selectedDate={selectedDate} onSelectDate={onSelectDate} />);
     fireEvent.click(screen.getByText(/Mes/i));
     
     expect(screen.getByText(/Abril 2026/i)).toBeInTheDocument();
     
     // Simulate prop update from parent as if onSelectDate was handled
     const nextMonth = addMonths(selectedDate, 1);
     rerender(<CalendarView selectedDate={nextMonth} onSelectDate={onSelectDate} />);
     
     expect(screen.getByText(/Mayo 2026/i)).toBeInTheDocument();
  });
});
