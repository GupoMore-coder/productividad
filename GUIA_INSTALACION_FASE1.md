# 📘 Guía de Instalación y Certificación - Fase 1
**Sistema Financiero Inteligente (Google Sheets + Apps Script)**

Esta guía te permitirá inicializar el libro de Google Sheets y ejecutar la suite de pruebas de certificación para validar la Fase 1 al 100% antes de avanzar a la Fase 2.

---

## Paso 1: Crear el Libro en Google Sheets
1. Abre tu navegador y ve a [sheets.new](https://sheets.new) (o crea una hoja de cálculo en blanco en tu Google Drive).
2. Nombra tu libro como: `Control y Gestión Financiera Antigravity`.

---

## Paso 2: Abrir el Editor de Apps Script
1. En el menú superior de tu hoja de cálculo, haz clic en **Extensiones** > **Apps Script**.
2. Se abrirá una pestaña nueva con el editor de código.
3. Si hay un archivo `Código.gs` con una función vacía `myFunction()`, borra todo su contenido.

---

## Paso 3: Pegar los Archivos del Proyecto

### Archivo 1: Código Núcleo (`fase1_google_sheets_core.js`)
1. Copia todo el contenido del archivo local [`fase1_google_sheets_core.js`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase1_google_sheets_core.js).
2. Pégalo en el editor de Apps Script (puedes renombrar el archivo a `Core.gs`).
3. **Personaliza tu número de teléfono:**  
   En las primeras líneas (línea 25 aprox), edita el valor de `TELEFONO_ADMIN_DEFAULT`:
   ```javascript
   TELEFONO_ADMIN_DEFAULT: "+57300XXXXXXX", // Reemplaza con tu número real de WhatsApp
   ```

### Archivo 2: Suite de Pruebas (`fase1_test_suite.js`)
1. En el menú lateral izquierdo de Apps Script, haz clic en el botón **`+`** al lado de *Archivos* y selecciona **Secuencia de comandos**.
2. Nómbralo: `TestRunner`.
3. Copia todo el contenido del archivo local [`fase1_test_suite.js`](file:///c:/Users/ferna/Documents/Antigravity%20Project/fase1_test_suite.js) y pégalo allí.
4. Haz clic en el ícono de **Guardar** (Ctrl + S o 💾).

---

## Paso 4: Ejecutar la Inicialización
1. En la barra superior del editor de Apps Script, en el desplegable de funciones, selecciona:
   **`inicializarLibroFinanzas`**
2. Haz clic en el botón **Ejecutar** (▶️).
3. **Permisos de Google:**
   - La primera vez que ejecutes, Google te pedirá autorizar el acceso a la hoja de cálculo.
   - Haz clic en *Revisar permisos* > selecciona tu cuenta de Google > *Avanzado* > *Ir a Proyecto (no seguro)* > *Permitir*.
4. Espera 4 a 6 segundos. En el panel inferior verás el registro de ejecución completado.

Regresa a la pestaña de tu Google Sheet: **verás todas las 11 pestañas creadas con encabezados ejecutivos, anchos óptimos, formatos de moneda colombiana `$#,##0` y fórmulas en tiempo real.**

---

## Paso 5: Ejecutar la Suite de Certificación (Pruebas 100%)
1. Regresa a Apps Script.
2. En el desplegable de funciones, selecciona:
   **`testRunnerFase1`**
3. Haz clic en **Ejecutar** (▶️).
4. En el registro de ejecución (*Registro de ejecución / Logs*), verás la evaluación de las 5 pruebas críticas:
   - ✅ **Prueba 1:** Estructura de Hojas (11/11 hojas presentes).
   - ✅ **Prueba 2:** Control de Acceso (Super Admin activo y números no registrados bloqueados).
   - ✅ **Prueba 3:** Fórmulas en Tiempo Real (Reactividad del Dashboard Consolidado con fórmulas `SUMIF`/`SUMIFS`).
   - ✅ **Prueba 4:** Control de Compromisos (Cálculo exacto de saldo deudor tras pagos).
   - ✅ **Prueba 5:** Ventana de 24h WhatsApp (Deduplicación de consumo para cuota gratuita de Meta).
5. El informe final emitirá:
   `🧪 RESULTADO FINAL: 5/5 PRUEBAS APROBADAS (100%)`

---

## Checklist de Salida de Fase 1
- [ ] 11 pestañas creadas y visibles en Google Sheets.
- [ ] Tu número registrado como `SUPER_ADMIN` en `Control_Acceso`.
- [ ] Fórmulas activas en `Dashboard_Consolidado`.
- [ ] Resultado de `testRunnerFase1()` en 5/5 (100%).

Una vez confirmada esta verificación, ¡la base de datos y la seguridad están 100% blindadas para conectar el Agente de IA en la **Fase 2**!
