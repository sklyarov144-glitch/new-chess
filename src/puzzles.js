const tr = {
  categories: {
    mate1: { ru: 'Мат в 1 ход', en: 'Mate in 1', tr: '1 Hamlede Mat' },
    mate2: { ru: 'Мат в 2 хода', en: 'Mate in 2', tr: '2 Hamlede Mat' },
    fork: { ru: 'Вилка', en: 'Fork', tr: 'Çatal' },
    pin: { ru: 'Связка', en: 'Pin', tr: 'Açmaz' },
    discovered: { ru: 'Вскрытое нападение', en: 'Discovered Attack', tr: 'Açık Saldırı' },
    defense: { ru: 'Защита', en: 'Defense', tr: 'Savunma' },
    endgame: { ru: 'Эндшпиль', en: 'Endgame', tr: 'Oyunsonu' },
    promotion: { ru: 'Превращение пешки', en: 'Promotion', tr: 'Terfi' },
    tactical: { ru: 'Тактика', en: 'Tactics', tr: 'Taktik' }
  },
  difficulty: {
    all: { ru: 'Все', en: 'All', tr: 'Tümü' },
    easy: { ru: 'Легко', en: 'Easy', tr: 'Kolay' },
    medium: { ru: 'Средне', en: 'Medium', tr: 'Orta' },
    hard: { ru: 'Сложно', en: 'Hard', tr: 'Zor' },
    expert: { ru: 'Эксперт', en: 'Expert', tr: 'Uzman' }
  }
};

export function getPuzzleLabel(type, lang='ru') { return tr.categories[type]?.[lang] || type; }
export function getDifficultyLabel(level, lang='ru') { return tr.difficulty[level]?.[lang] || level; }

const baseHint = {
  ru: 'Сначала проверьте шахи, затем взятия и угрозы.',
  en: 'Check forcing moves first: checks, captures, threats.',
  tr: 'Önce zorlayıcı hamlelere bakın: şah, alma, tehdit.'
};

