import { usePresence, PresenceStatus } from '../../context/PresenceContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PresenceIndicatorProps {
  userId: string;
  lastSeenFromDB?: string | null;
  /** 'dot' = small dot only, 'badge' = dot + label, 'full' = dot + label + last seen */
  variant?: 'dot' | 'badge' | 'full';
  className?: string;
}

const STATUS_CONFIG: Record<PresenceStatus, { color: string; glow: string; label: string; dotClass: string }> = {
  online: {
    color: 'text-emerald-500',
    glow: 'shadow-[0_0_8px_#10b981]',
    label: 'En línea',
    dotClass: 'bg-emerald-500',
  },
  away: {
    color: 'text-amber-500',
    glow: 'shadow-[0_0_6px_#f59e0b]',
    label: 'En pausa',
    dotClass: 'bg-amber-500',
  },
  offline: {
    color: 'text-slate-500',
    glow: '',
    label: 'Offline',
    dotClass: 'bg-slate-600',
  },
};

export default function PresenceIndicator({ userId, lastSeenFromDB, variant = 'badge', className = '' }: PresenceIndicatorProps) {
  const { getUserStatus } = usePresence();
  const { status, lastSeen } = getUserStatus(userId, lastSeenFromDB);
  const config = STATUS_CONFIG[status];

  if (variant === 'dot') {
    return (
      <div
        className={`w-2.5 h-2.5 rounded-full ${config.dotClass} ${status === 'online' ? config.glow : ''} ${status === 'online' || status === 'away' ? 'animate-pulse' : ''} ${className}`}
        title={config.label}
      />
    );
  }

  const lastSeenLabel = status === 'offline' && lastSeen
    ? formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: es })
    : null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div
        className={`w-1.5 h-1.5 rounded-full ${config.dotClass} ${status === 'online' ? config.glow : ''} ${status !== 'offline' ? 'animate-pulse' : ''}`}
      />
      <span className={`text-[0.45rem] font-bold uppercase tracking-widest ${config.color}`}>
        {variant === 'full' && status === 'offline' && lastSeenLabel
          ? `Visto ${lastSeenLabel}`
          : config.label}
      </span>
    </div>
  );
}

/**
 * Overlay dot for avatar corners.
 * Place inside a `relative` container.
 */
export function PresenceAvatarDot({ userId, lastSeenFromDB, size = 'sm' }: { userId: string; lastSeenFromDB?: string | null; size?: 'sm' | 'md' }) {
  const { getUserStatus } = usePresence();
  const { status } = getUserStatus(userId, lastSeenFromDB);
  const config = STATUS_CONFIG[status];
  const sizeClass = size === 'md' ? 'w-3.5 h-3.5 border-[2.5px]' : 'w-3 h-3 border-2';

  return (
    <div
      className={`absolute bottom-0 right-0 ${sizeClass} rounded-full border-[#1a1622] ${config.dotClass} ${status === 'online' ? config.glow : ''} ${status !== 'offline' ? 'animate-pulse' : ''}`}
      title={config.label}
    />
  );
}
