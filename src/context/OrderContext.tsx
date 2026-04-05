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
  registerDeposit: (id: string, amount: number) => Promise<void>;
  reactivateOrder: (id: string) => Promise<void>;
  downloadOrderPdf: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType>({} as OrderContextType);

// Helper for mapping DB snake_case to CamelCase
const mapOrderFromDB = (o: any): ServiceOrder => ({
  id: o.id,
  customerName: o.customer_name,
  customerPhone: o.customer_phone,
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
        
        // Skip history for totalCost changes if User is Master Admin (as requested)
        const isMaster = user.role === 'Administrador maestro';
        const isTotalCostChange = updates.totalCost !== undefined && updates.totalCost !== existingOrder.totalCost;
        
        if (updates.depositAmount !== undefined && updates.depositAmount > existingOrder.depositAmount) {
          const added = updates.depositAmount - existingOrder.depositAmount;
          await supabase.from('order_history').insert({ 
            order_id: id, type: 'financiero', user_name: uName, 
            description: `Nuevo abono recibido: $${added.toLocaleString()} • Total abonado: $${updates.depositAmount.toLocaleString()}` 
          });
        }
        
        // Only log modification if it's NOT a silent financial correction by Master
        if (isTotalCostChange && !isMaster) {
           await supabase.from('order_history').insert({ 
            order_id: id, type: 'financiero', user_name: uName, 
            description: `Corrección de costo total: $${existingOrder.totalCost.toLocaleString()} -> $${updates.totalCost.toLocaleString()}` 
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

  const registerDeposit = async (id: string, amount: number) => {
    const order = (queryClient.getQueryData(['orders']) as ServiceOrder[])?.find(o => o.id === id);
    if (!order) return;
    
    const newTotalDeposit = order.depositAmount + amount;
    const newBalance = Math.max(0, order.totalCost - newTotalDeposit);
    const uName = user?.full_name || user?.username || user?.email || 'Sistema';

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('service_orders')
        .update({ 
          deposit_amount: newTotalDeposit, 
          pending_balance: newBalance,
          payment_status: newBalance === 0 ? 'pagado' : 'abono'
        })
        .eq('id', id);
      
      if (error) throw error;

      await supabase.from('order_history').insert({
        order_id: id,
        type: 'financiero',
        user_name: uName,
        description: `Abono recibido: $${amount.toLocaleString()} • Total abonado: $${newTotalDeposit.toLocaleString()}`
      });
    } else {
      // Mock logic
      const mockOrders = await mockStorage.getItem<ServiceOrder[]>('mock_orders') || [];
      const idx = mockOrders.findIndex(o => o.id === id);
      if (idx !== -1) {
        mockOrders[idx].depositAmount = newTotalDeposit;
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
    }
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    triggerHaptic('medium');
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
      
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const trackingUrl = `${window.location.origin}/status/${orderId}`;
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, { margin: 1, errorCorrectionLevel: 'H' });
      
      // Social Media QRs
      const qrInstagram = await QRCode.toDataURL('https://instagram.com/grupomore_', { margin: 1 });
      const qrWAMorePaper = await QRCode.toDataURL('https://wa.me/573045267493', { margin: 1 });
      const qrWAMoreDesign = await QRCode.toDataURL('https://wa.me/573183806342', { margin: 1 });

      // Load Logo
      const loadLogo = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
          img.src = '/logo.png';
        });
      };
      const logoBase64 = await loadLogo();

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

      // --- PAGE BACKGROUND (Premium Feel) ---
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 297, 'F');

      // --- HEADER: DARK BRANDED ---
      doc.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setFillColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.rect(0, 43, 210, 2, 'F');

      // Logo & Brand
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 15, 8, 25, 25);
      }
      
      doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("GRUPO MORE", 45, 22);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("Un regalo auténtico · Personalizar es identidad", 45, 28);

      // Order Info Box
      doc.setFillColor(255, 255, 255, 0.08);
      doc.roundedRect(145, 10, 55, 25, 4, 4, 'F');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(7);
      doc.text("ORDEN DE SERVICIO", 150, 16);
      doc.setTextColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.setFontSize(14);
      doc.text(`#${orderId.slice(-6).toUpperCase()}`, 150, 23);
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(order.status.replace('_', ' ').toUpperCase(), 150, 30);

      // --- CLIENT & RESPONSIBLE SECTION ---
      let y = 60;
      doc.setFillColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.roundedRect(10, y - 5, 115, 40, 5, 5, 'F');
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.PURPLE[0], COLORS.PURPLE[1], COLORS.PURPLE[2]);
      doc.text("INFORMACIÓN DEL CLIENTE", 15, y);

      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
      doc.setFont("helvetica", "bold");
      doc.text(order.customerName.toUpperCase(), 15, y);
      
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
      doc.text(`Contacto: ${order.customerPhone}`, 15, y);
      
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.SLATE_700[0], COLORS.SLATE_700[1], COLORS.SLATE_700[2]);
      doc.text("OPERADOR:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(order.responsible.toUpperCase(), 38, y);

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("ENTREGA:", 15, y);
      doc.setTextColor(COLORS.AMBER[0], COLORS.AMBER[1], COLORS.AMBER[2]);
      doc.text(format(new Date(order.deliveryDate), "dd 'de' MMMM, HH:mm", { locale: es }), 38, y);

      // --- QR CODE SECTION (High Priority) ---
      const qrX = 135;
      const qrY = 55;
      doc.setFillColor(COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2]);
      doc.roundedRect(qrX - 5, qrY - 5, 70, 40, 5, 5, 'F');
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, 25, 25);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
      doc.text("VALIDACIÓN DIGITAL", qrX + 28, qrY + 5);
      
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
      const qrExplanation = "Escanee este código para verificar el estado de su orden en tiempo real y acceder a la trazabilidad oficial 24/7 de Grupo More.";
      const splitQrText = doc.splitTextToSize(qrExplanation, 35);
      doc.text(splitQrText, qrX + 28, qrY + 10);

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
      const servicesText = order.services.join(" + ");
      const splitServices = doc.splitTextToSize(servicesText, 175);
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
        pdf.setTextColor(100, 116, 139);
        pdf.text("INSTAGRAM", 145, footY + 23);
        pdf.text("WA PAPER", 165, footY + 23);
        pdf.text("WA DESIGN", 185, footY + 23);

        pdf.setFontSize(6);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
        pdf.text("GRUPO MORE · UN REGALO AUTÉNTICO · PERSONALIZAR ES IDENTIDAD", 15, 294);
        
        // Page Numbering - Guaranteed Right Corner
        pdf.text(`Página ${pageNum}`, 200, 294, { align: 'right' } as any);
      };

      const addNewPage = (pdf: any) => {
        renderFooter(pdf, pdf.internal.pages.length - 1);
        pdf.addPage();
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, 0, 210, 297, 'F');
        return 25; // Reset Y
      };

      // --- AUDIT TRAIL (HISTORY) ---
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
        const descText = `${log.description} (por ${log.userName})`;
        const splitDesc = doc.splitTextToSize(descText, 165);
        const rowHeight = Math.max(8, (splitDesc.length * 4) + 4);

        if (y + rowHeight > 250) { y = addNewPage(doc); } 
        
        if (index % 2 === 0) {
          doc.setFillColor(240, 240, 250);
          doc.rect(10, y - 4, 190, rowHeight, 'F');
        }
        
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
        const dateStr = format(new Date(log.timestamp), "dd/MM HH:mm", { locale: es });
        doc.text(dateStr, 15, y + 1);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.SLATE_700[0], COLORS.SLATE_700[1], COLORS.SLATE_700[2]);
        doc.text(splitDesc, 35, y + 1);
        
        y += rowHeight;
      });

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
        const colWidth = (190 - (spacing * (colCount - 1))) / colCount;
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
            doc.addImage(order.photos[i], 'JPEG', 10 + (colIdx * (colWidth + spacing)), currentY, colWidth, imgHeight);
          } catch (err) {
            console.error("Error adding image to PDF:", err);
          }
        }
      }

      // Final Footer
      renderFooter(doc, doc.internal.pages.length - 1);


      doc.save(`OS_${orderId.slice(-6)}_${order.customerName.replace(/ /g, '_')}.pdf`);
      triggerHaptic('success');
    } catch (err) {
      console.error('Error generando PDF premium:', err);
      alert('Error en motor PDF. Reintente.');
    }
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      archivedOrders, 
      serviceTypes, 
      teamMembers, 
      loading, 
      createOrder, 
      updateOrder, 
      registerDeposit,
      reactivateOrder,
      downloadOrderPdf 
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
