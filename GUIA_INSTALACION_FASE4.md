# 📘 Guía de Instalación y Certificación - Fase 4
**Dashboard Interactivo en Tiempo Real ("Prompt & Canvas")**

En esta fase final completamos el ecosistema financiero implementando la interfaz ejecutiva visual (**Canvas**) y el asistente inteligente de consultas (**Copiloto Prompt con Gemini 3.6 Flash**), conectado en tiempo real con las 11 hojas de Google Sheets y las operaciones registradas por WhatsApp.

---

## Paso 1: Abrir el Editor de Apps Script
1. Abre tu hoja de cálculo `Control y Gestión Financiera Antigravity`.
2. Ve a **Extensiones** > **Apps Script**.

---

## Paso 2: Actualizar `WhatsAppWebhook.gs`
Asegúrate de que la función `doGet(e)` en tu archivo `WhatsAppWebhook.gs` esté actualizada con la versión enriquecida (líneas 58 a 87 de [`fase3_whatsapp_webhook.js`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase3_whatsapp_webhook.js)), la cual incluye el despachador del Dashboard:

```javascript
    // Caso 2: Petición del Dashboard Interactivo o API REST (Fase 4)
    if (typeof despacharSolicitudGetDashboard === "function") {
      return despacharSolicitudGetDashboard(e);
    }
```

---

## Paso 3: Crear los Archivos de Fase 4 en Google Apps Script

En el menú lateral izquierdo de Apps Script, al lado de *Archivos*, haz clic en el botón **`+`**:

### 1. Crear el Backend (`DashboardAPI.gs`)
- Clic en **`+`** > **Secuencia de comandos**.
- Nómbralo: `DashboardAPI`.
- Copia y pega todo el contenido de [`fase4_dashboard_backend.js`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase4_dashboard_backend.js).

### 2. Crear la Suite de Certificación (`TestRunnerFase4.gs`)
- Clic en **`+`** > **Secuencia de comandos**.
- Nómbralo: `TestRunnerFase4`.
- Copia y pega todo el contenido de [`fase4_test_suite.js`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase4_test_suite.js).

### 3. Crear la Vista HTML (`DashboardView.html`) ⚠️ *(Importante: Tipo HTML)*
- Clic en **`+`** > **HTML** *(selecciona HTML, no secuencia de comandos)*.
- Nómbralo: `DashboardView`.
- Borra lo que aparezca por defecto y pega todo el contenido de [`fase4_dashboard_canvas.html`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase4_dashboard_canvas.html).
- Guarda todo con **`Ctrl + S`** (o el ícono de disquete 💾).

---

## Paso 4: Ejecutar la Suite de Certificación (Pruebas 100%)

1. En la barra superior de Apps Script, en el desplegable de funciones, selecciona:  
   👉 **`testRunnerFase4`**
2. Haz clic en **Run** (▶️).
3. En el registro de ejecución (*Execution log*), comprobarás las 5 pruebas automatizadas:
   - ✅ **Prueba 1:** Extracción y Consolidación Global de Métricas (Ingresos, Gastos, Flujo Neto).
   - ✅ **Prueba 2:** Filtrado y Aislamiento por Entidad (`Personal` vs `More Paper`).
   - ✅ **Prueba 3:** Integridad y Consistencia Matemática de Categorías de Gastos.
   - ✅ **Prueba 4:** Despacho de API REST JSON (`?action=getDashboardData`).
   - ✅ **Prueba 5:** Copiloto Financiero IA (`procesarPromptDashboard` con Gemini 3.6 Flash).
4. El registro confirmará:
   `🏆 ¡FASE 4 CERTIFICADA AL 100%! El Dashboard 'Prompt & Canvas' está listo para su uso.`

---

## Paso 5: Publicar la Nueva Versión de la Aplicación Web

Para que los cambios se activen en la URL pública:
1. Arriba a la derecha, haz clic en **Deploy** (Implementar) > **Manage deployments** (Administrar implementaciones).
2. Haz clic en el **ícono del lápiz (Editar)** de tu implementación activa.
3. En el desplegable **Version**, selecciona: **New version** (Nueva versión).
4. Haz clic en el botón azul **Deploy** (Implementar).
5. Haz clic en **Done** (Listo).

---

## Paso 6: Abrir y Disfrutar tu Dashboard Interactivo ("Prompt & Canvas") 🚀

1. Abre en una nueva pestaña de tu navegador tu URL de Apps Script (la que termina en `/exec`):
   ```text
   https://script.google.com/macros/s/AKfycbyHxkfFJ1qAnmRcXDgJEnCPSxphpvLMa16fkFCfpVzfGmPBh_YL5M2QLe1uGRA3kp_XIg/exec
   ```
2. ¡Verás el **Dashboard Ejecutivo en pantalla completa**!
   - **Scorecards en Vivo:** Verás reflejado el gasto de `$35.000 COP` en almuerzo que registraste hace unos minutos por WhatsApp.
   - **Selector de Entidad:** Haz clic en `Personal`, `More Paper` o `More Design` y observa cómo cambian las gráficas y cifras al instante.
   - **Copiloto de IA:** Escribe cualquier consulta en la barra superior (ej. *"¿Cómo están mis gastos en alimentación?"* o usa los botones rápidos) y presiona **⚡ Analizar** para recibir el diagnóstico instantáneo de Gemini.
   - **Acceso Directo Móvil:** Puedes abrir ese mismo enlace en el navegador de tu celular y seleccionar *"Agregar a la pantalla de inicio"* para tener tu app financiera nativa.
