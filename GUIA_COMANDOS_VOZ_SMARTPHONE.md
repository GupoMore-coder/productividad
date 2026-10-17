# 🎙️ GUÍA DE COMANDOS POR VOZ Y PERSONALIZACIÓN DE ASISTENTES
## Antigravity Financial Engine • Activación Hands-Free en Celulares

Esta guía explica paso a paso cómo configurar tu teléfono móvil (iPhone o Android) para invocar a tu agente financiero mediante un **comando de voz (*Wake Word*)** personalizado (ej: *"Oye Siri, Jarvis"* o *"Hey Google, habla con Sofía"*), abrir la conversación y registrar tus movimientos por voz sin fricción.

---

## 1. Personalización de Nombres y Voces desde WhatsApp

Cada usuario (Fernando, Florangellys y cualquier usuario futuro) puede bautizar y cambiar el nombre y la voz de su asistente de forma **100% independiente** directamente por el chat de WhatsApp:

### 🗣️ Comandos para Cambiar de Nombre:
Simplemente escribe o di en una nota de voz al bot:
* *"A partir de ahora te llamarás Sofía"*
* *"Quiero que tu nuevo nombre sea Jarvis"*
* *"Desde hoy te llamas Aura"*
* *"Tu nuevo nombre es Ciro"*
* *"Llámate Optimus"*

### 🎭 Perfiles de Voz Automáticos (TTS):
El sistema clasifica el nombre y adapta su voz automáticamente:
1. **Nombres Femeninos** (*Sofía, Aura, Valeria, Camila, Luna, etc.*):
   * **Perfil:** Mujer joven, alegre, cercana y dulce.
   * **Acústica:** Modulación colombiana ágil (`ttsspeed=1.05`), tono cálido y timbre optimista.
2. **Nombres Masculinos** (*Jarvis, Ciro, Mateo, Lucas, Leo, Atlas, etc.*):
   * **Perfil:** Adulto joven, cordial, sobrio y fresco.
   * **Acústica:** Modulación pausada (`ttsspeed=0.92`), tono medio-grave profesional.
3. **Nombres Tecnológicos / Superhéroes** (*Optimus, Titan, Cyborg, Nexus, etc.*):
   * **Perfil:** Voz sintética, electrónica, metálica o estilo superhéroe.
   * **Acústica:** Cadencia modular sintética (`ttsspeed=0.85`).
4. **Nombres Ambiguos o Neutros** (*Alex, Ariel, Sam, Morgan, etc.*):
   * El asistente te preguntará de inmediato en el chat qué perfil prefieres (1. Femenina dulce, 2. Masculina cordial, 3. Robótica).
   * Basta con responder: `1`, `2` o `3`.

> [!CAUTION]
> **Restricción Estricta:** Por políticas de profesionalismo y seguridad financiera, el sistema **bloquea y rechaza tajantemente cualquier intento de asignar voces de niños, niñas o de animales**.

---

## 2. Configuración en iPhone (iOS) con Atajos de Apple y Siri

En iPhone puedes activar tu agente diciendo:  
👉 **«Oye Siri, [Nombre de tu Asistente]»**

### Paso a paso para configurarlo:

1. Abre la aplicación nativa **Atajos (*Shortcuts*)** en tu iPhone.
2. Toca el botón **`+`** en la esquina superior derecha para crear un atajo nuevo.
3. En la parte superior, toca el nombre del atajo y cámbialo al **nombre exacto de tu asistente** (por ejemplo: `Jarvis`, `Aura`, `Sofía` o `Finanzas`).
   > *Nota:* Siri usará exactamente este nombre como comando verbal de activación.
4. Toca en **«Añadir acción»** y busca: **«Abrir URL»** (o *Open URLs*).
5. En el campo de URL, escribe el enlace universal de WhatsApp con el número del bot:
   ```text
   https://wa.me/TUNUMERODEWHATSAPP
   ```
   *(Reemplaza `TUNUMERODEWHATSAPP` con el número internacional del bot de Meta, por ejemplo: `https://wa.me/15550192834`)*.