export const puzzles = [
  ['6k1/5ppp/8/8/8/8/5PPP/6KQ w - - 0 1','h1d8','mate1','easy'],
  ['r1bqkbnr/pppp1ppp/2n5/4p3/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 0 1','d4c6','fork','easy'],
  ['7k/8/6K1/8/8/8/8/R7 w - - 0 1','a1a8','mate1','easy'],
  ['4k3/8/8/3q4/8/4N3/8/4K3 w - - 0 1','e3d5','fork','easy'],
  ['4k3/8/8/8/8/8/5q2/4K2R w - - 0 1','e1f2','defense','easy'],
  ['r3k2r/ppp2ppp/2n5/3qp3/3P4/2P2N2/PP3PPP/R1BQ1RK1 w kq - 0 1','d4e5','tactical','medium'],
  ['2r3k1/5ppp/3q4/8/3Q4/8/5PPP/6K1 w - - 0 1','d4d6','pin','medium'],
  ['6k1/5pp1/7p/8/8/1Q6/5PPP/6K1 w - - 0 1','b3b8','mate1','easy'],
  ['4r1k1/5ppp/8/8/8/5Q2/5PPP/6K1 w - - 0 1','f3a8','mate1','easy'],
  ['8/5pk1/5np1/8/8/5Q2/5PPP/6K1 w - - 0 1','f3a8','mate2','medium'],
  ['r1b1k2r/ppp2ppp/2n1pn2/3q4/3P4/2N1PN2/PPQ2PPP/R1B2RK1 w kq - 0 1','c2h7','tactical','hard'],
  ['2r3k1/5ppp/8/8/8/1Q6/5PPP/6K1 w - - 0 1','b3b8','mate1','easy'],
  ['6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1','d1d8','mate1','easy'],
  ['6k1/5ppp/8/8/8/8/5PPP/5RK1 w - - 0 1','f1d1','endgame','easy'],
  ['8/5pk1/6p1/8/8/5Q2/5PPP/6K1 w - - 0 1','f3a8','mate1','easy'],
  ['r2q1rk1/ppp2ppp/2n5/3n4/3P4/2N1PN2/PP3PPP/R1BQ1RK1 w - - 0 1','c3d5','fork','medium'],
  ['r1bq1rk1/pppp1ppp/2n5/4p3/3nP3/5N2/PPP2PPP/RNBQ1RK1 w - - 0 1','f3d4','fork','easy'],
  ['5rk1/5ppp/8/8/8/5Q2/5PPP/6K1 w - - 0 1','f3a8','mate1','easy'],
  ['r1b1k2r/ppp2ppp/2n1pn2/8/3P4/2N1PN2/PP3PPP/R1BQ1RK1 w kq - 0 1','d4d5','tactical','medium'],
  ['6k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1','e2e8','mate1','easy'],
  ['8/5pk1/8/8/8/3Q4/5PPP/6K1 w - - 0 1','d3d8','mate1','easy'],
  ['rnbqk2r/pppp1ppp/4pn2/8/3P4/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 1','d4d5','tactical','medium'],
  ['6k1/5ppp/8/8/8/2Q5/5PPP/6K1 w - - 0 1','c3c8','mate1','easy'],
  ['r1bqkbnr/pppp1ppp/2n5/4p3/3NP3/5N2/PPP2PPP/R1BQKB1R w KQkq - 0 1','d4c6','fork','easy'],
  ['6k1/5ppp/8/8/8/8/5PPP/2Q3K1 w - - 0 1','c1c8','mate1','easy'],
  ['8/5pk1/8/8/8/8/5PPP/3Q2K1 w - - 0 1','d1d8','mate1','easy'],
  ['r1bq1rk1/ppp2ppp/2n5/3n4/3P4/2N2N2/PPQ2PPP/R1B2RK1 w - - 0 1','c3d5','fork','medium'],
  ['6k1/5ppp/8/8/8/5Q2/5PPP/7K w - - 0 1','f3a8','mate1','easy'],
  ['4r1k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1','d1d8','mate1','easy'],
  ['r2q1rk1/ppp2ppp/2n5/8/3P4/2N2N2/PPQ2PPP/R1B2RK1 w - - 0 1','c3d5','fork','medium'],
  ['6k1/5ppp/8/8/8/8/4QPPP/7K w - - 0 1','e2e8','mate1','easy'],
  ['8/5pk1/8/8/8/8/5PPP/2Q3K1 w - - 0 1','c1c8','mate1','easy'],
  ['r1bqk2r/pppp1ppp/2n2n2/8/3P4/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 1','d4d5','tactical','medium'],
  ['6k1/5ppp/8/8/8/2Q5/5PPP/7K w - - 0 1','c3c8','mate1','easy'],
  ['8/5pk1/8/8/8/5Q2/5PPP/7K w - - 0 1','f3a8','mate1','easy'],
  ['r1bq1rk1/ppp2ppp/2n5/8/3P4/2N1PN2/PP3PPP/R1BQ1RK1 w - - 0 1','d4d5','tactical','medium'],
  ['6k1/5ppp/8/8/8/8/5PPP/3Q3K w - - 0 1','d1d8','mate1','easy'],
  ['4r1k1/5ppp/8/8/8/2Q5/5PPP/6K1 w - - 0 1','c3c8','mate1','easy'],
  ['r1bqk2r/pppp1ppp/2n2n2/4p3/3NP3/8/PPP2PPP/R1BQKB1R w KQkq - 0 1','d4c6','fork','easy'],
  ['6k1/5ppp/8/8/8/8/5PPP/1Q4K1 w - - 0 1','b1b8','mate1','easy'],
  ['8/5pk1/8/8/8/1Q6/5PPP/6K1 w - - 0 1','b3b8','mate1','easy'],
  ['r2q1rk1/ppp2ppp/2n5/3n4/3P4/2N2N2/PP3PPP/R1BQ1RK1 w - - 0 1','c3d5','fork','medium'],
  ['6k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1','e2e8','mate1','easy'],
  ['4r1k1/5ppp/8/8/8/1Q6/5PPP/6K1 w - - 0 1','b3b8','mate1','easy'],
  ['r1bqkbnr/pppp1ppp/2n5/4p3/3NP3/8/PPP2PPP/RNBQK2R w KQkq - 0 1','d4c6','fork','easy'],
  ['6k1/5ppp/8/8/8/8/5PPP/Q5K1 w - - 0 1','a1a8','mate1','easy'],
  ['8/5pk1/8/8/8/2Q5/5PPP/6K1 w - - 0 1','c3c8','mate1','easy'],
  ['r1bq1rk1/ppp2ppp/2n5/3n4/3P4/2N1PN2/PPQ2PPP/R1B2RK1 w - - 0 1','c3d5','fork','medium'],
  ['6k1/5ppp/8/8/8/3Q4/5PPP/6K1 w - - 0 1','d3d8','mate1','easy'],
  ['4r1k1/5ppp/8/8/8/8/5PPP/2Q3K1 w - - 0 1','c1c8','mate1','easy'],
  ['r2q1rk1/ppp2ppp/2n5/8/3P4/2N1PN2/PP3PPP/R1BQ1RK1 w - - 0 1','d4d5','tactical','medium']
].map((p, i) => ({
  id: i + 1,
  title: { ru: `Задача ${i + 1}`, en: `Puzzle ${i + 1}`, tr: `Bulmaca ${i + 1}` },
  description: {
    ru: `Найдите лучший ход. Тема: ${tr.categories[p[2]].ru}.`,
    en: `Find the best move. Theme: ${tr.categories[p[2]].en}.`,
    tr: `En iyi hamleyi bulun. Tema: ${tr.categories[p[2]].tr}.`
  },
  category: p[2],
  difficulty: p[3],
  fen: p[0],
  solution: p[1],
  hint: baseHint,
  reward: 25 + (p[3] === 'easy' ? 5 : p[3] === 'medium' ? 15 : p[3] === 'hard' ? 25 : 35)
}));
