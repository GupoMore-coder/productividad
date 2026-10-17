# 📘 Guía de Instalación y Certificación - Fase 3
**Integración con Meta WhatsApp Cloud API & Automatización Diaria (8:00 AM)**

En esta fase conectamos todo el sistema contable y el cerebro de IA con **Meta WhatsApp Cloud API**, habilitando la recepción de mensajes en tiempo real, el envío de respuestas formateadas y la activación del disparador diario para alertas matutinas de vencimientos.

---

## Paso 1: Abrir el Editor de Apps Script
1. Abre tu hoja de cálculo `Control y Gestión Financiera Antigravity`.
2. Ve a **Extensiones** > **Apps Script**.

---

## Paso 2: Crear el Archivo del Webhook (`WhatsAppWebhook.gs`)
1. En el menú lateral izquierdo de Apps Script, haz clic en el botón **`+`** al lado de *Archivos* > **Secuencia de comandos**.
2. Nómbralo: `WhatsAppWebhook`.
3. Copia todo el contenido del archivo local [`fase3_whatsapp_webhook.js`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase3_whatsapp_webhook.js) y pégalo en `WhatsAppWebhook.gs`.

---

## Paso 3: Crear el Archivo de Pruebas (`TestRunnerFase3.gs`)
1. Haz clic de nuevo en **`+`** al lado de *Archivos* > **Secuencia de comandos**.
2. Nómbralo: `TestRunnerFase3`.
3. Copia todo el contenido del archivo local [`fase3_test_suite.js`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase3_test_suite.js) y pégalo allí.
4. Haz clic en el ícono de **Guardar** (Ctrl + S o 💾).

---

## Paso 4: Ejecutar la Suite de Certificación de Fase 3 (Pruebas 100%)
1. En la barra superior de Apps Script, en el desplegable de funciones, selecciona:
   👉 **`testRunnerFase3`**
2. Haz clic en **Run** (▶️).
3. En el registro de ejecución (*Execution log*), comprobarás las 5 pruebas de integración:
   - ✅ **Prueba 1: Handshake Meta doGet** (Verificación oficial con parámetro `hub.challenge`).
   - ✅ **Prueba 2: Seguridad Webhook** (Rechazo automático de tokens no autorizados).
   - ✅ **Prueba 3: Payload Meta Graph API** (Formato JSON estricto para WhatsApp Business v21.0).
   - ✅ **Prueba 4: Pipeline doPost Extremo a Extremo** (Recepción simulada de WhatsApp, confirmación 200 OK y escritura automática en More Paper).
   - ✅ **Prueba 5: Automatización Diaria 8:00 AM** (Creación del Trigger horario de Google y ejecución del despacho de recordatorios).
4. El informe final emitirá:
   `📱 RESULTADO FINAL: 5/5 PRUEBAS APROBADAS`

---

## Paso 5: Cómo Publicar tu Web App para Meta (Producción)
Una vez aprobadas las pruebas internas:
1. En la esquina superior derecha de Apps Script, haz clic en el botón azul **Implementar** > **Nueva implementación**.
2. En el engranaje ⚙️ (Seleccionar tipo), elige: **Aplicación web**.
3. Configura:
   - **Descripción:** `Webhook WhatsApp Antigravity`
   - **Ejecutar como:** `Yo (tu correo de Google)`
   - **Quién tiene acceso:** `Cualquier usuario (Anyone)` *(Indispensable para que los servidores de Meta puedan enviar mensajes)*.
4. Haz clic en **Implementar**.
5. Copia la **URL de la aplicación web** generada (termina en `/exec`).
6. En tu panel de **Meta for Developers**:
   - Pega esa URL en el campo **URL de devolución de llamada (Callback URL)**.
   - En **Token de verificación**, coloca: `antigravity_finanzas_token_2026` (o el que hayas definido en `META_CONFIG.VERIFY_TOKEN`).
   - Haz clic en **Verificar y guardar**.

¡A partir de ese momento, cada mensaje que envíes a tu número de WhatsApp será procesado por Gemini 3.6 Flash y registrado en Google Sheets en tiempo real!
