import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  activities?: string[]; // Array of 'yyyy-MM-dd' strings
}

export default function CalendarView({ selectedDate, onSelectDate, activities = [] }: CalendarViewProps) {
  const [viewDate, setViewDate] = useState<Date>(selectedDate);
  
  useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  // v13: Increased to 14 days for better scroll experience
  const days = Array.from({ length: 14 }, (_, i) => addDays(subDays(viewDate, 7), i));

  const navigateWeek = (direction: 'prev' | 'next') => {
    triggerHaptic('light');
    const newView = direction === 'prev' ? subDays(viewDate, 14) : addDays(viewDate, 14);
    setViewDate(newView);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      triggerHaptic('medium');
      const d = new Date(e.target.value + 'T12:00:00');
      onSelectDate(d);
      setViewDate(d);
    }
  };

  const handleSelectDay = (day: Date) => {
    triggerHaptic('light');
    onSelectDate(day);
  };

  const goToToday = () => {
    triggerHaptic('medium');
    const today = new Date();
    onSelectDate(today);
    setViewDate(today);
  };

  return (
    <div className="mb-6 animate-fade-in select-none w-full overflow-visible">
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateWeek('prev')}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-purple-400 hover:bg-white/10 transition-colors active:scale-90"
            title="Quincena Anterior"
            aria-label="Ver quincena anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="relative group">
            <button 
              onClick={() => (document.getElementById('native-date-picker') as any)?.showPicker?.()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
              aria-label="Abrir selector de fecha"
            >
              <h3 className="text-lg font-bold text-white capitalize tracking-tight group-hover:text-purple-400 transition-colors">
                {format(viewDate, "MMMM yyyy", { locale: es })}
              </h3>
              <CalendarIcon size={16} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
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
            onClick={() => navigateWeek('next')}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-purple-400 hover:bg-white/10 transition-colors active:scale-90"
            title="Siguiente Quincena"
            aria-label="Ver siguiente quincena"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={goToToday}
          className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-all active:scale-95 shadow-lg shadow-purple-500/5"
        >
          Hoy
        </button>
      </div>

      {/* v13: Force scroll and snap for Android stability */}
      <div 
        className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x touch-pan-x overscroll-x-contain"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="flex gap-3 min-w-max pb-2">
          {days.map((day, idx) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const isSelected = dayKey === format(selectedDate, "yyyy-MM-dd");
            const isToday = dayKey === format(new Date(), "yyyy-MM-dd");
            const hasActivity = activities.includes(dayKey);

            return (
              <button 
                key={idx}
                onClick={() => handleSelectDay(day)}
                className={`
                  min-w-[65px] h-20 rounded-2xl flex flex-col items-center justify-center transition-all snap-center flex-shrink-0
                  ${isSelected 
                    ? 'bg-purple-500 text-slate-950 shadow-xl shadow-purple-500/20 scale-105 z-10 font-black' 
                    : 'bg-white/[0.03] border border-white/5 text-slate-400 hover:bg-white/[0.07] hover:border-white/10'}
                  ${isToday && !isSelected ? 'border-purple-500/50 border-dashed' : ''}
                `}
                aria-label={`Seleccionar ${format(day, "EEEE d 'de' MMMM", { locale: es })}`}
                aria-pressed={isSelected}
              >
                <span className={`text-[0.6rem] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-slate-900/70' : 'text-slate-500'}`}>
                  {format(day, "EEE", { locale: es })}
                </span>
                <span className="text-xl font-black tracking-tighter">
                  {format(day, "dd")}
                </span>
                {hasActivity && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-slate-900' : 'bg-purple-500 shadow-sm shadow-purple-500/50'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
