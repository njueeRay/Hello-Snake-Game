const LS_KEY_LEADERBOARD = 'snakeLeaderboard';
const MAX_ENTRIES = 10;

export class Leaderboard {
  constructor() {
    this._entries = this._load();
  }

  /** @returns {Array<{score,level,difficulty,maxCombo,date}>} sorted by score desc */
  getAll() {
    return [...this._entries];
  }

  /**
   * Add a new result. Returns the 1-based rank (1=best), or null if not in top-10.
   * @param {{score:number, level:number, difficulty:string, maxCombo:number}} data
   * @returns {number|null}
   */
  add(data) {
    const entry = {
      score:      data.score,
      level:      data.level,
      difficulty: data.difficulty,
      maxCombo:   data.maxCombo,
      date:       new Date().toLocaleDateString(),
    };
    this._entries.push(entry);
    this._entries.sort((a, b) => b.score - a.score);
    const rank = this._entries.indexOf(entry) + 1; // 1-based
    this._entries = this._entries.slice(0, MAX_ENTRIES);
    this._save();
    return rank <= MAX_ENTRIES ? rank : null;
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY_LEADERBOARD) || '[]');
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(LS_KEY_LEADERBOARD, JSON.stringify(this._entries));
    } catch {
      // localStorage unavailable
    }
  }
}
