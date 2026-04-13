import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface MonthGridViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  activities: { date: string; type: 'task' | 'order' | 'birthday' }[];
}

export default function MonthGridView({ selectedDate, onSelectDate, activities }: MonthGridViewProps) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });


  return (
    <div className="p-2 sm:p-4 bg-slate-900/60 rounded-[28px] sm:rounded-[32px] border border-white/10 backdrop-blur-3xl animate-in zoom-in-95 duration-300 w-full overflow-hidden">

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="text-center text-[0.55rem] sm:text-[0.6rem] font-black text-slate-500 py-1.5 sm:py-2 uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {calendarDays.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayActivities = activities.filter(a => a.date === dayKey);

          return (
            <button
              key={idx}
              onClick={() => {
                triggerHaptic('light');
                onSelectDate(day);
              }}
              className={`
                relative h-14 sm:h-16 md:h-24 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border transition-all flex flex-col items-center justify-between
                ${isSelected 
                  ? 'bg-purple-600 border-purple-500 text-white ring-2 ring-purple-500/20 z-10' 
                  : isCurrentMonth 
                    ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10' 
                    : 'bg-transparent border-transparent text-slate-700 opacity-30'}
                ${isToday && !isSelected ? 'border-purple-500/40 text-purple-400' : ''}
              `}
            >
              <span className={`text-[0.65rem] sm:text-xs font-black ${isSelected ? 'text-white' : ''}`}>
                {format(day, 'd')}
              </span>
              
              <div className="flex flex-wrap gap-0.5 justify-center mb-0.5">
                {dayActivities.slice(0, 2).map((act, i) => (
                  <div 
                    key={i} 
                    className={`p-0.5 rounded-md ${
                      isSelected 
                        ? 'bg-white/20' 
                        : act.type === 'birthday' 
                          ? 'bg-amber-500/20 text-amber-400' 
                          : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {act.type === 'order' ? <ClipboardList size={7} /> : 
                     act.type === 'birthday' ? <span className="text-[7px]">🎂</span> :
                     <CheckCircle2 size={7} />}
                  </div>
                ))}
                {dayActivities.length > 2 && (
                  <div className="text-[0.45rem] font-black opacity-50">+{dayActivities.length - 2}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