6. *(Opcional)* Si prefieres que abra directamente la app de WhatsApp sin pasar por Safari:
   * En lugar de «Abrir URL», busca la acción propia de WhatsApp: **«Enviar mensaje con WhatsApp»** y selecciona el contacto de tu bot financiero.
7. Toca en **«Listo»** (*Done*).

### 🚀 Cómo usarlo:
1. Di en voz alta: **«Oye Siri, Jarvis»** (o el nombre que configuraste).
2. Tu iPhone se desbloqueará y abrirá de inmediato la conversación con tu bot.
3. Mantén presionado el micrófono de WhatsApp y di tu gasto o ingreso:  
   *«Gasté 45 mil en combustible en More Paper con tarjeta»*.
4. Tu asistente lo procesará y te responderá con una nota de voz con el perfil y género asignados.

---

## 3. Configuración en Android (Asistente de Google / Gemini)

En dispositivos Android puedes invocar al asistente diciendo:  
👉 **«Hey Google, habla con [Nombre de tu Asistente]»** o **«Hey Google, registra finanzas»**

### Paso a paso para configurarlo con Rutinas de Google:

1. Abre la app de **Google** o los **Ajustes** de tu Android.
2. Ve a: **Asistente de Google** $\rightarrow$ **Rutinas** (*Routines*).
3. Toca en **«+ Nueva»** (Crear rutina personalizada).
4. **Activador (Cómo empezar):**
   * Toca en *«Al decir al Asistente de Google»*.
   * Escribe la frase que dirás:  
     Ejemplo: `Habla con Jarvis`, `Abre Sofía` o `Registra finanzas`.
5. **Acción (Lo que debe hacer el asistente):**
   * Toca en *«Añadir acción»*.
   * Selecciona: **Comunicación** $\rightarrow$ **Enviar un mensaje por WhatsApp**.
   * Elige el contacto de tu bot financiero en WhatsApp.
   * *(O como alternativa)*: Elige la acción **Abrir enlace web** con la URL `https://wa.me/TUNUMERODEWHATSAPP`.
6. Guarda la rutina.

### ⚡ Acceso Rápido por Gesto o Botón Físico (Opcional):
* En teléfonos **Samsung Galaxy**: Ve a *Ajustes > Funciones avanzadas > Botón lateral > Doble pulsación* y selecciona abrir WhatsApp directamente.
* En teléfonos **Google Pixel / Xiaomi**: Activa el *Doble toque trasero* (Quick Tap) para abrir directamente la conversación con tu bot financiero.

---

## 4. Envío y Recepción Directa de Notas de Voz en WhatsApp

No necesitas escribir números ni textos largos:
1. **Notas de Voz Entrantes:**  
   Puedes enviar un audio de WhatsApp normal diciendo:  
   *«Hola Sofía, acabé de pagar la factura de energía de More Design por 185 mil pesos por transferencia Bancolombia»*.
2. **Transcripción y Procesamiento Multimodal:**  
   Gemini 3.6 Flash escucha la nota de voz, extrae el valor (`$185.000 COP`), el acreedor (`Energía`), la entidad (`More Design`) y el método (`Transferencia`).
3. **Respuesta en Audio con Personalidad:**  
   El bot registrará la transacción en la hoja de Google Sheets correspondiente y te responderá con una nota de voz oficial llamándote por tu nombre y con el perfil de voz configurado.

---

## 5. Resumen de Perfiles Configurados por Defecto

| Usuario | Teléfono | Rol | Alias Asistente | Perfil de Voz | Estilo de Audio |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fernando** | `+573008880001` | Super Admin | **Jarvis** | `MASCULINO_CORDIAL` | Adulto joven, cordial, profesional y fresco |
| **Florangellys** | `+573117917391` | Usuario Estándar | **Aura** / **Sofía** | `FEMENINO_DULCE` | Mujer joven, alegre, dulce y cercana |
| **Nuevos Usuarios** | Dinámico | Usuario Estándar | Asignado por nombre | Auto-inferido | Según género o robótico |
