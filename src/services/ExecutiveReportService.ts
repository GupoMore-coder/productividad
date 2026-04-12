import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

/**
 * ExecutiveReportService v1.0 - Premium Management Reporting
 * Designed for More Paper & Design Executive Intelligence
 */

export interface ExecutiveStats {
  period: string;
  generatedBy: string;
  financial: {
    totalSales: number;
    totalCollected: number;
    totalPending: number;
    weeklyForecast: number;
    quotesConversionRate: number;
  };
  productivity: {
    tasksEfficiency: number;
    ordersEfficiency: number;
    avgSLA: number;
    loyaltyRatio: number;
    ranking: Array<{ label: string; score: number; efficiency: number; sales: number }>;
  };
  administrative: {
    userCount: number;
    onlineUsers: number;
    systemHealth: 'optimal' | 'degraded' | 'critical';
  };
}

const COLORS = {
  PRIMARY: [124, 58, 237], // Purple 600
  SECONDARY: [245, 158, 11], // Amber 500
  DEEP_BG: [15, 10, 21],
  SLATE_900: [30, 41, 59],
  SLATE_700: [51, 65, 85],
  SLATE_500: [100, 116, 139],
  WHITE: [255, 255, 255],
  EMERALD: [16, 185, 129],
  RED: [239, 68, 68]
};

