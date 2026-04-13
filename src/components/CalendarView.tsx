import { useState, useEffect } from 'react';
import { format, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import MonthGridView from './MonthGridView';

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  activityDetails?: { date: string; type: 'task' | 'order' | 'birthday' }[]; // Para la vista de mes
}

export default function CalendarView({ selectedDate, onSelectDate, activityDetails = [] }: CalendarViewProps) {
  const [viewDate, setViewDate] = useState<Date>(selectedDate);
  const [isMonthView, setIsMonthView] = useState(true);
  
  useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  const days = Array.from({ length: 14 }, (_, i) => addDays(subDays(viewDate, 7), i));

  const navigateAmount = (amount: number) => {
    triggerHaptic('light');
    const newView = addDays(viewDate, amount);
    setViewDate(newView);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      triggerHaptic('medium');
      const [year, month, day] = e.target.value.split('-').map(Number);
      const d = new Date(year, month - 1, day, 12, 0, 0);
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
    <div className="mb-6 animate-fade-in select-none w-full overflow-hidden">
      {/* Header with improved navigation controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 px-1">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <button 
            onClick={() => isMonthView ? onSelectDate(subMonths(selectedDate, 1)) : navigateAmount(-7)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-purple-400 hover:bg-white/10 transition-all active:scale-90 shadow-lg"
            title={isMonthView ? "Mes Anterior" : "Semana Anterior"}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          <div className="relative group flex-1 text-center">
            <button 
              onClick={() => (document.getElementById('native-date-picker') as any)?.showPicker?.()}
              className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-2xl hover:bg-white/5 transition-colors w-full"
            >
              <h3 className="text-sm sm:text-lg font-black text-white capitalize tracking-tighter group-hover:text-purple-400 transition-colors whitespace-nowrap">
                {format(isMonthView ? selectedDate : viewDate, "MMMM yyyy", { locale: es })}
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
            onClick={() => isMonthView ? onSelectDate(addMonths(selectedDate, 1)) : navigateAmount(7)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-purple-400 hover:bg-white/10 transition-all active:scale-90 shadow-lg"
            title={isMonthView ? "Siguiente Mes" : "Siguiente Semana"}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => { triggerHaptic('light'); setIsMonthView(!isMonthView); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-95 ${isMonthView ? 'bg-purple-500 text-slate-950 border-purple-400 font-black' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
          >
            {isMonthView ? <List size={14} /> : <LayoutGrid size={14} />}
            <span className="text-[0.65rem] uppercase tracking-widest font-black">{isMonthView ? 'Tira' : 'Grid'}</span>
          </button>
          <button 
            onClick={goToToday}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[0.65rem] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95"
          >
            Hoy
          </button>
        </div>
      </div>

      {isMonthView ? (
        <MonthGridView 
          selectedDate={selectedDate} 
          onSelectDate={onSelectDate} 
          activities={activityDetails}
        />
      ) : (
        /* Days Container optimized for Android/PWA horizontal motion */
        <div 
          className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory touch-pan-x overscroll-x-contain"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className="flex gap-3 min-w-max pb-2 md:pb-4">
            {days.map((day, idx) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const isSelected = dayKey === format(selectedDate, "yyyy-MM-dd");
              const isToday = dayKey === format(new Date(), "yyyy-MM-dd");
              const dayActivities = activityDetails.filter(a => a.date === dayKey);
              const hasBirthday = dayActivities.some(a => a.type === 'birthday');
              const hasOther = dayActivities.some(a => a.type !== 'birthday');

              return (
                <button 
                  key={idx}
                  onClick={() => handleSelectDay(day)}
                  className={`
                    min-w-[72px] h-20 md:h-28 rounded-3xl flex flex-col items-center justify-center transition-all snap-center flex-shrink-0 border-2
                    ${isSelected 
                      ? 'bg-purple-500 border-purple-400 text-slate-950 shadow-2xl shadow-purple-500/40 scale-105 z-10 font-black' 
                      : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/[0.08] hover:border-white/10'}
                    ${isToday && !isSelected ? 'border-purple-500/40 border-dashed bg-purple-500/5' : ''}
                  `}
                  aria-label={`Seleccionar ${format(day, "EEEE d 'de' MMMM", { locale: es })}`}
                  aria-pressed={isSelected}
                >
                  <span className={`text-[0.6rem] font-bold uppercase tracking-[0.15em] mb-1.5 ${isSelected ? 'text-slate-900/80' : 'text-slate-600'}`}>
                    {format(day, "EEE", { locale: es })}
                  </span>
                  <span className="text-2xl md:text-3xl font-black tracking-tighter">
                    {format(day, "dd")}
                  </span>
                  <div className="flex gap-1 mt-2">
                    {hasBirthday && (
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-900' : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} />
                    )}
                    {hasOther && (
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-900' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
