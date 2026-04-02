import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStorage } from '@/lib/storageService';

export const SERVICE_TYPES = [
  'Sublimado de camisetas',
  'DTF',
  'Vinilo adhesivo',
  'UV DTF',
  'Vinilo textil',
  'Sublimación de tazas',
  'Bordado',
  'Otros'
];

export const RESPONSIBLE_PERSONS = [
  'Shaira Mendez',
  'Nayelis Puerta',
  'Maidi Sarmiento',
  'Fernando Marulanda',
  'Florangellys Vilarete',
  'Miguel A Marulanda'
];

export interface ServiceOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  services: string[];
  notes: string;
  responsible: string;
  createdAt: string;
  deliveryDate: string;
  createdBy: string;
  createdByRole?: string;
  completedAt?: string;
  status: 'recibida' | 'en_proceso' | 'pendiente_entrega' | 'completada' | 'cancelada' | 'vencida';
  paymentStatus: 'pendiente' | 'abono' | 'pagado';
  totalCost: number;
  depositAmount: number;
  pendingBalance: number;
  cancelReason?: string;
  photos: string[];
  lastStatusChangeBy?: string;
  history: OrderHistoryEntry[];
}

export interface OrderHistoryEntry {
  id: string;
  timestamp: string;
  type: 'creacion' | 'cambio_estado' | 'financiero' | 'observacion' | 'vencimiento' | 'modificacion';
  userName: string;
  description: string;
}

export interface GlobalAlert {
  id: string;
  timestamp: string;
  type: 'creation' | 'status_change' | 'completion' | 'expiration' | 'observation';
  orderId: string;
  userId: string;
  userName: string;
  message: string;
  seenBy: string[];
}

export interface ArchivedOrderRecord {
  id: string;
  archivedAt: string;
  summary: string;
}

interface OrderContextType {
  orders: ServiceOrder[];
  archivedOrders: ArchivedOrderRecord[];
  createOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt' | 'createdBy' | 'status' | 'pendingBalance' | 'history'>) => Promise<ServiceOrder>;
  updateOrder: (id: string, updates: Partial<ServiceOrder> & { newObservation?: string }) => Promise<ServiceOrder>;
}

const OrderContext = createContext<OrderContextType>({} as OrderContextType);

// Helper for mapping DB snake_case to CamelCase
const mapOrderFromDB = (o: any): ServiceOrder => ({
  id: o.id,
  customerName: o.customer_name,
  customerPhone: o.customer_phone,
  services: o.services || [],
  notes: o.notes,
  responsible: o.responsible,
  createdAt: o.created_at,
  deliveryDate: o.delivery_date,
  createdBy: o.created_by,
  createdByRole: o.created_by_role,
  completedAt: o.completed_at,
  status: o.status,
  paymentStatus: o.payment_status,
  totalCost: Number(o.total_cost || 0),
  depositAmount: Number(o.deposit_amount || 0),
  pendingBalance: Number(o.pending_balance || 0),
  cancelReason: o.cancel_reason,
  photos: o.photos || [],
  lastStatusChangeBy: o.last_status_change_by,
  history: (o.order_history || []).map((h: any) => ({
    id: h.id,
    timestamp: h.timestamp,
    type: h.type,
    userName: h.user_name,
    description: h.description
  })) || []
});

