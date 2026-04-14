// Follow this setup guide to integrate the Denu web-push library:
// https://github.com/marvin-j97/deno-webpush

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

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
    const { user_id, title, body, url = "/" } = await req.json()

    if (!user_id) throw new Error("user_id is required")

    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Get user subscriptions
    let subscriptions: any[] | null = null;
    let subError: any = null;

    if (user_id === "all" || user_id === "broadcast") {
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription');
      subscriptions = data;
      subError = error;
    } else {
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', user_id);
      subscriptions = data;
      subError = error;
    }

    if (subError) throw subError
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions found securely" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 3. Initialize WebPush
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@grupomore.com'

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured in Edge Function environment")
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    )

    // 4. Send notifications to all user devices
    const results = await Promise.all(
      subscriptions.map(async (row) => {
        try {
          await webpush.sendNotification(
            row.subscription,
            JSON.stringify({ title, body, url })
          )
          return { success: true }
        } catch (err) {
          console.error(`Error sending to subscription:`, err)
          return { success: false, error: err.message }
        }
      })
    )

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
