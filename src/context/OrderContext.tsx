import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStorage } from '@/lib/storageService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subHours, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { triggerHaptic } from '@/utils/haptics';
import { derivePaymentStatus, canCompleteOrder, TestUser } from '@/utils/businessRules';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { SyncService } from '@/services/SyncService';
import { uploadFile } from '@/lib/supabase';

const COLORS = {
  DEEP_BG: [15, 23, 42], // Slate 900
  PURPLE: [147, 51, 234], // Purple 600
  AMBER: [217, 119, 6], // Amber 600
  EMERALD: [5, 150, 105], // Emerald 600
  SLATE_900: [15, 23, 42],
  SLATE_700: [51, 65, 85],
  SLATE_500: [100, 116, 139],
  SLATE_50: [248, 250, 252],
  WHITE: [255, 255, 255]
};

export interface ServiceOrder {
  id: string;
  customerName: string;
  customerCedula?: string;
  customerPhone: string;
  services: string[];
  notes: string;
  responsible: string;
  createdAt: string;
  deliveryDate: string;
  createdBy: string;
  createdByRole?: string;
  completedAt?: string;
  status: 'recibida' | 'en_proceso' | 'pendiente_entrega' | 'completada' | 'cancelada' | 'vencida' | 'incumplida';
  paymentStatus: 'pendiente' | 'abono' | 'pagado';
  totalCost: number;
  depositAmount: number;
  pendingBalance: number;
  cancelReason?: string;
  photos: string[];
  lastStatusChangeBy?: string;
  is_demo?: boolean;
  isTest?: boolean;
  pdfUrl?: string;
  pdfExpiresAt?: string;
  history: OrderHistoryEntry[];
  recordType?: 'orden' | 'cotizacion';
  quoteItems?: { item: string; unitPrice: number; quantity: number; discountPercent?: number; total: number; }[];
  quoteExpiresAt?: string;
  quoteExtendedDays?: number;
  customerEmail?: string;
  isOfflinePending?: boolean;
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
  getOrderSequenceLabel: (id: string) => string;
  getQuoteSequenceLabel: (id: string) => string;
  createOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt' | 'createdBy' | 'status' | 'pendingBalance' | 'history'>) => Promise<ServiceOrder>;
  updateOrder: (id: string, updates: Partial<ServiceOrder> & { newObservation?: string }) => Promise<ServiceOrder>;
  deleteOrderMaster: (id: string) => Promise<void>;
  registerDeposit: (id: string, amount: number) => Promise<void>;
  reactivateOrder: (id: string) => Promise<void>;
  downloadOrderPdf: (orderId: string, options?: { returnUrlOnly?: boolean, hideHistory?: boolean }) => Promise<string | void>;
  convertQuoteToOrder: (id: string) => Promise<void>;
  extendQuote: (id: string) => Promise<void>;
  archiveExpiredQuote: (id: string) => Promise<void>;
  promoteDemoOrder: (id: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType>({} as OrderContextType);

// Helper for mapping DB snake_case to CamelCase
const mapOrderFromDB = (o: any): ServiceOrder => ({
  id: o.id,
  customerName: o.customer_name,
  customerCedula: o.customer_cedula,
  customerPhone: o.customer_phone,
  customerEmail: o.customer_email,
  services: o.services || [],
  notes: o.notes || '',
  responsible: o.responsible || 'Sistema',
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
  is_demo: o.is_demo || false,
  isTest: o.is_demo || false,
  pdfUrl: o.pdf_url,
  pdfExpiresAt: o.pdf_expires_at,
  recordType: o.record_type || 'orden',
  quoteItems: o.quote_items || [],
  quoteExpiresAt: o.quote_expires_at || null,
  quoteExtendedDays: Number(o.quote_extended_days || 0),
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
  if (o.customerCedula !== undefined) result.customer_cedula = o.customerCedula;
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
  if (o.quoteExtendedDays !== undefined) result.quote_extended_days = o.quoteExtendedDays;
  if (o.isTest !== undefined) result.is_demo = o.isTest;
  if (o.createdAt !== undefined) result.created_at = o.createdAt;
  if (o.createdBy !== undefined) result.created_by = o.createdBy;
  if (o.recordType !== undefined) result.record_type = o.recordType;
  if (o.quoteItems !== undefined) result.quote_items = o.quoteItems;
  if (o.quoteExpiresAt !== undefined) result.quote_expires_at = o.quoteExpiresAt;
  if (o.customerEmail !== undefined) result.customer_email = o.customerEmail;
  return result;
const MANDATORY_SERVICES = [
  'Bordado', 'DTF', 'Marcado láser', 'Sublimación placa mascota', 
  'Sublimación de tazas', 'Sublimado de camisetas', 'UV DTF', 
  'Vinilo adhesivo', 'Vinilo textil', 'Otros'
];

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Helper to sort service types alphabetically but keep 'Otros' at the end
  const sortServices = (list: string[]) => {
    const uniqueList = Array.from(new Set(list));
    const sorted = uniqueList.filter(s => s !== 'Otros').sort((a, b) => a.localeCompare(b));
    if (uniqueList.includes('Otros')) sorted.push('Otros');
    return sorted;
  };

  const [serviceTypes, setServiceTypes] = useState<string[]>(sortServices(MANDATORY_SERVICES));
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [offlineOrders, setOfflineOrders] = useState<ServiceOrder[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  // Helper to strip emojis and non-standard chars that break jsPDF Helvetica
  const cleanPdfText = (text: string = '') => {
    // Keep standard ALPHANUMERIC and common Spanish chars
    // Replace emojis and symbols with standard text equivalents or just remove them
    return text
      .replace(/📅|⏰|🚨|✨|🔄|✅|📋|🚩/g, '') // Common emojis used in logs
      .replace(/[^\x00-\x7F\sÁÉÍÓÚáéíóúÑñÜü]/g, '') // Strip other non-standard chars
      .replace(/\s+/g, ' ')
      .trim();
  };



  // 1. Fetch Orders with React Query
  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const saved = await mockStorage.getItem<ServiceOrder[]>('mock_orders');
        return saved || [];
      }
      const { data, error } = await supabase
        .from('service_orders')
        .select(`*, order_history(*)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // v19: Filtrar por is_demo (columna real) y buffer de 24h
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      return data.filter(o => 
        !o.is_demo || (o.created_at >= cutoff)
      ).map(mapOrderFromDB);
    },
    enabled: !!user,
  });

  // 2. Fetch Archived Orders
  const { data: archivedOrders = [] } = useQuery({
    queryKey: ['orders-archive'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const saved = await mockStorage.getItem<ArchivedOrderRecord[]>('mock_orders_archive');
        return saved || [];
      }
      return []; // Implement DB archive fetch if needed
    },
    enabled: !!user,
  });

  // 1.2 Poll for Offline Pending Actions (Persistent Visibility & Resilience)
  useEffect(() => {
    const fetchOffline = async () => {
      if (!user) return;
      try {
        const queue = await SyncService.getQueue();
        const orderActions = queue.filter(a => a.endpoint === 'service_orders');
        setPendingActions(orderActions);

        const creations = orderActions
          .filter(a => a.type === 'create_order')
          .map(a => {
             const payload = mapOrderFromDB(a.payload);
             return {
               ...payload,
               id: a.id, 
               isOfflinePending: true,
               createdAt: payload.createdAt || new Date().toISOString(),
               history: []
             } as ServiceOrder;
          });
        setOfflineOrders(creations);
      } catch (err) {
        console.error('Error fetching offline actions:', err);
      }
    };

    fetchOffline();
    const t = setInterval(fetchOffline, 4000); 
    return () => clearInterval(t);
  }, [user]);

  // Merge server and offline data with Vanguard Overlay System (v21)
  const allOrders = useMemo(() => {
    // 1. Process deletions and updates (Patches)
    const updates = pendingActions.filter(a => a.type === 'update_order');
    const deletions = new Set(pendingActions.filter(a => a.type === 'delete_order').map(a => a.payload.id));

    // 2. Apply patches to server orders
    const patchedServerOrders = orders
      .filter(o => !deletions.has(o.id)) // Real-time deletion resilience
      .map(o => {
        const action = updates.find(a => a.payload.id === o.id);
        if (action) {
           const patches = mapOrderFromDB(action.payload);
           return { ...o, ...patches, isOfflinePending: true };
        }
        return o;
      });

    // 3. Process new creations (avoid duplicates)
    const serverCheckSet = new Set(patchedServerOrders.map(o => `${o.customerName}|${o.customerPhone}|${o.totalCost}`));
    
    const pendingCreations = offlineOrders.filter(off => {
      // 1. Check direct ID match (for updates that might have been processed as creations - safety)
      if (patchedServerOrders.some(o => o.id === off.id)) return false;
      
      // 2. Check business match (highly likely for creations during sync lag)
      const businessKey = `${off.customerName}|${off.customerPhone}|${off.totalCost}`;
      if (serverCheckSet.has(businessKey)) return false;
      
      return true;
    });

    return [...pendingCreations, ...patchedServerOrders];
  }, [pendingActions, offlineOrders, orders]);

  // 3. Configuration Sync
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data: st } = await supabase.from('config_service_types').select('name').order('name');
        
        if (st && st.length > 0) {
          const dbNames = st.map(i => i.name);
          setServiceTypes(sortServices([...MANDATORY_SERVICES, ...dbNames]));
        } else {
          setServiceTypes(sortServices(MANDATORY_SERVICES));
        }
        
        const { data: tm } = await supabase.from('config_team_members').select('full_name').order('full_name');
        if (tm) setTeamMembers(tm.map(i => i.full_name));
      } catch (err) {
        console.error('Error fetching config:', err);
      }
    };

    if (isSupabaseConfigured) {
      fetchConfig();
      
      const channel = supabase
        .channel('order-updates-global')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_history' }, () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isSupabaseConfigured, queryClient]);

  // 1.1 Virtual Sequencing logic
  // 1.1 Virtual Sequencing logic
  const getOrderSequenceLabel = (id: string): string => {
    const order = allOrders.find(o => o.id === id);
    if (order?.isTest) return `PRUEBA-${id.slice(0, 4).toUpperCase()}`;

    const ordersHistory = allOrders.filter(o => 
      (o.recordType === 'orden' || !o.recordType) && !o.isTest && !o.isOfflinePending
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const index = ordersHistory.findIndex(o => o.id === id);
    if (index === -1) return `ORDEN ${(ordersHistory.length + 1).toString().padStart(4, '0')}`;
    return `ORDEN ${(index + 1).toString().padStart(4, '0')}`;
  };

  const getQuoteSequenceLabel = (id: string): string => {
    if (!allOrders) return `COT 0000`;
    const order = allOrders.find(o => o.id === id);
    if (order?.isTest) return `PRUEBA-${id.slice(0, 4).toUpperCase()}`;

    const quotesHistory = allOrders.filter(o => o.recordType === 'cotizacion' && !o.isTest && !o.isOfflinePending)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const index = quotesHistory.findIndex(o => o.id === id);
    if (index === -1) return `COT ${(quotesHistory.length + 1).toString().padStart(4, '0')}`;
    return `COT ${(index + 1).toString().padStart(4, '0')}`;
  };

  // 4. Mutations
  const createOrderMutation = useOfflineMutation(
    async (orderData: any) => {
      if (!user) throw new Error('Usuario no autenticado');
      const computedBalance = orderData.totalCost - (orderData.depositAmount || 0);
      const uName = user?.full_name || user?.username || user?.email || 'Sistema';

      const newOrderPayload: any = {
        ...orderData,
        createdAt: new Date().toISOString(),
        createdBy: user.id || user.email,
        createdByRole: user.role || 'Colaborador',
        status: 'recibida',
        paymentStatus: derivePaymentStatus(orderData.totalCost, orderData.depositAmount || 0),
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

        // 3. Trigger MASSIVE CRITICAL NOTIFICATION (Only if NOT test)
        if (!orderData.isTest) {
          const isQuote = dbOrder.record_type === 'cotizacion';
          const typeLabel = isQuote ? 'una Cotización' : 'una Orden de Servicio';
          await supabase.from('global_alerts').insert({
            type: 'critical',
            order_id: orderId,
            user_id: user.id,
            user_name: uName,
            message: `🚨 ¡ALERTA CRÍTICA! Se ha creado ${typeLabel} #${orderId} por el usuario ${uName}. Podrás verificar toda la información en la sección correspondiente.`
          });
        }

        // v16: PDF Cloud Storage Logic (Static Original Capture)
        setTimeout(async () => {
           try {
             const pdfUrl = await generateAndUploadPdf(orderId);
             if (pdfUrl) {
                const expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + 1);
                await supabase.from('service_orders').update({ 
                  pdf_url: pdfUrl, 
                  pdf_expires_at: expiresAt.toISOString() 
                }).eq('id', orderId);
                queryClient.invalidateQueries({ queryKey: ['orders'] });
             }
           } catch (err) {
             console.error('Error in static PDF upload:', err);
           }
        }, 1500);

