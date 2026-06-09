// Maps keyboard events to game actions.
// Consumers call input.consume(action) to check and clear a queued action.

export class Input {
  constructor() {
    this._held = new Set();    // keys currently held down
    this._actions = [];        // one-shot actions (keydown)

    // Auto-repeat state for movement keys
    this._repeatKey = null;
    this._repeatTimer = 0;
    this._DAS = 133;  // ms before auto-repeat starts (Delayed Auto Shift)
    this._ARR = 10;   // ms between auto-repeat ticks

    window.addEventListener('keydown', e => this._onKeyDown(e));
    window.addEventListener('keyup', e => this._onKeyUp(e));
  }

  _onKeyDown(e) {
    if (this._held.has(e.code)) return; // ignore key-repeat from OS
    this._held.add(e.code);

    const action = this._codeToAction(e.code);
    if (!action) return;

    e.preventDefault();
    this._actions.push(action);

    // Start DAS for movement keys
    if (action === 'left' || action === 'right' || action === 'softDrop') {
      this._repeatKey = action;
      this._repeatTimer = -this._DAS; // negative: count up to 0 before repeating
    }
  }

  _onKeyUp(e) {
    this._held.delete(e.code);
    const action = this._codeToAction(e.code);
    if (action === this._repeatKey) {
      this._repeatKey = null;
      this._repeatTimer = 0;
    }
  }

  _codeToAction(code) {
    switch (code) {
      case 'ArrowLeft':  return 'left';
      case 'ArrowRight': return 'right';
      case 'ArrowDown':  return 'softDrop';
      case 'ArrowUp':    return 'rotateCW';
      case 'KeyX':       return 'rotateCW';
      case 'KeyZ':       return 'rotateCCW';
      case 'Space':      return 'hardDrop';
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight': return 'hold';
      case 'KeyP':       return 'pause';
      case 'KeyR':       return 'restart';
      case 'Enter':      return 'start';
      default:           return null;
    }
  }

  // Call every frame with delta-ms to fire auto-repeat actions
  update(dt) {
    if (!this._repeatKey) return;
    this._repeatTimer += dt;
    if (this._repeatTimer >= 0) {
      this._actions.push(this._repeatKey);
      this._repeatTimer -= this._ARR;
    }
  }

  // Returns true and removes the action if it is queued
  consume(action) {
    const idx = this._actions.indexOf(action);
    if (idx === -1) return false;
    this._actions.splice(idx, 1);
    return true;
  }

  clearAll() {
    this._actions = [];
    this._repeatKey = null;
  }
}
