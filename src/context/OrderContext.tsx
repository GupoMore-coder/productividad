import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStorage } from '@/lib/storageService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

        // History and alerts...
        if (updates.status && updates.status !== existingOrder.status) {
          await supabase.from('order_history').insert({ 
            order_id: id, type: 'cambio_estado', user_name: uName, 
            description: `Cambio de estado: ${existingOrder.status} ➔ ${updates.status}` 
          });
        }
      } else {
        // Mock update logic not strictly needed if we invalidate, but good for local-only
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
    return (queryClient.getQueryData(['orders']) as ServiceOrder[]).find(o => o.id === id)!;
  };

  const downloadOrderPdf = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const { default: jsPDF } = await import('jspdf');
      const QRCode = await import('qrcode');
      
      const doc = new jsPDF();
      const trackingUrl = `${window.location.origin}/status/${orderId}`;
      const qrDataUrl = await QRCode.toDataURL(trackingUrl);

      const PRIMARY_PURPLE = [124, 58, 237];
      const SLATE_DARK = [15, 23, 42];
      const SLATE_GRAY = [100, 116, 139];

      doc.setFillColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("ORDEN DE SERVICIO", 20, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(PRIMARY_PURPLE[0], PRIMARY_PURPLE[1], PRIMARY_PURPLE[2]);
      doc.text("GRUPO MORE - PRODUCTIVIDAD Y GESTIÓN", 20, 28);

      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text(`ID: #${orderId.toString()}`, 20, 35);
      doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 80, 35);

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(165, 5, 35, 35, 3, 3, 'F');
      doc.addImage(qrDataUrl, 'PNG', 167.5, 7.5, 30, 30);
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("SEGUIMIENTO DIGITAL", 166, 44);

      let y = 60;
      doc.setFontSize(12);
      doc.setTextColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
      doc.text("INFORMACIÓN DEL CLIENTE", 20, y);
      doc.setDrawColor(PRIMARY_PURPLE[0], PRIMARY_PURPLE[1], PRIMARY_PURPLE[2]);
      doc.setLineWidth(0.5);
      doc.line(20, y + 2, 190, y + 2);

      y += 12;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Nombre:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerName, 50, y);

      y += 8;
      doc.setFont("helvetica", "bold");
      doc.text("Teléfono:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerPhone, 50, y);

      y += 20;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DETALLES DEL TRABAJO", 20, y);
      doc.line(20, y + 2, 190, y + 2);

      y += 12;
      doc.setFontSize(10);
      doc.text("Servicios Contratados:", 20, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const servicesText = order.services.join(", ");
      const splitServices = doc.splitTextToSize(servicesText, 160);
      doc.text(splitServices, 20, y);
      y += (splitServices.length * 5);

      if (order.notes) {
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Observaciones:", 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const splitNotes = doc.splitTextToSize(order.notes, 170);
        doc.text(splitNotes, 20, y);
        y += (splitNotes.length * 5);
      }

      y += 15;
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFillColor(245, 245, 250);
      doc.roundedRect(20, y, 170, 25, 3, 3, 'F');
      
      let fy = y + 10;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(SLATE_GRAY[0], SLATE_GRAY[1], SLATE_GRAY[2]);
      doc.text("TOTAL ESTIMADO", 30, fy);
      doc.text("ABONO RECIBIDO", 85, fy);
      doc.text("SALDO PENDIENTE", 145, fy);

      fy += 7;
      doc.setFontSize(12);
      doc.setTextColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
      doc.text(`$${order.totalCost.toLocaleString()}`, 30, fy);
      doc.setTextColor(20, 150, 80);
      doc.text(`$${order.depositAmount.toLocaleString()}`, 85, fy);
      doc.setTextColor(180, 50, 50);
      doc.text(`$${order.pendingBalance.toLocaleString()}`, 145, fy);

      if (order.photos && order.photos.length > 0) {
        y += 50;
        if (y > 230) { doc.addPage(); y = 20; }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
        doc.text("EVIDENCIAS FOTOGRÁFICAS", 20, y);
        doc.line(20, y + 2, 190, y + 2);
        
        y += 10;
        const imgSize = 40;
        const margin = 2;
        const startX = 20;
        let currentX = startX;

        for (let i = 0; i < order.photos.length; i++) {
          try {
            doc.addImage(order.photos[i], 'JPEG', currentX, y, imgSize, imgSize);
            currentX += imgSize + margin;
            if ((i + 1) % 4 === 0) {
              currentX = startX;
              y += imgSize + margin;
              if (y > 250) { doc.addPage(); y = 20; }
            }
          } catch (e) {
            console.warn("Could not add image to PDF:", order.photos[i]);
          }
        }
      }

      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Documento generado automáticamente por Sistema Grupo More - Página ${i} de ${pageCount}`, 105, 285, { align: "center" });
      }

      doc.save(`ORDEN_${orderId}.pdf`);
    } catch (err) {
      console.error('Error generando PDF local:', err);
      alert('Error al generar el PDF. Reintente en un momento.');
    }
  };

  return (
    <OrderContext.Provider value={{ orders, archivedOrders, serviceTypes, teamMembers, loading, createOrder, updateOrder, downloadOrderPdf }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
