const { getStore } = require('@netlify/blobs');

const QUESTIONS = [
  {
    "id": 1,
    "text": "1950年、オニツカ株式会社（現ASICS）が最初に発売した競技用シューズの種目は？",
    "options": [
      "マラソン",
      "バスケットボール",
      "レスリング",
      "体操"
    ],
    "correctAnswer": 1,
    "timeLimit": 25
  },
  {
    "id": 2,
    "text": "1986年、初めて「GEL」を搭載して発売されたシューズのモデル名は？",
    "options": [
      "GT-II",
      "TARTHER",
      "GEL-LYTE",
      "KAYANO"
    ],
    "correctAnswer": 0,
    "timeLimit": 20
  },
  {
    "id": 3,
    "text": "1966年に誕生した、アシックスストライプの当時の呼び名は？",
    "options": [
      "タイガーストライプ",
      "オリンピックライン",
      "メキシコライン",
      "スピードライン"
    ],
    "correctAnswer": 2,
    "timeLimit": 20
  },
  {
    "id": 4,
    "text": "初代「GEL-KAYANO」（1993年）のデザインのモチーフとなった昆虫は？",
    "options": [
      "クワガタ",
      "カブトムシ",
      "トンボ",
      "カマキリ"
    ],
    "correctAnswer": 0,
    "timeLimit": 20
  },
  {
    "id": 5,
    "text": "アシックスの社名の由来「Anima Sana In Corpore Sano」を残した古代ローマの詩人は？",
    "options": [
      "ユウェナリス",
      "ホラティウス",
      "ウェルギリウス",
      "オウィディウス"
    ],
    "correctAnswer": 0,
    "timeLimit": 25
  },
  {
    "id": 6,
    "text": "計画中のベトナム「南北高速鉄道」の最高設計速度は時速何キロ？",
    "options": [
      "250 km/h",
      "300 km/h",
      "350 km/h",
      "400 km/h"
    ],
    "correctAnswer": 2,
    "timeLimit": 20
  },
  {
    "id": 7,
    "text": "ベトナムの通貨「ドン（Đồng）」の語源（本来の意味）は？",
    "options": [
      "銅",
      "銀",
      "金",
      "龍"
    ],
    "correctAnswer": 0,
    "timeLimit": 15
  },
  {
    "id": 8,
    "text": "ベトナム料理「フォー」のスープに、通常『使われない』スパイスはどれ？",
    "options": [
      "八角",
      "シナモン",
      "クミン",
      "クローブ"
    ],
    "correctAnswer": 2,
    "timeLimit": 25
  },
  {
    "id": 9,
    "text": "世界第2位のコーヒー生産国ベトナムで、主に栽培されている豆の品種は？",
    "options": [
      "アラビカ種",
      "ロブスタ種",
      "リベリカ種",
      "エクセルサ種"
    ],
    "correctAnswer": 1,
    "timeLimit": 15
  },
  {
    "id": 10,
    "text": "ベトナムに対する外国直接投資（FDI）の累積投資額が最も多い国は？",
    "options": [
      "日本",
      "韓国",
      "アメリカ",
      "中国"
    ],
    "correctAnswer": 1,
    "timeLimit": 20
  }
];
const STORE_KEY = 'asics-quiz-state-v1';

function initialState() {
  return {
    phase: 'lobby',
    players: {},
    currentQuestionIndex: -1,
    currentQuestion: null,
    questionStartedAt: null,
    counts: [],
    correctAnswer: null,
    playerStates: {},
    leaderboard: [],
    totalQuestions: QUESTIONS.length,
    version: Date.now(),
    updatedAt: new Date().toISOString()
  };
}

function headers() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };
}

async function loadState(store) {
  const state = await store.get(STORE_KEY, { type: 'json' });
  return state || initialState();
}

async function saveState(store, state) {
  state.version = Date.now();
  state.updatedAt = new Date().toISOString();
  await store.setJSON(STORE_KEY, state);
  return state;
}

function publicQuestion(q) {
  if (!q) return null;
  return { id: q.id, text: q.text, options: q.options, timeLimit: q.timeLimit };
}

function computeResults(state) {
  const fullQ = QUESTIONS[state.currentQuestionIndex];
  if (!fullQ) return state;
  const counts = new Array(fullQ.options.length).fill(0);
  const playerStates = {};
  for (const [id, p] of Object.entries(state.players || {})) {
    if (p.isEliminated) {
      playerStates[id] = { isCorrect: false, wrongCount: p.wrongCount, isEliminated: true, score: p.score };
      continue;
    }
    const ans = p.currentAnswer;
    let isCorrect = false;
    if (Number.isInteger(ans) && ans >= 0 && ans < counts.length) counts[ans] += 1;
    if (ans === fullQ.correctAnswer) {
      isCorrect = true;
      p.score += 100;
    } else {
      p.wrongCount += 1;
      if (p.wrongCount >= 5) p.isEliminated = true;
    }
    playerStates[id] = { isCorrect, wrongCount: p.wrongCount, isEliminated: p.isEliminated, score: p.score };
  }
  state.phase = 'result';
  state.counts = counts;
  state.correctAnswer = fullQ.correctAnswer;
  state.playerStates = playerStates;
  return state;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  const store = getStore('quiz');
  try {
    let state = await loadState(store);
    if (event.httpMethod === 'GET') {
      return { statusCode: 200, headers: headers(), body: JSON.stringify(state) };
    }
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: headers(), body: JSON.stringify({ error: 'Method not allowed' }) };

    const body = event.body ? JSON.parse(event.body) : {};
    const action = body.action;

    if (action === 'reset') {
      state = initialState();
    } else if (action === 'join') {
      const playerId = String(body.playerId || '').slice(0, 64);
      const name = String(body.name || '').trim().slice(0, 20);
      if (!playerId || !name) throw new Error('playerId and name are required');
      if (!state.players[playerId]) {
        state.players[playerId] = { name, score: 0, currentAnswer: null, wrongCount: 0, isEliminated: false };
      } else {
        state.players[playerId].name = name;
      }
    } else if (action === 'start' || action === 'next') {
      const nextIndex = action === 'start' ? 0 : state.currentQuestionIndex + 1;
      if (nextIndex >= QUESTIONS.length) {
        state.phase = 'end';
        state.leaderboard = Object.values(state.players || {}).sort((a,b) => b.score - a.score).slice(0, 5);
      } else {
        state.phase = 'question';
        state.currentQuestionIndex = nextIndex;
        state.currentQuestion = publicQuestion(QUESTIONS[nextIndex]);
        state.questionStartedAt = Date.now();
        state.counts = [];
        state.correctAnswer = null;
        state.playerStates = {};
        for (const p of Object.values(state.players || {})) p.currentAnswer = null;
      }
    } else if (action === 'answer') {
      if (state.phase !== 'question') return { statusCode: 200, headers: headers(), body: JSON.stringify(state) };
      const p = state.players[String(body.playerId || '')];
      if (p && !p.isEliminated && p.currentAnswer === null) {
        p.currentAnswer = Number(body.optionIndex);
      }
      const active = Object.values(state.players || {}).filter(p => !p.isEliminated).length;
      const answered = Object.values(state.players || {}).filter(p => !p.isEliminated && p.currentAnswer !== null).length;
      if (active > 0 && answered >= active) state = computeResults(state);
    } else if (action === 'showResults') {
      if (state.phase === 'question') state = computeResults(state);
    } else {
      throw new Error('Unknown action');
    }
    state = await saveState(store, state);
    return { statusCode: 200, headers: headers(), body: JSON.stringify(state) };
  } catch (err) {
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ error: err.message }) };
  }
};
