import { ChessGame, puzzles, themes } from './chess.js';
import { yandex } from './yandex.js';

const stateDefaults = {
  coins: 120,
  level: 1,
  completedPuzzles: [],
  activeSkin: 'royal',
  unlockedSkins: ['royal'],
  sessionSeconds: 0,
  adsBetweenLevels: 0,
  dailyClaimedDate: ''
};

const game = new ChessGame();
let state = { ...stateDefaults };
let selected = null;
let legalTargets = [];
let mode = 'campaign';
let activePuzzle = puzzles[0];
let sessionTimerId = null;
let rewardMultiplierArmed = false;

const $ = (selector) => document.querySelector(selector);
const boardEl = $('#board');
const statusText = $('#statusText');
const coinsEl = $('#coins');
const sessionTimerEl = $('#sessionTimer');
const retentionProgressEl = $('#retentionProgress');
const retentionTextEl = $('#retentionText');
const missionTitleEl = $('#missionTitle');
const modeLabelEl = $('#modeLabel');
const toastEl = $('#toast');

boot();

async function boot() {
  await yandex.init();
  state = await yandex.load(stateDefaults);
  startMode('campaign');
  bindUI();
  render();
  yandex.gameReady();
  yandex.gameplayStart();
  startSessionTimer();
}

function bindUI() {
  document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => startMode(button.dataset.mode));
  });

  $('#hintBtn').addEventListener('click', () => {
    yandex.showRewarded({
      onRewarded: () => {
        showToast(activePuzzle?.hint || 'Лучший ход подсвечен на доске.');
        highlightHint();
      }
    });
  });

  $('#undoBtn').addEventListener('click', () => {
    yandex.showRewarded({
      onRewarded: () => {
        if (game.undo()) {
          if (mode === 'ai') game.undo();
          showToast('Ход отменен.');
          render();
        } else {
          showToast('Отменять пока нечего.');
        }
      }
    });
  });

  $('#rewardBtn').addEventListener('click', () => {
    yandex.showRewarded({
      onRewarded: () => {
        rewardMultiplierArmed = true;
        showToast('Следующая награда будет удвоена!');
      }
    });
  });

  $('#interstitialBtn').addEventListener('click', () => {
    yandex.showInterstitial({ onClose: () => showToast('Fullscreen ad закрыта.') });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) yandex.gameplayStop();
    else yandex.gameplayStart();
  });

  window.addEventListener('contextmenu', event => event.preventDefault());
}

function startMode(nextMode) {
  mode = nextMode;
  selected = null;
  legalTargets = [];
  rewardMultiplierArmed = false;

  document.querySelectorAll('.mode-btn').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));

  if (mode === 'campaign') {
    activePuzzle = puzzles[(state.level - 1) % puzzles.length];
    game.reset(activePuzzle.fen);
    modeLabelEl.textContent = `Кампания • уровень ${state.level}`;
    missionTitleEl.textContent = activePuzzle.title;
  }

  if (mode === 'puzzle') {
    activePuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    game.reset(activePuzzle.fen);
    modeLabelEl.textContent = 'Шахматная задача';
    missionTitleEl.textContent = activePuzzle.title;
  }

  if (mode === 'daily') {
    const dailyIndex = new Date().getDate() % puzzles.length;
    activePuzzle = puzzles[dailyIndex];
    game.reset(activePuzzle.fen);
    modeLabelEl.textContent = 'Ежедневный вызов';
    missionTitleEl.textContent = `${activePuzzle.title} • бонус дня`;
  }

  if (mode === 'ai') {
    activePuzzle = null;
    game.reset('start');
    modeLabelEl.textContent = 'Быстрая партия';
    missionTitleEl.textContent = 'Игра против ИИ';
  }

  render();
}

function render() {
  coinsEl.textContent = state.coins;
  document.documentElement.dataset.skin = state.activeSkin;
  renderBoard();
  renderSkins();
  renderRetention();
  statusText.textContent = game.status().text;
}

function renderBoard() {
  boardEl.innerHTML = '';
  const skin = themes[state.activeSkin] || themes.royal;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('button');
      square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
      square.dataset.row = row;
      square.dataset.col = col;
      square.setAttribute('aria-label', game.coordsToSquare(row, col));

      const piece = game.getPiece(row, col);
      if (piece) {
        square.textContent = piece.color === 'w' ? skin.white[piece.type] : skin.black[piece.type];
        square.classList.add('piece', piece.color === 'w' ? 'white-piece' : 'black-piece');
      }

      if (selected?.row === row && selected?.col === col) square.classList.add('selected');
      if (legalTargets.some(target => target.row === row && target.col === col)) square.classList.add('legal-target');

      square.addEventListener('click', () => onSquareClick(row, col));
      boardEl.appendChild(square);
    }
  }
}