export const generateExecutiveReport = async (stats: ExecutiveStats) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Helper: Draw Gradient Header ---
  const drawHeader = (title: string, subtitle: string) => {
    doc.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Decorative line
    doc.setFillColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
    doc.rect(0, 44, pageWidth, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('More Paper & Design', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
    doc.text('INTELLIGENT BUSINESS SOLUTIONS', 15, 26);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pageWidth - 15, 22, { align: 'right' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
    doc.text(subtitle.toUpperCase(), pageWidth - 15, 28, { align: 'right' });
  };

  // --- Helper: Draw Footer ---
  const drawFooter = (pageNum: number) => {
    doc.setFillColor(COLORS.DEEP_BG[0], COLORS.DEEP_BG[1], COLORS.DEEP_BG[2]);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
    doc.setFontSize(7);
    doc.text(`Generado por ${stats.generatedBy} • ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, pageHeight - 7);
    doc.text(`Página ${pageNum}`, pageWidth - 15, pageHeight - 7, { align: 'right' });
  };

  // --- PAGE 1: EXECUTIVE SUMMARY ---
  drawHeader('Reporte Gerencial', 'Análisis de Inteligencia de Negocios');

  let currentY = 60;

  // Introduction
  doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. RESUMEN EJECUTIVO', 15, currentY);
  currentY += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.SLATE_700[0], COLORS.SLATE_700[1], COLORS.SLATE_700[2]);
  const intro = `Este documento presenta el análisis integral del desempeño financiero, operativo y administrativo de More Paper & Design para el periodo ${stats.period}. Los datos aquí presentados han sido auditados en tiempo real por el motor Vanguard v17.`;
  const splitIntro = doc.splitTextToSize(intro, pageWidth - 30);
  doc.text(splitIntro, 15, currentY);
  currentY += splitIntro.length * 5 + 5;

  // KPI Overview Cards (Simulated with Rects)
  const drawCard = (x: number, y: number, w: number, h: number, label: string, value: string, subvalue: string, color: number[]) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y, 2, h, 'F');

    doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x + 6, y + 8);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(value, x + 6, y + 18);

    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(7);
    doc.text(subvalue.toUpperCase(), x + 6, y + 24);
  };

  drawCard(15, currentY, 55, 30, 'Ventas Totales', `$${stats.financial.totalSales.toLocaleString()}`, 'Ingreso Bruto', COLORS.PRIMARY);
  drawCard(77.5, currentY, 55, 30, 'Recaudo Real', `$${stats.financial.totalCollected.toLocaleString()}`, `${((stats.financial.totalCollected / stats.financial.totalSales) * 100).toFixed(1)}% Cobrado`, COLORS.EMERALD);
  drawCard(140, currentY, 55, 30, 'Eficiencia Op.', `${stats.productivity.ordersEfficiency.toFixed(1)}%`, 'Tasa de Cierre', COLORS.SECONDARY);

  currentY += 45;

  // Predictive Analysis Section
  doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. ANÁLISIS PREDICTIVO Y CONVERSIÓN', 15, currentY);
  currentY += 8;

  const formulaQuote = `FORMULA: Ratio de Conversión = (Ordenes Generadas / Cotizaciones Creadas) * 100`;
  doc.setFontSize(7);
  doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
  doc.text(formulaQuote, 15, currentY);
  currentY += 5;

  // Stats text
  doc.setFontSize(9);
  doc.setTextColor(COLORS.SLATE_700[0], COLORS.SLATE_700[1], COLORS.SLATE_700[2]);
  doc.text(`• Pronóstico de Ventas (7 días): $${stats.financial.weeklyForecast.toLocaleString()}`, 20, currentY);
  currentY += 6;
  doc.text(`• Eficacia de Cotización: ${stats.financial.quotesConversionRate.toFixed(1)}%`, 20, currentY);
  currentY += 6;
  doc.text(`• SLA Promedio de Entrega: ${stats.productivity.avgSLA.toFixed(1)} horas`, 20, currentY);
  currentY += 6;
  doc.text(`• Tasa de Retención (Loyalty): ${stats.productivity.loyaltyRatio.toFixed(0)}%`, 20, currentY);
  
  currentY += 20;

  // --- PAGE 2: PRODUCTIVITY RANKING ---
  doc.addPage();
  drawHeader('Análisis Operativo', 'Ranking de Desempeño y Productividad');
  
  currentY = 60;
  doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ESCALAFÓN DE PRODUCTIVIDAD (TOP 10)', 15, currentY);
  currentY += 10;

  // Table Header
  doc.setFillColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
  doc.rect(15, currentY, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('POS', 20, currentY + 5.5);
  doc.text('COLABORADOR', 35, currentY + 5.5);
  doc.text('VENTAS', 85, currentY + 5.5);
  doc.text('EFICIENCIA', 125, currentY + 5.5);
  doc.text('PUNTAJE (SCORE)', 165, currentY + 5.5);

  currentY += 8;

  // Table Rows (Manual)
  stats.productivity.ranking.slice(0, 10).forEach((entry, i) => {
    const isEven = i % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY, pageWidth - 30, 8, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', isEven ? 'bold' : 'normal');
    doc.text(`${i + 1}`, 20, currentY + 5.5);
    doc.text(`@${entry.label}`, 35, currentY + 5.5);
    doc.text(`$${entry.sales.toLocaleString()}`, 85, currentY + 5.5);
    doc.text(`${entry.efficiency.toFixed(1)}%`, 125, currentY + 5.5);
    
    // Draw small bar for score
    const barW = 15;
    const filledW = (entry.score / 100) * barW;
    doc.setFillColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
    doc.rect(165, currentY + 3, barW, 2, 'F');
    doc.setFillColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
    doc.rect(165, currentY + 3, filledW, 2, 'F');
    
    doc.text(`${entry.score.toFixed(1)}`, 185, currentY + 5.5);

    currentY += 8;
  });

  currentY += 15;

  // Administrative Health
  doc.setTextColor(COLORS.SLATE_900[0], COLORS.SLATE_900[1], COLORS.SLATE_900[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. AUDITORIA ADMINISTRATIVA', 15, currentY);
  currentY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`• Colaboradores en Planta: ${stats.administrative.userCount} registrados`, 20, currentY);
  currentY += 6;
  doc.text(`• Conectividad Actual: ${stats.administrative.onlineUsers} usuarios en línea`, 20, currentY);
  currentY += 6;
  doc.text(`• Estado del Ecosistema:`, 20, currentY);
  
  const healthTxt = stats.administrative.systemHealth === 'optimal' ? 'ÓPTIMO' : stats.administrative.systemHealth === 'degraded' ? 'DEGRADADO' : 'CRÍTICO';
  const healthColor = stats.administrative.systemHealth === 'optimal' ? COLORS.EMERALD : stats.administrative.systemHealth === 'degraded' ? COLORS.SECONDARY : COLORS.RED;
  
  doc.setTextColor(healthColor[0], healthColor[1], healthColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(healthTxt, 65, currentY);

  drawFooter(1);
  doc.setPage(1);
  drawFooter(1);
  doc.setPage(2);
  drawFooter(2);

  doc.save(`Reporte_Gerencial_More_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
