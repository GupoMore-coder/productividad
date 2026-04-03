import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1?target=deno"
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId } = await req.json()
    if (!orderId) throw new Error('OrderId es obligatorio')

    // 1. Initialize Supabase Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch Order Data
    const { data: order, error } = await supabase
      .from('service_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) throw new Error(`Orden no encontrada: ${error?.message}`)

    // 3. Generate QR Code (Base64)
    const baseUrl = Deno.env.get('APP_URL') ?? 'https://antigravity-pwa.vercel.app'
    const statusUrl = `${baseUrl}/status/${order.id}`
    const qrDataUrl = await qrcode(statusUrl)

    // 4. Create PDF Document
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    })

    // --- PDF STYLING ---
    const primaryColor = [147, 51, 234] // Purple-600
    const textColor = [30, 41, 59] // Slate-800
    const lightText = [100, 116, 139] // Slate-500

    // Header Background Decoration
    doc.setFillColor( primaryColor[0], primaryColor[1], primaryColor[2] )
    doc.rect(0, 0, 210, 40, 'F')
    
    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(24)
    doc.text("ANTIGRAVITY", 20, 20)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("SOPORTE TÉCNICO Y DISEÑO", 20, 28)

    // Order ID Badge
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(150, 15, 40, 12, 2, 2, 'F')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(order.id, 170, 23, { align: 'center' })

    // Customer Section
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(14)
    doc.text("DATOS DEL CLIENTE", 20, 55)
    doc.setDrawColor(226, 232, 240)
    doc.line(20, 58, 190, 58)

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Nombre:", 20, 68)
    doc.setFont("helvetica", "normal")
    doc.text(order.customer_name, 45, 68)

    doc.setFont("helvetica", "bold")
    doc.text("Celular:", 20, 75)
    doc.setFont("helvetica", "normal")
    doc.text(order.customer_phone, 45, 75)

    doc.setFont("helvetica", "bold")
    doc.text("Fecha Entrega:", 120, 68)
    const dDate = new Date(order.delivery_date)
    doc.setFont("helvetica", "normal")
    doc.text(`${dDate.toLocaleDateString('es-CO')} - ${dDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, 150, 68)

    // Services Table
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("SERVICIOS REQUERIDOS", 20, 95)
    doc.line(20, 98, 190, 98)

    let y = 108
    doc.setFontSize(10)
    order.services.forEach((svc: string, index: number) => {
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(20, y - 5, 170, 8, 1, 1, 'F')
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(`${index + 1}. ${svc}`, 25, y)
      y += 10
    })

    // Notes
    if (order.notes) {
      doc.setTextColor(lightText[0], lightText[1], lightText[2])
      doc.setFontSize(12)
      doc.text("OBSERVACIONES", 20, y + 10)
      doc.setFontSize(9)
      doc.setFont("helvetica", "italic")
      const splitNotes = doc.splitTextToSize(order.notes, 160)
      doc.text(splitNotes, 20, y + 18)
      y += 25
    }

    // Financial Footer Section
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.line(120, y + 20, 190, y + 20)
    
    doc.setFont("helvetica", "bold")
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text("TOTAL:", 120, y + 30)
    doc.text(`$ ${order.total_cost.toLocaleString('es-CO')}`, 190, y + 30, { align: 'right' })

    doc.text("ABONO:", 120, y + 37)
    doc.setTextColor(16, 185, 129) // Emerald-500
    doc.text(`$ ${order.deposit_amount.toLocaleString('es-CO')}`, 190, y + 37, { align: 'right' })

    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(12)
    doc.text("SALDO PENDIENTE:", 120, y + 46)
    doc.setFontSize(14)
    doc.setTextColor(245, 158, 11) // Amber-500
    doc.text(`$ ${(order.total_cost - order.deposit_amount).toLocaleString('es-CO')}`, 190, y + 46, { align: 'right' })

    // QR Code and Tracking Info
    doc.addImage(qrDataUrl, 'PNG', 20, y + 20, 35, 35)
    doc.setTextColor(lightText[0], lightText[1], lightText[2])
    doc.setFontSize(8)
    doc.text("Escanea para el", 25, y + 58)
    doc.text("seguimiento en vivo", 24, y + 62)

    // Legal Footer
    doc.setTextColor(lightText[0], lightText[1], lightText[2])
    doc.setFontSize(7)
    doc.text("Este documento es un comprobante de servicio técnico interno.", 105, 285, { align: "center" })
    doc.text("Antigravity PWA - Gestión de Órdenes Segura", 105, 290, { align: "center" })

    // 5. Output as ArrayBuffer
    const pdfOutput = doc.output('arraybuffer')

    return new Response(pdfOutput, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Orden_${order.id}.pdf"`,
      },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
