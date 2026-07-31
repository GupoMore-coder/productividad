import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Leer payload opcional o de secrets
    let reqBody: any = {}
    try {
      reqBody = await req.json()
    } catch (_) {
      // Body vacio es aceptable si se leen de la BD
    }

    // 1. Obtener credenciales actuales desde secrets DB o variables de entorno
    const { data: secrets } = await supabase
      .from('secrets')
      .select('name, value')
      .in('name', [
        'WHATSAPP_ACCESS_TOKEN', 
        'SYSTEM_USER_TOKEN', 
        'WHATSAPP_PERMANENT_TOKEN', 
        'WHATSAPP_PHONE_NUMBER_ID', 
        'WHATSAPP_WABA_ID'
      ])

    const secretMap: Record<string, string> = {}
    if (secrets) {
      for (const s of secrets) {
        secretMap[s.name] = s.value
      }
    }

    const accessToken = reqBody.access_token || secretMap['WHATSAPP_ACCESS_TOKEN'] || secretMap['SYSTEM_USER_TOKEN'] || secretMap['WHATSAPP_PERMANENT_TOKEN'] || Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = reqBody.phone_number_id || secretMap['WHATSAPP_PHONE_NUMBER_ID'] || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    const wabaId = secretMap['WHATSAPP_WABA_ID'] || Deno.env.get('WHATSAPP_WABA_ID')

    const deregisterResults: Record<string, any> = {
      meta_deregister: 'skipped',
      waba_unsubscribe: 'skipped',
      tokens_deleted: false,
      cache_cleaned: false
    }

    // 2. PASO 1: Dar de baja el Webhook en Meta Graph API
    if (phoneNumberId && accessToken) {
      try {
        console.log(`Dando de baja suscripción del número ${phoneNumberId} en Meta...`)
        
        // Petición de desregistro de número en Meta Graph API
        const deregisterUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/deregister`
        const metaRes = await fetch(deregisterUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp'
          })
        })

        const metaResult = await metaRes.json()
        console.log('Respuesta Meta deregister:', metaResult)
        deregisterResults.meta_deregister = metaResult

        // Intento de desuscripción de WABA (si se dispone de WABA ID)
        if (wabaId) {
          const wabaUrl = `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`
          const wabaRes = await fetch(wabaUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          })
          deregisterResults.waba_unsubscribe = await wabaRes.json()
        }

      } catch (metaErr: any) {
        console.warn('Advertencia durante la desvinculación en Meta:', metaErr.message)
        deregisterResults.meta_deregister = { error: metaErr.message, note: 'Continuando con la limpieza interna' }
      }
    } else {
      console.log('No se encontraron credenciales de Meta activas para desregistrar en Graph API.')
    }

    // 3. PASO 2 y 3: Borrar tokens y limpiar caché de Phone Number ID en Base de Datos (public.secrets)
    const targetKeys = [
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PERMANENT_TOKEN',
      'SYSTEM_USER_TOKEN',
      'META_SYSTEM_USER_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_WABA_ID'
    ]

    const { error: deleteError } = await supabase
      .from('secrets')
      .delete()
      .in('name', targetKeys)

    if (deleteError) {
      console.error('Error limpiando secrets en Supabase:', deleteError.message)
    } else {
      deregisterResults.tokens_deleted = true
      deregisterResults.cache_cleaned = true
      console.log('Tokens y Phone Number ID eliminados correctamente de public.secrets')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Limpieza de backend de WhatsApp realizada correctamente.',
        details: deregisterResults
      }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (err: any) {
    console.error('Error crítico en whatsapp-deregister:', err.message)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
