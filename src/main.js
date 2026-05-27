import { ChessGame, boardThemes, pieceSets, puzzles } from './chess.js';
import { yandex } from './yandex.js';

const SHOP_ITEMS = {
  boards: [
    { id: 'royal', name: 'Royal Gold', price: 0 },
    { id: 'neon', name: 'Neon Cyber', price: 240 },
    { id: 'glass', name: 'Frozen Glass', price: 420 }
  ],
  pieces: [
    { id: 'classic', name: 'Classic Unicode', price: 0 },
    { id: 'glyph', name: 'Runic Glyphs', price: 180 },
    { id: 'minimal', name: 'Minimal Dots', price: 300 }
  ]
};

const stateDefaults = {
  coins: 120,
  level: 1,
  completedPuzzles: [],
  activeBoardTheme: 'royal',
  ownedBoardThemes: ['royal'],
  activePieceSet: 'classic',
  ownedPieceSets: ['classic'],
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
  const loadedState = await yandex.load(stateDefaults);
  state = migrateState(loadedState);
  startMode('campaign');
  bindUI();
  render();
  yandex.gameReady();
  yandex.gameplayStart();
  startSessionTimer();
}

function migrateState(loaded) {
  const migrated = { ...stateDefaults, ...loaded };
  if (loaded.activeSkin && !loaded.activeBoardTheme) migrated.activeBoardTheme = loaded.activeSkin;
  if (loaded.unlockedSkins && !loaded.ownedBoardThemes) migrated.ownedBoardThemes = loaded.unlockedSkins;
  if (!Array.isArray(migrated.ownedBoardThemes) || !migrated.ownedBoardThemes.length) migrated.ownedBoardThemes = ['royal'];
  if (!Array.isArray(migrated.ownedPieceSets) || !migrated.ownedPieceSets.length) migrated.ownedPieceSets = ['classic'];
  if (!migrated.ownedBoardThemes.includes('royal')) migrated.ownedBoardThemes.unshift('royal');
  if (!migrated.ownedPieceSets.includes('classic')) migrated.ownedPieceSets.unshift('classic');
  return migrated;
}

function bindUI() { /* unchanged bindings */
  document.querySelectorAll('.mode-btn').forEach(button => button.addEventListener('click', () => startMode(button.dataset.mode)));
  $('#hintBtn').addEventListener('click', () => yandex.showRewarded({ onRewarded: () => { showToast(activePuzzle?.hint || 'Лучший ход подсвечен на доске.'); highlightHint(); } }));
  $('#undoBtn').addEventListener('click', () => yandex.showRewarded({ onRewarded: () => { if (game.undo()) { if (mode === 'ai') game.undo(); showToast('Ход отменен.'); render(); } else showToast('Отменять пока нечего.'); } }));
  $('#rewardBtn').addEventListener('click', () => yandex.showRewarded({ onRewarded: () => { rewardMultiplierArmed = true; showToast('Следующая награда будет удвоена!'); } }));
  $('#interstitialBtn').addEventListener('click', () => yandex.showInterstitial({ onClose: () => showToast('Fullscreen ad закрыта.') }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) yandex.gameplayStop(); else yandex.gameplayStart(); });
  window.addEventListener('contextmenu', event => event.preventDefault());
}

function startMode(nextMode) { /* same */
  mode = nextMode; selected = null; legalTargets = []; rewardMultiplierArmed = false;
  document.querySelectorAll('.mode-btn').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  if (mode === 'campaign') { activePuzzle = puzzles[(state.level - 1) % puzzles.length]; game.reset(activePuzzle.fen); modeLabelEl.textContent = `Кампания • уровень ${state.level}`; missionTitleEl.textContent = activePuzzle.title; }
  if (mode === 'puzzle') { activePuzzle = puzzles[Math.floor(Math.random() * puzzles.length)]; game.reset(activePuzzle.fen); modeLabelEl.textContent = 'Шахматная задача'; missionTitleEl.textContent = activePuzzle.title; }
  if (mode === 'daily') { const dailyIndex = new Date().getDate() % puzzles.length; activePuzzle = puzzles[dailyIndex]; game.reset(activePuzzle.fen); modeLabelEl.textContent = 'Ежедневный вызов'; missionTitleEl.textContent = `${activePuzzle.title} • бонус дня`; }
  if (mode === 'ai') { activePuzzle = null; game.reset('start'); modeLabelEl.textContent = 'Быстрая партия'; missionTitleEl.textContent = 'Игра против ИИ'; }
  render();
}

function render() {
  coinsEl.textContent = state.coins;
  document.documentElement.dataset.boardTheme = state.activeBoardTheme;
  renderBoard();
  renderShop();
  renderRetention();
  statusText.textContent = game.status().text;
}

