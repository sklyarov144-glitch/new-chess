const basePuzzles = [
  { fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1', solution: 'a1a8' },
  { fen: '4k3/8/8/3q4/8/4N3/8/4K3 w - - 0 1', solution: 'e3d5' },
  { fen: '4k3/8/8/8/8/8/5q2/4K2R w - - 0 1', solution: 'e1f2' },
  { fen: '6k1/5ppp/8/8/8/8/5PPP/6KQ w - - 0 1', solution: 'h1d8' },
  { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 0 1', solution: 'd4c6' }
];

const categories = [
  'mate1','mate2','winQueen','fork','pin','discovered','defense','endgame','promotion','tactical'
];

const difficulties = ['easy','medium','hard','expert'];

const tr = {
  categories: {
    mate1: { ru: 'Мат в 1 ход', en: 'Mate in 1', tr: '1 Hamlede Mat' },
    mate2: { ru: 'Мат в 2 хода', en: 'Mate in 2', tr: '2 Hamlede Mat' },
    winQueen: { ru: 'Выигрыш ферзя', en: 'Win the Queen', tr: 'Veziri Kazan' },
    fork: { ru: 'Вилка', en: 'Fork', tr: 'Çatal' },
    pin: { ru: 'Связка', en: 'Pin', tr: 'Açmaz' },
    discovered: { ru: 'Вскрытое нападение', en: 'Discovered Attack', tr: 'Açmaz Saldırısı' },
    defense: { ru: 'Защита от мата', en: 'Defend Mate Threat', tr: 'Mat Savunması' },
    endgame: { ru: 'Эндшпиль', en: 'Endgame', tr: 'Oyunsonu' },
    promotion: { ru: 'Превращение пешки', en: 'Pawn Promotion', tr: 'Piyon Terfisi' },
    tactical: { ru: 'Тактический удар', en: 'Tactical Shot', tr: 'Taktik Darbe' }
  },
  difficulty: {
    easy: { ru: 'Легко', en: 'Easy', tr: 'Kolay' },
    medium: { ru: 'Средне', en: 'Medium', tr: 'Orta' },
    hard: { ru: 'Сложно', en: 'Hard', tr: 'Zor' },
    expert: { ru: 'Эксперт', en: 'Expert', tr: 'Uzman' }
  }
};

export function getPuzzleLabel(type, lang='ru') { return tr.categories[type]?.[lang] || type; }
export function getDifficultyLabel(level, lang='ru') { return tr.difficulty[level]?.[lang] || level; }

export const puzzles = Array.from({ length: 100 }, (_, i) => {
  const b = basePuzzles[i % basePuzzles.length];
  const category = categories[i % categories.length];
  const difficulty = difficulties[Math.floor(i / 25)];
  return {
    id: i + 1,
    title: {
      ru: `Задача #${i + 1}`,
      en: `Puzzle #${i + 1}`,
      tr: `Bulmaca #${i + 1}`
    },
    description: {
      ru: `Найдите лучшее продолжение. Тип: ${tr.categories[category].ru}.`,
      en: `Find the best continuation. Theme: ${tr.categories[category].en}.`,
      tr: `En iyi devam yolunu bulun. Tema: ${tr.categories[category].tr}.`
    },
    category,
    difficulty,
    fen: b.fen,
    solution: b.solution,
    hint: {
      ru: 'Ищите шахи, взятия и угрозы в первую очередь.',
      en: 'Look for checks, captures, and threats first.',
      tr: 'Önce şah, alma ve tehditlere bakın.'
    },
    reward: 30 + ((i % 10) * 5)
  };
});
