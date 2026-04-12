import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { record, type } = await req.json()
    
    // Solo actuar en inserciones (nuevas órdenes/cotizaciones)
    if (type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Ignored event type' }), { status: 200 })
    }

    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!accessToken || !phoneNumberId) {
      throw new Error('Credenciales de WhatsApp no configuradas en Supabase Secrets.')
    }

    const isQuote = record.record_type === 'cotizacion'
    const phone = record.customer_phone.replace(/\D/g, '')
    
    // Sugerencia de plantillas (el usuario deberá crearlas en Meta con estos nombres)
    const templateName = isQuote ? 'cotizacion_generada' : 'nueva_orden_servicio'
    
    // Parámetros para la plantilla
    // Nota: El orden de los parámetros debe coincidir con la configuración en Meta Dashboard
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: record.customer_name },
          { type: 'text', text: record.id.toString().slice(-6).toUpperCase() },
          { type: 'text', text: `$${Number(record.total_cost).toLocaleString()}` },
          { type: 'text', text: record.delivery_date ? new Date(record.delivery_date).toLocaleDateString() : 'Pronto' }
        ]
      }
    ]

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es' },
          components
        }
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`WhatsApp API Error: ${JSON.stringify(result)}`)
    }

    return new Response(JSON.stringify({ success: true, result }), {
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
