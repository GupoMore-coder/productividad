import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Archive, ClipboardList, Users, Check } from 'lucide-react';

import { useOrders, ServiceOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import CreateOrderModal from '../components/CreateOrderModal';
import OrderStatusModal from '../components/OrderStatusModal';
import { OrderCard } from '../components/orders/OrderCard';
import { OrderFilters } from '../components/orders/OrderFilters';
import { OrderCardSkeleton, Skeleton } from '../components/ui/Skeleton';
import { triggerHaptic } from '../utils/haptics';
import { usePageTitle } from '../hooks/usePageTitle';
import { QuoteExpirationAlert } from '../components/QuoteExpirationAlert';
import ImageZoomModal from '../components/ImageZoomModal';

export default function Orders() {
  const { user } = useAuth();
  const { 
    orders, 
    loading, 
    updateOrder, 
    deleteOrderMaster, 
    downloadOrderPdf, 
    reactivateOrder, 
    promoteDemoOrder,
    registerDeposit,
    archivedOrders,
    getQuoteSequenceLabel,
    getOrderSequenceLabel,
    convertQuoteToOrder,
    extendQuote,
    archiveExpiredQuote
  } = useOrders();

  usePageTitle('Gestión de Órdenes');


  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | undefined>(undefined);
  const [filter, setFilter] = useState<'activas' | 'inactivas'>('activas');
  const [zoomedGallery, setZoomedGallery] = useState<{ photos: string[], index: number } | null>(null);

  // Quote expiration alert state
  const [expiringQuoteQueue, setExpiringQuoteQueue] = useState<ServiceOrder[]>([]);
  const [autoExpiredQueue, setAutoExpiredQueue] = useState<ServiceOrder[]>([]);
  const processedExpiredRef = useRef<Set<string>>(new Set());

  // ── Multi-user Analysis State (Master Admin Only) ──
  const [analysisUserIds, setAnalysisUserIds] = useState<string[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      setAnalysisUserIds([user.id]);
    }
    
    const fetchProfiles = async () => {
      // Robust role check: Master Admin or CEO can access the selection panel
      const isMasterAdmin = user?.isMaster || user?.role === 'Administrador maestro' || user?.role === 'Director General (CEO)';
      
      if (isMasterAdmin) {
        if (isSupabaseConfigured) {
          try {
            const { data, error } = await supabase.from('profiles').select('*').order('username');
            if (error) throw error;
            if (data && data.length > 0) {
              setAllProfiles(data);
            } else {
              setAllProfiles([{ id: user.id, username: user.username, full_name: user.full_name, avatar: user.avatar }]);
            }
          } catch (err) {
            console.error('Error loading profiles for analysis:', err);
            setAllProfiles([{ id: user.id, username: user.username, full_name: user.full_name, avatar: user.avatar }]);
          }
        } else {
          // Local/Demo Mode fallback
          try {
            const db = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
            if (db.length > 0) {
              setAllProfiles(db.map((u: any) => ({ 
                id: u.id, 
                username: u.username, 
                full_name: u.full_name || u.user_metadata?.fullName,
                avatar: u.avatar 
              })));
            } else {
              setAllProfiles([{ id: user.id, username: user.username, full_name: user.full_name, avatar: user.avatar }]);
            }
          } catch (e) {
            setAllProfiles([{ id: user.id, username: user.username, full_name: user.full_name, avatar: user.avatar }]);
          }
        }
      } else if (user) {
        setAllProfiles([{ id: user.id, username: user.username, full_name: user.full_name, avatar: user.avatar }]);
      }
    };
    fetchProfiles();
  }, [user]);

  // Personal Stats Calculation
  const myStats = useMemo(() => {
    // Analysis group: if empty (safety check), fallback to current user
    const targets = analysisUserIds.length > 0 ? analysisUserIds : [user?.id];
    
    // Analysis must strictly be based on the initial creator of the order
    const myOrders = orders.filter(o => targets.includes(o.createdBy || ''));
    
    const total = myOrders.length;
    const completed = myOrders.filter(o => o.status === 'completada').length;
    const pending = myOrders.filter(o => ['recibida', 'en_proceso', 'pendiente_entrega'].includes(o.status)).length;
    const totalValue = myOrders.reduce((acc, current) => acc + (current.totalCost || 0), 0);
    
    // Efficiency: completed / total. Cancellations remain in total, effectively lowering efficiency as requested.
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, pending, totalValue, efficiency };
  }, [orders, user?.id, analysisUserIds]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [docType, setDocType] = useState<'todas' | 'ordenes' | 'cotizaciones'>('todas');

  // Status Modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetOrderStatus, setTargetOrderStatus] = useState<'completada' | 'cancelada' | null>(null);
  const [targetOrder, setTargetOrder] = useState<ServiceOrder | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  // Listen for global '+' button event
  useEffect(() => {
    const handleOpen = () => {
      setShowCreateModal(true);
      (window as any).__activeModal = 'order';
    };
    const handleForceClose = () => {
      setShowCreateModal(false);
      setEditingOrder(undefined);
      (window as any).__activeModal = undefined;
    };
    const handleUpdateField = (e: any) => {
      const { id, fields } = e.detail;
      updateOrder(id, fields);
    };
    const handleZoom = (e: any) => setZoomedGallery(e.detail);
    window.addEventListener('open-create-order', handleOpen);
    window.addEventListener('force-close-modals', handleForceClose);
    window.addEventListener('update-order-field', handleUpdateField);
    window.addEventListener('zoom-image', handleZoom);
    return () => {
      window.removeEventListener('open-create-order', handleOpen);
      window.removeEventListener('force-close-modals', handleForceClose);
      window.removeEventListener('update-order-field', handleUpdateField);
      window.removeEventListener('zoom-image', handleZoom);
    };
  }, []);

  // ── Quote expiration detector (runs every 60s) ──
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const userQuotes = orders.filter(
        o => o.recordType === 'cotizacion'
          && (o.status === 'recibida' || o.status === 'en_proceso')
          && o.createdBy === user?.id
      );

      const expired10: ServiceOrder[] = [];
      const expired15: ServiceOrder[] = [];

      for (const q of userQuotes) {
        if (!q.quoteExpiresAt) continue;
        const key = q.id;
        if (processedExpiredRef.current.has(key)) continue;

        const expiresMs = new Date(q.quoteExpiresAt).getTime();
        if (now >= expiresMs) {
          if ((q.quoteExtendedDays || 0) >= 5) {
            // 15-day auto-archive
            expired15.push(q);
            processedExpiredRef.current.add(key);
            archiveExpiredQuote(q.id).catch(console.error);
          } else {
            // 10-day: prompt user
            expired10.push(q);
            processedExpiredRef.current.add(key);
          }
        }
      }

      if (expired10.length > 0) setExpiringQuoteQueue(prev => [...prev, ...expired10]);
      if (expired15.length > 0) setAutoExpiredQueue(prev => [...prev, ...expired15]);
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, user?.id]);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Date range filter
      if (startDate && new Date(o.createdAt) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(o.createdAt) > end) return false;
      }
      
      // Document Type Filter
      if (docType === 'ordenes' && o.recordType === 'cotizacion') return false;
      if (docType === 'cotizaciones' && o.recordType !== 'cotizacion') return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          o.id.toLowerCase().includes(query) ||
          o.customerName.toLowerCase().includes(query) ||
          o.responsible.toLowerCase().includes(query) ||
          (o.notes && o.notes.toLowerCase().includes(query)) ||
          o.services.some(s => s.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [orders, searchQuery, startDate, endDate, docType]);

  const activeOrders = useMemo(() => 
    filteredOrders.filter(o => 
      ['recibida', 'en_proceso', 'pendiente_entrega'].includes(o.status) || 
      (o.status === 'vencida' && !o.cancelReason)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [filteredOrders]);

  const inactiveOrders = useMemo(() => 
    filteredOrders.filter(o => 
      ['completada', 'cancelada'].includes(o.status) || 
      (o.status === 'vencida' && o.cancelReason)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [filteredOrders]);

  const displayList = filter === 'activas' ? activeOrders : inactiveOrders;

  // Handlers
  const handleStatusRequest = (id: string, newStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    if (newStatus === 'completada' || newStatus === 'cancelada') {
      setTargetOrder(order);
      setTargetOrderStatus(newStatus as any);
      setStatusModalOpen(true);
    } else {
      updateOrder(id, { status: newStatus as any });
    }
  };

  const confirmStatusChange = async (reason?: string) => {
    if (!targetOrder || !targetOrderStatus) return;
    await updateOrder(targetOrder.id, {
      status: targetOrderStatus,
      cancelReason: reason || undefined
    });
    setStatusModalOpen(false);
  };

  const handleObsAdd = (id: string, obs: string) => {
    updateOrder(id, { newObservation: obs });
  };

  const handleEdit = (order: ServiceOrder) => {
    // Restricted editing logic can be added here if needed, but CreateOrderModal already handles field locking
    setEditingOrder(order);
    setShowCreateModal(true);
  };

  const handleReactivateAttempt = async (orderId: string) => {
    if (user?.isMaster || user?.role === 'Director General (CEO)') {
      await reactivateOrder(orderId);
      triggerHaptic('success');
    } else if (user?.isSupervisor || user?.role === 'Gestor Administrativo') {
      // Create Approval Request
      const order = orders.find(o => o.id === orderId);
      window.dispatchEvent(new CustomEvent('open-approval-request', { 
        detail: { 
          type: 'reactivacion_orden', 
          source_id: orderId,
          details: { customerName: order?.customerName, totalCost: order?.totalCost }
        } 
      }));
    } else {
      triggerHaptic('error');
      // Toast/Alert: No tienes permisos para reactivar
    }
  };

  // PDF logic (Server-side Phase 4)
  const handleDownloadPdf = async (order: ServiceOrder) => {
    setIsGeneratingPdf(order.id);
    try {
      await downloadOrderPdf(order.id);
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-32 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div className="flex items-center gap-3">
          <Skeleton width={48} height={48} className="rounded-2xl" />
          <div className="space-y-2">
            <Skeleton width={200} height={28} />
            <Skeleton width={150} height={14} />
          </div>
        </div>
        <Skeleton width={140} height={44} className="rounded-2xl" />
      </header>

      <div className="flex gap-2 mb-8">
        <Skeleton width={100} height={40} className="rounded-xl" />
        <Skeleton width={100} height={40} className="rounded-xl" />
      </div>

      <div className="space-y-6">
        <OrderCardSkeleton />
        <OrderCardSkeleton />
        <OrderCardSkeleton />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-32 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <ClipboardList className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Órdenes de Servicio</h1>
            <p className="text-sm text-slate-400 font-light mt-0.5">Control técnico y flujo financiero</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => { triggerHaptic('light'); setShowPerformanceModal(true); }}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 shadow-xl group"
          >
            <ClipboardList className="text-purple-400" size={18} />
            Mi Rendimiento
          </button>
          <button 
            onClick={() => { setEditingOrder(undefined); setShowCreateModal(true); }}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-slate-900 px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-purple-500/20 group"
          >
            <Plus className="group-hover:rotate-90 transition-transform duration-300" size={18} />
            Nueva Orden
          </button>
        </div>
      </header>

      {/* Performance Modal */}
      <AnimatePresence>
        {showPerformanceModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPerformanceModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-[#1a1622] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                   <div>
                      <h3 className="text-xl font-black text-white tracking-tight">
                        {analysisUserIds.length > 1 ? 'Análisis de Rendimiento Grupal' : (analysisUserIds[0] === user?.id ? 'Mi Rendimiento Personal' : 'Análisis de Rendimiento')}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Análisis de Eficacia Operativa</p>
                   </div>
                   <button onClick={() => setShowPerformanceModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-slate-500"><Plus className="rotate-45" size={24} /></button>
                </div>

                {/* Master Admin User Selector */}
                {(user?.isMaster || user?.role === 'Administrador maestro') && (
                  <div className="mb-8 p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                       <Users className="text-purple-400" size={12} />
                       <span className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest">Selector de Análisis (Master)</span>
                       <span className="ml-auto text-[0.55rem] font-bold text-slate-600 italic">Análisis aggregate</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {allProfiles.map(profile => {
                         const isSelected = analysisUserIds.includes(profile.id);
                         return (
                           <button
                             key={profile.id}
                             onClick={() => {
                               triggerHaptic('light');
                               setAnalysisUserIds(prev => 
                                 prev.includes(profile.id) 
                                   ? (prev.length > 1 ? prev.filter(id => id !== profile.id) : prev) 
                                   : [...prev, profile.id]
                               );
                             }}
                             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[0.6rem] font-bold transition-all ${isSelected ? 'bg-purple-500/20 border-purple-500/40 text-white shadow-lg shadow-purple-500/10' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                           >
                             <div className="w-5 h-5 rounded-md border border-purple-500/20 flex items-center justify-center text-[0.45rem] overflow-hidden">
                               {profile.avatar && profile.avatar.length > 10 ? <img src={profile.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800 text-white font-black">{(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}</div>}
                             </div>
                             <span>@{profile.username}</span>
                             {isSelected && <Check size={10} className="ml-0.5" />}
                           </button>
                         );
                       })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                      <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Órdenes Propias</div>
                      <div className="text-2xl font-black text-white leading-none">{myStats.total}</div>
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                      <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Eficacia</div>
                      <div className="text-2xl font-black text-emerald-400 leading-none">{myStats.efficiency}%</div>
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                      <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Total Ventas</div>
                      <div className="text-2xl font-black text-purple-400 leading-none">${myStats.totalValue.toLocaleString()}</div>
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                      <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Pendientes</div>
                      <div className="text-2xl font-black text-amber-500 leading-none">{myStats.pending}</div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">PROGRESO DE COMPLETADO</span>
                      <span className="text-white">{myStats.completed}/{myStats.total}</span>
                   </div>
                   <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${myStats.efficiency}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
                      />
                   </div>
                </div>

                <div className="mt-10 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-center">
                   <p className="text-[0.65rem] font-black text-purple-400 uppercase tracking-[0.2em]">
                     {analysisUserIds.length > 1 
                       ? 'Métricas de Equipo Consolidadas' 
                       : (analysisUserIds[0] === user?.id 
                           ? `Sigue así, @${user?.full_name || user?.username || 'Usuario'}` 
                           : `Analizando a @${allProfiles.find(p => p.id === analysisUserIds[0])?.username || 'Usuario'}`)}
                   </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filters & Toggles */}
      <OrderFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        filter={filter}
        setFilter={setFilter}
        activeCount={activeOrders.length}
        inactiveCount={inactiveOrders.length}
        docType={docType}
        setDocType={setDocType}
      />

      {/* Orders List */}
      <div className="space-y-6 min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {displayList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl"
            >
              <Archive className="mb-4 opacity-20" size={48} />
              <p className="text-sm font-medium">No se encontraron órdenes</p>
            </motion.div>
          ) : (
            displayList.map(order => (
              <OrderCard 
                key={order.id}
                order={order}
                onStatusChange={handleStatusRequest}
                onEdit={handleEdit}
                onDownloadPdf={handleDownloadPdf}
                onAddObservation={handleObsAdd}
                onRegisterDeposit={registerDeposit}
                onReactivate={() => handleReactivateAttempt(order.id)}
                onPromote={() => {
                  if (order.recordType === 'cotizacion') convertQuoteToOrder(order.id);
                  else if (order.isTest) promoteDemoOrder(order.id);
                }}
                onDelete={deleteOrderMaster}
                onExtendQuote={extendQuote}
                sequenceLabel={order.recordType === 'cotizacion' ? getQuoteSequenceLabel(order.id) : getOrderSequenceLabel(order.id)}
                isOverdue={new Date(order.deliveryDate) < new Date() && filter === 'activas' && order.recordType !== 'cotizacion'}
                isGenerating={isGeneratingPdf === order.id}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Archived Section (Persistent Storage) */}
      {archivedOrders.length > 0 && (
        <section className="mt-20 border-t border-white/5 pt-12">
          <div className="flex items-center gap-3 mb-6">
             <Archive className="text-slate-500" size={20} />
             <h2 className="text-lg font-bold text-slate-400 tracking-tight">Historial Archivado (30D+)</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {archivedOrders.map(record => (
              <div key={record.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-black text-slate-500 tracking-widest">{record.id}</span>
                  <span className="text-[0.65rem] text-slate-600 uppercase font-bold">Archivado {format(new Date(record.archivedAt), 'dd/MM/yyyy')}</span>
                </div>
                <div className="text-[0.75rem] text-slate-400 font-mono leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                  {record.summary}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <CreateOrderModal 
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingOrder(undefined); (window as any).__activeModal = undefined; }}
        initialOrder={editingOrder}
      />

      <OrderStatusModal 
        isOpen={statusModalOpen}
        onClose={() => { setStatusModalOpen(false); setTargetOrder(null); setTargetOrderStatus(null); }}
        order={targetOrder}
        targetStatus={targetOrderStatus}
        onConfirm={confirmStatusChange}
      />

      {/* ── Quote Expiration Alert Queue (10-day: user decision required) ── */}
      {expiringQuoteQueue.length > 0 && (
        <QuoteExpirationAlert
          quote={expiringQuoteQueue[0]}
          onConvert={convertQuoteToOrder}
          onExtend={extendQuote}
          onArchive={archiveExpiredQuote}
          onDismiss={() => setExpiringQuoteQueue(prev => prev.slice(1))}
          isAutoExpired={false}
        />
      )}

      {/* ── Auto-Expired Notification Queue (15-day: already archived) ── */}
      {autoExpiredQueue.length > 0 && (
        <QuoteExpirationAlert
          quote={autoExpiredQueue[0]}
          onConvert={convertQuoteToOrder}
          onExtend={extendQuote}
          onArchive={archiveExpiredQuote}
          onDismiss={() => setAutoExpiredQueue(prev => prev.slice(1))}
          isAutoExpired={true}
        />
      )}

      {zoomedGallery && (
        <ImageZoomModal 
          photos={zoomedGallery.photos} 
          initialIndex={zoomedGallery.index} 
          onClose={() => setZoomedGallery(null)} 
        />
      )}
    </div>
  );
}
