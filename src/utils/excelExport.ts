import * as XLSX from 'xlsx';
import { ServiceOrder } from '../context/OrderContext';
import { format } from 'date-fns';

/**
 * Exporta los datos contables a un archivo Excel (.xlsx) con formato detallado.
 */
export const exportAccountingToExcel = (orders: ServiceOrder[]) => {
  // 1. Filtrar órdenes válidas (quitar pruebas y canceladas)
  const validOrders = orders.filter(o => !o.is_demo && o.status !== 'cancelada');

  // 2. Mapear datos a filas de Excel
  const rows = validOrders.map(order => ({
    'ID': (order.recordType === 'cotizacion' ? 'COT-' : 'ORD-') + order.id.slice(-6).toUpperCase(),
    'Fecha': format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm'),
    'Tipo': order.recordType === 'cotizacion' ? 'Cotización' : 'Orden de Servicio',
    'Cliente': order.customerName.toUpperCase(),
    'Teléfono': order.customerPhone,
    'Servicios': order.services.join(' + '),
    'Responsable': order.responsible,
    'Estado': order.status.replace('_', ' ').toUpperCase(),
    'Valor Total': order.totalCost,
    'Abonado': order.depositAmount,
    'Saldo Pendiente': order.pendingBalance,
    'Entrega': format(new Date(order.deliveryDate), 'dd/MM/yyyy HH:mm'),
  }));

  // 3. Crear el libro y la hoja
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Detallado');

  // 4. Formatear anchos de columna (opcional pero profesional)
  const wscols = [
    { wch: 15 }, // ID
    { wch: 18 }, // Fecha
    { wch: 15 }, // Tipo
    { wch: 25 }, // Cliente
    { wch: 15 }, // Teléfono
    { wch: 30 }, // Servicios
    { wch: 20 }, // Responsable
    { wch: 15 }, // Estado
    { wch: 15 }, // Valor Total
    { wch: 15 }, // Abonado
    { wch: 15 }, // Saldo Pendiente
    { wch: 18 }, // Entrega
  ];
  worksheet['!cols'] = wscols;

  // 5. Generar archivo y descargar
  const fileName = `Balance_Antigravity_${format(new Date(), 'yyyy_MM_dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
