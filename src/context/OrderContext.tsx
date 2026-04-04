import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStorage } from '@/lib/storageService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { triggerHaptic } from '@/utils/haptics';

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
  const queryClient = useQueryClient();
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

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
      return data.map(mapOrderFromDB);
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

  // 3. Configuration Sync
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

  // 4. Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
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
        return completedOrder;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const existingOrder = orders.find(o => o.id === id);
      if (!existingOrder) throw new Error('Orden no encontrada');

      const uName = user?.full_name || user?.username || user?.email || 'Sistema';
      let computedBalance = existingOrder.pendingBalance;
      if (updates.totalCost !== undefined || updates.depositAmount !== undefined) {
        const tc = updates.totalCost ?? existingOrder.totalCost;
        const da = updates.depositAmount ?? existingOrder.depositAmount;
        computedBalance = Math.max(0, tc - da);
      }

      if (isSupabaseConfigured) {
        const dbUpdate = { ...mapOrderToDB(updates), pending_balance: computedBalance, last_status_change_by: uName };
        const { error } = await supabase.from('service_orders').update(dbUpdate).eq('id', id);
        if (error) throw error;

        if (updates.status && updates.status !== existingOrder.status) {
          await supabase.from('order_history').insert({ 
            order_id: id, type: 'cambio_estado', user_name: uName, 
            description: `Estado actualizado a "${updates.status}" por ${uName}` 
          });
        }
        if (updates.depositAmount !== undefined && updates.depositAmount > existingOrder.depositAmount) {
          const added = updates.depositAmount - existingOrder.depositAmount;
          await supabase.from('order_history').insert({ 
            order_id: id, type: 'financiero', user_name: uName, 
            description: `Nuevo abono recibido: $${added.toLocaleString()} • Total abonado: $${updates.depositAmount.toLocaleString()}` 
          });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

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
       // if refetch hasn't completed, construct best effort
       const existing = orders.find(o => o.id === id)!;
       return { ...existing, ...updates };
    }
    return updated;
  };

  const downloadOrderPdf = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const { default: jsPDF } = await import('jspdf');
      const QRCode = await import('qrcode');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const trackingUrl = `${window.location.origin}/status/${orderId}`;
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, { margin: 1 });

      // -- Color Palette --
      const COLORS = {
        DARK_TEXT: [15, 23, 42],
        DEEP_BG: [10, 10, 15],
        PURPLE: [124, 58, 237],
        AMBER: [245, 158, 11],
        EMERALD: [16, 185, 129],
        SLATE_600: [71, 85, 105],
        SLATE_200: [226, 232, 240],
        WHITE: [255, 255, 255]
      };

      // 1. Premium Executive Header
      doc.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
      doc.rect(0, 0, 210, 60, 'F');
      
      doc.setDrawColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.setLineWidth(1);
      doc.line(10, 58, 200, 58);

      // Logo & Brand
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.text("M", 20, 32);
      doc.setFontSize(22);
      doc.text("GRUPO MORE", 40, 28);
      doc.setFontSize(8);
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("PRECISIÓN · CALIDAD · IDENTIDAD CLOUD", 40, 35);

      // Order ID Accent
      doc.setFillColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2], 0.1);
      doc.roundedRect(155, 12, 40, 35, 3, 3, 'F');
      doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.setFontSize(7);
      doc.text("ORDEN DE SERVICIO No.", 159, 20);
      doc.setFontSize(16);
      doc.text(`#${orderId}`, 159, 32);
      doc.setFontSize(7);
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.text(order.status.toUpperCase(), 159, 41);

      // 2. Client Section
      let y = 75;
      doc.setFillColor(245, 245, 250);
      doc.roundedRect(10, y-5, 190, 40, 4, 4, 'F');
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("DETALLES DEL CLIENTE Y RESPONSABLE", 15, y);

      y += 10;
      doc.setTextColor(COLORS.DARK_TEXT[0], COLORS.DARK_TEXT[1], COLORS.DARK_TEXT[2]);
      doc.setFontSize(10);
      doc.text("CLIENTE:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerName.toUpperCase(), 45, y);
      doc.text("CONTACTO:", 110, y);
      doc.text(order.customerPhone, 140, y);
      
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.text("OPERADOR:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(order.responsible.toUpperCase(), 45, y);
      doc.text("ENTREGA:", 110, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.text(format(new Date(order.deliveryDate), "dd/MM/yyyy - 17:00", { locale: es }), 140, y);

      // 3. Services & Notes
      y += 25;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("SERVICIOS Y ESPECIFICACIONES", 15, y);
      doc.setDrawColor(COLORS.SLATE_200[0], COLORS.SLATE_200[1], COLORS.SLATE_200[2]);
      doc.line(15, y+2, 195, y+2);

      y += 10;
      doc.setTextColor(COLORS.DARK_TEXT[0], COLORS.DARK_TEXT[1], COLORS.DARK_TEXT[2]);
      doc.setFontSize(10);
      const servicesText = order.services.join(" + ");
      const splitServices = doc.splitTextToSize(servicesText, 175);
      doc.text(splitServices, 15, y);
      y += (splitServices.length * 6) + 5;

      if (order.notes) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        const splitNotes = doc.splitTextToSize(`Nota: ${order.notes}`, 175);
        doc.text(splitNotes, 15, y);
        y += (splitNotes.length * 5) + 10;
      }

      // 4. Financial Summary
      doc.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
      doc.roundedRect(10, y, 190, 30, 4, 4, 'F');
      
      let fy = y + 10;
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(150, 150, 150);
      doc.text("TOTAL ESTIMADO", 25, fy);
      doc.text("ABONO RECIBIDO", 85, fy);
      doc.text("SALDO PENDIENTE", 145, fy);

      fy += 10;
      doc.setFontSize(14);
      doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.text(`$ ${order.totalCost.toLocaleString()}`, 25, fy);
      doc.setTextColor(COLORS.EMERALD[0], COLORS.EMERALD[1], COLORS.EMERALD[2]);
      doc.text(`$ ${order.depositAmount.toLocaleString()}`, 85, fy);
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.text(`$ ${order.pendingBalance.toLocaleString()}`, 145, fy);

      // 5. History Section (Premium List)
      y += 45;
      if (y > 200) { doc.addPage(); y = 20; }
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("TRAZABILIDAD Y NOVEDADES (HISTORIAL)", 15, y);
      doc.line(15, y+2, 195, y+2);
      
      y += 10;
      doc.setFontSize(8);
      
      order.history.slice().reverse().forEach((log) => {
        if (y > 270) { doc.addPage(); y = 20; }
        
        // Date bullet
        doc.setFillColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
        doc.circle(18, y-1, 1, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.DARK_TEXT[0], COLORS.DARK_TEXT[1], COLORS.DARK_TEXT[2]);
        const dateStr = format(new Date(log.timestamp), "dd/MM HH:mm", { locale: es });
        doc.text(dateStr, 22, y);
        
        doc.setTextColor(COLORS.SLATE_600[0], COLORS.SLATE_600[1], COLORS.SLATE_600[2]);
        doc.text(`[${log.userName.toUpperCase()}]`, 45, y);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const splitDesc = doc.splitTextToSize(log.description, 130);
        doc.text(splitDesc, 72, y);
        
        y += (splitDesc.length * 5) + 3;
      });

      // Final Footer with QR
      y += 15;
      if (y > 240) { doc.addPage(); y = 20; }
      
      doc.addImage(qrDataUrl, 'PNG', 15, y, 25, 25);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("ESCANEÉ PARA SEGUIMIENTO CLOUD EN TIEMPO REAL", 45, y + 10);
      doc.text("ESTE DOCUMENTO ES UNA REPRESENTACIÓN DIGITAL DE SEGURIDAD.", 45, y + 14);

      doc.save(`ORDEN_${orderId}_GRUPO_MORE.pdf`);
      triggerHaptic('success');
    } catch (err) {
      console.error('Error generando PDF premium:', err);
      alert('Error en motor PDF. Reintente.');
    }
  };

  return (
    <OrderContext.Provider value={{ orders, archivedOrders, serviceTypes, teamMembers, loading, createOrder, updateOrder, downloadOrderPdf }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