          // 4. Schedule MILESTONES (24h, 12h, 6h) if it's an Order and NOT test
          const isQuote = newOrderPayload.recordType === 'cotizacion';
          if (!isQuote && dbOrder.delivery_date && !orderData.isTest) {
            const delivery = parseISO(dbOrder.delivery_date);
            const milestones = [
              { h: 24, label: '24 HORAS' },
              { h: 12, label: '12 HORAS' },
              { h: 6, label: '6 HORAS' }
            ];
  
            for (const m of milestones) {
              const fireAt = subHours(delivery, m.h);
              if (fireAt > new Date()) {
                await supabase.from('global_broadcast_queue').insert({
                  fire_at: fireAt.toISOString(),
                  title: `⏰ Recordatorio de Entrega - ${m.label}`,
                  message: `La Orden #${orderId} vence en ${m.h} horas. Favor verificar el estado del servicio.`,
                  order_id: orderId,
                  type: 'milestone'
                });
              }
            }
  
            // 4.1 ADD BREACH CHECK AT EXACT DELIVERY TIME (0h)
            await supabase.from('global_broadcast_queue').insert({
              fire_at: delivery.toISOString(),
              title: `🚩 VERIFICACIÓN DE INCUMPLIMIENTO`,
              message: `Verificando estado final de Orden #${orderId}`,
              order_id: orderId,
              type: 'breach_check'
            });
          }

        
        return mapOrderFromDB({ ...created, order_history: [] });
      } else {
        const id = `ORD-MOCK-${Math.floor(Math.random()*100000)}`;
        const completedOrder = { ...newOrderPayload, id, history: [] };
        return completedOrder;
      }
    },
    {
      mutationKey: ['orders'],
      type: 'create_order',
      table: 'service_orders',
      transform: (variables) => {
        const computedBalance = variables.totalCost - (variables.depositAmount || 0);
        const payload = {
          ...variables,
          createdAt: new Date().toISOString(),
          createdBy: user?.id,
          createdByRole: user?.role || 'Colaborador',
          status: 'recibida',
          paymentStatus: derivePaymentStatus(variables.totalCost, variables.depositAmount || 0),
          pendingBalance: Math.max(0, computedBalance),
        };
        return mapOrderToDB(payload);
      }
    }
  );

  const updateOrderMutation = useOfflineMutation(
    async ({ id, updates }: { id: string, updates: any }) => {
      if (!user) throw new Error('Usuario no autenticado');
      const existingOrder = orders.find(o => o.id === id);
      if (!existingOrder) throw new Error('Orden no encontrada');

      const uName = user?.full_name || user?.username || user?.email || 'Sistema';
      let computedBalance = existingOrder.pendingBalance;
      
      // FIX (v21): Preserve additional deposits when updating totalCost or initial depositAmount
      if (updates.totalCost !== undefined || updates.depositAmount !== undefined) {
        const tc = updates.totalCost ?? existingOrder.totalCost;
        const da = updates.depositAmount ?? existingOrder.depositAmount;
        
        // Calculate the sum of all payments EXCEPT the initial deposit
        const additionalPayments = Math.max(0, (existingOrder.totalCost - existingOrder.pendingBalance) - existingOrder.depositAmount);
        
        // New balance is Total - (New Initial + Sum of Additional)
        computedBalance = Math.max(0, tc - (da + additionalPayments));
        updates.paymentStatus = derivePaymentStatus(tc, (da + additionalPayments));
      }

      // v3.1: Guarda de Despacho
      if (updates.status === 'completada' && existingOrder.status !== 'completada') {
         const guardUser: TestUser = { 
           id: user.id, 
           username: user.username, 
           role: user.role, 
           isMaster: user.isMaster 
         };
         const check = canCompleteOrder({ 
           totalCost: updates.totalCost ?? existingOrder.totalCost, 
           depositAmount: updates.depositAmount ?? existingOrder.depositAmount 
         }, guardUser);

         if (!check.allowed) {
            triggerHaptic('error');
            throw new Error(check.message);
         }
      }

      if (isSupabaseConfigured) {
        const dbUpdate = { ...mapOrderToDB(updates), pending_balance: computedBalance, last_status_change_by: uName };
        const { error } = await supabase.from('service_orders').update(dbUpdate).eq('id', id);
        if (error) throw error;

        if (updates.status && updates.status !== existingOrder.status) {
          const statusLabel = updates.status.replace('_', ' ');
          // v3.3 Non-blocking history
          supabase.from('order_history').insert({ 
            order_id: id, type: 'cambio_estado', user_name: uName, 
            description: `Estado actualizado a "${statusLabel}" por ${uName}${updates.cancelReason ? `. Justificación: ${updates.cancelReason}` : ''}` 
          }).then(({ error: hErr }) => hErr && console.warn('History log error:', hErr));

          // v23: Massive broadcast for ANY status change as requested
          const icon = updates.status === 'cancelada' ? '🚨' : updates.status === 'completada' ? '✅' : '🔄';
          supabase.from('global_alerts').insert({
            type: 'critical',
            order_id: id,
            user_id: user.id,
            user_name: uName,
            message: `${icon} CAMBIO DE ESTADO: La orden #${id} pasó a "${statusLabel.toUpperCase()}" por ${uName}${updates.cancelReason ? `. Motivo: ${updates.cancelReason}` : ''}`
          }).then(({ error: aErr }) => aErr && console.warn('Alert log error:', aErr));
        }
        
        const isMaster = user.role === 'Administrador maestro';
        const isTotalCostChange = updates.totalCost !== undefined && updates.totalCost !== existingOrder.totalCost;
        
        if (updates.depositAmount !== undefined && (updates.depositAmount > (existingOrder.depositAmount || 0))) {
          const added = updates.depositAmount - (existingOrder.depositAmount || 0);
          supabase.from('order_history').insert({ 
            order_id: id, type: 'financiero', user_name: uName, 
            description: `Nuevo abono recibido: $${added.toLocaleString()} • Total abonado: $${updates.depositAmount.toLocaleString()}` 
          }).then(({ error: fErr }) => fErr && console.warn('History finance error:', fErr));
        }
        
        if (isTotalCostChange && user && !isMaster) {
           supabase.from('order_history').insert({ 
            order_id: id, type: 'financiero', user_name: uName, 
            description: `Corrección de costo total: $${existingOrder.totalCost.toLocaleString()} -> $${updates.totalCost.toLocaleString()}` 
          }).then(({ error: cErr }) => cErr && console.warn('History correction error:', cErr));
        }

        if (updates.deliveryDate && updates.deliveryDate !== existingOrder.deliveryDate) {
          const oldDate = existingOrder.deliveryDate ? format(new Date(existingOrder.deliveryDate), 'dd/MM/yyyy HH:mm') : 'N/A';
          const newDate = format(new Date(updates.deliveryDate), 'dd/MM/yyyy HH:mm');
          
          // 1. Log History
          await supabase.from('order_history').insert({
            order_id: id,
            type: 'cambio_estado',
            user_name: uName,
            description: `📅 TRASLADO DE FECHA: ${oldDate} -> ${newDate} por ${uName}`
          });

          // 2. Reschedule Background Alerts
          const delivery = new Date(updates.deliveryDate);
          if (delivery > new Date()) {
            // Delete old ones
            await supabase.from('global_broadcast_queue').delete().eq('order_id', id);
            
            const milestones = [
              { h: 12, label: '12 HORAS' },
              { h: 6, label: '6 HORAS' }
            ];
  
            for (const m of milestones) {
              const fireAt = subHours(delivery, m.h);
              if (fireAt > new Date()) {
                await supabase.from('global_broadcast_queue').insert({
                  fire_at: fireAt.toISOString(),
                  title: `⏰ Recordatorio de Entrega - ${m.label}`,
                  message: `La Orden #${id} vence en ${m.h} horas. Favor verificar el estado del servicio.`,
                  order_id: id,
                  type: 'milestone'
                });
              }
            }
  
            await supabase.from('global_broadcast_queue').insert({
              fire_at: delivery.toISOString(),
              title: `🚩 VERIFICACIÓN DE INCUMPLIMIENTO`,
              message: `Verificando estado final de Orden #${id}`,
              order_id: id,
              type: 'breach_check'
            });
          }
        }
      } else {
        const mockOrders = await mockStorage.getItem<ServiceOrder[]>('mock_orders') || [];
        const index = mockOrders.findIndex(o => o.id === id);
        if (index !== -1) {
          const updatedOrder = { ...mockOrders[index], ...updates, pendingBalance: computedBalance };
          mockOrders[index] = updatedOrder;
          await mockStorage.setItem('mock_orders', mockOrders);
        }
      }
    },
    {
      mutationKey: ['orders'],
      type: 'update_order',
      table: 'service_orders',
      transform: ({ id, updates }) => ({ id, ...mapOrderToDB(updates) })
    }
  );

  const registerDeposit = async (id: string, amount: number) => {
    const order = (queryClient.getQueryData(['orders']) as ServiceOrder[])?.find(o => o.id === id);
    if (!order) return;
    
    // VALIDATION: Cannot pay more than pending balance
    if (amount > (order.pendingBalance || 0)) {
      throw new Error(`El abono ($${amount.toLocaleString()}) no puede ser mayor al saldo pendiente ($${(order.pendingBalance || 0).toLocaleString()})`);
    }

    const newBalance = Math.max(0, (order.pendingBalance || 0) - amount);
    const uName = user?.full_name || user?.username || user?.email || 'Sistema';

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('service_orders')
        .update({ 
          pending_balance: newBalance,
          payment_status: newBalance === 0 ? 'pagado' : 'abono'
        })
        .eq('id', id);
      
      if (error) throw error;

      // v3.3: Non-blocking audit
      supabase.from('order_history').insert({
        order_id: id,
        type: 'financiero',
        user_name: uName,
        description: `ABONO ADICIONAL: $${amount.toLocaleString()} | Recibido por: ${uName} | Saldo Restante: $${newBalance.toLocaleString()}`
      }).then(({ error: hErr }) => hErr && console.warn('Deposit history error:', hErr));
    } else {
      // Mock logic
      const mockOrders = await mockStorage.getItem<ServiceOrder[]>('mock_orders') || [];
      const idx = mockOrders.findIndex(o => o.id === id);
      if (idx !== -1) {
        mockOrders[idx].pendingBalance = newBalance;
        mockOrders[idx].paymentStatus = newBalance === 0 ? 'pagado' : 'abono';
        await mockStorage.setItem('mock_orders', mockOrders);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    triggerHaptic('success');
  };

  const reactivateOrder = async (id: string) => {
    if (!user?.isSuperAdmin) {
      alert("Solo el Administrador Maestro puede restablecer órdenes finalizadas.");
      return;
    }
    const uName = user?.full_name || user?.username || user?.email || 'Sistema';
    
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('service_orders')
        .update({ status: 'recibida', completed_at: null })
        .eq('id', id);
      
      if (error) throw error;

      await supabase.from('order_history').insert({
        order_id: id,
        type: 'modificacion',
        user_name: uName,
        description: `Orden restablecida a modo ACTIVO por ${uName}`
      });

      await supabase.from('global_alerts').insert({
        type: 'critical',
        order_id: id,
        user_id: user.id,
        user_name: uName,
        message: `🔄 ORDEN REACTIVADA: La orden #${id} ha sido restablecida a modo activo por el Administrador Maestro.`
      });
    }
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    triggerHaptic('medium');
  };


   const deleteOrderMaster = async (id: string) => {
    if (!user?.isMaster) {
      triggerHaptic('error');
      throw new Error('Privilegio reservado para el Administrador Maestro.');
    }

    if (isSupabaseConfigured) {
      // 0. Fetch order to check if test and get PDF URL
      const { data: orderData } = await supabase.from('service_orders').select('is_test, pdf_url').eq('id', id).single();
      
      // Cleanup associated resources if it's a test order
      if (orderData?.is_test) {
         // a. Delete tasks (Agenda)
         await supabase.from('tasks').delete().eq('order_id', id);
         // b. Delete global alerts
         await supabase.from('global_alerts').delete().eq('order_id', id);
         // c. Delete PDF from Storage
         if (orderData.pdf_url) {
            try {
              const urlParts = orderData.pdf_url.split('/');
              const filePath = urlParts.slice(urlParts.indexOf('order-pdfs') + 1).join('/');
              if (filePath) await supabase.storage.from('order-pdfs').remove([filePath]);
            } catch (storageErr) {
              console.error('Error cleaning storage:', storageErr);
            }
         }
      }

      // 1. Delete history first
      await supabase.from('order_history').delete().eq('order_id', id);
      // 2. Delete the order
      const { error } = await supabase.from('service_orders').delete().eq('id', id);
      if (error) throw error;
    } else {
      const mockOrders = await mockStorage.getItem<ServiceOrder[]>('mock_orders') || [];
      const filtered = mockOrders.filter(o => o.id !== id);
      await mockStorage.setItem('mock_orders', filtered);
    }
    
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    triggerHaptic('success');
  };

  // ──────────────────────────────────────────────
  // Quote Lifecycle Functions
  // ──────────────────────────────────────────────

  /** Convierte una cotización en una Orden de Servicio oficial */
  const convertQuoteToOrder = async (id: string) => {
    const uName = user?.full_name || user?.username || 'Sistema';
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('service_orders')
        .update({
          record_type: 'orden',
          status: 'recibida',
          payment_status: 'pendiente',
          quote_expires_at: null,
          created_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      await supabase.from('order_history').insert({
        order_id: id,
        type: 'modificacion',
        user_name: uName,
        description: `Cotización CONVERTIDA a Orden de Servicio oficial por ${uName}`
      });

      await supabase.from('global_alerts').insert({
        type: 'critical',
        order_id: id,
        user_id: user?.id,
        user_name: uName,
        message: `🔄 ✅ La cotización #${id.slice(-6).toUpperCase()} del cliente ${orders.find(o => o.id === id)?.customerName || 'N/A'} fue convertida en la orden de servicio oficial por el usuario ${uName}. Mas informacion en la seccion correspondiente.`
      });

      // Auditoría P-1: Programar hitos para la nueva orden convertida si tiene fecha de entrega
      const orderData = (queryClient.getQueryData(['orders']) as ServiceOrder[])?.find(o => o.id === id);
      if (orderData?.deliveryDate) {
        const delivery = parseISO(orderData.deliveryDate);
        const milestones = [
          { h: 24, label: '24 HORAS' },
          { h: 12, label: '12 HORAS' },
          { h: 6, label: '6 HORAS' }
        ];

        for (const m of milestones) {
          const fireAt = subHours(delivery, m.h);
          if (fireAt > new Date()) {
            await supabase.from('global_broadcast_queue').insert({
              fire_at: fireAt.toISOString(),
              title: `⏰ Recordatorio de Entrega - ${m.label}`,
              message: `La Orden #${id} vence en ${m.h} horas. Favor verificar el estado del servicio.`,
              order_id: id,
              type: 'milestone'
            });
          }
        }

        await supabase.from('global_broadcast_queue').insert({
          fire_at: delivery.toISOString(),
          title: `🚩 VERIFICACIÓN DE INCUMPLIMIENTO`,
          message: `Verificando estado final de Orden #${id}`,
          order_id: id,
          type: 'breach_check'
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    triggerHaptic('success');
  };

  /** Extiende la cotización 5 días adicionales (solo 1 vez permitido) */
  const extendQuote = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    if ((order.quoteExtendedDays || 0) >= 5) {
      throw new Error('Esta cotización ya fue extendida una vez. No se puede extender nuevamente.');
    }
    const uName = user?.full_name || user?.username || 'Sistema';
    const currentExpiry = order.quoteExpiresAt ? new Date(order.quoteExpiresAt) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('service_orders')
        .update({ quote_expires_at: newExpiry, quote_extended_days: 5 })
        .eq('id', id);
      if (error) throw error;

      await supabase.from('order_history').insert({
        order_id: id,
        type: 'modificacion',
        user_name: uName,
        description: `Cotización EXTENDIDA 5 días adicionales por ${uName}. Nueva expiración: ${new Date(newExpiry).toLocaleDateString()}`
      });
    }
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    triggerHaptic('success');
  };

  const promoteDemoOrder = async (id: string) => {
    if (isSupabaseConfigured) {
      const uName = user?.full_name || user?.username || 'Sistema';
      const { error } = await supabase
        .from('service_orders')
        .update({ is_demo: false })
        .eq('id', id);
      if (error) throw error;

      await supabase.from('order_history').insert({
        order_id: id,
        type: 'modificacion',
        user_name: uName,
        description: `La orden fue PROMOVIDA de prueba a REAL por ${uName}`
      });
    }
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    triggerHaptic('success');
  };

  /** Archiva una cotización vencida: la cancela, notifica a CEO/Maestro y la marca como expirada */
  const archiveExpiredQuote = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const uName = user?.full_name || user?.username || 'Sistema';

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'cancelada',
          cancel_reason: 'Cotización vencida — tiempo de validez agotado',
        })
        .eq('id', id);
      if (error) throw error;

      await supabase.from('order_history').insert({
        order_id: id,
        type: 'modificacion',
        user_name: 'Sistema',
        description: `Cotización ARCHIVADA automáticamente por expiración de tiempo (${order.quoteExtendedDays ? '15' : '10'} días)`
      });

      // Notify CEO, Master and creator
      const alertMsg = `⏰ La cotización "${order.customerName}" expiró y fue archivada automáticamente. Creada por: ${uName}`;
      await supabase.from('global_alerts').insert({
        type: 'expiration',
        order_id: id,
        user_id: user?.id,
        user_name: uName,
        message: alertMsg
      });
    }
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    triggerHaptic('warning');
  };

  // Listener para capturar motivos de cancelación desde UI
  useEffect(() => {
    const handleCancelReason = (e: any) => {
      const { id, reason } = e.detail;
      updateOrderMutation.mutate({ id, updates: { cancelReason: reason } });
    };
    window.addEventListener('cancel-order-reason', handleCancelReason);
    return () => window.removeEventListener('cancel-order-reason', handleCancelReason);
  }, [updateOrderMutation]);

  const createOrder = async (orderData: any) => {
    return createOrderMutation.mutateAsync(orderData);
  };

  const updateOrder = async (id: string, updates: any): Promise<ServiceOrder> => {
    await updateOrderMutation.mutateAsync({ id, updates });
    // Refetch or return expected data to ensure UI sync
    const currentOrders = queryClient.getQueryData(['orders']) as ServiceOrder[] || [];
    const updated = currentOrders.find(o => o.id === id);
    if (!updated) {
       const existing = allOrders.find(o => o.id === id)!;
       return { ...existing, ...updates };
    }
    return updated;
  };

  const downloadQuotePdf = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // --- HEADER: ABSOLUTE REPLICATION (Identical Layout) ---
      const headerH = 45;
      const splitXTop = 90;
      const splitXBottom = 68;

      // Right Side: Lavender/Gray Area
      doc.setFillColor(226, 226, 235);
      doc.rect(0, 0, 210, headerH, 'F');

      // Left Side: White Area with Geometry
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, splitXBottom, headerH, 'F');
      doc.triangle(splitXBottom, 0, splitXTop, 0, splitXBottom, headerH, 'F');
      
      // Bottom Brand Bar
      doc.setFillColor(142, 87, 163); // Brand Purple
      doc.rect(0, 43, 210, 2, 'F');

      // Info Box (Left Side Integrated)
      doc.setFillColor(15, 23, 42); // Obsidian Brand Color
      doc.roundedRect(12, 9, 58, 26, 4, 4, 'F');
      
      doc.setTextColor(180, 180, 190);
      doc.setFontSize(7);
      doc.text("COTIZACIÓN", 18, 16);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(getOrderSequenceLabel(orderId), 18, 23);
      
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.setFontSize(8);
      doc.text("COTIZACIÓN COMERCIAL", 18, 30);

      // --- LOGO LOADING (Required for Brand) ---
      const loadLogo = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
          img.src = '/logo.png';
        });
      };
      const logoBase64 = await loadLogo();

      // Branding Text & Logo (Right Side Balanced)
      doc.setTextColor(142, 87, 163); // Brand Purple
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("Papeleria creativa, detalles y personalización", 195, 8, { align: 'right' } as any);

      if (logoBase64) {
        // Optimized Scale (Taller & Bolder as per final proposal)
        doc.addImage(logoBase64, 'PNG', 145, 10, 55, 33);
      }





      let y = 55;

      doc.setFillColor(240, 240, 240);
      doc.rect(10, y, 190, 8, 'F');
      doc.setTextColor(COLORS.SLATE_700[0], COLORS.SLATE_700[1], COLORS.SLATE_700[2]);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("SEÑOR(ES)", 12, y + 5);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerName.toUpperCase(), 40, y + 5);
      
      doc.setFont("helvetica", "bold");
      doc.text("FECHA EXP:", 145, y + 5);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(order.createdAt).toLocaleDateString(), 170, y + 5);
      
      y += 8;
      doc.rect(10, y, 190, 8, 'S');
      doc.setFont("helvetica", "bold");
      doc.text("TEL/CELULAR", 12, y + 5);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerPhone, 40, y + 5);
      
      doc.setFont("helvetica", "bold");
      doc.text("FECHA VENC:", 145, y + 5);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(order.deliveryDate).toLocaleDateString(), 170, y + 5);
      
      y += 8;
      doc.setFillColor(240, 240, 240);
      doc.rect(10, y, 190, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.text("NIT/CC", 12, y + 5);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerCedula || '1234567890', 40, y + 5);

      y += 15;
      doc.setFillColor(160, 160, 160);
      doc.rect(10, y, 190, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ÍTEM / SERVICIO", 12, y + 5);
      doc.text("PRECIO", 110, y + 5, { align: 'right' } as any);
      doc.text("CANT", 130, y + 5, { align: 'right' } as any);
      doc.text("DESC(%)", 150, y + 5, { align: 'right' } as any);
      doc.text("TOTAL", 195, y + 5, { align: 'right' } as any);

      y += 8;
      doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
      let subtotal = 0;
      
      const items = order.quoteItems && order.quoteItems.length > 0 
          ? order.quoteItems 
          : [{ item: order.services.join(', '), unitPrice: order.totalCost / 1.19, quantity: 1, discountPercent: 0, total: order.totalCost / 1.19 }];

      for (const qi of items) {
          doc.setFont("helvetica", "normal");
          const splitItem = doc.splitTextToSize(qi.item, 90);
          doc.text(splitItem, 12, y + 5);
          doc.text(qi.unitPrice.toLocaleString(), 110, y + 5, { align: 'right' } as any);
          doc.text((qi.quantity || 1).toString(), 130, y + 5, { align: 'right' } as any);
          doc.text((qi.discountPercent || 0).toString() + '%', 150, y + 5, { align: 'right' } as any);
          const lineTotal = (qi.unitPrice * (qi.quantity || 1)) * (1 - (qi.discountPercent || 0)/100);
          subtotal += lineTotal;
          doc.text(lineTotal.toLocaleString(), 195, y + 5, { align: 'right' } as any);
          y += (splitItem.length * 4) + 4;
      }

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Subtotal", 160, y, { align: 'right' } as any);
      doc.setFont("helvetica", "normal");
      doc.text('$' + Math.round(subtotal).toLocaleString(), 195, y, { align: 'right' } as any);
      
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("IVA 19%", 160, y, { align: 'right' } as any);
      doc.setFont("helvetica", "normal");
      doc.text('$' + Math.round(subtotal * 0.19).toLocaleString(), 195, y, { align: 'right' } as any);

      y += 8;
      doc.setFillColor(200, 200, 200);
      doc.rect(150, y - 5, 50, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
      doc.text("TOTAL COP", 160, y, { align: 'right' } as any);
      doc.text('$' + Math.round(subtotal * 1.19).toLocaleString(), 195, y, { align: 'right' } as any);

      y = 250;
      doc.line(10, y, 80, y);
      doc.setFontSize(7);
      doc.text("ELABORADO POR", 45, y + 4, { align: 'center' } as any);
      doc.text(order.responsible.toUpperCase(), 45, y + 8, { align: 'center' } as any);

      doc.save("Cotizacion_" + getOrderSequenceLabel(orderId) + ".pdf");
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      triggerHaptic('error');
      alert('Error generando PDF de cotización');
    }
  };

  const downloadOrderPdf = async (orderId: string, options: { returnUrlOnly?: boolean, hideHistory?: boolean } = {}) => {
    const { returnUrlOnly = false, hideHistory = false } = options;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.recordType === 'cotizacion') return downloadQuotePdf(orderId);

    try {
      const { default: jsPDF } = await import('jspdf');
      const QRCode = await import('qrcode');
      
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const trackingUrl = `${window.location.origin}/status/${orderId}`;
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, { margin: 1, errorCorrectionLevel: 'H' });
      
      // Social Media QRs
      const qrInstagram = await QRCode.toDataURL('https://instagram.com/grupomore_', { margin: 1 });
      const qrWAMorePaper = await QRCode.toDataURL('https://wa.me/573045267493', { margin: 1 });
      const qrWAMoreDesign = await QRCode.toDataURL('https://wa.me/573183806342', { margin: 1 });



      const COLORS = {
        DEEP_BG: [15, 23, 42], // Slate 900
        PURPLE: [147, 51, 234], // Purple 600
        AMBER: [217, 119, 6], // Amber 600
        EMERALD: [5, 150, 105], // Emerald 600
        SLATE_900: [15, 23, 42],
        SLATE_700: [51, 65, 85],
        SLATE_500: [100, 116, 139],
        SLATE_50: [248, 250, 252],
        WHITE: [255, 255, 255]
      };

      // --- HEADER: ABSOLUTE REPLICATION (Identical Layout) ---
      const headerH = 45;
      const splitXTop = 90;
      const splitXBottom = 68;

      // Right Side: Lavender/Gray Background
      doc.setFillColor(226, 226, 235);
      doc.rect(0, 0, 210, headerH, 'F');

      // Left Side: White Area with Geometry
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, splitXBottom, headerH, 'F');
      doc.triangle(splitXBottom, 0, splitXTop, 0, splitXBottom, headerH, 'F');
      
      // Bottom Brand Bar
      doc.setFillColor(142, 87, 163); // Brand Purple
      doc.rect(0, 43, 210, 2, 'F');

      // Info Box (Left Side Integrated)
      doc.setFillColor(15, 23, 42); // Obsidian Brand Color
      doc.roundedRect(12, 9, 58, 26, 4, 4, 'F');
      
      doc.setTextColor(180, 180, 190);
      doc.setFontSize(7);
      doc.text("SERVICIO", 18, 16);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(getOrderSequenceLabel(orderId), 18, 23);
      
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.setFontSize(8);
      doc.text(cleanPdfText(order.status.replace('_', ' ')).toUpperCase(), 18, 30);

      // --- WATERMARK (Test Only) ---
      if (order.isTest) {
        doc.setTextColor(245, 158, 11);
        doc.setFontSize(40);
        doc.setFont("helvetica", "bold");
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
        doc.text("DOCUMENTO DE PRUEBA", 105, 150, { align: 'center', angle: 45 } as any);
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
      }

      // --- LOGO LOADING (Required for Brand) ---
      const loadLogo = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
          img.src = '/logo.png';
        });
      };
      const logoBase64 = await loadLogo();

      // Branding Text & Logo (Right Side Balanced)
      doc.setTextColor(142, 87, 163); // Brand Purple
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("Papeleria creativa, detalles y personalización", 195, 8, { align: 'right' } as any);

      if (logoBase64) {
        // Optimized Scale (Taller & Bolder as per final proposal)
        doc.addImage(logoBase64, 'PNG', 145, 10, 55, 33);
      }






      // --- CLIENT & RESPONSIBLE SECTION ---
      let y = 60;
      doc.setFillColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.roundedRect(15, y - 5, 110, 40, 5, 5, 'F');
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("INFORMACIÓN DEL CLIENTE", 20, y);

      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
      doc.setFont("helvetica", "bold");
      doc.text(cleanPdfText(order.customerName).toUpperCase(), 20, y);
      
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
      doc.text(`Contacto: ${order.customerPhone}`, 20, y);
      
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.SLATE_700[0], COLORS.SLATE_700[1], COLORS.SLATE_700[2]);
      doc.text("OPERADOR:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(cleanPdfText(order.responsible).toUpperCase(), 43, y);

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("ENTREGA:", 20, y);
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.text(format(new Date(order.deliveryDate), "dd 'de' MMMM, HH:mm", { locale: es }), 43, y);

      // --- QR CODE SECTION (High Priority) ---
      const qrX = 140;
      const qrY = 55;
      doc.setFillColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.roundedRect(qrX - 5, qrY - 5, 60, 40, 5, 5, 'F');
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, 25, 25);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
      doc.text("VALIDACIÓN DIGITAL", qrX + 28, qrY + 4); 
      
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
      doc.text("Escanee para verificar trazabilidad.", qrX + 28, qrY + 8);

      // --- SERVICES ---
      y = 105;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("ESPECIFICACIONES DEL SERVICIO", 15, y);
      doc.setDrawColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2], 0.1);
      doc.line(15, y + 2, 195, y + 2);

      y += 10;
      doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const servicesText = cleanPdfText(order.services.join(" + "));
      const splitServices = doc.splitTextToSize(servicesText, 180);
      doc.text(splitServices, 15, y);
      y += (splitServices.length * 4) + 6;

      // --- FINANCIAL CARD (EXECUTIVE STYLE) ---
      y += 5;
      doc.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
      doc.roundedRect(10, y, 190, 30, 5, 5, 'F');
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
      doc.text("RESUMEN FINANCIERO", 15, y + 8);
      
      let fy = y + 18;
      doc.setFontSize(8);
      doc.setTextColor(COLORS.SLATE_50[0], COLORS.SLATE_50[1], COLORS.SLATE_50[2]);
      doc.text("VALOR TOTAL", 20, fy);
      doc.text("ABONADO", 85, fy);
      doc.text("SALDO PENDIENTE", 150, fy);

      fy += 6;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.text(`$ ${order.totalCost.toLocaleString()}`, 20, fy);
      doc.setTextColor(COLORS.EMERALD[0], COLORS.EMERALD[1], COLORS.EMERALD[2]);
      doc.text(`$ ${order.depositAmount.toLocaleString()}`, 85, fy);
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.text(`$ ${order.pendingBalance.toLocaleString()}`, 150, fy);

      // --- HELPERS FOR MULTI-PAGE & FOOTER ---
      const renderFooter = (pdf: any, pageNum: number) => {
        const footY = 270;
        pdf.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
        pdf.rect(0, footY, 210, 27, 'F');
        pdf.setFillColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
        pdf.rect(0, footY, 210, 0.5, 'F');

        pdf.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.text("LEGALIDAD Y DATOS", 15, footY + 7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(160, 160, 170);
        pdf.text("Privacidad (Habeas Data)", 15, footY + 12);
        pdf.text("Términos de Servicio", 15, footY + 16);

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
        pdf.text("SOPORTE Y CONTACTO", 75, footY + 7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(160, 160, 170);
        pdf.text("morepaper2024@gmail.com", 75, footY + 12);
        pdf.text("Barranquilla, Colombia", 75, footY + 16);
        pdf.text("Tel: 304 526 7493 / 318 380 6342", 75, footY + 20);

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
        pdf.text("NUESTRAS REDES", 145, footY + 7);
        pdf.addImage(qrInstagram, 'PNG', 145, footY + 9, 12, 12);
        pdf.addImage(qrWAMorePaper, 'PNG', 165, footY + 9, 12, 12);
        pdf.addImage(qrWAMoreDesign, 'PNG', 185, footY + 9, 12, 12);
        
        pdf.setFontSize(5);
        pdf.setTextColor(168, 85, 247); // Purple-400 for brand harmony and contrast
        pdf.text("INSTAGRAM", 151, footY + 23.5, { align: 'center' } as any);
        pdf.text("WA More Paper", 171, footY + 23.5, { align: 'center' } as any);
        pdf.text("WA More Design", 191, footY + 23.5, { align: 'center' } as any);

        pdf.setFontSize(6);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
        pdf.text("MORE PAPER & DESIGN · EST. 2024 · PERSONALIZAR ES IDENTIDAD", 15, 295.5);
        
        // Page Numbering - Guaranteed Right Corner with no overlap
        pdf.text(`Página ${pageNum}`, 200, 295.5, { align: 'right' } as any);
      };

      const addNewPage = (pdf: any) => {
        renderFooter(pdf, pdf.internal.pages.length - 1);
        pdf.addPage();
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, 0, 210, 297, 'F');
        return 25; // Reset Y
      };

      // --- AUDIT TRAIL (HISTORY) ---
      if (!hideHistory) {
        y += 38;
        if (y > 220) { y = addNewPage(doc); }
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
        doc.text("TRAZABILIDAD Y REGISTROS OFICIALES", 15, y);
        doc.setDrawColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2], 0.3);
        doc.line(15, y + 2, 195, y + 2);
        
        y += 10;
        const history = order.history.slice().reverse();
        history.forEach((log, index) => {
          const descText = cleanPdfText(`${log.description} (por ${log.userName})`);
          const splitDesc = doc.splitTextToSize(descText, 150);
          const rowHeight = Math.max(8, (splitDesc.length * 4) + 4);
  
          if (y + rowHeight > 250) { y = addNewPage(doc); } 
          
          if (index % 2 === 0) {
            doc.setFillColor(242, 242, 248);
            doc.rect(15, y - 4, 180, rowHeight, 'F');
          }
          
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
          const dateStr = format(new Date(log.timestamp), "dd/MM HH:mm", { locale: es });
          doc.text(dateStr, 20, y + 1);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(COLORS.SLATE_700[0], COLORS.SLATE_700[1], COLORS.SLATE_700[2]);
          doc.text(splitDesc, 40, y + 1);
          
          y += rowHeight;
        });
      }

      // --- ATTACHED IMAGES (4 COLUMNS) ---
      if (order.photos && order.photos.length > 0) {
        y += 10;
        if (y > 230) { y = addNewPage(doc); }
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
        doc.text("ANEXOS FOTOGRÁFICOS", 15, y);
        doc.setDrawColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2], 0.3);
        doc.line(15, y + 2, 195, y + 2);
        
        y += 8;
        const colCount = 4;
        const spacing = 4;
        const colWidth = (180 - (spacing * (colCount - 1))) / colCount;
        const imgHeight = colWidth;

        let rowOnPage = 0;
        for (let i = 0; i < order.photos.length; i++) {
          const colIdx = i % colCount;
          if (i > 0 && colIdx === 0) rowOnPage++;
          
          let currentY = y + (rowOnPage * (imgHeight + spacing));
          
          if (currentY + imgHeight > 260) {
             y = addNewPage(doc);
             rowOnPage = 0;
             currentY = y;
          }

          try {
            doc.addImage(order.photos[i], 'JPEG', 15 + (colIdx * (colWidth + spacing)), currentY, colWidth, imgHeight, undefined, 'MEDIUM');
          } catch (err) {
            console.error("Error adding image to PDF:", err);
          }
        }
      }

      // Final Footer
      renderFooter(doc, doc.internal.pages.length - 1);


      if (returnUrlOnly) {
         const pdfBlob = doc.output('blob');
         const fileName = `OS_${orderId.slice(-6)}_${Date.now()}.pdf`;
         const filePath = `managed_pdfs/${orderId}/${fileName}`;
         const publicUrl = await uploadFile('order-pdfs', filePath, pdfBlob);
         return publicUrl;
      }

      doc.save(`OS_${orderId.slice(-6)}_${order.customerName.replace(/ /g, '_')}.pdf`);
      triggerHaptic('success');
    } catch (err) {
      console.error('Error generando PDF premium:', err);
      alert('Error en motor PDF. Reintente.');
    }
  };

  const generateAndUploadPdf = async (orderId: string): Promise<string | void> => {
     return await downloadOrderPdf(orderId, { returnUrlOnly: true, hideHistory: true });
  };

  return (
    <OrderContext.Provider value={{ 
      orders: allOrders,
      archivedOrders,
      serviceTypes,
      teamMembers,
      loading,
      getOrderSequenceLabel,
      getQuoteSequenceLabel,
      createOrder,
      updateOrder,
      registerDeposit,
      reactivateOrder,
      deleteOrderMaster,
      downloadOrderPdf,
      convertQuoteToOrder,
      extendQuote,
      archiveExpiredQuote,
      promoteDemoOrder,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
