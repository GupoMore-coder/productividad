import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Iniciando Edge Function: send-feedback v1.0.2 (Verified Diagnostic Mode)");

serve(async (req) => {
  // Manejo de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userName, message, pdfBase64 } = await req.json();

    if (!pdfBase64) {
        throw new Error("El reporte PDF no se generó correctamente.");
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no encontrada en los secretos de Supabase.");
    }

    console.log(`Enviando reporte para: ${userName}`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Antigravity Reports <onboarding@resend.dev>',
        to: ['fernando830609@gmail.com'],
        subject: `Reporte de hallazgo Aplicativo Grupo More elaborado por: ${userName}`,
        html: `
          <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #9333ea; border-bottom: 2px solid #9333ea; padding-bottom: 10px;">Nuevo Hallazgo Detectado</h2>
            <p><strong>Usuario:</strong> ${userName}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; border: 1px solid #eee; margin: 20px 0;">
              <p style="margin: 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p style="font-size: 11px; color: #999;">
              Este mensaje fue generado automáticamente por el sistema Antigravity Elite Enhancement Unit.
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `Reporte_${userName.replace(/\s+/g, '_')}.pdf`,
            content: pdfBase64,
          },
        ],
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("Error respuesta Resend:", responseData);
      return new Response(
        JSON.stringify({ success: false, error: responseData.message || "Resend API Error" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Email enviado satisfactoriamente");

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Error crítico en función:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Retornamos 200 para capturar el error en el frontend
    );
  }
})