// Helper for mapping CamelCase to DB snake_case
const mapOrderToDB = (o: Partial<ServiceOrder>) => {
  const result: any = {};
  if (o.customerName !== undefined) result.customer_name = o.customerName;
  if (o.customerPhone !== undefined) result.customer_phone = o.customerPhone;
  if (o.services !== undefined) result.services = o.services;
  if (o.notes !== undefined) result.notes = o.notes;
  if (o.responsible !== undefined) result.responsible = o.responsible;
  if (o.deliveryDate !== undefined) result.delivery_date = o.deliveryDate;
  if (o.status !== undefined) result.status = o.status;
  if (o.paymentStatus !== undefined) result.payment_status = o.paymentStatus;
  if (o.totalCost !== undefined) result.total_cost = o.totalCost;
  if (o.depositAmount !== undefined) result.deposit_amount = o.depositAmount;
  if (o.pendingBalance !== undefined) result.pending_balance = o.pendingBalance;
  if (o.cancelReason !== undefined) result.cancel_reason = o.cancelReason;
  if (o.photos !== undefined) result.photos = o.photos;
  if (o.lastStatusChangeBy !== undefined) result.last_status_change_by = o.lastStatusChangeBy;
  if (o.completedAt !== undefined) result.completed_at = o.completedAt;
  if (o.createdByRole !== undefined) result.created_by_role = o.createdByRole;
  return result;
};

