import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Archive, ClipboardList } from 'lucide-react';

import { useOrders, ServiceOrder } from '../context/OrderContext';
import CreateOrderModal from '../components/CreateOrderModal';
import OrderStatusModal from '../components/OrderStatusModal';
import { OrderCard } from '../components/orders/OrderCard';
import { OrderFilters } from '../components/orders/OrderFilters';
import { OrderCardSkeleton, Skeleton } from '../components/ui/Skeleton';

export default function Orders() {
  const { orders, updateOrder, archivedOrders, downloadOrderPdf, loading } = useOrders();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | undefined>(undefined);
  const [filter, setFilter] = useState<'activas' | 'inactivas'>('activas');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    window.addEventListener('open-create-order', handleOpen);
    window.addEventListener('force-close-modals', handleForceClose);
    return () => {
      window.removeEventListener('open-create-order', handleOpen);
      window.removeEventListener('force-close-modals', handleForceClose);
    };
  }, []);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (startDate && new Date(o.deliveryDate) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(o.deliveryDate) > end) return false;
      }
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
  }, [orders, searchQuery, startDate, endDate]);

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
    setEditingOrder(order);
    setShowCreateModal(true);
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
        
        <button 
          onClick={() => { setEditingOrder(undefined); setShowCreateModal(true); }}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-slate-900 px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-purple-500/20 group"
        >
          <Plus className="group-hover:rotate-90 transition-transform duration-300" size={18} />
          Nueva Orden
        </button>
      </header>

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
                isOverdue={new Date(order.deliveryDate) < new Date() && filter === 'activas'}
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
    </div>
  );
}
