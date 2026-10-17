# 📘 Guía de Instalación y Certificación - Fase 2
**Cerebro del Agente de IA, Enrutamiento Multi-Entidad & Lógica Financiera**

En esta fase incorporamos el cerebro inteligente del sistema, capaz de comprender lenguaje natural, enrutar automáticamente entre **Personal**, **More Paper** y **More Design**, gestionar deudas con abonos conversacionales y emitir alertas proactivas a 24 horas del vencimiento.

---

## Paso 1: Abrir el Editor de Apps Script
1. Abre tu hoja de cálculo `Control y Gestión Financiera Antigravity`.
2. Ve a **Extensiones** > **Apps Script**.

---

## Paso 2: Crear el Archivo del Cerebro del Agente (`AgentBrain.gs`)
1. En el menú lateral izquierdo de Apps Script, haz clic en el botón **`+`** al lado de *Archivos* y selecciona **Secuencia de comandos**.
2. Nómbralo: `AgentBrain`.
3. Copia todo el contenido del archivo local [`fase2_ai_agent_brain.js`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase2_ai_agent_brain.js) y pégalo en `AgentBrain.gs`.

---

## Paso 3: Crear el Archivo de Pruebas de Fase 2 (`TestRunnerFase2.gs`)
1. Haz clic de nuevo en **`+`** al lado de *Archivos* > **Secuencia de comandos**.
2. Nómbralo: `TestRunnerFase2`.
3. Copia todo el contenido del archivo local [`fase2_test_suite.js`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase2_test_suite.js) y pégalo allí.
4. Haz clic en el ícono de **Guardar** (Ctrl + S o 💾).

---

## Paso 4: Configuración de Gemini API (Opcional para pruebas, Obligatorio para producción)
El script cuenta con un motor semántico heurístico incorporado que permite validar las pruebas de certificación de inmediato. Para conectarlo a Google Gemini real:
1. Obtén tu clave gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Puedes pegarla en la línea 19 de `AgentBrain.gs` en `GEMINI_API_KEY: "tu_clave"`, o ejecutar una sola vez en el editor:
   ```javascript
   configurarApiKeyGemini("TU_CLAVE_AQUÍ");
   ```

---

## Paso 5: Ejecutar la Suite de Certificación de Fase 2 (Pruebas 100%)
1. En la barra superior de Apps Script, en el desplegable de funciones, selecciona:
   **`testRunnerFase2`**
2. Haz clic en **Ejecutar** (▶️).
3. En el registro de ejecución (*Execution log*), verás la comprobación en tiempo real de las 5 capacidades:
   - ✅ **Prueba 1: Enrutamiento Semántico** (Personal, More Paper y More Design clasificados y escritos con precisión).
   - ✅ **Prueba 2: Ciclo de Compromisos** (Creación de deuda, abono parcial en lenguaje natural, recálculo de saldo y auto-generación de egreso contable).
   - ✅ **Prueba 3: Consultas Financieras** (Interpretación de balance disponible y respuesta analítica).
   - ✅ **Prueba 4: Escáner Alertas 24h** (Detección de obligaciones con vencimiento al día siguiente y formato para WhatsApp).
   - ✅ **Prueba 5: Blindaje de Seguridad** (Rechazo inmediato de números de teléfono no autorizados).
4. El informe final emitirá:
   `🧠 RESULTADO FINAL: 5/5 PRUEBAS APROBADAS`

---

## Checklist de Salida de Fase 2
- [ ] `AgentBrain.gs` y `TestRunnerFase2.gs` guardados en Apps Script.
- [ ] Resultado de `testRunnerFase2()` en 5/5 (100%).
- [ ] Hojas de transacciones y compromisos comprobadas sin filas corruptas.

¡Una vez obtenido el **5/5**, el cerebro está listo para recibir mensajes reales desde WhatsApp en la **Fase 3**!
