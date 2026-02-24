export class UI {
  constructor() {
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.finalScore = document.getElementById('finalScore');
    this.startOverlay = document.getElementById('startOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
  }

  /** @param {number} score */
  updateScore(score) {
    this.scoreDisplay.textContent = String(score);
  }

  showStartScreen() {
    this.startOverlay.classList.remove('overlay-hidden');
  }

  hideStartScreen() {
    this.startOverlay.classList.add('overlay-hidden');
  }

  /** @param {number} score */
  showGameOver(score) {
    this.finalScore.textContent = String(score);
    this.gameOverOverlay.classList.remove('overlay-hidden');
  }

  hideGameOver() {
    this.gameOverOverlay.classList.add('overlay-hidden');
  }

  showPause() {
    this.pauseOverlay.classList.remove('overlay-hidden');
  }

  hidePause() {
    this.pauseOverlay.classList.add('overlay-hidden');
  }
}
