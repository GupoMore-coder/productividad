import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function CalendarView({ selectedDate, onSelectDate }: CalendarViewProps) {
  // viewDate determines which week is shown in the carousel
  const [viewDate, setViewDate] = useState<Date>(selectedDate);
  
  // Sync viewDate when selectedDate changes externally (e.g. "Ir a Hoy")
  useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  // Generate 7 days starting from viewDate's week start or centered
  // Let's center it: [v-3, v-2, v-1, v, v+1, v+2, v+3]
  const days = Array.from({ length: 7 }, (_, i) => addDays(subDays(viewDate, 3), i));

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newView = direction === 'prev' ? subDays(viewDate, 7) : addDays(viewDate, 7);
    setViewDate(newView);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const d = new Date(e.target.value + 'T12:00:00');
      onSelectDate(d);
      setViewDate(d);
    }
  };

  return (
    <div style={{ marginBottom: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigateWeek('prev')}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-color)', borderRadius: '8px', cursor: 'pointer', padding: '4px 8px', display: 'flex' }}
            title="Semana Anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          <div style={{ position: 'relative' }}>
            <h3 style={{ textTransform: 'capitalize', fontSize: '1.25rem', margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => (document.getElementById('native-date-picker') as any)?.showPicker?.()}>
              {format(viewDate, "MMMM yyyy", { locale: es })}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </h3>
            <input 
              id="native-date-picker"
              type="date" 
              onChange={handleDatePickerChange}
              style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', visibility: 'hidden' }}
            />
          </div>

          <button 
            onClick={() => navigateWeek('next')}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-color)', borderRadius: '8px', cursor: 'pointer', padding: '4px 8px', display: 'flex' }}
            title="Siguiente Semana"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <button 
          onClick={() => {
            const today = new Date();
            onSelectDate(today);
            setViewDate(today);
          }}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: '6px 12px', borderRadius: '10px' }}
        >
          Ir a Hoy
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {days.map((day, idx) => {
          const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div 
              key={idx}
              onClick={() => onSelectDate(day)}
              style={{ 
                minWidth: '60px', 
                height: '75px', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: isSelected ? 'var(--accent-color)' : 'var(--glass-bg)',
                color: isSelected ? 'var(--bg-color)' : 'var(--text-primary)',
                border: isToday && !isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6, marginBottom: '4px' }}>
                {format(day, "EEE", { locale: es })}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {format(day, "dd")}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  );
}
