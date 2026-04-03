import React from 'react';
import { Search, Calendar, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  filter: 'activas' | 'inactivas';
  setFilter: (val: 'activas' | 'inactivas') => void;
  activeCount: number;
  inactiveCount: number;
}

export function OrderFilters({
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  filter,
  setFilter,
  activeCount,
  inactiveCount,
}: OrderFiltersProps) {
  const [showDates, setShowDates] = React.useState(false);

  return (
    <div className="space-y-4 mb-8">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar orden, cliente, notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all backdrop-blur-md"
          />
        </div>
        <button
          onClick={() => setShowDates(!showDates)}
          className={`p-3.5 rounded-2xl border transition-all backdrop-blur-md ${showDates ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-slate-900/50 border-white/10 text-slate-500 hover:text-slate-300'}`}
        >
          <Calendar size={20} />
        </button>
      </div>

      {/* Date Filters Expandable */}
      {showDates && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="grid grid-cols-2 gap-3 p-4 bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="space-y-1.5">
            <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-bold ml-1">Desde</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white color-scheme-dark outline-none focus:ring-1 focus:ring-purple-500/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-bold ml-1">Hasta</label>
            <div className="flex gap-2">
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white color-scheme-dark outline-none focus:ring-1 focus:ring-purple-500/30"
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="bg-red-500/10 text-red-400 p-2 rounded-xl hover:bg-red-500/20 border border-red-500/20 transition-all"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Status Toggles */}
      <div className="flex p-1.5 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden">
        <button
          onClick={() => setFilter('activas')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-500 relative z-10 ${filter === 'activas' ? 'text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <span>Activas</span>
          <span className={`px-2 py-0.5 rounded-md text-[0.6rem] ${filter === 'activas' ? 'bg-black/20 text-slate-900' : 'bg-white/5 text-slate-600'}`}>
            {activeCount}
          </span>
        </button>
        <button
          onClick={() => setFilter('inactivas')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-500 relative z-10 ${filter === 'inactivas' ? 'text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <span>Historial</span>
          <span className={`px-2 py-0.5 rounded-md text-[0.6rem] ${filter === 'inactivas' ? 'bg-black/20 text-slate-900' : 'bg-white/5 text-slate-600'}`}>
            {inactiveCount}
          </span>
        </button>

        {/* Animated Selection Background */}
        <motion.div
          animate={{ x: filter === 'activas' ? 0 : '100%' }}
          className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-purple-400 rounded-xl"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
}
