import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, templateName, parameters, orderId } = await req.json()

    if (!phone || !templateName) {
      throw new Error('phone y templateName son obligatorios')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    let accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    let phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    // Si no están en Deno.env, consultar la tabla secrets de Supabase
    if ((!accessToken || !phoneNumberId) && supabaseUrl && supabaseServiceKey) {
      try {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey)
        const { data: secrets } = await adminClient
          .from('secrets')
          .select('name, value')
          .in('name', ['WHATSAPP_ACCESS_TOKEN', 'SYSTEM_USER_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'])

        if (secrets) {
          const secretMap = Object.fromEntries(secrets.map((s: any) => [s.name, s.value]))
          accessToken = accessToken || secretMap['WHATSAPP_ACCESS_TOKEN'] || secretMap['SYSTEM_USER_TOKEN']
          phoneNumberId = phoneNumberId || secretMap['WHATSAPP_PHONE_NUMBER_ID']
        }
      } catch (dbError) {
        console.warn('No se pudieron recuperar secrets de WhatsApp desde DB:', dbError)
      }
    }

    if (!accessToken || !phoneNumberId) {
      console.log('WhatsApp desvinculado o credenciales no configuradas. Cancelando envío sin error.')
      return new Response(JSON.stringify({
        disabled: true,
        message: 'Servicio de WhatsApp no configurado o dado de baja. Se evita petición HTTP 400/401.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

    const components = [{
      type: 'body',
      parameters: parameters.map((value: string) => ({
        type: 'text',
        text: value
      }))
    }]

    const body = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es' },
        components
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message || 'Error al enviar mensaje WhatsApp')

    if (orderId && supabaseUrl && supabaseServiceKey) {
      try {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey)
        await adminClient.from('whatsapp_messages').insert({
          order_id: orderId,
          customer_phone: phone,
          message_text: `Plantilla enviada: ${templateName} | Params: ${parameters.join(' | ')}`,
          direction: 'outbound',
          metadata: {
            meta_message_id: result.messages?.[0]?.id,
            template: templateName,
            params: parameters
          }
        })
      } catch (dbErr) {
        console.error('Error guardando historial WhatsApp:', dbErr)
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})