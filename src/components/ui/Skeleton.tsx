import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ className = '', width, height, circle }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: circle ? '50%' : 'var(--radius-md)',
  };

  return (
    <div 
      className={`animate-shimmer ${className}`} 
      style={style}
      aria-hidden="true"
    />
  );
}

// ── Common Layout Presets ────────────────────────────────────

export function TaskCardSkeleton() {
  return (
    <div className="glass-panel p-4 mb-4 opacity-50">
      <div className="flex gap-4">
        <Skeleton width={40} height={40} circle />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
         <Skeleton width={60} height={20} />
         <Skeleton width={80} height={20} />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="glass-panel p-5 mb-4 border-l-4 border-l-slate-700/30">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
           <Skeleton width={120} height={20} />
           <Skeleton width={180} height={14} />
        </div>
        <Skeleton width={80} height={24} className="rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
         <Skeleton width="100%" height={32} />
         <Skeleton width="100%" height={32} />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="glass-panel p-4">
          <Skeleton width={24} height={24} className="mb-2" />
          <Skeleton width="50%" height={24} className="mb-1" />
          <Skeleton width="30%" height={12} />
        </div>
      ))}
    </div>
  );
}
