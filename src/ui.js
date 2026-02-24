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
   */
  showGameOver(score, highScore) {
    this.finalScore.textContent = String(score);
    this.finalHighScore.textContent = String(highScore);
    this.gameOverOverlay.classList.remove('overlay-hidden');
  }

  hideGameOver() {
    this.gameOverOverlay.classList.add('overlay-hidden');
  }

  /**
   * @param {number} score
   * @param {number} highScore
   */
  showVictory(score, highScore) {
    this.victoryScore.textContent = String(score);
    this.highScoreDisplay.textContent = String(highScore);
    this.victoryOverlay.classList.remove('overlay-hidden');
  }

  hideVictory() {
    this.victoryOverlay.classList.add('overlay-hidden');
  }

  /** @param {number} score */
  showPause(score) {
    this.pauseScore.textContent = String(score);
    this.pauseOverlay.classList.remove('overlay-hidden');
  }

  hidePause() {
    this.pauseOverlay.classList.add('overlay-hidden');
  }
}