function renderBoard() {
  boardEl.innerHTML = '';
  const set = pieceSets[state.activePieceSet] || pieceSets.classic;
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const square = document.createElement('button');
    square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
    square.dataset.row = row; square.dataset.col = col; square.setAttribute('aria-label', game.coordsToSquare(row, col));
    const piece = game.getPiece(row, col);
    if (piece) { square.textContent = piece.color === 'w' ? set.white[piece.type] : set.black[piece.type]; square.classList.add('piece', piece.color === 'w' ? 'white-piece' : 'black-piece'); }
    if (selected?.row === row && selected?.col === col) square.classList.add('selected');
    if (legalTargets.some(target => target.row === row && target.col === col)) square.classList.add('legal-target');
    square.addEventListener('click', () => onSquareClick(row, col)); boardEl.appendChild(square);
  }
}
// keep original gameplay functions
const onSquareClick = (row,col)=>{const piece=game.getPiece(row,col);if(selected){const move=game.makeMove(selected,{row,col});if(move){selected=null;legalTargets=[];afterPlayerMove(move);render();return;}}if(piece&&piece.color===game.turn){selected={row,col};legalTargets=game.legalMoves().filter(m=>m.from.row===row&&m.from.col===col).map(m=>m.to);}else{selected=null;legalTargets=[];}render();};
function afterPlayerMove(move){const notation=game.moveToNotation(move);if(activePuzzle){if(notation===activePuzzle.solution) completeChallenge(); else if(!game.status().over) showToast('Ход возможен, но это не лучшее решение. Попробуйте еще раз или нажмите Подсказка.');return;}if(mode==='ai'&&!game.status().over){window.setTimeout(()=>{const aiMove=game.bestMove('b',2);if(aiMove) game.applyMove(aiMove,'q',true);if(game.status().over) completeChallenge(80);render();},350);}}
function completeChallenge(customReward){const baseReward=customReward||activePuzzle.reward;const reward=rewardMultiplierArmed?baseReward*2:baseReward;rewardMultiplierArmed=false;state.coins+=reward;state.completedPuzzles=[...new Set([...state.completedPuzzles,activePuzzle?.title||'ai-win'])];if(mode==='campaign') state.level+=1;if(mode==='daily') state.dailyClaimedDate=new Date().toISOString().slice(0,10);saveState();showToast(`Победа! +${reward} монет.`);state.adsBetweenLevels+=1;if(state.adsBetweenLevels>=3){state.adsBetweenLevels=0;yandex.showInterstitial();}window.setTimeout(()=>startMode(mode==='ai'?'campaign':mode),900);}

function renderShop() {
  renderCategory({ items: SHOP_ITEMS.boards, container: $('#boardShop'), owned: state.ownedBoardThemes, active: state.activeBoardTheme, type: 'board' });
  renderCategory({ items: SHOP_ITEMS.pieces, container: $('#pieceShop'), owned: state.ownedPieceSets, active: state.activePieceSet, type: 'piece' });
}

function renderCategory({ items, container, owned, active, type }) {
  container.innerHTML = '';
  items.forEach(item => {
    const isOwned = owned.includes(item.id);
    const isActive = active === item.id;
    const btn = document.createElement('button');
    btn.className = `skin-card ${isActive ? 'active' : ''}`;
    const label = isActive ? 'Выбрано' : isOwned ? 'Куплено' : `${item.price} 🪙`;
    btn.innerHTML = `<span>${type === 'board' ? '◼' : (pieceSets[item.id]?.black?.q || '♛')}</span><strong>${item.name}</strong><small>${label}</small>`;
    btn.addEventListener('click', () => handleShopAction(type, item));
    container.appendChild(btn);
  });
}

function handleShopAction(type, item) {
  const ownedKey = type === 'board' ? 'ownedBoardThemes' : 'ownedPieceSets';
  const activeKey = type === 'board' ? 'activeBoardTheme' : 'activePieceSet';
  if (state[ownedKey].includes(item.id)) {
    state[activeKey] = item.id;
    saveState();
    render();
    return;
  }
  if (state.coins < item.price) return showToast('Недостаточно монет для покупки.');
  state.coins -= item.price;
  state[ownedKey].push(item.id);
  state[activeKey] = item.id;
  saveState();
  showToast(`Покупка успешна: ${item.name}`);
  render();
}

function highlightHint(){if(!activePuzzle) return;const from=game.squareToCoords(activePuzzle.solution.slice(0,2));selected=from;legalTargets=[game.squareToCoords(activePuzzle.solution.slice(2,4))];render();}
function startSessionTimer(){clearInterval(sessionTimerId);sessionTimerId=setInterval(()=>{state.sessionSeconds+=1;if(state.sessionSeconds%15===0) saveState();renderRetention();},1000);}
function renderRetention(){const minutes=Math.floor(state.sessionSeconds/60).toString().padStart(2,'0');const seconds=(state.sessionSeconds%60).toString().padStart(2,'0');sessionTimerEl.textContent=`${minutes}:${seconds}`;const progress=Math.min(100,(state.sessionSeconds/600)*100);retentionProgressEl.style.width=`${progress}%`;retentionTextEl.textContent=progress>=100?'Премиальный сундук открыт. Отличная сессия!':`До премиального сундука: ${Math.ceil((600-state.sessionSeconds)/60)} мин.`;}
function saveState(){yandex.save(state);}
function showToast(message){toastEl.textContent=message;toastEl.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toastEl.classList.remove('show'),2600);}
