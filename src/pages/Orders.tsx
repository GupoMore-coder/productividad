import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders, ServiceOrder, OrderHistoryEntry } from '../context/OrderContext';
import CreateOrderModal from '../components/CreateOrderModal';
import { jsPDF } from 'jspdf';
import OrderStatusModal from '../components/OrderStatusModal';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Timeline Entry Component ──────────────────────────────────────
const HistoryItem = ({ entry }: { entry: OrderHistoryEntry }) => {
  const icon = {
    creacion: '✨',
    cambio_estado: '🔄',
    financiero: '💰',
    observacion: '💬',
    vencimiento: '⚠️',
    modificacion: '🛠️'
  }[entry.type] || '📌';

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '12px', position: 'relative' }}>
       <div style={{ position: 'absolute', left: '-7px', top: '2px', background: 'var(--bg-color)', borderRadius: '50%', padding: '2px' }}>
         {icon}
       </div>
       <div style={{ flex: 1 }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
           <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-color)' }}>{entry.userName}</span>
           <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
             {format(new Date(entry.timestamp), 'dd/MM HH:mm', { locale: es })}
           </span>
         </div>
         <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{entry.description}</p>
       </div>
    </div>
  );
};

export default function Orders() {
  const { user } = useAuth();
  const { orders, updateOrder, archivedOrders } = useOrders();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | undefined>(undefined);

  const [filter, setFilter] = useState<'activas' | 'inactivas'>('activas');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const toggleHistory = (orderId: string) => {
    setExpandedHistory(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null); // stores order id being generated

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetOrderStatus, setTargetOrderStatus] = useState<'completada' | 'cancelada' | null>(null);
  const [targetOrder, setTargetOrder] = useState<ServiceOrder | null>(null);

  const myUserId = user?.id || user?.email || '';

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

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Date filter (by deliveryDate)
      if (startDate) {
        if (new Date(o.deliveryDate) < new Date(startDate)) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(o.deliveryDate) > end) return false;
      }

      // Text filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = o.id.toLowerCase().includes(query);
        const matchesCustomer = o.customerName.toLowerCase().includes(query);
        const matchesCreator = o.createdBy.toLowerCase().includes(query);
        const matchesResponsible = o.responsible.toLowerCase().includes(query);
        const matchesNotes = o.notes ? o.notes.toLowerCase().includes(query) : false;
        const matchesServices = o.services.some(s => s.toLowerCase().includes(query));
        const matchesStatus = o.status.toLowerCase().replace('_', ' ').includes(query);

        return matchesId || matchesCustomer || matchesCreator || matchesResponsible || matchesNotes || matchesServices || matchesStatus;
      }
      return true;
    });
  }, [orders, searchQuery, startDate, endDate]);

  const activeOrders = useMemo(() => {
    return filteredOrders.filter(o => 
      ['recibida', 'en_proceso', 'pendiente_entrega'].includes(o.status) || 
      (o.status === 'vencida' && !o.cancelReason)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders]);

  const inactiveOrders = useMemo(() => {
    return filteredOrders.filter(o => 
      ['completada', 'cancelada'].includes(o.status) || 
      (o.status === 'vencida' && o.cancelReason)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders]);

  const displayedOrders = filter === 'activas' ? activeOrders : inactiveOrders;

  const handleStatusChange = async (id: string, newStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (newStatus === 'completada' || newStatus === 'cancelada') {
      setTargetOrder(order);
      setTargetOrderStatus(newStatus as 'completada' | 'cancelada');
      setStatusModalOpen(true);
      return;
    }

    await updateOrder(id, { status: newStatus as any });
  };

  const confirmStatusChange = async (reason?: string) => {
    if (!targetOrder || !targetOrderStatus) return;
    await updateOrder(targetOrder.id, {
      status: targetOrderStatus,
      cancelReason: reason || undefined
    });
    setStatusModalOpen(false);
    setTargetOrder(null);
    setTargetOrderStatus(null);
  };

  const reactivateOrder = async (id: string) => {
    await updateOrder(id, { status: 'recibida', cancelReason: undefined });
  };

  const downloadPdf = async (order: ServiceOrder) => {
    setIsGeneratingPdf(order.id);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210; // A4 width mm
      const MARGIN = 14;
      const LINE = 7;
      let y = MARGIN;

      const fmtDate = (iso: string) => {
        try { return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: es }); } catch { return iso; }
      };

      // ── Dark background ───────────────────────────
      doc.setFillColor(26, 22, 34);
      doc.rect(0, 0, W, 297, 'F');

      // ── Header text ──────────────────────────
      doc.setFontSize(20);
      doc.setTextColor(212, 188, 143);
      doc.setFont('helvetica', 'bold');
      doc.text('Grupo More', MARGIN, y + 10);

      doc.setFontSize(8);
      doc.setTextColor(170, 170, 170);
      doc.setFont('helvetica', 'normal');
      doc.text('More Paper | Design', MARGIN, y + 16);

      // Order ID top-right
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDEN DE SERVICIO', W - MARGIN, y + 7, { align: 'right' });
      doc.setFontSize(12);
      doc.setTextColor(212, 188, 143);
      doc.text('#' + order.id, W - MARGIN, y + 14, { align: 'right' });

      y += 22;

      // ── Divider ──────────────────────────────────────────
      doc.setDrawColor(212, 188, 143);
      doc.line(MARGIN, y, W - MARGIN, y);
      y += LINE;

      // ── Helper: section header ───────────────────────────
      const sectionHeader = (title: string) => {
        doc.setFontSize(10);
        doc.setTextColor(212, 188, 143);
        doc.setFont('helvetica', 'bold');
        doc.text(title, MARGIN, y);
        y += 2;
        doc.setDrawColor(212, 188, 143, 0.4);
        doc.line(MARGIN, y, W - MARGIN, y);
        y += LINE - 2;
        doc.setFont('helvetica', 'normal');
      };

      // ── Helper: field row ────────────────────────────────
      const field = (label: string, value: string, xOffset = 0) => {
        doc.setFontSize(9);
        doc.setTextColor(170, 170, 170);
        doc.text(label + ':', MARGIN + xOffset, y);
        doc.setTextColor(255, 255, 255);
        doc.text(value, MARGIN + xOffset + 28, y);
        y += LINE - 1;
      };

      // ── Client Data ──────────────────────────────────────
      sectionHeader('Datos del Cliente');
      field('Nombre', order.customerName);
      field('Telefono', order.customerPhone);
      field('Responsable', order.responsible);
      y += 2;

      // ── Timing ───────────────────────────────────────────
      sectionHeader('Tiempos Operativos');
      field('Creada', fmtDate(order.createdAt));
      field('Entrega', fmtDate(order.deliveryDate));
      field('Estado', order.status.toUpperCase().replace('_', ' '));
      y += 2;

      // ── Services ───────────────────────────────────────────
      sectionHeader('Servicios Requeridos');
      {
        const PILL_H = 8;
        const PILL_PAD_X = 4;
        const GAP_X = 4;
        const GAP_Y = 3;
        const MAX_X = W - MARGIN;
        const TEXT_Y_OFFSET = PILL_H / 2 + 1.2;
        let px = MARGIN;
        let py = y;
        order.services.forEach((svc) => {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const label = '  ' + svc + '  ';
          const textW = doc.getTextWidth(label);
          const pillW = textW + PILL_PAD_X * 2;
          if (px + pillW > MAX_X && px > MARGIN) { px = MARGIN; py += PILL_H + GAP_Y; }
          doc.setFillColor(40, 35, 55);
          doc.setDrawColor(212, 188, 143);
          doc.roundedRect(px, py, pillW + PILL_PAD_X, PILL_H, 1.5, 1.5, 'FD');
          doc.setTextColor(255, 255, 255);
          doc.text(label, px + PILL_PAD_X, py + TEXT_Y_OFFSET);
          px += pillW + PILL_PAD_X + GAP_X;
        });
        y = py + PILL_H + GAP_Y + 2;
        doc.setFont('helvetica', 'normal');
      }

      // ── Notes ────────────────────────────────────────────
      if (order.notes) {
        sectionHeader('Notas Adicionales');
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        const noteLines = doc.splitTextToSize('"' + order.notes + '"', W - MARGIN * 2);
        doc.text(noteLines, MARGIN, y);
        y += noteLines.length * (LINE - 1) + 2;
      }

      // ── Finance ──────────────────────────────────────────
      sectionHeader('Liquidacion Financiera');
      const col1 = MARGIN + 5;
      const col2 = W / 2 - 10;
      const col3 = W - MARGIN - 45;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 130);
      doc.text('COSTO TOTAL', col1, y + 4);
      doc.text('ABONADO (' + order.paymentStatus.toUpperCase() + ')', col2, y + 4);
      doc.text('SALDO PENDIENTE', col3, y + 4);
      doc.setFontSize(15); doc.setFont('helvetica', 'bold');
      doc.setTextColor(230, 230, 235); doc.text('$' + order.totalCost.toLocaleString('es-CO'), col1, y + 15);
      doc.setTextColor(74, 222, 128); doc.text('$' + order.depositAmount.toLocaleString('es-CO'), col2, y + 15);
      doc.setTextColor(251, 191, 36); doc.text('$' + order.pendingBalance.toLocaleString('es-CO'), col3, y + 15);
      y += 26;

      // ── QR Code Injection ────────────────────────────────
      try {
        // Detect if localhost and suggest using a local IP or production URL for mobile access
        const origin = window.location.hostname === 'localhost' ? 'http://YOUR_LOCAL_IP:5173' : window.location.origin;
        const publicUrl = `${origin}/status/${order.id}`;
        const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`;
        
        // Fetch QR as base64
        const resp = await fetch(qrApi);
        const blob = await resp.blob();
        const reader = new FileReader();
        const qrB64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Place QR in a corner or side
        const QR_SIZE = 35;
        doc.setFillColor(255,255,255);
        doc.roundedRect(W - MARGIN - QR_SIZE - 2, y, QR_SIZE + 4, QR_SIZE + 4, 2, 2, 'F');
        doc.addImage(qrB64, 'PNG', W - MARGIN - QR_SIZE, y + 2, QR_SIZE, QR_SIZE);
        
        doc.setFontSize(7);
        doc.setTextColor(212, 188, 143);
        doc.text('ESCANEAME PARA', W - MARGIN - QR_SIZE/2 - 2, y + QR_SIZE + 8, { align: 'center' });
        doc.text('VER EL ESTADO', W - MARGIN - QR_SIZE/2 - 2, y + QR_SIZE + 11, { align: 'center' });
        
        y += QR_SIZE + 15;
      } catch (err) {
        console.warn('Could not generate QR for PDF:', err);
      }

      // ── Photos and History (Existing logic continues...) ──
      // [Remaining logic omitted for brevity in response but kept in file]
      // I will actually replace the whole block to be safe.



      // ── Photos embedded (3-col grid, ~55mm wide each) ────
      if (order.photos && order.photos.length > 0) {
        // Check remaining space; add new page if < 80mm left
        if (y > 210) {
          doc.addPage();
          doc.setFillColor(26, 22, 34);
          doc.rect(0, 0, W, 297, 'F');
          y = MARGIN;
        }

        sectionHeader(`Evidencias Fotograficas (${order.photos.length})`);

        const IMG_W = 55;   // mm per image
        const IMG_H = 45;   // mm height
        const IMG_GAP = 5;    // mm gap between images
        const COLS = 3;

        order.photos.forEach((photoB64, idx) => {
          const col = idx % COLS;
          const x = MARGIN + col * (IMG_W + IMG_GAP);

          // If starting a new row (except the very first) check page space
          if (col === 0 && idx !== 0) {
            y += IMG_H + IMG_GAP;
            if (y + IMG_H > 285) {
              doc.addPage();
              doc.setFillColor(26, 22, 34);
              doc.rect(0, 0, W, 297, 'F');
              y = MARGIN;
            }
          }

          try {
            // Border rectangle behind image
            doc.setDrawColor(212, 188, 143);
            doc.setFillColor(30, 26, 40);
            doc.roundedRect(x, y, IMG_W, IMG_H, 2, 2, 'FD');

            // Determine format from data URL prefix
            const isJpeg = photoB64.startsWith('data:image/jpeg') || photoB64.startsWith('data:image/jpg');
            const fmt = isJpeg ? 'JPEG' : 'PNG';
            doc.addImage(photoB64, fmt, x + 1, y + 1, IMG_W - 2, IMG_H - 2);

            // Small index label
            doc.setFontSize(6.5);
            doc.setTextColor(212, 188, 143);
            doc.setFont('helvetica', 'bold');
            doc.text(`Foto ${idx + 1}`, x + 1.5, y + IMG_H - 1.5);
          } catch {
            // If this specific image fails, draw a placeholder
            doc.setFillColor(40, 35, 55);
            doc.roundedRect(x, y, IMG_W, IMG_H, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setTextColor(130, 130, 130);
            doc.text('[Imagen no disponible]', x + IMG_W / 2, y + IMG_H / 2, { align: 'center' });
          }

          // After the last image, advance y past the current row
          if (idx === order.photos.length - 1) {
            y += IMG_H + IMG_GAP;
          }
        });
      }

      // ── Novedades / Seguimiento (History) ────────────────
      const noveltyEntries = (order.history || []).filter(h => h.type === 'observacion' || h.type === 'vencimiento');
      
      if (noveltyEntries.length > 0) {
        // Check space; add page if < 40mm left
        if (y > 250) {
          doc.addPage();
          doc.setFillColor(26, 22, 34);
          doc.rect(0, 0, W, 297, 'F');
          y = MARGIN;
        }

        sectionHeader(`Historial de Novedades y Seguimiento (${noveltyEntries.length})`);

        noveltyEntries.slice().reverse().forEach((h) => {
          doc.setFontSize(8);
          doc.setTextColor(212, 188, 143);
          doc.setFont('helvetica', 'bold');
          const timeStr = `[${fmtDate(h.timestamp)}] ${h.userName}: `;
          const timeW = doc.getTextWidth(timeStr);
          
          doc.text(timeStr, MARGIN, y);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(220, 220, 220);
          
          const msgLines = doc.splitTextToSize(h.description, W - MARGIN * 2 - timeW - 2);
          doc.text(msgLines, MARGIN + timeW + 1, y);
          
          const entryH = msgLines.length * 4 + 2;
          y += entryH;

          // Page break check within history
          if (y > 280) {
            doc.addPage();
            doc.setFillColor(26, 22, 34);
            doc.rect(0, 0, W, 297, 'F');
            y = MARGIN;
            sectionHeader('Continuacion Historial...');
          }
        });
        y += 4;
      }

      // ── Footer ───────────────────────────────────────────
      y += 4;
      doc.setDrawColor(255, 255, 255, 0.1);
      doc.line(MARGIN, y, W - MARGIN, y);
      y += LINE - 2;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(130, 130, 130);
      const creationDate = fmtDate(order.createdAt);
      doc.text('Documento generado electronicamente a traves de la red corporativa de Grupo More.', MARGIN, y);
      y += LINE - 3;
      doc.text(`Creada el: ${creationDate} por ${order.createdByRole || 'Personal Autorizado'}`, MARGIN, y);

      doc.save(`ORDEN_MORE_${order.id}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error al generar el PDF: ' + String(err));
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const handleEditClick = (order: ServiceOrder) => {
    setEditingOrder(order);
    setShowCreateModal(true);
  };

  const renderStatusPill = (status: string) => {
    const colors: Record<string, string> = {
      'recibida': 'var(--info-color, #3b82f6)',
      'en_proceso': 'var(--warning-color, #eab308)',
      'pendiente_entrega': 'var(--accent-color, #a855f7)',
      'completada': 'var(--success-color, #22c55e)',
      'cancelada': 'var(--danger-color, #ef4444)',
      'vencida': '#ff4d4d'
    };

    const labels: Record<string, string> = {
      'recibida': 'Recibida',
      'en_proceso': 'En Elaboración',
      'pendiente_entrega': 'Pte Entrega',
      'completada': 'Completada',
      'cancelada': 'Cancelada',
      'vencida': '⚠️ Vencida'
    };

    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '16px',
        fontSize: '0.75rem',
        fontWeight: 700,
        background: `${colors[status]}22`,
        color: colors[status],
        border: `1px solid ${colors[status]}55`
      }}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div style={{ padding: '24px 16px 100px 16px', maxWidth: '600px', margin: '0 auto' }} className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Órdenes de Servicio
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Gestión técnica y financiera
          </p>
        </div>
        <button
          onClick={() => { setEditingOrder(undefined); setShowCreateModal(true); }}
          style={{
            background: 'var(--accent-color)', color: '#000', border: 'none',
            padding: '8px 16px', borderRadius: '12px', fontWeight: 600,
            cursor: 'pointer', boxShadow: 'var(--shadow-glow)'
          }}
        >
          + Nueva Orden
        </button>
      </header>

      {/* Search and Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por orden, cliente, responsable, notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 36px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ padding: '0 16px', borderRadius: '12px', background: showFilters ? 'var(--accent-glow)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showFilters ? 'var(--accent-color)' : 'var(--glass-border)'}`, color: showFilters ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', transition: '0.2s' }}
            title="Filtros por Fecha"
          >
            📅
          </button>
        </div>

        {showFilters && (
          <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)', animation: 'fadeIn 0.2s', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Desde (Entrega)</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hasta (Entrega)</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }} />
            </div>
            {(startDate || endDate) && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)', border: '1px solid rgba(239, 68, 68, 0.5)', cursor: 'pointer', fontSize: '0.75rem', height: '35px' }}>✕ Limpiar</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setFilter('activas')}
          style={{ flex: 1, padding: '10px', borderRadius: '12px', background: filter === 'activas' ? 'var(--accent-color)' : 'transparent', border: filter === 'activas' ? 'none' : '1px solid var(--glass-border)', color: filter === 'activas' ? '#000' : 'var(--text-primary)', fontWeight: filter === 'activas' ? 600 : 400, cursor: 'pointer', transition: 'var(--transition-fast)' }}
        >
          Activas ({activeOrders.length})
        </button>
        <button
          onClick={() => setFilter('inactivas')}
          style={{ flex: 1, padding: '10px', borderRadius: '12px', background: filter === 'inactivas' ? 'var(--accent-color)' : 'transparent', border: filter === 'inactivas' ? 'none' : '1px solid var(--glass-border)', color: filter === 'inactivas' ? '#000' : 'var(--text-primary)', fontWeight: filter === 'inactivas' ? 600 : 400, cursor: 'pointer', transition: 'var(--transition-fast)' }}
        >
          Historial ({inactiveOrders.length})
        </button>
      </div>

      {displayedOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--glass-bg)', borderRadius: '16px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No hay órdenes en esta categoría.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {displayedOrders.map(order => {
            const deliveryDate = new Date(order.deliveryDate);
            const timeRemaining = formatDistanceToNow(deliveryDate, { addSuffix: true, locale: es });
            const isOverdue = deliveryDate < new Date() && filter === 'activas';
            const isCreator = order.createdBy === myUserId || user?.isSuperAdmin;

            return (
              <div key={order.id} className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Top header: ID, Pill */}
                <div style={{ padding: '16px 16px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {order.id}
                  </span>
                  {renderStatusPill(order.status)}
                </div>

                {/* Main Content */}
                <div style={{ padding: '0 16px 16px 16px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem' }}>{order.customerName}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      📞 {order.customerPhone}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Entrega</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isOverdue ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                      {format(deliveryDate, 'dd MMM, HH:mm', { locale: es })}
                    </div>
                    {filter === 'activas' && (
                      <div style={{ fontSize: '0.75rem', color: isOverdue ? 'var(--danger-color)' : 'var(--warning-color)' }}>
                        {timeRemaining}
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges / Services */}
                <div style={{ padding: '0 16px', display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {order.services.map(svc => (
                    <span key={svc} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 500 }}>
                      {svc}
                    </span>
                  ))}
                </div>

                {/* Fotos Thumbnail Preview */}
                {order.photos && order.photos.length > 0 && (
                  <div style={{ padding: '0 16px', marginBottom: '12px', display: 'flex', gap: '6px', overflowX: 'auto' }}>
                    {order.photos.map((p, i) => (
                      <img key={i} src={p} alt="foto" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--glass-border)' }} />
                    ))}
                  </div>
                )}

                {/* Notes and Cancel Reason */}
                {order.notes && (
                  <div style={{ padding: '0 16px', marginBottom: '16px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px', fontStyle: 'italic' }}>
                      "{order.notes}"
                    </p>
                  </div>
                )}
                {order.cancelReason && (
                  <div style={{ padding: '0 16px', marginBottom: '16px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px', borderRadius: '8px' }}>
                      <strong>{order.status === 'vencida' ? 'Justificación Vencimiento:' : 'Motivo Cancelación:'}</strong> {order.cancelReason}
                    </p>
                  </div>
                )}

                {/* Financial Bar */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TOTAL</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>$ {order.totalCost?.toLocaleString() || 0}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ABONO ({order.paymentStatus})</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--success-color)' }}>$ {order.depositAmount?.toLocaleString() || 0}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>SALDO</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: order.pendingBalance > 0 ? 'var(--warning-color)' : 'var(--text-primary)' }}>$ {order.pendingBalance?.toLocaleString() || 0}</span>
                  </div>
                </div>

                {/* Actions and Workflow (Bottom bar) */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* ⚠️ JUSTIFICACIÓN DE VENCIMIENTO ⚠️ */}
                  {order.status === 'vencida' && !order.cancelReason && isCreator && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid var(--danger-color)', animation: 'pulse 2s infinite' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--danger-color)', fontWeight: 600 }}>
                        Esta orden ha vencido. Por favor digita la justificación para informar al equipo:
                      </p>
                      <textarea
                        placeholder="Escribe el motivo del vencimiento..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const val = (e.target as HTMLTextAreaElement).value.trim();
                            if (val) {
                              updateOrder(order.id, { cancelReason: val });
                            } else {
                              alert('La justificación de vencimiento es obligatoria.');
                            }
                          }
                        }}
                        style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '8px', outline: 'none' }}
                      />
                      <button
                        onClick={(e) => {
                          const ta = (e.currentTarget.previousElementSibling as HTMLTextAreaElement);
                          const val = ta.value.trim();
                          if (val) {
                            updateOrder(order.id, { cancelReason: val });
                          } else {
                            alert('La justificación de vencimiento es obligatoria.');
                          }
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--danger-color)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Enviar Justificación y Notificar
                      </button>
                    </div>
                  )}

                  {/* Botones de Estado - Cualquier usuario  */}
                  {filter === 'activas' && order.status !== 'vencida' && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button onClick={() => handleStatusChange(order.id, 'en_proceso')} disabled={order.status === 'en_proceso'} style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '8px', background: order.status === 'en_proceso' ? 'var(--warning-color)' : 'transparent', color: order.status === 'en_proceso' ? 'black' : 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>En Proceso</button>
                      <button onClick={() => handleStatusChange(order.id, 'pendiente_entrega')} disabled={order.status === 'pendiente_entrega'} style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '8px', background: order.status === 'pendiente_entrega' ? 'var(--accent-color)' : 'transparent', color: order.status === 'pendiente_entrega' ? 'black' : 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>Pte Entrega</button>
                      <button onClick={() => handleStatusChange(order.id, 'completada')} style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--success-color)', border: '1px solid var(--success-color)', cursor: 'pointer' }}>Completar</button>
                      <button onClick={() => handleStatusChange(order.id, 'cancelada')} style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '8px', background: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  )}

                  {/* 💬 SECCIÓN DE OBSERVACIONES / NOVEDADES 💬 */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>AGREGAR NOVEDAD / OBSERVACIÓN</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <textarea
                        placeholder="Escribe una actualización o novedad..."
                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', minHeight: '38px', height: '38px', resize: 'none' }}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' && !e.shiftKey) {
                             e.preventDefault();
                             const val = (e.currentTarget as HTMLTextAreaElement).value.trim();
                             if (val) {
                               updateOrder(order.id, { newObservation: val });
                               (e.currentTarget as HTMLTextAreaElement).value = '';
                             }
                           }
                        }}
                      />
                      <button
                        onClick={(e) => {
                           const ta = (e.currentTarget.previousElementSibling as HTMLTextAreaElement);
                           const val = ta.value.trim();
                           if (val) {
                             updateOrder(order.id, { newObservation: val });
                             ta.value = '';
                           }
                        }}
                        style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0 12px', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Enviar
                      </button>
                    </div>
                  </div>

                  {/* 📜 HISTORIAL DE LA ORDEN 📜 */}
                  <div style={{ marginTop: '4px' }}>
                    <button
                      onClick={() => toggleHistory(order.id)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      {expandedHistory[order.id] ? '🔼 Ocultar Historial' : '🔽 Ver Historial / Novedades'}
                    </button>
                    
                    {expandedHistory[order.id] && (
                      <div style={{ marginTop: '12px', padding: '0 8px', animation: 'fadeIn 0.3s' }}>
                        {order.history && order.history.length > 0 ? (
                          order.history.slice().reverse().map(entry => (
                            <HistoryItem key={entry.id} entry={entry} />
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '10px' }}>
                            No hay registros históricos aún.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metadata y Edición */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Responsable Técnico: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{order.responsible}</span>
                      <div style={{ marginTop: '4px', fontSize: '0.68rem', color: 'var(--accent-color)', fontWeight: 500 }}>
                        📅 {format(new Date(order.createdAt), "dd/MM/yy 'a las' HH:mm", { locale: es })}
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                          por {order.createdByRole || 'Colaborador'}
                        </span>
                      </div>
                    </div>


                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          const origin = window.location.hostname === 'localhost' ? 'http://YOUR_LOCAL_IP:5173' : window.location.origin;
                          const url = `${origin}/status/${order.id}`;
                          const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
                          window.open(qr, '_blank');
                        }}
                        style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center' }}
                      >
                        📱 QR
                      </button>

                      <button
                        onClick={() => downloadPdf(order)}
                        disabled={isGeneratingPdf === order.id}
                        style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px', background: 'var(--accent-glow)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', cursor: isGeneratingPdf === order.id ? 'wait' : 'pointer', display: 'flex', gap: '4px', alignItems: 'center', opacity: isGeneratingPdf === order.id ? 0.6 : 1 }}
                      >
                        📄 {isGeneratingPdf === order.id ? 'Generando...' : 'PDF'}
                      </button>

                      {isCreator && filter === 'activas' && (
                        <button
                          onClick={() => handleEditClick(order)}
                          style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center' }}
                        >
                          ✏️ Editar
                        </button>
                      )}
                    </div>

                    {isCreator && filter === 'inactivas' && (
                      <button
                        onClick={() => reactivateOrder(order.id)}
                        style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px', background: 'var(--warning-color)', color: 'black', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center' }}
                      >
                        🔄 Reactivar
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Historial Archivado (30D+) ────────────────────────── */}
      {archivedOrders.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '16px',
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '24px',
          }}>
            <span style={{ fontSize: '1.3rem' }}>📁</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>Historial Archivado</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                Órdenes finalizadas hace más de 30 días — sólo lectura, texto plano permanente
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {archivedOrders.map(record => (
              <div
                key={record.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed var(--glass-border)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{record.id}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    opacity: 0.6,
                    whiteSpace: 'nowrap',
                    marginLeft: '8px',
                  }}>
                    Archivado: {new Date(record.archivedAt).toLocaleDateString('es-CO')}
                  </span>
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.6,
                  opacity: 0.85,
                  fontFamily: 'monospace',
                }}>
                  {record.summary}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}


      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingOrder(undefined); (window as any).__activeModal = undefined; }}
        initialOrder={editingOrder}
      />

      <OrderStatusModal
        isOpen={statusModalOpen}
        onClose={() => { setStatusModalOpen(false); setTargetOrderStatus(null); setTargetOrder(null); }}
        order={targetOrder}
        targetStatus={targetOrderStatus}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
