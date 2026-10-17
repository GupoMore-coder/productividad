/**
 * ============================================================================
 * CYBERSNAKE 2099 - MOTOR DE JUEGO Y RENDERIZADO CANVAS 2D
 * Efectos de brillo Neón, partículas a 60 FPS, combos y física de colisión.
 * ============================================================================
 */

(function () {
  'use strict';

  // Configuración del Tablero
  const CANVAS_SIZE = 600;
  const GRID_COUNT = 24;
  const TILE_SIZE = CANVAS_SIZE / GRID_COUNT; // 25px por celda

  // Estados del Juego
  const STATE = {
    READY: 'READY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
  };

  class CyberSnakeGame {
    constructor() {
      // Elementos del DOM
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.stageOverlay = document.getElementById('stageOverlay');
      this.overlayTitle = document.getElementById('overlayTitle');
      this.overlayDesc = document.getElementById('overlayDesc');
      this.btnStartGame = document.getElementById('btnStartGame');
      this.btnStartText = document.getElementById('btnStartText');

      // Elementos del HUD
      this.hudScore = document.getElementById('hudScore');
      this.hudMultiplier = document.getElementById('hudMultiplier');
      this.hudHighScore = document.getElementById('hudHighScore');
      this.hudSpeedLevel = document.getElementById('hudSpeedLevel');
      this.comboFillBar = document.getElementById('comboFillBar');
      this.comboToast = document.getElementById('comboToast');

      // Modales y Controles
      this.modalGameOver = document.getElementById('modalGameOver');
      this.modalLeaderboard = document.getElementById('modalLeaderboard');
      this.modalSettings = document.getElementById('modalSettings');
      this.btnRestartGame = document.getElementById('btnRestartGame');
      this.btnSaveScore = document.getElementById('btnSaveScore');
      this.playerAliasInput = document.getElementById('playerAliasInput');
      this.saveFeedback = document.getElementById('saveFeedback');
      this.goFinalScore = document.getElementById('goFinalScore');
      this.goBestCombo = document.getElementById('goBestCombo');
      this.goFoodCount = document.getElementById('goFoodCount');
      this.goNewRecordBadge = document.getElementById('goNewRecordBadge');

      // Botones de Cabecera
      this.btnAudioToggle = document.getElementById('btnAudioToggle');
      this.audioIcon = document.getElementById('audioIcon');
      this.btnLeaderboardOpen = document.getElementById('btnLeaderboardOpen');
      this.btnCloseLeaderboard = document.getElementById('btnCloseLeaderboard');
      this.btnCloseLeaderboardBtn = document.getElementById('btnCloseLeaderboardBtn');
      this.btnSettingsOpen = document.getElementById('btnSettingsOpen');
      this.btnCloseSettings = document.getElementById('btnCloseSettings');
      this.btnSaveSettings = document.getElementById('btnSaveSettings');
      this.btnClearLocalScores = document.getElementById('btnClearLocalScores');
      this.btnViewLeaderboardFromGO = document.getElementById('btnViewLeaderboardFromGO');

      // Tabs del Leaderboard
      this.tabGlobal = document.getElementById('tabGlobal');
      this.tabLocal = document.getElementById('tabLocal');
      this.leaderboardBody = document.getElementById('leaderboardBody');

      // Ajustes del usuario
      this.settings = {
        difficulty: 'arcade', // 'casual', 'arcade', 'cyber'
        glowEnabled: true,
        particlesEnabled: true,
        audioEnabled: true
      };

      // Estado interno del juego
      this.currentState = STATE.READY;
      this.snake = [];
      this.vx = 1;
      this.vy = 0;
      this.nextVx = 1;
      this.nextVy = 0;
      this.inputQueue = [];

      this.score = 0;
      this.foodCount = 0;
      this.comboMultiplier = 1.0;
      this.comboTimer = 0;
      this.comboDuration = 3200; // ms para mantener combo
      this.bestCombo = 1.0;

      this.foods = []; // Lista de alimentos activos (regular + especiales)
      this.particles = []; // Partículas de chispas neón

      // Control de tiempo y ciclos (Tick rate)
      this.lastFrameTime = 0;
      this.moveAccumulator = 0;
      this.baseTickInterval = 110; // ms por movimiento
      this.currentTickInterval = 110;

      this.specialSpawnCounter = 0;

      this.init();
    }

    init() {
      this.loadSettings();
      this.updateHighScoreDisplay();
      this.setupEventListeners();
      this.resetGameData();
      this.renderInitialBoard();

      // Bucle continuo de renderizado a 60 FPS
      requestAnimationFrame(this.gameLoop.bind(this));
    }

    loadSettings() {
      const savedDiff = localStorage.getItem('cybersnake_difficulty');
      if (savedDiff) this.settings.difficulty = savedDiff;

      const diffRadio = document.querySelector(`input[name="difficulty"][value="${this.settings.difficulty}"]`);
      if (diffRadio) diffRadio.checked = true;

      const savedGlow = localStorage.getItem('cybersnake_glow');
      if (savedGlow !== null) {
        this.settings.glowEnabled = (savedGlow === 'true');
        const tg = document.getElementById('toggleGlow');
        if (tg) tg.checked = this.settings.glowEnabled;
      }

      const savedAudio = localStorage.getItem('cybersnake_audio_enabled');
      if (savedAudio !== null) {
        this.settings.audioEnabled = (savedAudio === 'true');
        this.updateAudioIcon();
      }
    }

    updateAudioIcon() {
      if (this.audioIcon) {
        this.audioIcon.textContent = window.soundEngine && window.soundEngine.isMuted ? '🔇' : '🔊';
      }
    }

    updateHighScoreDisplay() {
      const personalBest = window.leaderboardManager.getPersonalHighScore();
      this.hudHighScore.textContent = personalBest.toLocaleString();
    }

    resetGameData() {
      // Iniciar serpiente centrada
      const startX = Math.floor(GRID_COUNT / 2);
      const startY = Math.floor(GRID_COUNT / 2);
      this.snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
      ];

      this.vx = 1;
      this.vy = 0;
      this.nextVx = 1;
      this.nextVy = 0;
      this.inputQueue = [];

      this.score = 0;
      this.foodCount = 0;
      this.comboMultiplier = 1.0;
      this.comboTimer = 0;
      this.bestCombo = 1.0;
      this.specialSpawnCounter = 0;

      // Calcular velocidad según dificultad
      if (this.settings.difficulty === 'casual') {
        this.baseTickInterval = 135;
      } else if (this.settings.difficulty === 'cyber') {
        this.baseTickInterval = 85;
        this.comboMultiplier = 2.0; // Bono inicial
      } else {
        this.baseTickInterval = 110;
      }
      this.currentTickInterval = this.baseTickInterval;

      this.foods = [];
      this.particles = [];
      this.spawnFood('apple');

      this.updateHud();
    }

    startGame() {
      window.soundEngine.ensureContext();
      window.soundEngine.playClick();
      this.resetGameData();
      this.currentState = STATE.PLAYING;
      this.stageOverlay.classList.add('hidden');
      this.modalGameOver.classList.remove('active');
    }

    pauseGame() {
      if (this.currentState === STATE.PLAYING) {
        this.currentState = STATE.PAUSED;
        this.overlayTitle.textContent = 'PAUSA TÁCTICA';
        this.overlayDesc.textContent = 'El sistema se encuentra en espera. Pulsa reanudar o la barra espaciadora para continuar.';
        this.btnStartText.textContent = 'REANUDAR';
        this.stageOverlay.classList.remove('hidden');
        window.soundEngine.playClick();
      } else if (this.currentState === STATE.PAUSED) {
        this.currentState = STATE.PLAYING;
        this.stageOverlay.classList.add('hidden');
        window.soundEngine.playClick();
      }
    }

    handleGameOver() {
      this.currentState = STATE.GAMEOVER;
      window.soundEngine.playCrash();

      // Desintegrar serpiente en chispas espectaculares
      this.snake.forEach(seg => {
        this.createExplosionParticles(seg.x * TILE_SIZE + TILE_SIZE / 2, seg.y * TILE_SIZE + TILE_SIZE / 2, '#ff007f', 6);
      });

      // Llenar estadísticas del modal
      this.goFinalScore.textContent = this.score.toLocaleString();
      this.goBestCombo.textContent = `x${this.bestCombo.toFixed(1)}`;
      this.goFoodCount.textContent = this.foodCount;

      const prevHighScore = window.leaderboardManager.getPersonalHighScore();
      if (this.score > prevHighScore && this.score > 0) {
        this.goNewRecordBadge.classList.remove('hidden');
      } else {
        this.goNewRecordBadge.classList.add('hidden');
      }

      this.saveFeedback.textContent = '';
      this.btnSaveScore.disabled = false;
      this.modalGameOver.classList.add('active');
    }

    // =========================================================================
    // MECÁNICAS DE COMIDA Y POWER-UPS
    // =========================================================================
    spawnFood(type = 'apple') {
      let position;
      let attempts = 0;

      while (attempts < 100) {
        const x = Math.floor(Math.random() * GRID_COUNT);
        const y = Math.floor(Math.random() * GRID_COUNT);

        const onSnake = this.snake.some(seg => seg.x === x && seg.y === y);
        const onOtherFood = this.foods.some(f => f.x === x && f.y === y);

        if (!onSnake && !onOtherFood) {
          position = { x, y };
          break;
        }
        attempts++;
      }

      if (!position) return;

      const foodItem = {
        x: position.x,
        y: position.y,
        type: type,
        createdAt: performance.now(),
        duration: type === 'apple' ? null : 9000 // Los especiales duran 9 seg
      };

      this.foods.push(foodItem);
    }

    checkFoodCollision(head) {
      for (let i = this.foods.length - 1; i >= 0; i--) {
        const f = this.foods[i];
        if (f.x === head.x && f.y === head.y) {
          this.eatFood(f, i);
          return true;
        }
      }
      return false;
    }

    eatFood(food, index) {
      this.foods.splice(index, 1);
      this.foodCount++;
      this.specialSpawnCounter++;

      // Puntos base por tipo
      let points = 100;
      let particleColor = '#00ff88';

      if (food.type === 'star') {
        points = 350;
        particleColor = '#ffe600';
        this.comboMultiplier = Math.min(this.comboMultiplier + 1.0, 5.0);
        window.soundEngine.playSpecial();
        this.triggerComboToast('⭐ ¡ESTRELLA DORADA!');
      } else if (food.type === 'chrono') {
        points = 250;
        particleColor = '#00f3ff';
        this.currentTickInterval += 35; // Desacelera temporalmente
        setTimeout(() => { this.recalculateSpeed(); }, 4000);
        window.soundEngine.playSpecial();
        this.triggerComboToast('⏱️ ¡RALENTIZACIÓN!');
      } else if (food.type === 'overdrive') {
        points = 500;
        particleColor = '#ff007f';
        window.soundEngine.playSpecial();
        this.triggerComboToast('🔥 ¡SOBRECARGA!');
      } else {
        window.soundEngine.playEat();
      }

      // Sistema de Combo
      this.comboTimer = this.comboDuration;
      this.comboMultiplier = Math.min(this.comboMultiplier + 0.2, 5.0);
      if (this.comboMultiplier > this.bestCombo) {
        this.bestCombo = this.comboMultiplier;
      }

      if (this.comboMultiplier >= 2.0 && food.type === 'apple') {
        window.soundEngine.playCombo(this.comboMultiplier);
        this.triggerComboToast(`COMBO x${this.comboMultiplier.toFixed(1)}`);
      }

      const totalEarned = Math.round(points * this.comboMultiplier);
      this.score += totalEarned;

      // Efecto de Partículas
      if (this.settings.particlesEnabled) {
        this.createFoodSparks(food.x * TILE_SIZE + TILE_SIZE / 2, food.y * TILE_SIZE + TILE_SIZE / 2, particleColor);
      }

      // Reaparición de comida normal si no quedan manzanas
      const hasApple = this.foods.some(f => f.type === 'apple');
      if (!hasApple) {
        this.spawnFood('apple');
      }

      // Ocasionalmente generar alimento especial
      if (this.specialSpawnCounter >= 4) {
        this.specialSpawnCounter = 0;
        const rand = Math.random();
        if (rand < 0.45) this.spawnFood('star');
        else if (rand < 0.75) this.spawnFood('chrono');
        else this.spawnFood('overdrive');
      }

      this.recalculateSpeed();
      this.updateHud();
    }

    recalculateSpeed() {
      // La velocidad se incrementa ligeramente cada 4 comidas
      const speedStep = Math.floor(this.foodCount / 4);
      let target = this.baseTickInterval - (speedStep * 4);
      this.currentTickInterval = Math.max(target, 55); // Mínimo 55ms

      const level = Math.min(Math.floor(this.foodCount / 5) + 1, 99);
      this.hudSpeedLevel.textContent = `NIV ${level}`;
    }

    triggerComboToast(text) {
      if (!this.comboToast) return;
      this.comboToast.textContent = text;
      this.comboToast.classList.add('show');
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.comboToast.classList.remove('show');
      }, 900);
    }

    // =========================================================================
    // SISTEMA DE PARTÍCULAS CANVAS (60 FPS)
    // =========================================================================
    createFoodSparks(x, y, color) {
      const count = 18;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1.0,
          decay: Math.random() * 0.03 + 0.02,
          radius: Math.random() * 3 + 1.5
        });
      }
    }

    createExplosionParticles(x, y, color, count = 8) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1.0,
          decay: Math.random() * 0.02 + 0.015,
          radius: Math.random() * 4 + 2
        });
      }
    }

    updateParticles(deltaTime) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94; // Rozamiento
        p.vy *= 0.94;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    drawParticles() {
      this.particles.forEach(p => {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;
        if (this.settings.glowEnabled) {
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = p.color;
        }
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
    }

    // =========================================================================
    // LÓGICA DE MOVIMIENTO Y COLISIÓN
    // =========================================================================
    changeDirection(newVx, newVy) {
      // Prevenir giro 180° inmediato sobre sí mismo
      if (this.inputQueue.length < 2) {
        this.inputQueue.push({ vx: newVx, vy: newVy });
      }
    }

    processInput() {
      if (this.inputQueue.length > 0) {
        const next = this.inputQueue.shift();
        // Verificar que no sea el reverso directo
        if (next.vx !== -this.vx && next.vy !== -this.vy) {
          this.vx = next.vx;
          this.vy = next.vy;
        }
      }
    }

    updateGamePhysics() {
      this.processInput();

      const head = { ...this.snake[0] };
      head.x += this.vx;
      head.y += this.vy;

      // Comportamiento de paredes según dificultad
      if (this.settings.difficulty === 'casual') {
        // Modo Zen / Wrap-around
        if (head.x < 0) head.x = GRID_COUNT - 1;
        else if (head.x >= GRID_COUNT) head.x = 0;
        if (head.y < 0) head.y = GRID_COUNT - 1;
        else if (head.y >= GRID_COUNT) head.y = 0;
      } else {
        // Muros letales
        if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
          this.handleGameOver();
          return;
        }
      }

      // Colisión con su propio cuerpo
      for (let i = 0; i < this.snake.length; i++) {
        if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
          this.handleGameOver();
          return;
        }
      }

      // Avanzar serpiente
      this.snake.unshift(head);

      // Comprobar si come
      const ate = this.checkFoodCollision(head);
      if (!ate) {
        this.snake.pop(); // Quitar cola si no comió
      }

      // Manejar expiración de alimentos especiales con temporizador
      const now = performance.now();
      for (let i = this.foods.length - 1; i >= 0; i--) {
        const f = this.foods[i];
        if (f.duration && (now - f.createdAt > f.duration)) {
          this.foods.splice(i, 1);
        }
      }
    }

    // =========================================================================
    // CICLO PRINCIPAL (GAME LOOP)
    // =========================================================================
    gameLoop(timestamp) {
      if (!this.lastFrameTime) this.lastFrameTime = timestamp;
      const deltaTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;

      // Actualizar Combo Decay
      if (this.currentState === STATE.PLAYING && this.comboTimer > 0) {
        this.comboTimer -= deltaTime;
        const progress = Math.max(0, this.comboTimer / this.comboDuration);
        this.comboFillBar.style.width = `${progress * 100}%`;

        if (this.comboTimer <= 0) {
          this.comboMultiplier = this.settings.difficulty === 'cyber' ? 2.0 : 1.0;
          this.updateHud();
        }
      }

      // Acumulador de movimiento fijo
      if (this.currentState === STATE.PLAYING) {
        this.moveAccumulator += deltaTime;
        while (this.moveAccumulator >= this.currentTickInterval) {
          this.updateGamePhysics();
          this.moveAccumulator -= this.currentTickInterval;
        }
      }

      this.updateParticles(deltaTime);
      this.renderCanvas();

      requestAnimationFrame(this.gameLoop.bind(this));
    }

    // =========================================================================
    // RENDERIZADO CANVAS
    // =========================================================================
    renderCanvas() {
      this.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 1. Dibujar Rejilla Sutil de Fondo
      this.drawBoardGrid();

      // 2. Dibujar Alimentos / Orbes
      this.drawFoods();

      // 3. Dibujar Serpiente Neón
      this.drawSnake();

      // 4. Dibujar Partículas
      this.drawParticles();
    }

    renderInitialBoard() {
      this.renderCanvas();
    }

    drawBoardGrid() {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
      this.ctx.lineWidth = 1;

      for (let i = 0; i <= GRID_COUNT; i++) {
        const pos = i * TILE_SIZE;
        this.ctx.beginPath();
        this.ctx.moveTo(pos, 0);
        this.ctx.lineTo(pos, CANVAS_SIZE);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(0, pos);
        this.ctx.lineTo(CANVAS_SIZE, pos);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    drawFoods() {
      const now = performance.now();

      this.foods.forEach(f => {
        const cx = f.x * TILE_SIZE + TILE_SIZE / 2;
        const cy = f.y * TILE_SIZE + TILE_SIZE / 2;
        const radius = (TILE_SIZE / 2) - 3;

        this.ctx.save();

        let mainColor = '#00ff88';
        let glowColor = 'rgba(0, 255, 136, 0.6)';

        if (f.type === 'star') {
          mainColor = '#ffe600';
          glowColor = 'rgba(255, 230, 0, 0.7)';
        } else if (f.type === 'chrono') {
          mainColor = '#00f3ff';
          glowColor = 'rgba(0, 243, 255, 0.7)';
        } else if (f.type === 'overdrive') {
          mainColor = '#ff007f';
          glowColor = 'rgba(255, 0, 127, 0.8)';
        }

        if (this.settings.glowEnabled) {
          this.ctx.shadowBlur = 14;
          this.ctx.shadowColor = glowColor;
        }

        // Animación de pulso
        const pulse = Math.sin(now * 0.008) * 2;
        const drawRadius = Math.max(radius + pulse, 4);

        // Orbe principal
        const grad = this.ctx.createRadialGradient(cx, cy, 2, cx, cy, drawRadius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, mainColor);
        grad.addColorStop(1, glowColor);

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, drawRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Anillo de tiempo para alimentos temporales
        if (f.duration) {
          const elapsed = now - f.createdAt;
          const remaining = Math.max(0, 1 - (elapsed / f.duration));
          this.ctx.strokeStyle = mainColor;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, drawRadius + 4, -Math.PI / 2, (-Math.PI / 2) + (remaining * Math.PI * 2));
          this.ctx.stroke();
        }

        this.ctx.restore();
      });
    }

    drawSnake() {
      if (this.snake.length === 0) return;

      this.ctx.save();

      // Renderizado del cuerpo con degradado progresivo
      for (let i = this.snake.length - 1; i >= 0; i--) {
        const seg = this.snake[i];
        const px = seg.x * TILE_SIZE + 2;
        const py = seg.y * TILE_SIZE + 2;
        const w = TILE_SIZE - 4;
        const h = TILE_SIZE - 4;
        const isHead = (i === 0);

        const ratio = i / this.snake.length;

        if (isHead) {
          // Cabeza con brillo intenso
          this.ctx.fillStyle = '#00f3ff';
          if (this.settings.glowEnabled) {
            this.ctx.shadowBlur = 18;
            this.ctx.shadowColor = '#00f3ff';
          }
          this.roundRect(this.ctx, px, py, w, h, 7);
          this.ctx.fill();

          // Ojos direccionales neón
          this.drawEyes(seg.x, seg.y);
        } else {
          // Segmentos del cuerpo con gradiente Cyan -> Magenta
          const r = Math.round(0 + ratio * 230);
          const g = Math.round(243 - ratio * 200);
          const b = Math.round(255 - ratio * 50);

          this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          if (this.settings.glowEnabled && i < 6) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
          } else {
            this.ctx.shadowBlur = 0;
          }

          this.roundRect(this.ctx, px, py, w, h, 5);
          this.ctx.fill();
        }
      }

      this.ctx.restore();
    }

    drawEyes(gridX, gridY) {
      const cx = gridX * TILE_SIZE;
      const cy = gridY * TILE_SIZE;
      this.ctx.fillStyle = '#05060d';

      let eye1 = { x: cx + 7, y: cy + 7 };
      let eye2 = { x: cx + 18, y: cy + 7 };

      if (this.vx === 1) { // Derecha
        eye1 = { x: cx + 17, y: cy + 6 };
        eye2 = { x: cx + 17, y: cy + 18 };
      } else if (this.vx === -1) { // Izquierda
        eye1 = { x: cx + 7, y: cy + 6 };
        eye2 = { x: cx + 7, y: cy + 18 };
      } else if (this.vy === 1) { // Abajo
        eye1 = { x: cx + 6, y: cy + 17 };
        eye2 = { x: cx + 18, y: cy + 17 };
      } else if (this.vy === -1) { // Arriba
        eye1 = { x: cx + 6, y: cy + 7 };
        eye2 = { x: cx + 18, y: cy + 7 };
      }

      this.ctx.beginPath();
      this.ctx.arc(eye1.x, eye1.y, 2.5, 0, Math.PI * 2);
      this.ctx.arc(eye2.x, eye2.y, 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Pupilas brillantes
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(eye1.x, eye1.y, 1, 0, Math.PI * 2);
      this.ctx.arc(eye2.x, eye2.y, 1, 0, Math.PI * 2);
      this.ctx.fill();
    }

    roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    updateHud() {
      this.hudScore.textContent = this.score.toLocaleString();
      this.hudMultiplier.textContent = `x${this.comboMultiplier.toFixed(1)}`;
      this.updateHighScoreDisplay();
    }

    // =========================================================================
    // EVENT LISTENERS & ENLACES DE CONTROL
    // =========================================================================
    setupEventListeners() {
      // 1. Controles de Teclado
      window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
          e.preventDefault(); // Evitar scroll de pantalla
        }

        if (this.currentState === STATE.READY && (key === ' ' || key === 'enter')) {
          this.startGame();
          return;
        }

        if (key === ' ' || key === 'escape') {
          this.pauseGame();
          return;
        }

        if (this.currentState !== STATE.PLAYING) return;

        if ((key === 'arrowup' || key === 'w') && this.vy === 0) {
          this.changeDirection(0, -1);
        } else if ((key === 'arrowdown' || key === 's') && this.vy === 0) {
          this.changeDirection(0, 1);
        } else if ((key === 'arrowleft' || key === 'a') && this.vx === 0) {
          this.changeDirection(-1, 0);
        } else if ((key === 'arrowright' || key === 'd') && this.vx === 0) {
          this.changeDirection(1, 0);
        }
      });

      // 2. Botón Iniciar Partida en Overlay
      this.btnStartGame.addEventListener('click', () => {
        if (this.currentState === STATE.PAUSED) {
          this.pauseGame();
        } else {
          this.startGame();
        }
      });

      // 3. Controles Táctiles Virtuales (D-Pad)
      const bindTouchBtn = (id, vx, vy) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const trigger = (e) => {
          e.preventDefault();
          window.soundEngine.ensureContext();
          if (this.currentState === STATE.PLAYING) {
            if ((vx !== 0 && this.vx === 0) || (vy !== 0 && this.vy === 0)) {
              this.changeDirection(vx, vy);
            }
          } else if (this.currentState === STATE.READY) {
            this.startGame();
          }
        };
        btn.addEventListener('touchstart', trigger, { passive: false });
        btn.addEventListener('mousedown', trigger);
      };

      bindTouchBtn('btnTouchUp', 0, -1);
      bindTouchBtn('btnTouchDown', 0, 1);
      bindTouchBtn('btnTouchLeft', -1, 0);
      bindTouchBtn('btnTouchRight', 1, 0);

      const btnTouchPause = document.getElementById('btnTouchPause');
      if (btnTouchPause) {
        btnTouchPause.addEventListener('click', () => this.pauseGame());
      }

      // 4. Detección de Gestos Swipe en el Canvas
      let touchStartX = 0;
      let touchStartY = 0;

      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      this.canvas.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) < 25) return; // Umbral mínimo para evitar toques accidentales

        if (this.currentState === STATE.READY) {
          this.startGame();
          return;
        }

        if (this.currentState !== STATE.PLAYING) return;

        if (absDx > absDy) {
          // Movimiento Horizontal
          if (dx > 0 && this.vx === 0) this.changeDirection(1, 0);
          else if (dx < 0 && this.vx === 0) this.changeDirection(-1, 0);
        } else {
          // Movimiento Vertical
          if (dy > 0 && this.vy === 0) this.changeDirection(0, 1);
          else if (dy < 0 && this.vy === 0) this.changeDirection(0, -1);
        }
      }, { passive: true });

      // 5. Gestión de Audio
      this.btnAudioToggle.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        this.updateAudioIcon();
      });

      // 6. Modal Leaderboard
      const openLeaderboard = () => {
        window.soundEngine.playClick();
        window.leaderboardManager.renderTable(this.leaderboardBody, 'global');
        this.tabGlobal.classList.add('active');
        this.tabLocal.classList.remove('active');
        this.modalLeaderboard.classList.add('active');
      };

      this.btnLeaderboardOpen.addEventListener('click', openLeaderboard);
      this.btnViewLeaderboardFromGO.addEventListener('click', () => {
        this.modalGameOver.classList.remove('active');
        openLeaderboard();
      });

      const closeLeaderboard = () => {
        window.soundEngine.playClick();
        this.modalLeaderboard.classList.remove('active');
      };
      this.btnCloseLeaderboard.addEventListener('click', closeLeaderboard);
      this.btnCloseLeaderboardBtn.addEventListener('click', closeLeaderboard);

      this.tabGlobal.addEventListener('click', () => {
        this.tabGlobal.classList.add('active');
        this.tabLocal.classList.remove('active');
        window.leaderboardManager.renderTable(this.leaderboardBody, 'global');
      });

      this.tabLocal.addEventListener('click', () => {
        this.tabLocal.classList.add('active');
        this.tabGlobal.classList.remove('active');
        window.leaderboardManager.renderTable(this.leaderboardBody, 'local');
      });

      this.btnClearLocalScores.addEventListener('click', () => {
        if (confirm('¿Deseas restablecer tu historial de puntuaciones locales?')) {
          window.leaderboardManager.clearLocalScores();
          this.updateHighScoreDisplay();
          window.leaderboardManager.renderTable(this.leaderboardBody, 'local');
        }
      });

      // 7. Modal Game Over y Guardado
      this.btnRestartGame.addEventListener('click', () => {
        this.startGame();
      });

      document.getElementById('formSaveScore').addEventListener('submit', (e) => {
        e.preventDefault();
        const alias = this.playerAliasInput.value.trim();
        if (!alias) return;

        const res = window.leaderboardManager.saveScore(
          alias,
          this.score,
          this.settings.difficulty,
          this.foodCount,
          `x${this.bestCombo.toFixed(1)}`
        );

        if (res.success) {
          this.btnSaveScore.disabled = true;
          this.saveFeedback.textContent = `¡Puntuación asegurada! Clasificación Mundial: #${res.globalRank}`;
          this.updateHighScoreDisplay();
          window.soundEngine.playSpecial();
        }
      });

      // 8. Modal Ajustes
      this.btnSettingsOpen.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.modalSettings.classList.add('active');
      });

      const closeSettings = () => {
        window.soundEngine.playClick();
        this.modalSettings.classList.remove('active');
      };
      this.btnCloseSettings.addEventListener('click', closeSettings);

      this.btnSaveSettings.addEventListener('click', () => {
        const selectedDiff = document.querySelector('input[name="difficulty"]:checked');
        if (selectedDiff) {
          this.settings.difficulty = selectedDiff.value;
          localStorage.setItem('cybersnake_difficulty', this.settings.difficulty);
        }

        const toggleGlow = document.getElementById('toggleGlow');
        if (toggleGlow) {
          this.settings.glowEnabled = toggleGlow.checked;
          localStorage.setItem('cybersnake_glow', this.settings.glowEnabled);
        }

        const toggleParticles = document.getElementById('toggleParticles');
        if (toggleParticles) {
          this.settings.particlesEnabled = toggleParticles.checked;
        }

        const toggleAudio = document.getElementById('toggleAudio');
        if (toggleAudio) {
          if (!toggleAudio.checked && !window.soundEngine.isMuted) {
            window.soundEngine.toggleMute();
          } else if (toggleAudio.checked && window.soundEngine.isMuted) {
            window.soundEngine.toggleMute();
          }
          this.updateAudioIcon();
        }

        closeSettings();
        if (this.currentState === STATE.READY) {
          this.resetGameData();
        }
      });
    }
  }

  // Inicializar el juego al cargar el documento
  document.addEventListener('DOMContentLoaded', () => {
    window.cyberSnake = new CyberSnakeGame();
  });
})();