function onSquareClick(row, col) {
  const piece = game.getPiece(row, col);

  if (selected) {
    const move = game.makeMove(selected, { row, col });
    if (move) {
      selected = null;
      legalTargets = [];
      afterPlayerMove(move);
      render();
      return;
    }
  }

  if (piece && piece.color === game.turn) {
    selected = { row, col };
    legalTargets = game.legalMoves().filter(move => move.from.row === row && move.from.col === col).map(move => move.to);
  } else {
    selected = null;
    legalTargets = [];
  }

  render();
}

function afterPlayerMove(move) {
  const notation = game.moveToNotation(move);

  if (activePuzzle) {
    if (notation === activePuzzle.solution) {
      completeChallenge();
    } else if (!game.status().over) {
      showToast('Ход возможен, но это не лучшее решение. Попробуйте еще раз или нажмите Подсказка.');
    }
    return;
  }

  if (mode === 'ai' && !game.status().over) {
    window.setTimeout(() => {
      const aiMove = game.bestMove('b', 2);
      if (aiMove) game.applyMove(aiMove, 'q', true);
      if (game.status().over) completeChallenge(80);
      render();
    }, 350);
  }
}

function completeChallenge(customReward) {
  const baseReward = customReward || activePuzzle.reward;
  const reward = rewardMultiplierArmed ? baseReward * 2 : baseReward;
  rewardMultiplierArmed = false;

  state.coins += reward;
  state.completedPuzzles = [...new Set([...state.completedPuzzles, activePuzzle?.title || 'ai-win'])];

  if (mode === 'campaign') state.level += 1;
  if (mode === 'daily') state.dailyClaimedDate = new Date().toISOString().slice(0, 10);

  maybeUnlockSkin();
  saveState();
  showToast(`Победа! +${reward} монет.`);

  state.adsBetweenLevels += 1;
  if (state.adsBetweenLevels >= 3) {
    state.adsBetweenLevels = 0;
    yandex.showInterstitial();
  }

  window.setTimeout(() => startMode(mode === 'ai' ? 'campaign' : mode), 900);
}

function maybeUnlockSkin() {
  const unlocks = [
    { id: 'neon', price: 240 },
    { id: 'glass', price: 420 }
  ];

  for (const skin of unlocks) {
    if (state.coins >= skin.price && !state.unlockedSkins.includes(skin.id)) {
      state.unlockedSkins.push(skin.id);
      showToast(`Открыта тема: ${themes[skin.id].name}`);
      break;
    }
  }
}

function renderSkins() {
  const skinsEl = $('#skins');
  skinsEl.innerHTML = '';

  Object.entries(themes).forEach(([id, theme]) => {
    const unlocked = state.unlockedSkins.includes(id);
    const button = document.createElement('button');
    button.className = `skin-card ${state.activeSkin === id ? 'active' : ''}`;
    button.innerHTML = `<span>${theme.black.q}</span><strong>${theme.name}</strong><small>${unlocked ? 'Открыто' : 'Закрыто'}</small>`;
    button.addEventListener('click', () => {
      if (!unlocked) {
        showToast('Эта тема откроется за монеты или через магазин.');
        return;
      }
      state.activeSkin = id;
      saveState();
      render();
    });
    skinsEl.appendChild(button);
  });
}

function highlightHint() {
  if (!activePuzzle) return;
  const from = game.squareToCoords(activePuzzle.solution.slice(0, 2));
  selected = from;
  legalTargets = [game.squareToCoords(activePuzzle.solution.slice(2, 4))];
  render();
}

function startSessionTimer() {
  clearInterval(sessionTimerId);
  sessionTimerId = setInterval(() => {
    state.sessionSeconds += 1;
    if (state.sessionSeconds % 15 === 0) saveState();
    renderRetention();
  }, 1000);
}

function renderRetention() {
  const minutes = Math.floor(state.sessionSeconds / 60).toString().padStart(2, '0');
  const seconds = (state.sessionSeconds % 60).toString().padStart(2, '0');
  sessionTimerEl.textContent = `${minutes}:${seconds}`;
  const progress = Math.min(100, (state.sessionSeconds / 600) * 100);
  retentionProgressEl.style.width = `${progress}%`;
  retentionTextEl.textContent = progress >= 100
    ? 'Премиальный сундук открыт. Отличная сессия!'
    : `До премиального сундука: ${Math.ceil((600 - state.sessionSeconds) / 60)} мин.`;
}

function saveState() {
  yandex.save(state);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}
