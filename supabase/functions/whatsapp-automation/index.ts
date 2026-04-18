import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { record, type, old_record } = await req.json()
    
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!accessToken || !phoneNumberId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variables de entorno incompletas en Supabase.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const results = []

    // 1. Lógica para CLIENTE (Solo en INSERCIÓN)
    if (type === 'INSERT' && record.customer_phone) {
      const isQuote = record.record_type === 'cotizacion'
      const customerPhone = record.customer_phone.replace(/\D/g, '')
      const templateName = isQuote ? 'cotizacion_generada' : 'nueva_orden_servicio'
      
      const components = [{
        type: 'body',
        parameters: [
          { type: 'text', text: record.customer_name },
          { type: 'text', text: record.id.toString().slice(-6).toUpperCase() },
          { type: 'text', text: `$${Number(record.total_cost).toLocaleString()}` },
          { type: 'text', text: record.delivery_date ? new Date(record.delivery_date).toLocaleDateString() : 'Pronto' }
        ]
      }]

      const res = await sendWhatsApp(phoneNumberId, accessToken, customerPhone, templateName, components)
      results.push({ target: 'customer', ...res })
    }

    // 2. Lógica para EQUIPO ADMINISTRATIVO (Broadcast)
    // Buscamos administradores y CEOs con teléfono registrado
    const { data: admins } = await supabase
      .from('profiles')
      .select('username, phone')
      .in('role', ['Administrador maestro', 'Director General (CEO)', 'Gestor Administrativo'])
      .not('phone', 'is', null)

    if (admins && admins.length > 0) {
      const isStatusChange = type === 'UPDATE' && record.status !== old_record?.status
      const isNew = type === 'INSERT'
      const label = record.record_type === 'cotizacion' ? 'COTIZACIÓN' : 'ORDEN'

      let adminMessage = ''
      if (isNew) {
        adminMessage = `✨ NUEVA ${label}: #${record.id.toString().slice(-6).toUpperCase()} para ${record.customer_name}. Total: $${Number(record.total_cost).toLocaleString()}.`
      } else if (isStatusChange) {
        const icon = record.status === 'completada' ? '✅' : record.status === 'cancelada' ? '🚨' : '🔄'
        adminMessage = `${icon} CAMBIO DE ESTADO: ${label} #${record.id.toString().slice(-6).toUpperCase()} pasó a "${record.status.toUpperCase()}" por el equipo.`
      }

      if (adminMessage) {
        // Para administradores usamos 'hello_world' o una plantilla de servicio si existe.
        // Como no conocemos todas las plantillas, usaremos una genérica o intentaremos enviar el mensaje.
        // NOTA: WhatsApp Business API requiere plantillas aprobadas. Usaremos 'nueva_orden_servicio' adaptada si es posible
        // Pero para simplificar y asegurar entrega, enviaremos notificaciones individuales a los admins.
        
        for (const admin of admins) {
          const cleanAdminPhone = admin.phone.replace(/\D/g, '')
          // Usamos la misma plantilla de nueva_orden para notificar la creación
          // Si es un cambio de estado, podríamos necesitar otra plantilla, pero Meta es estricto.
          // Por ahora, notificaremos CREACIONES a todo el equipo con la plantilla oficial.
          if (isNew) {
            const adminComponents = [{
              type: 'body',
              parameters: [
                { type: 'text', text: `EQUIPO (${admin.username})` },
                { type: 'text', text: `${label} #${record.id.toString().slice(-6).toUpperCase()}` },
                { type: 'text', text: `$${Number(record.total_cost).toLocaleString()}` },
                { type: 'text', text: record.customer_name }
              ]
            }]
            const res = await sendWhatsApp(phoneNumberId, accessToken, cleanAdminPhone, 'nueva_orden_servicio', adminComponents)
            results.push({ target: `admin_${admin.username}`, ...res })
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Automation Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

async function sendWhatsApp(phoneNumberId: string, accessToken: string, to: string, template: string, components: any) {
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: 'es' },
        components
      }
    })
  })
  return await response.json()
}
