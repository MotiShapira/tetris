import { Game } from './gameloop.js';

const boardCanvas   = document.getElementById('board');
const nextCanvases  = [1, 2, 3].map(i => document.getElementById(`next${i}`));
const holdCanvas    = document.getElementById('hold');

const uiElements = {
  score:        document.getElementById('score'),
  level:        document.getElementById('level'),
  lines:        document.getElementById('lines'),
  overlay:      document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlay-title'),
  overlayMsg:   document.getElementById('overlay-msg'),
  restartBtn:   document.getElementById('restart-btn'),
};

const game = new Game(boardCanvas, nextCanvases, holdCanvas, uiElements);
