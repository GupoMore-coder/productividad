# 🐍 CYBERSNAKE 2099 - NEON ARCADE ONLINE

Videojuego web de la clásica serpiente (**Snake**) llevado al siglo XXI con una estética **Cyberpunk / Synthwave Neón**, efectos de partículas por Canvas a 60 FPS, audio procedural en tiempo real (Web Audio API), soporte táctil completo para móviles y tabla de clasificación mundial (**Leaderboard**).

---

## ✨ Características Principales

1. **Gráficos Neón & Glassmorphism**:
   - Renderizado Canvas 2D de alta resolución con resplandor (*bloom glow*), degradados bioluminiscentes y ojos dinámicos.
   - Fondo reactivo con rejilla isométrica estilo Tron y nebulosas flotantes.
   - Partículas de chispa al devorar alimentos y explosión al chocar.

2. **Mecánicas Arcade & Combos**:
   - **Sistema de Multiplicador de Racha (Combo)**: comer orbes rápidamente eleva tu multiplicador hasta **x5.0**.
   - **Alimentos y Power-ups**:
     - 🍏 **Manzana Neón**: +100 puntos y crecimiento estándar.
     - ⭐ **Estrella Dorada**: +350 puntos y salto de multiplicador (con temporizador visible).
     - ⏱️ **Orbe Crono**: ralentiza la velocidad temporalmente para maniobras complejas.
     - 🔥 **Turbo Gem**: +500 puntos para maximizar tu puntuación.

3. **Modos de Dificultad**:
   - **Casual (Modo Zen)**: Atraviesas las paredes saliendo por el lado opuesto.
   - **Arcade (Clásico)**: Muros letales y aceleración progresiva.
   - **Cyber Turbo**: Velocidad extrema y multiplicador x2.0 base.

4. **Audio Procedural (Web Audio API)**:
   - Sonidos de sintetizador generados directamente por el navegador (sin archivos MP3/WAV externos, 0% problemas de CORS).

5. **Salón de la Fama (Leaderboard)**:
   - Registro de alias con sanitización contra XSS.
   - Pestaña de Récords Locales y Clasificación Global con contrincantes mundiales.

6. **Controles Universales**:
   - **PC / Mac**: Flechas del teclado o teclas <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>. <kbd>ESPACIO</kbd> para pausar.
   - **Móvil / Tablet**: D-Pad táctil virtual o gestos de deslizamiento (*Swipe*) sobre la pantalla.

---

## 🚀 Cómo Jugar

Puedes abrir directamente el archivo `index.html` en cualquier navegador web moderno (Chrome, Edge, Safari, Firefox), o ejecutar un servidor local ligero:

### Opción 1: Apertura Directa
Doble clic en:
`c:\Users\ferna\Documents\Antigravity Project\snake_neon_arcade\index.html`

### Opción 2: Con Python
```bash
cd "c:\Users\ferna\Documents\Antigravity Project\snake_neon_arcade"
python -m http.server 3000
```
Luego ingresa a: `http://localhost:3000`

---

## 🔒 Auditoría de Seguridad OWASP
- **Prevención XSS**: Los alias se procesan y escapan con textContent antes de inyectarse en el DOM.
- **Aislamiento**: Sin dependencias de terceros vulnerables ni rastreo no consentido.
