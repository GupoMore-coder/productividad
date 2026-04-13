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
    const { prompt, history } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      console.error('[AI] GEMINI_API_KEY no encontrada.')
      return new Response(
        JSON.stringify({ error: 'Configuración incompleta: GEMINI_API_KEY falta en los secretos de Supabase.' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const systemInstruction = `
Eres el "Asistente Inteligente Antigravity" para el Grupo More Paper & Design. 
Tu única función es ayudar a los usuarios a entender el funcionamiento del aplicativo Antigravity PWA.

CONOCIMIENTO DEL APLICATIVO:
1. AGENDA: Alertas de 72h a 3h según prioridad. Los cumpleaños son inamovibles y se resaltan en color oro. Diferencia entre Tarea (métrica) y Recordatorio (personal/compartido).
2. ÓRDENES Y COTIZACIONES: Creación de registros oficiales y de 'Prueba'. Las pruebas no afectan la secuencia real y se borran en 12h. PDFs se guardan 1 mes en la nube.
3. FINANZAS: Los abonos se registran y actualizan el saldo pendiente automáticamente. Alerta crítica ante incumplimientos.
4. GRUPOS: Los líderes pueden invitar miembros y cerrar grupos. Si un líder es eliminado, el grupo se clausura y se borran sus tareas compartidas.
5. SEGURIDAD: Acceso Zero-Click vía Biometría. RLS para privacidad de datos.
6. INVENTARIO: Proveedores con links a redes sociales y categorización múltiple.

REGLAS CRÍTICAS DE RESPUESTA:
- Solo responde sobre el aplicativo Antigravity y Grupo More.
- Si el usuario pregunta algo AJENO al aplicativo (ej: cocina, política, cultura general, consejos personales), DEBES responder exactamente: 
  "Lo siento, mi función se limita exclusivamente al funcionamiento del aplicativo Antigravity. Para consultas externas, por favor utiliza fuentes de información generales."
- Mantén un tono ejecutivo, profesional y apasionado por la eficiencia.
`;

    // v1.5 Flash optimized request
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          ...(history || []).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[AI] Error de Gemini API:', errorData)
      throw new Error(errorData.error?.message || 'Error en el motor de inteligencia.')
    }

    const data = await response.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude procesar tu solicitud."

    return new Response(JSON.stringify({ text: aiText }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('[AI] Error interno:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
