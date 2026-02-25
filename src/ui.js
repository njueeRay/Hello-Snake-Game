export class UI {
  constructor() {
    this.scoreDisplay     = document.getElementById('scoreDisplay');
    this.levelDisplay     = document.getElementById('levelDisplay');
    this.highScoreDisplay = document.getElementById('highScoreDisplay');
    this.finalScore       = document.getElementById('finalScore');
    this.finalHighScore   = document.getElementById('finalHighScore');
    this.victoryScore     = document.getElementById('victoryScore');
    this.pauseScore       = document.getElementById('pauseScore');
    this.startOverlay     = document.getElementById('startOverlay');
    this.gameOverOverlay  = document.getElementById('gameOverOverlay');
    this.victoryOverlay   = document.getElementById('victoryOverlay');
    this.pauseOverlay     = document.getElementById('pauseOverlay');
    this.muteButton       = document.getElementById('muteButton');
    this.comboItem        = document.getElementById('comboItem');
    this.comboDisplay     = document.getElementById('comboDisplay');
    this.pauseLevel       = document.getElementById('pauseLevel');
    this.pauseDifficulty  = document.getElementById('pauseDifficulty');
    this.pauseTime        = document.getElementById('pauseTime');
    this.pauseMaxCombo    = document.getElementById('pauseMaxCombo');
    this.leaderboardOverlay = document.getElementById('leaderboardOverlay');
    this.leaderboardBody  = document.getElementById('leaderboardBody');
    this.newRecordBadge   = document.getElementById('newRecordBadge');
    this.gameOverLbBody   = document.getElementById('gameOverLbBody');
    this.timerItem        = document.getElementById('timerItem');
    this.timerDisplay     = document.getElementById('timerDisplay');

    ['scoreDisplay','levelDisplay','highScoreDisplay','finalScore','finalHighScore',
     'victoryScore','pauseScore','startOverlay','gameOverOverlay','victoryOverlay','pauseOverlay',
    ].forEach((key) => {
      if (!this[key]) console.error(`[UI] Missing DOM element: #${key}`);
    });
  }

  /** @param {number} score */
  updateScore(score) {
    this.scoreDisplay.textContent = String(score);
  }

  /** @param {number} level */
  updateLevel(level) {
    this.levelDisplay.textContent = String(level);
  }

  /** @param {number} highScore */
  updateHighScore(highScore) {
    this.highScoreDisplay.textContent = String(highScore);
  }

  showStartScreen() {
    this.startOverlay.classList.remove('overlay-hidden');
  }

  hideStartScreen() {
    this.startOverlay.classList.add('overlay-hidden');
  }

  /**
   * @param {number} score
   * @param {number} highScore
   * @param {Array} leaderboard
   * @param {number|null} rank
   */
  showGameOver(score, highScore, leaderboard = [], rank = null) {
    this.finalScore.textContent = String(score);
    this.finalHighScore.textContent = String(highScore);
    if (this.newRecordBadge) {
      this.newRecordBadge.classList.toggle('overlay-hidden', rank === null || rank > 3);
    }
    if (this.gameOverLbBody) {
      this._renderLeaderboardRows(this.gameOverLbBody, leaderboard, 5);
    }
    this.gameOverOverlay.classList.remove('overlay-hidden');
  }

  hideGameOver() {
    this.gameOverOverlay.classList.add('overlay-hidden');
  }

  /**
   * @param {number} score
   * @param {number} highScore
   */
  showVictory(score, highScore, rank = null) {
    this.victoryScore.textContent = String(score);
    this.highScoreDisplay.textContent = String(highScore);
    if (this.newRecordBadge) {
      this.newRecordBadge.classList.toggle('overlay-hidden', rank === null || rank > 3);
    }
    this.victoryOverlay.classList.remove('overlay-hidden');
  }

  hideVictory() {
    this.victoryOverlay.classList.add('overlay-hidden');
  }

  /**
   * @param {{score:number, level:number, difficulty:string, elapsed:number, maxCombo:number}} stats
   */
  showPause(stats) {
    this.pauseScore.textContent      = String(stats.score);
    this.pauseLevel.textContent      = String(stats.level);
    this.pauseDifficulty.textContent = stats.difficulty;
    const secs = Math.floor(stats.elapsed / 1000);
    this.pauseTime.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    this.pauseMaxCombo.textContent = `×${(stats.maxCombo >= 10 ? 3 : stats.maxCombo >= 6 ? 2 : stats.maxCombo >= 3 ? 1.5 : 1)}`;
    this.pauseOverlay.classList.remove('overlay-hidden');
  }

  hidePause() {
    this.pauseOverlay.classList.add('overlay-hidden');
  }

  /** @param {number} combo */
  updateCombo(combo) {
    if (!this.comboItem || !this.comboDisplay) return;
    if (combo < 3) {
      this.comboItem.classList.add('score-item--hidden');
      return;
    }
    this.comboItem.classList.remove('score-item--hidden');
    const mult = combo >= 10 ? 3 : combo >= 6 ? 2 : 1.5;
    this.comboDisplay.textContent = `×${mult}`;
    this.comboDisplay.className = `combo-value combo-value--${mult === 3 ? 'max' : mult === 2 ? 'high' : 'mid'}`;
  }

  showLeaderboard(entries) {
    if (!this.leaderboardOverlay || !this.leaderboardBody) return;
    this._renderLeaderboardRows(this.leaderboardBody, entries, 10);
    this.leaderboardOverlay.classList.remove('overlay-hidden');
  }

  hideLeaderboard() {
    if (this.leaderboardOverlay) {
      this.leaderboardOverlay.classList.add('overlay-hidden');
    }
  }

  /**
   * Reflect the muted state on the mute button.
   * @param {boolean} muted
   */
  updateMuteButton(muted) {
    if (!this.muteButton) return;
    this.muteButton.classList.toggle('mute-btn--off', muted);
    this.muteButton.textContent = muted ? '🔇' : '♪';
    this.muteButton.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  }

  /**
   * Render leaderboard table rows into a <tbody> element.
   * @param {HTMLElement} tbody
   * @param {Array} entries
   * @param {number} maxRows
   */
  _renderLeaderboardRows(tbody, entries, maxRows) {
    tbody.innerHTML = '';
    if (entries.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.className = 'lb-empty';
      td.textContent = 'No records yet';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    entries.slice(0, maxRows).forEach((e, i) => {
      const tr = document.createElement('tr');
      if (i === 0) tr.classList.add('lb-row--first');

      const tdRank = document.createElement('td');
      tdRank.className = 'lb-rank';
      tdRank.textContent = String(i + 1);

      const tdScore = document.createElement('td');
      tdScore.className = 'lb-score';
      tdScore.textContent = String(e.score);

      const tdDiff = document.createElement('td');
      tdDiff.className = `lb-difficulty lb-difficulty--${e.difficulty}`;
      const modeLabel = (e.mode || 'classic') === 'timeattack' ? 'TIME ATK' : 'CLASSIC';
      tdDiff.textContent = modeLabel;

      const tdDate = document.createElement('td');
      tdDate.className = 'lb-date';
      tdDate.textContent = String(e.date);

      tr.appendChild(tdRank);
      tr.appendChild(tdScore);
      tr.appendChild(tdDiff);
      tr.appendChild(tdDate);
      tbody.appendChild(tr);
    });
  }

  /**
   * Update the countdown timer HUD (visible only in Time Attack mode).
   * @param {number} ms - milliseconds remaining
   * @param {string} mode - 'classic' | 'timeattack'
   */
  updateTimer(ms, mode) {
    if (!this.timerItem || !this.timerDisplay) return;
    if (mode !== 'timeattack') {
      this.timerItem.classList.add('score-item--hidden');
      return;
    }
    this.timerItem.classList.remove('score-item--hidden');
    const secs = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, '0');
    this.timerDisplay.textContent = `${m}:${s}`;
    this.timerDisplay.classList.toggle('timer-value--warning', secs <= 10);
  }
}
