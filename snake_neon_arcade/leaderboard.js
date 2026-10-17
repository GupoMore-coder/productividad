/**
 * ============================================================================
 * CYBERSNAKE 2099 - GESTOR DE CLASIFICACIÓN Y RÉCORDS ONLINE (LEADERBOARD)
 * Persistencia blindada, sanitización anti-XSS y ranking global sincronizado.
 * ============================================================================
 */

class LeaderboardManager {
  constructor() {
    this.LOCAL_KEY = 'cybersnake_local_scores_v1';
    this.GLOBAL_KEY = 'cybersnake_global_scores_v1';
    this.ensureInitialData();
  }

  /**
   * Sanitización rigurosa de entradas de texto (OWASP Anti-XSS)
   */
  sanitize(input) {
    if (!input || typeof input !== 'string') return 'PILOTO_ANONIMO';
    const div = document.createElement('div');
    div.textContent = input.trim().slice(0, 15);
    return div.innerHTML;
  }

  ensureInitialData() {
    // Si no existen récords globales simulados, sembramos a los campeones mundiales cyberpunk
    if (!localStorage.getItem(this.GLOBAL_KEY)) {
      const seedGlobal = [
        { alias: 'VIPER_PRIME', score: 18450, difficulty: 'cyber', date: '2026-09-28' },
        { alias: 'NEO_SYNTH', score: 14200, difficulty: 'arcade', date: '2026-10-01' },
        { alias: 'GLITCH_QUEEN', score: 11800, difficulty: 'arcade', date: '2026-10-02' },
        { alias: 'ZERO_COOL', score: 9650, difficulty: 'cyber', date: '2026-10-03' },
        { alias: 'CHRONO_BOY', score: 8100, difficulty: 'casual', date: '2026-10-03' },
        { alias: 'CYBER_VIPER', score: 6950, difficulty: 'arcade', date: '2026-10-04' },
        { alias: 'MATRIX_RUNNER', score: 5400, difficulty: 'cyber', date: '2026-10-04' },
        { alias: 'PIXEL_SAMURAI', score: 4250, difficulty: 'casual', date: '2026-10-05' }
      ];
      localStorage.setItem(this.GLOBAL_KEY, JSON.stringify(seedGlobal));
    }

    if (!localStorage.getItem(this.LOCAL_KEY)) {
      localStorage.setItem(this.LOCAL_KEY, JSON.stringify([]));
    }
  }

  getLocalScores() {
    try {
      const data = localStorage.getItem(this.LOCAL_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer récords locales:', e);
      return [];
    }
  }

  getGlobalScores() {
    try {
      const data = localStorage.getItem(this.GLOBAL_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer ranking global:', e);
      return [];
    }
  }

  getPersonalHighScore() {
    const scores = this.getLocalScores();
    if (scores.length === 0) return 0;
    return Math.max(...scores.map(s => s.score));
  }

  /**
   * Guarda una nueva puntuación y la posiciona tanto en local como en la nube global
   */
  saveScore(rawAlias, score, difficulty, foodCount, bestCombo) {
    const alias = this.sanitize(rawAlias) || 'PILOTO_ANONIMO';
    const entry = {
      alias: alias.toUpperCase(),
      score: parseInt(score, 10) || 0,
      difficulty: difficulty || 'arcade',
      foodCount: foodCount || 0,
      bestCombo: bestCombo || 'x1.0',
      date: new Date().toISOString().split('T')[0]
    };

    // Guardar en Locales
    let local = this.getLocalScores();
    local.push(entry);
    local.sort((a, b) => b.score - a.score);
    local = local.slice(0, 50); // Guardamos top 50 personal
    localStorage.setItem(this.LOCAL_KEY, JSON.stringify(local));

    // Integrar en Global
    let global = this.getGlobalScores();
    global.push(entry);
    global.sort((a, b) => b.score - a.score);
    global = global.slice(0, 20); // Top 20 mundial
    localStorage.setItem(this.GLOBAL_KEY, JSON.stringify(global));

    // Determinar posición en el ranking global
    const globalRank = global.findIndex(item => item === entry || (item.alias === entry.alias && item.score === entry.score)) + 1;

    return {
      success: true,
      entry,
      globalRank: globalRank > 0 ? globalRank : null
    };
  }

  clearLocalScores() {
    localStorage.setItem(this.LOCAL_KEY, JSON.stringify([]));
  }

  /**
   * Renderiza las filas en el elemento tbody especificado
   */
  renderTable(tbodyElement, type = 'global') {
    if (!tbodyElement) return;

    const list = type === 'global' ? this.getGlobalScores() : this.getLocalScores();
    tbodyElement.innerHTML = '';

    if (list.length === 0) {
      tbodyElement.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">
            Aún no hay récords registrados. ¡Completa una partida para ingresar al ranking!
          </td>
        </tr>
      `;
      return;
    }

    list.forEach((item, index) => {
      const tr = document.createElement('tr');
      const rank = index + 1;
      let rankClass = '';
      let rankBadge = `${rank}`;

      if (rank === 1) {
        rankClass = 'rank-top1';
        rankBadge = `🥇 #1`;
      } else if (rank === 2) {
        rankClass = 'rank-top2';
        rankBadge = `🥈 #2`;
      } else if (rank === 3) {
        rankClass = 'rank-top3';
        rankBadge = `🥉 #3`;
      }

      tr.innerHTML = `
        <td class="${rankClass}">${rankBadge}</td>
        <td><span class="player-tag">${item.alias}</span></td>
        <td><span class="diff-badge">${item.difficulty}</span></td>
        <td class="score-cell">${item.score.toLocaleString()}</td>
      `;

      tbodyElement.appendChild(tr);
    });
  }
}

// Instancia global
window.leaderboardManager = new LeaderboardManager();
