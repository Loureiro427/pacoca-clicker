export class SaveManager {
  static SAVE_KEY = 'pacoca_clicker_save';

  static save(state) {
    state.lastSaveTime = Date.now();
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(state));
  }

  static load() {
    const data = localStorage.getItem(this.SAVE_KEY);
    return data ? JSON.parse(data) : null;
  }
}