// ── Storage helpers (LOCAL FALLBACK REMOVED - Using mockStorage) ─────────────────────────

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<ArchivedOrderRecord[]>([]);

  // 1. Initial Load & Real-time Subscription
  useEffect(() => {
    const initMock = async () => {
      await mockStorage.syncFromLocalStorage('mock_orders');
      await mockStorage.syncFromLocalStorage('mock_orders_archive');
      
      const savedOrders = await mockStorage.getItem<ServiceOrder[]>('mock_orders');
      if (savedOrders) setOrders(savedOrders);

      const savedArchive = await mockStorage.getItem<ArchivedOrderRecord[]>('mock_orders_archive');
      if (savedArchive) setArchivedOrders(savedArchive);
    };

    if (!isSupabaseConfigured) {
      initMock();
      return;
    }

    const loadData = async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`*, order_history(*)`)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data.map(mapOrderFromDB));
      if (error) console.error('Error fetching orders:', error);
    };

    loadData();

    const channel = supabase
      .channel('order-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_history' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isSupabaseConfigured]);

  // 2. Local Storage Sync (Only active if Supabase is NOT configured)
  useEffect(() => {
    if (!isSupabaseConfigured && orders.length > 0) {
      mockStorage.setItem('mock_orders', orders);
    }
  }, [orders, isSupabaseConfigured]);

  const generateConsecutive = async (currentOrders: ServiceOrder[]): Promise<string> => {
    let maxNum = 0;
    
    const extractNum = (id?: string) => {
      if (!id) return 0;
      const match = id.match(/^ORDEN\s+(\d+)$/i);
      return match && match[1] ? parseInt(match[1], 10) : 0;
    };

    if (isSupabaseConfigured) {
      const { data } = await supabase.from('service_orders').select('id');
      if (data) data.forEach(d => { maxNum = Math.max(maxNum, extractNum(d.id)); });
    } else {
      currentOrders.forEach(o => { maxNum = Math.max(maxNum, extractNum(o.id)); });
    }
    
    return `ORDEN ${String(maxNum + 1).padStart(6, '0')}`;
  };

  const createOrder = async (orderData: any) => {
    if (!user) throw new Error('Usuario no autenticado');
    const computedBalance = orderData.totalCost - (orderData.depositAmount || 0);
    const id = await generateConsecutive(orders);
    const uName = user?.user_metadata?.fullName || user?.username || user?.email || 'Sistema';

    const newOrder: ServiceOrder = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
      createdBy: user.id || user.email,
      createdByRole: user.role || 'Colaborador',
      status: 'recibida',
      pendingBalance: Math.max(0, computedBalance),
      photos: orderData.photos || [],
      history: [{
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        type: 'creacion',
        userName: uName,
        description: `Orden generada por ${uName}`
      }]
    };

    if (isSupabaseConfigured) {
      const dbOrder = { 
        ...mapOrderToDB(newOrder), 
        id, 
        created_by: user.id,
        created_at: newOrder.createdAt,
        created_by_role: newOrder.createdByRole
      };
      const { error: orderError } = await supabase.from('service_orders').insert(dbOrder);
      if (orderError) throw orderError;

      await supabase.from('order_history').insert({
        order_id: id,
        type: 'creacion',
        user_name: uName,
        description: `Orden generada por ${uName}`
      });

      await supabase.from('global_alerts').insert({
        type: 'creation',
        order_id: id,
        user_id: user.id,
        user_name: uName,
        message: `✨ Se ha creado la orden No. ${id} por ${uName}`
      });
    } else {
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      await mockStorage.setItem('mock_orders', updatedOrders);
    }

    return newOrder;
  };

  const updateOrder = async (id: string, updates: any) => {
    const existingOrder = orders.find(o => o.id === id);
    if (!existingOrder) throw new Error('Orden no encontrada');

    // LOCK logic
    if (existingOrder.status === 'completada' || existingOrder.status === 'cancelada') {
      if (updates.status !== 'recibida') { // Simple reactivation escape hatch if ever needed
         throw new Error('Esta orden ya fue finalizada.');
      }
    }

    let computedBalance = existingOrder.pendingBalance;
    if (updates.totalCost !== undefined || updates.depositAmount !== undefined) {
      const tc = updates.totalCost ?? existingOrder.totalCost;
      const da = updates.depositAmount ?? existingOrder.depositAmount;
      computedBalance = Math.max(0, tc - da);
    }

    const isFinishing = (updates.status === 'completada' || updates.status === 'cancelada')
      && existingOrder.status !== 'completada' && existingOrder.status !== 'cancelada';

    const uName = user?.user_metadata?.fullName || user?.username || user?.email || 'Sistema';
    const historyEntries: any[] = [];

    if (updates.status && updates.status !== existingOrder.status) {
      historyEntries.push({ type: 'cambio_estado', user_name: uName, description: `Cambio de estado: ${existingOrder.status} ➔ ${updates.status}` });
    }
    if (updates.cancelReason && updates.cancelReason !== existingOrder.cancelReason) {
      const label = (updates.status === 'vencida' || existingOrder.status === 'vencida') ? 'VENCIMIENTO' : 'CANCELACIÓN';
      historyEntries.push({ type: 'observacion', user_name: uName, description: `JUSTIFICACIÓN FORMAL (${label}): ${updates.cancelReason}` });
    }
    if (updates.newObservation) {
      historyEntries.push({ type: 'observacion', user_name: uName, description: `Novedad / Seguimiento: ${updates.newObservation}` });
    }

    if (isSupabaseConfigured) {
      const dbUpdate = { ...mapOrderToDB(updates), pending_balance: computedBalance, last_status_change_by: uName };
      if (isFinishing) (dbUpdate as any).completed_at = new Date().toISOString();
      
      const { error } = await supabase.from('service_orders').update(dbUpdate).eq('id', id);
      if (error) throw error;

      for (const h of historyEntries) {
        await supabase.from('order_history').insert({ order_id: id, ...h });
      }

      if (updates.status || updates.newObservation || (updates.cancelReason && existingOrder.status === 'vencida')) {
        let msg = `🔄 Actualización en orden ${id}`;
        if (updates.status === 'completada') msg = `✅ Completada orden No. ${id}`;
        else if (updates.newObservation) msg = `💬 Nueva novedad en orden ${id}: "${updates.newObservation}"`;
        else if (updates.cancelReason && existingOrder.status === 'vencida') msg = `⚠️ Orden ${id} VENCIDA: "${updates.cancelReason}"`;
        
        await supabase.from('global_alerts').insert({
          type: updates.status === 'completada' ? 'completion' : 'status_change',
          order_id: id, user_id: user?.id, user_name: uName, message: msg
        });
      }
    } else {
      const updated = {
        ...existingOrder,
        ...updates,
        pendingBalance: computedBalance,
        lastStatusChangeBy: uName,
        history: [...(existingOrder.history || [])]
      };
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
    }

    return existingOrder;
  };

  return (
    <OrderContext.Provider value={{ orders, archivedOrders, createOrder, updateOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
