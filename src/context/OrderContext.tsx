import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStorage } from '@/lib/storageService';

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
  serviceTypes: string[];
  teamMembers: string[];
  loading: boolean;
  createOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt' | 'createdBy' | 'status' | 'pendingBalance' | 'history'>) => Promise<ServiceOrder>;
  updateOrder: (id: string, updates: Partial<ServiceOrder> & { newObservation?: string }) => Promise<ServiceOrder>;
  downloadOrderPdf: (orderId: string) => Promise<void>;
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

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<ArchivedOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  // 1. Initial Load & Dynamic Configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data: st } = await supabase.from('config_service_types').select('name').order('name');
        if (st) setServiceTypes(st.map(i => i.name));
        
        const { data: tm } = await supabase.from('config_team_members').select('full_name').order('full_name');
        if (tm) setTeamMembers(tm.map(i => i.full_name));
      } catch (err) {
        console.error('Error fetching config:', err);
      }
    };

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
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('service_orders')
          .select(`*, order_history(*)`)
          .order('created_at', { ascending: false });
        
        if (data) setOrders(data.map(mapOrderFromDB));
        if (error) console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
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

  const createOrder = async (orderData: any) => {
    if (!user) throw new Error('Usuario no autenticado');
    const computedBalance = orderData.totalCost - (orderData.depositAmount || 0);
    const uName = user?.full_name || user?.username || user?.email || 'Sistema';

    const newOrderPayload: any = {
      ...orderData,
      createdAt: new Date().toISOString(),
      createdBy: user.id || user.email,
      createdByRole: user.role || 'Colaborador',
      status: 'recibida',
      pendingBalance: Math.max(0, computedBalance),
      photos: orderData.photos || []
    };

    if (isSupabaseConfigured) {
      const dbOrder = { 
        ...mapOrderToDB(newOrderPayload), 
        created_by: user.id,
        created_at: newOrderPayload.createdAt,
        created_by_role: newOrderPayload.createdByRole
      };

      // Se omite el 'id' para que el trigger de BD lo genere atómicamente
      const { data: created, error: orderError } = await supabase
        .from('service_orders')
        .insert(dbOrder)
        .select()
        .single();
      
      if (orderError) throw orderError;
      const orderId = created.id;

      await supabase.from('order_history').insert({
        order_id: orderId,
        type: 'creacion',
        user_name: uName,
        description: `Orden generada por ${uName}`
      });

      await supabase.from('global_alerts').insert({
        type: 'creation',
        order_id: orderId,
        user_id: user.id,
        user_name: uName,
        message: `✨ Se ha creado la orden No. ${orderId} por ${uName}`
      });
      
      return mapOrderFromDB({ ...created, order_history: [] });
    } else {
      const id = `ORD-MOCK-${Math.floor(Math.random()*100000)}`;
      const completedOrder = { ...newOrderPayload, id, history: [] };
      const updatedOrders = [completedOrder, ...orders];
      setOrders(updatedOrders);
      await mockStorage.setItem('mock_orders', updatedOrders);
      return completedOrder;
    }
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

    const uName = user?.full_name || user?.username || user?.email || 'Sistema';
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

  const downloadOrderPdf = async (orderId: string) => {
    if (!isSupabaseConfigured) {
      alert('La generación de PDF en servidor requiere Supabase configurado.');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-order-pdf', {
        body: { orderId },
      });

      if (error) throw error;

      if (data instanceof Blob) {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Orden_${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
         // Some versions of supabase-js return the blob directly, 
         // others might need handling if it comes as a base64 or similar.
         // Usually it's a Blob if the function returns it correctly.
         console.warn('Respuesta inesperada al generar PDF:', data);
      }
    } catch (err) {
      console.error('Error invocando Edge Function:', err);
      alert('Error al generar el PDF en el servidor.');
    }
  };

  return (
    <OrderContext.Provider value={{ orders, archivedOrders, serviceTypes, teamMembers, loading, createOrder, updateOrder, downloadOrderPdf }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
