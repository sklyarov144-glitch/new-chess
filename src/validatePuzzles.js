import { ChessGame } from './chess.js';

const LANGS = ['ru', 'en', 'tr'];
const SOLUTION_RE = /^[a-h][1-8][a-h][1-8]$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasLocalizedFields(container) {
  return isObject(container) && LANGS.every(lang => typeof container[lang] === 'string' && container[lang].trim().length > 0);
}

function parseSolution(solution) {
  return {
    from: { col: solution.charCodeAt(0) - 97, row: 8 - Number(solution[1]) },
    to: { col: solution.charCodeAt(2) - 97, row: 8 - Number(solution[3]) }
  };
}

export function validatePuzzlesForDebug(puzzles) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debugPuzzles') !== '1') return;

  const errors = [];
  let checked = 0;

  puzzles.forEach((puzzle, index) => {
    checked += 1;
    const puzzleId = puzzle?.id ?? `index:${index}`;

    const requiredChecks = [
      ['id', puzzle?.id !== undefined && puzzle?.id !== null],
      ['title.ru/en/tr', hasLocalizedFields(puzzle?.title)],
      ['description.ru/en/tr', hasLocalizedFields(puzzle?.description)],
      ['category', typeof puzzle?.category === 'string' && puzzle.category.trim().length > 0],
      ['difficulty', typeof puzzle?.difficulty === 'string' && puzzle.difficulty.trim().length > 0],
      ['fen', typeof puzzle?.fen === 'string' && puzzle.fen.trim().length > 0],
      ['solution', typeof puzzle?.solution === 'string' && puzzle.solution.trim().length > 0],
      ['hint.ru/en/tr', hasLocalizedFields(puzzle?.hint)],
      ['reward', typeof puzzle?.reward === 'number' && Number.isFinite(puzzle.reward)]
    ];

    requiredChecks.forEach(([field, ok]) => {
      if (!ok) errors.push(`[${puzzleId}] Missing or invalid field: ${field}`);
    });

    const game = new ChessGame();
    try {
      game.reset(puzzle.fen);
    } catch (err) {
      errors.push(`[${puzzleId}] FEN load error: ${err?.message || String(err)}`);
      return;
    }

    if (!SOLUTION_RE.test(puzzle.solution || '')) {
      errors.push(`[${puzzleId}] Invalid solution format: "${puzzle.solution}"`);
      return;
    }

    const { from, to } = parseSolution(puzzle.solution);
    const isLegal = game.legalMoves().some(move =>
      move.from.row === from.row &&
      move.from.col === from.col &&
      move.to.row === to.row &&
      move.to.col === to.col
    );

    if (!isLegal) {
      errors.push(`[${puzzleId}] Solution is not a legal move in this position: ${puzzle.solution}`);
    }
  });

  console.group('[Puzzle Validation]');
  console.log(`Checked puzzles: ${checked}`);
  console.log(`Errors found: ${errors.length}`);
  if (errors.length) {
    console.log('Error list:');
    errors.forEach((entry, idx) => console.log(`${idx + 1}. ${entry}`));
  } else {
    console.log('No puzzle validation errors found.');
  }
  console.groupEnd();
}
