import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrderHistoryEntry } from '../../context/OrderContext';

interface OrderTimelineProps {
  history: OrderHistoryEntry[];
}

const historyIcons: Record<string, string> = {
  creacion: '✨',
  cambio_estado: '🔄',
  financiero: '💰',
  observacion: '💬',
  vencimiento: '⚠️',
  modificacion: '🛠️'
};

export function OrderTimeline({ history }: OrderTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-500">
        No hay registros históricos aún.
      </div>
    );
  }

  // Slice(0, 100) or limit if needed, then reverse to show latest first
  const sortedHistory = [...history].reverse();

  return (
    <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
      {sortedHistory.map((entry) => (
        <div key={entry.id} className="flex gap-4 group">
          <div className="z-10 w-6 h-6 flex items-center justify-center bg-slate-900 border border-white/10 rounded-full text-[10px] group-hover:border-purple-500/50 transition-colors">
            {historyIcons[entry.type] || '📌'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[0.7rem] font-bold text-purple-400/90 group-hover:text-purple-400 transition-colors">
                {entry.userName}
              </span>
              <span className="text-[0.6rem] text-slate-500">
                {format(new Date(entry.timestamp), 'dd MMM, HH:mm', { locale: es })}
              </span>
            </div>
            <p className="text-[0.8rem] text-slate-300 leading-relaxed font-light">
              {entry.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
