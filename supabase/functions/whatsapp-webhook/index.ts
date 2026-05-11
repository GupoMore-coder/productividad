import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SB_URL = Deno.env.get('SUPABASE_URL') || '';
const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'antigravity_secure_token_2026';

const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url);

  // 1. Webhook Verification (GET) — required by Meta
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log(`Verificando Webhook - Modo: ${mode}, Token: ${token}`);

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verificado exitosamente!");
        return new Response(challenge, { status: 200 });
      } else {
        console.error("Token de verificación inválido");
        return new Response(null, { status: 403 });
      }
    }
  }

  // 2. Message Reception (POST)
  try {
    const body = await req.json();
    
    console.log("Notificación de Meta recibida:", JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || "[Mensaje no textual o multimedia]";
      const whatsappMessageId = message.id;

      console.log(`Mensaje de ${from}: ${text}`);

      const normalizedPhone = from.slice(-10);

      // FIXED: Usar customer_phone (snake_case) que es el nombre real de la columna en Supabase
      const { data: order, error: searchError } = await supabase
        .from('service_orders')
        .select('id, customer_name')
        .or(`customer_phone.ilike.%${normalizedPhone}`)
        .not('status', 'in', '("completada", "cancelada")')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (searchError) console.error("Error buscando orden:", searchError);

      const orderId = order?.id || null;

      const { error: insertError } = await supabase
        .from('whatsapp_messages')
        .insert({
          order_id: orderId,
          customer_phone: from,
          message_text: text,
          direction: 'inbound',
          metadata: {
            whatsapp_message_id: whatsappMessageId,
            raw_payload: body
          }
        });

      if (insertError) {
        console.error("Error guardando mensaje en DB:", insertError);
      } else {
        console.log(`Mensaje guardado y vinculado a orden: ${orderId || 'Ninguna (Huérfano)'}`);
      }
    }

    return new Response(JSON.stringify({ status: "processed" }), { 
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Error crítico en Webhook:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
})
