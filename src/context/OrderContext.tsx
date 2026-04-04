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
            description: `Cambio de estado: ${existingOrder.status} ➔ ${updates.status}` 
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
        DARK: [15, 23, 42],
        PURPLE: [124, 58, 237],
        AMBER: [245, 158, 11],
        EMERALD: [16, 185, 129],
        SLATE_600: [71, 85, 105],
        SLATE_100: [241, 245, 249],
        WHITE: [255, 255, 255]
      };

      // 1. Background Header
      doc.setFillColor(COLORS.DARK[0], COLORS.DARK[1], COLORS.DARK[2]);
      doc.rect(0, 0, 210, 55, 'F');
      
      // Accent line
      doc.setFillColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.rect(0, 55, 210, 1.5, 'F');

      // 2. Logo & Brand
      doc.setFillColor(40, 40, 60);
      doc.roundedRect(15, 12, 22, 22, 5, 5, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.text("M", 21.5, 27);

      doc.setFontSize(24);
      doc.text("GRUPO MORE", 45, 24);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("PRECISIÓN · CALIDAD · IDENTIDAD CLOUD", 45, 30);

      // 3. Order ID Box
      doc.setFillColor(255, 255, 255, 0.05);
      doc.roundedRect(155, 12, 40, 30, 4, 4, 'F');
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("ORDEN DE SERVICIO", 158, 18);
      doc.setFontSize(18);
      doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.text(`#${orderId}`, 158, 30);

      // 4. Client & Times Row
      let y = 75;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("INFORMACIÓN TÉCNICA Y CLIENTE", 15, y);
      doc.setDrawColor(COLORS.SLATE_100[0], COLORS.SLATE_100[1], COLORS.SLATE_100[2]);
      doc.line(15, y + 2, 195, y + 2);

      y += 15;
      // Client Details
      doc.setTextColor(COLORS.DARK[0], COLORS.DARK[1], COLORS.DARK[2]);
      doc.setFontSize(10);
      doc.text("CLIENTE:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerName.toUpperCase(), 45, y);
      
      doc.setFont("helvetica", "bold");
      doc.text("CONTACTO:", 15, y + 8);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerPhone, 45, y + 8);

      doc.setFont("helvetica", "bold");
      doc.text("RESPONSABLE:", 15, y + 16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.text(order.responsible.toUpperCase(), 45, y + 16);

      // Dates Details (Right side)
      doc.setTextColor(COLORS.DARK[0], COLORS.DARK[1], COLORS.DARK[2]);
      doc.setFont("helvetica", "bold");
      doc.text("INGRESO:", 120, y);
      doc.setFont("helvetica", "normal");
      doc.text(format(new Date(order.createdAt), "dd/MM/yyyy, p", { locale: es }), 150, y);

      doc.setFont("helvetica", "bold");
      doc.text("ENTREGA:", 120, y + 8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text(format(new Date(order.deliveryDate), "dd/MM/yyyy - 17:00", { locale: es }), 150, y + 8);

      doc.setTextColor(COLORS.DARK[0], COLORS.DARK[1], COLORS.DARK[2]);
      doc.setFont("helvetica", "bold");
      doc.text("ESTADO:", 120, y + 16);
      doc.setFont("helvetica", "normal");
      doc.text(order.status.toUpperCase(), 150, y + 16);

      // 5. Services Section
      y += 35;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("SERVICIOS REQUERIDOS", 15, y);
      doc.line(15, y + 2, 195, y + 2);

      y += 12;
      doc.setFontSize(10);
      doc.setTextColor(COLORS.DARK[0], COLORS.DARK[1], COLORS.DARK[2]);
      const servicesText = order.services.join(" + ");
      const splitServices = doc.splitTextToSize(servicesText, 170);
      doc.text(splitServices, 15, y);
      y += (splitServices.length * 6);

      if (order.notes) {
        y += 5;
        doc.setFillColor(COLORS.SLATE_100[0], COLORS.SLATE_100[1], COLORS.SLATE_100[2]);
        const splitNotes = doc.splitTextToSize(`OBS: ${order.notes}`, 170);
        const rectH = (splitNotes.length * 5) + 10;
        doc.roundedRect(15, y, 180, rectH, 3, 3, 'F');
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(splitNotes, 20, y + 7);
        y += rectH + 10;
      } else {
        y += 10;
      }

      // 6. Financial Summary (Premium Table Style)
      doc.setFillColor(COLORS.DARK[0], COLORS.DARK[1], COLORS.DARK[2]);
      doc.roundedRect(15, y, 180, 25, 4, 4, 'F');
      
      let fy = y + 10;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(150, 150, 150);
      doc.text("TOTAL ESTIMADO", 25, fy);
      doc.text("ABONO RECIBIDO", 85, fy);
      doc.text("SALDO PENDIENTE", 145, fy);

      fy += 8;
      doc.setFontSize(14);
      doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.text(`$ ${order.totalCost.toLocaleString()}`, 25, fy);
      doc.setTextColor(COLORS.EMERALD[0], COLORS.EMERALD[1], COLORS.EMERALD[2]);
      doc.text(`$ ${order.depositAmount.toLocaleString()}`, 85, fy);
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.text(`$ ${order.pendingBalance.toLocaleString()}`, 145, fy);

      // 7. QR & Final Footer
      y += 45;
      if (y > 220) { doc.addPage(); y = 20; }
      
      doc.addImage(qrDataUrl, 'PNG', 15, y, 25, 25);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.SLATE_600[0], COLORS.SLATE_600[1], COLORS.SLATE_600[2]);
      doc.text("ESCANEAR PARA SEGUIMIENTO", 15, y + 28);
      doc.text("EN TIEMPO REAL CLOUD", 15, y + 31);

      // Signature line
      doc.setDrawColor(COLORS.SLATE_600[0], COLORS.SLATE_600[1], COLORS.SLATE_600[2]);
      doc.line(100, y + 20, 180, y + 20);
      doc.setFont("helvetica", "bold");
      doc.text(order.responsible.toUpperCase(), 140, y + 25, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text("FIRMA AUTORIZADA", 140, y + 29, { align: "center" });

      // Global Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text(`Este documento es una representación digital de la orden #${orderId}. Generado por GRUPO MORE CLOUD v2.0 - Página ${i} de ${pageCount}`, 105, 288, { align: "center" });
      }

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
