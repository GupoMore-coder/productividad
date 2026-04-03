

interface OrderStatusPillProps {
  status: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  'recibida': { label: 'Recibida', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'en_proceso': { label: 'En Elaboración', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'pendiente_entrega': { label: 'Pte Entrega', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'completada': { label: 'Completada', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'cancelada': { label: 'Cancelada', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  'vencida': { label: '⚠️ Vencida', bg: 'bg-red-600/20', text: 'text-red-400', border: 'border-red-600/30' },
};

export function OrderStatusPill({ status }: OrderStatusPillProps) {
  const config = statusConfig[status] || { label: status, bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };

  return (
    <span className={`px-3 py-1 rounded-full text-[0.7rem] font-bold border ${config.bg} ${config.text} ${config.border} transition-all duration-300`}>
      {config.label}
    </span>
  );
}
