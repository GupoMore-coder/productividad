import { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import MonthGridView from './MonthGridView';

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  activityDetails?: { date: string; type: 'task' | 'order' | 'birthday' }[];
}

export default function CalendarView({ selectedDate, onSelectDate, activityDetails = [] }: CalendarViewProps) {
  const [viewDate, setViewDate] = useState<Date>(selectedDate);
  
  useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      triggerHaptic('medium');
      const [year, month, day] = e.target.value.split('-').map(Number);
      const d = new Date(year, month - 1, day, 12, 0, 0);
      onSelectDate(d);
      setViewDate(d);
    }
  };

  const goToToday = () => {
    triggerHaptic('medium');
    const today = new Date();
    onSelectDate(today);
    setViewDate(today);
  };

  const goPrevMonth = () => {
    triggerHaptic('light');
    onSelectDate(subMonths(selectedDate, 1));
  };

  const goNextMonth = () => {
    triggerHaptic('light');
    onSelectDate(addMonths(selectedDate, 1));
  };

  return (
    <div className="animate-fade-in select-none w-full overflow-hidden">
      {/* Header: < Mes Año 📅 >  HOY */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={goPrevMonth}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-purple-400 hover:bg-white/10 transition-all active:scale-90"
            title="Mes Anterior"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          <div className="relative group">
            <button 
              onClick={() => (document.getElementById('native-date-picker') as any)?.showPicker?.()}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              <h3 className="text-sm font-black text-white capitalize tracking-tight group-hover:text-purple-400 transition-colors whitespace-nowrap">
                {format(selectedDate, "MMMM yyyy", { locale: es })}
              </h3>
              <CalendarIcon size={12} className="text-slate-500 group-hover:text-purple-400 transition-colors shrink-0" />
            </button>
            <input 
              id="native-date-picker"
              type="date" 
              onChange={handleDatePickerChange}
              className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
              tabIndex={-1}
            />
          </div>

          <button 
            onClick={goNextMonth}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-purple-400 hover:bg-white/10 transition-all active:scale-90"
            title="Siguiente Mes"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        <button 
          onClick={goToToday}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[0.65rem] font-black uppercase tracking-[0.15em] hover:bg-white/10 transition-all active:scale-95"
        >
          Hoy
        </button>
      </div>

      {/* Month Grid (only view) */}
      <MonthGridView 
        selectedDate={selectedDate} 
        onSelectDate={onSelectDate} 
        activities={activityDetails}
      />
    </div>
  );
}
