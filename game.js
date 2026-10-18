// game.js — Noir Detective game logic + start.ng integration

// ============================================================
// START.NG INTEGRATION
// ============================================================
const START_NG = 'https://start.ng';
let frame;

function connectFrame() {
  frame ??= new Promise((resolve, reject) => {
    const el = document.createElement('iframe');
    el.src = `${START_NG}/connect`;
    el.hidden = true;
    el.onload = () => resolve(el);
    el.onerror = reject;
    document.body.append(el);
  });
  return frame;
}

async function askStartNg(message, replyType, timeoutMs = 5000) {
  const el = await connectFrame();
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2);
    const done = (reply) => { clearTimeout(timer); removeEventListener('message', onMessage); resolve(reply); };
    const timer = setTimeout(() => done(null), timeoutMs);
    function onMessage(e) {
      if (e.origin !== START_NG || e.source !== el.contentWindow) return;
      if (e.data?.type === replyType && e.data.requestId === requestId) done(e.data);
    }
    addEventListener('message', onMessage);
    el.contentWindow.postMessage({ ...message, requestId }, START_NG);
  });
}

// Profile card
let currentPlayer = null;

async function loadPlayer() {
  const reply = await askStartNg({ type: 'startng:whoami' }, 'startng:user');
  const player = reply?.user ?? reply?.guest;
  currentPlayer = reply;
  if (player) {
    document.getElementById('player-face').src = player.face;
    document.getElementById('player-name').textContent = player.name;
    const isGuest = !reply?.user;
    document.getElementById('player-account').textContent = isGuest ? 'Not signed in' : `@${reply.user.account}`;
    document.getElementById('player-sign-in').hidden = !isGuest;
    document.getElementById('player-sign-in').onclick = () =>
      (location.href = `${START_NG}/?return_to=${encodeURIComponent(location.origin + location.pathname)}`);
    document.getElementById('player-card').hidden = false;
  }
}

async function saveScore(scoreObj) {
  const reply = await askStartNg({ type: 'startng:score', stats: scoreObj }, 'startng:scoreSaved');
  return reply;
}

async function getLeaderboard(limit = 10) {
  const reply = await askStartNg({ type: 'startng:leaderboard', limit }, 'startng:leaderboardData');
  return reply?.entries ?? [];
}

// Re-check player on visibility change
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadPlayer(); });
window.addEventListener('focus', loadPlayer);

// ============================================================
// GAME STATE
// ============================================================
const state = {
  selectedCase: null,
  readingLevel: 'general',
  timerSeconds: 180, // countdown from 3 minutes
  timerInterval: null,
  hintsUsed: 0,
  lockedEvidence: new Set(),
  notebookEntries: [],
  boardLinks: [],
  contradictionsFound: 0,
  wrongContradictions: 0,
  wrongAccusations: 0,
  askedQuestions: {}, // suspect -> Set of question indices
};

// HINT COST tiers
const HINT_COSTS = [50, 100, 200];

// ============================================================
// SCREEN NAVIGATION
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ============================================================
// TITLE SCREEN
// ============================================================
document.getElementById('btn-start').addEventListener('click', () => {
  renderCaseLibrary();
  showScreen('screen-library');
});

// ============================================================
// CASE LIBRARY
// ============================================================
function renderCaseLibrary(theme = 'all') {
  const grid = document.getElementById('case-grid');
  const cases = theme === 'all' ? window.CASES : window.CASES.filter(c => c.theme === theme);
  grid.innerHTML = cases.map(c => `
    <div class="case-card" data-id="${c.id}">
      <div class="case-theme-badge">${c.theme.toUpperCase()}</div>
      <h3>${c.title}</h3>
      <p>${c.summary}</p>
      <div class="case-diff">Difficulty: ${'★'.repeat(c.difficulty)}${'☆'.repeat(3 - c.difficulty)}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.case-card').forEach(card => {
    card.addEventListener('click', () => {
      const c = window.CASES.find(x => x.id === card.dataset.id);
      openCaseSetup(c);
    });
  });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCaseLibrary(btn.dataset.theme);
  });
});

document.getElementById('btn-back-library').addEventListener('click', () => showScreen('screen-title'));

// ============================================================
// CASE SETUP
// ============================================================
function openCaseSetup(c) {
  state.selectedCase = c;
  document.getElementById('setup-theme').textContent = c.theme.toUpperCase();
  document.getElementById('setup-title').textContent = c.title;
  document.getElementById('setup-summary').textContent = c.summary;
  document.getElementById('setup-difficulty').textContent = '★'.repeat(c.difficulty) + '☆'.repeat(3 - c.difficulty);
  showScreen('screen-setup');
}

document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.readingLevel = btn.dataset.level;
  });
});

document.getElementById('btn-back-setup').addEventListener('click', () => showScreen('screen-library'));
document.getElementById('btn-begin').addEventListener('click', startInvestigation);

// ============================================================
// INVESTIGATION
// ============================================================
function startInvestigation() {
  const c = state.selectedCase;
  state.timerSeconds = 0;
  state.hintsUsed = 0;
  state.lockedEvidence = new Set();
  state.notebookEntries = [];
  state.boardLinks = [];
  state.contradictionsFound = 0;
  state.wrongContradictions = 0;
  state.wrongAccusations = 0;
  state.askedQuestions = {};
  c.suspects.forEach(s => { state.askedQuestions[s.id] = new Set(); });

  // Header
  document.getElementById('inv-case-title').textContent = c.title;
  document.getElementById('hint-cost').textContent = `−${HINT_COSTS[0]}`;

  // BRIEFING
  document.getElementById('briefing-text').textContent = c.briefing[state.readingLevel];
  const introList = document.getElementById('suspect-intro-list');
  introList.innerHTML = c.suspects.map(s => `
    <div class="suspect-card">
      <div class="sname">${s.emoji} ${s.name}</div>
      <div class="srole">${s.role}</div>
      <div class="sdesc">${s.intro}</div>
    </div>
  `).join('');

  // EVIDENCE
  renderEvidence();

  // SUSPECTS
  renderSuspects();

  // NOTEBOOK
  renderNotebook();

  // BOARD
  renderBoard();

  // Timer — countdown from 3:00
  clearInterval(state.timerInterval);
  state.timerSeconds = 180;
  document.getElementById('timer').textContent = '3:00';
  state.timerInterval = setInterval(() => {
    state.timerSeconds--;
    const m = Math.floor(state.timerSeconds / 60);
    const s = state.timerSeconds % 60;
    const timerEl = document.getElementById('timer');
    timerEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    // Turn red in last 30 seconds
    timerEl.style.color = state.timerSeconds <= 30 ? '#c0392b' : '';
    if (state.timerSeconds <= 0) {
      clearInterval(state.timerInterval);
      // Auto-submit with the current best guess
      const firstSuspect = state.selectedCase.suspects[0].id;
      const lockedArr = Array.from(state.lockedEvidence);
      showVerdict(firstSuspect, lockedArr.length ? lockedArr : [state.selectedCase.evidence[0].id]);
    }
  }, 1000);

  // Activate 3D crime scene tab by default
  switchTab('scene3d');
  showScreen('screen-investigation');
}

// TAB SWITCHING
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
  if (name === 'scene3d') {
    initOrUpdate3DScene();
  }
}

// ABANDON
document.getElementById('btn-abandon').addEventListener('click', () => {
  clearInterval(state.timerInterval);
  showScreen('screen-library');
});

// HINT
document.getElementById('btn-hint').addEventListener('click', () => {
  const c = state.selectedCase;
  const tier = Math.min(state.hintsUsed, 2);
  const cost = HINT_COSTS[tier];
  const hints = [
    `Nudge: Look carefully at the evidence involving "${c.evidence[0].name}".`,
    `Direction: Cross-reference what the suspects say about each other.`,
    `Strong Pointer: The culprit is "${c.suspects.find(s => s.id === c.culprit).name}". Now find the proof.`,
  ];
  alert(`💡 Hint (costs −${cost} pts):\n\n${hints[tier]}`);
  state.hintsUsed++;
  document.getElementById('hint-cost').textContent = `−${HINT_COSTS[Math.min(state.hintsUsed, 2)]}`;
  addNotebookEntry('Hint used', `Hint ${tier + 1} of 3 requested.`);
});

// ============================================================
// EVIDENCE
// ============================================================
function renderEvidence() {
  const c = state.selectedCase;
  const grid = document.getElementById('evidence-grid');
  grid.innerHTML = c.evidence.map(ev => `
    <div class="evidence-item ${state.lockedEvidence.has(ev.id) ? 'in-locker' : ''}" data-id="${ev.id}">
      <span class="evidence-icon">${ev.emoji}</span>
      <div class="evidence-name">${ev.name}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.evidence-item').forEach(item => {
    item.addEventListener('click', () => {
      const ev = c.evidence.find(e => e.id === item.dataset.id);
      showEvidenceDetail(ev);
    });
  });
}

function showEvidenceDetail(ev) {
  const detail = document.getElementById('evidence-detail');
  document.getElementById('ev-title').textContent = `${ev.emoji} ${ev.name}`;
  document.getElementById('ev-desc').textContent = ev.desc;
  const btn = document.getElementById('ev-locker-btn');
  btn.textContent = state.lockedEvidence.has(ev.id) ? 'In Locker ✓' : 'Add to Locker';
  btn.onclick = () => {
    state.lockedEvidence.add(ev.id);
    addNotebookEntry('Evidence', `${ev.name}: ${ev.desc}`);
    renderEvidence();
    btn.textContent = 'In Locker ✓';
    renderNotebook();
    repopulateSelects();
  };
  detail.classList.remove('hidden');
}

document.getElementById('close-evidence').addEventListener('click', () => {
  document.getElementById('evidence-detail').classList.add('hidden');
});

// ============================================================
// SUSPECTS / INTERVIEW
// ============================================================
function renderSuspects() {
  const c = state.selectedCase;
  const list = document.getElementById('suspect-list');
  list.innerHTML = c.suspects.map(s => `
    <div class="suspect-row" data-id="${s.id}">
      <div class="suspect-avatar">${s.emoji}</div>
      <div class="suspect-row-info">
        <div class="sname">${s.name}</div>
        <div class="srole">${s.role}</div>
      </div>
      <div style="margin-left:auto;font-size:12px;color:var(--amber);opacity:.7">Interview →</div>
    </div>
  `).join('');

  list.querySelectorAll('.suspect-row').forEach(row => {
    row.addEventListener('click', () => openInterview(row.dataset.id));
  });
}

function openInterview(suspectId) {
  const c = state.selectedCase;
  const s = c.suspects.find(x => x.id === suspectId);
  const interview = c.interviews[suspectId];
  const panel = document.getElementById('interview-panel');
  panel.classList.remove('hidden');
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.alignItems = 'center';
  panel.style.justifyContent = 'center';

  document.getElementById('interview-name').textContent = `${s.emoji} ${s.name}`;
  document.getElementById('dialogue-box').textContent = interview.opening;

  const qList = document.getElementById('question-list');
  const asked = state.askedQuestions[suspectId];

  qList.innerHTML = interview.questions.map((q, i) => `
    <button class="q-btn ${asked.has(i) ? 'asked' : ''}" data-i="${i}" ${asked.has(i) ? 'disabled' : ''}>
      ${asked.has(i) ? '✓ ' : ''}${q.q}
    </button>
  `).join('');

  qList.querySelectorAll('.q-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = +btn.dataset.i;
      const q = interview.questions[idx];
      document.getElementById('dialogue-box').textContent = q.a;
      asked.add(idx);
      addNotebookEntry(s.name, q.logsAs);
      renderNotebook();
      repopulateSelects();
      btn.disabled = true;
      btn.classList.add('asked');
      btn.textContent = '✓ ' + q.q;
    });
  });
}

document.getElementById('close-interview').addEventListener('click', () => {
  const panel = document.getElementById('interview-panel');
  panel.classList.add('hidden');
  panel.style.display = '';
});

// ============================================================
// NOTEBOOK
// ============================================================
function addNotebookEntry(label, text) {
  if (!state.notebookEntries.find(e => e.label === label && e.text === text)) {
    state.notebookEntries.push({ label, text, id: `nb-${state.notebookEntries.length}` });
  }
}

function renderNotebook() {
  const container = document.getElementById('notebook-entries');
  container.innerHTML = state.notebookEntries.map(e => `
    <div class="nb-entry" data-id="${e.id}">
      <strong>${e.label}:</strong> ${e.text}
    </div>
  `).join('') || '<p style="opacity:.5;font-size:13px">No entries yet. Examine evidence and interview suspects.</p>';
}

// CONTRADICTIONS
function repopulateSelects() {
  const c = state.selectedCase;
  const opts = state.notebookEntries.map(e => `<option value="${e.id}">${e.label}: ${e.text.slice(0, 60)}</option>`).join('');
  ['contra-a', 'contra-b', 'link-a', 'link-b'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

document.getElementById('btn-flag-contra').addEventListener('click', () => {
  const c = state.selectedCase;
  const aId = document.getElementById('contra-a').value;
  const bId = document.getElementById('contra-b').value;
  const feedback = document.getElementById('contra-feedback');
  if (aId === bId) { feedback.textContent = 'Select two different entries.'; feedback.className = 'wrong'; return; }

  const aEntry = state.notebookEntries.find(e => e.id === aId);
  const bEntry = state.notebookEntries.find(e => e.id === bId);
  if (!aEntry || !bEntry) return;

  const match = c.contradictions.find(con => {
    const aMatch = aEntry.text.includes(con.a.slice(0, 40)) || con.a.slice(0, 40).includes(aEntry.text.slice(0, 40));
    const bMatch = bEntry.text.includes(con.b.slice(0, 40)) || con.b.slice(0, 40).includes(bEntry.text.slice(0, 40));
    return (aMatch && bMatch) || (bMatch && aMatch);
  });

  if (match) {
    if (match.correct) {
      state.contradictionsFound++;
      feedback.textContent = `✓ ${match.feedback}`;
      feedback.className = 'correct';
    } else {
      state.wrongContradictions++;
      feedback.textContent = `✗ ${match.feedback}`;
      feedback.className = 'wrong';
    }
  } else {
    state.wrongContradictions++;
    feedback.textContent = '✗ No meaningful contradiction found between those entries.';
    feedback.className = 'wrong';
  }
});

// ============================================================
// DEDUCTION BOARD
// ============================================================
function renderBoard() {
  const c = state.selectedCase;
  const nodes = document.getElementById('board-nodes');
  nodes.innerHTML = c.suspects.map(s => `<div class="board-node">${s.emoji} ${s.name}</div>`).join('') +
    c.evidence.map(ev => `<div class="board-node">${ev.emoji} ${ev.name}</div>`).join('');

  renderBoardLinks();
}

function renderBoardLinks() {
  const links = document.getElementById('board-links');
  links.innerHTML = state.boardLinks.map(l =>
    `<div class="board-link ${l.type}">
      <strong>${l.a}</strong> 
      <span style="opacity:.6">[${l.type}]</span> 
      <strong>${l.b}</strong>
    </div>`
  ).join('') || '<p style="opacity:.4;font-size:12px">No connections yet.</p>';
}

document.getElementById('btn-draw-link').addEventListener('click', () => {
  const aOpt = document.getElementById('link-a').selectedOptions[0];
  const bOpt = document.getElementById('link-b').selectedOptions[0];
  const type = document.getElementById('link-type').value;
  if (!aOpt || !bOpt || aOpt.value === bOpt.value) return;
  state.boardLinks.push({ a: aOpt.textContent.trim().slice(0, 40), b: bOpt.textContent.trim().slice(0, 40), type });
  renderBoardLinks();
});

// ============================================================
// ACCUSATION
// ============================================================
document.getElementById('btn-accuse').addEventListener('click', openAccusation);

function openAccusation() {
  const c = state.selectedCase;
  const select = document.getElementById('accuse-suspect');
  select.innerHTML = c.suspects.map(s => `<option value="${s.id}">${s.emoji} ${s.name}</option>`).join('');

  const checklist = document.getElementById('evidence-checklist');
  checklist.innerHTML = c.evidence.map(ev => `
    <label class="ev-check-item">
      <input type="checkbox" value="${ev.id}" ${state.lockedEvidence.has(ev.id) ? 'checked' : ''}>
      ${ev.emoji} ${ev.name}
    </label>
  `).join('');

  showScreen('screen-accusation');
}

document.getElementById('btn-back-accuse').addEventListener('click', () => showScreen('screen-investigation'));

document.getElementById('btn-submit-accuse').addEventListener('click', async () => {
  const c = state.selectedCase;
  const suspectId = document.getElementById('accuse-suspect').value;
  const cited = Array.from(document.querySelectorAll('#evidence-checklist input:checked')).map(i => i.value);

  if (cited.length === 0) {
    alert('You must cite at least one piece of evidence!');
    return;
  }

  clearInterval(state.timerInterval);
  await showVerdict(suspectId, cited);
});

// ============================================================
// SCORING
// ============================================================
function calcScore(c, suspectId, cited) {
  let score = 0;
  const correct = suspectId === c.culprit;

  // 1. Correct solution (400)
  const solutionPts = correct ? 400 : 0;
  score += solutionPts;

  // 2. Key evidence cited
  const keyHits = cited.filter(id => c.keyEvidence.includes(id)).length;
  const evidencePts = keyHits * 80;
  score += evidencePts;

  // 3. Contradictions found
  const contraPts = state.contradictionsFound * 60;
  score += contraPts;

  // 4. Speed bonus: based on remaining time (max 150 at 3:00, 0 at 0:00)
  const speedPts = Math.round((state.timerSeconds / 180) * 150);
  score += speedPts;

  // 5. Hints used penalty
  const hintPenalty = HINT_COSTS.slice(0, state.hintsUsed).reduce((a, b) => a + b, 0);
  score -= hintPenalty;

  // 6. Wrong contradictions penalty
  score -= state.wrongContradictions * 30;

  // 7. Wrong accusation penalty
  if (!correct) score -= 50;

  // Level multiplier
  const mult = { kids: 0.8, general: 1.0, advanced: 1.3 }[state.readingLevel] ?? 1;
  const diffMult = 0.8 + c.difficulty * 0.2;
  const final = Math.max(0, Math.round(score * mult * diffMult));

  return { final, solutionPts, evidencePts, contraPts, speedPts, hintPenalty, correct, keyHits };
}

// ============================================================
// VERDICT
// ============================================================
async function showVerdict(suspectId, cited) {
  const c = state.selectedCase;
  const sc = calcScore(c, suspectId, cited);
  const suspect = c.suspects.find(s => s.id === suspectId);
  const culprit = c.suspects.find(s => s.id === c.culprit);

  // Stamp
  const stamp = document.getElementById('verdict-stamp');
  stamp.textContent = sc.correct ? 'CASE CLOSED' : 'CASE OPEN';
  stamp.className = `verdict-stamp ${sc.correct ? 'correct' : 'wrong'}`;

  document.getElementById('verdict-title').textContent = sc.correct
    ? `You got it, Detective!`
    : `Wrong accusation.`;

  document.getElementById('verdict-msg').textContent = sc.correct
    ? `${suspect.name} is indeed the culprit. Excellent deduction.`
    : `${suspect.name} is innocent. The real culprit was ${culprit.name}.`;

  // Breakdown
  document.getElementById('score-breakdown').innerHTML = `
    <div class="score-row"><span>Correct solution</span><span>+${sc.solutionPts}</span></div>
    <div class="score-row"><span>Key evidence cited (${sc.keyHits})</span><span>+${sc.evidencePts}</span></div>
    <div class="score-row"><span>Contradictions found</span><span>+${sc.contraPts}</span></div>
    <div class="score-row"><span>Speed bonus</span><span>+${sc.speedPts}</span></div>
    <div class="score-row"><span>Hint penalties</span><span>−${sc.hintPenalty}</span></div>
    <div class="score-row"><span>Wrong flag penalties</span><span>−${state.wrongContradictions * 30}</span></div>
    <div class="score-row"><span>Level/Difficulty multiplier</span><span>×${(0.8 + c.difficulty * 0.2).toFixed(1)} × ${({ kids: 0.8, general: 1.0, advanced: 1.3 }[state.readingLevel])}</span></div>
    <div class="score-row"><span><strong>TOTAL SCORE</strong></span><span><strong>${sc.final}</strong></span></div>
  `;

  // Debrief
  document.getElementById('debrief-text').textContent = c.debrief;
  document.getElementById('source-credit').textContent = `Source: ${c.source}`;

  // Leaderboard + save
  const msgEl = document.getElementById('score-save-msg');
  if (currentPlayer?.user) {
    // Get total score from localStorage (simple accumulation)
    const prevTotal = parseInt(localStorage.getItem('noir_total_score') || '0', 10);
    const prevCases = parseInt(localStorage.getItem('noir_cases_solved') || '0', 10);
    const newTotal = prevTotal + sc.final;
    const newCases = prevCases + (sc.correct ? 1 : 0);
    localStorage.setItem('noir_total_score', newTotal);
    localStorage.setItem('noir_cases_solved', newCases);

    const saved = await saveScore({ score: newTotal, cases: newCases });
    if (saved?.ok) {
      msgEl.textContent = saved.result?.improved
        ? `New personal best! You're ranked #${saved.result.rank} 🏆`
        : `Score saved. Your rank: #${saved.result?.rank ?? '—'}`;
    } else {
      msgEl.textContent = saved?.error ?? 'Score not saved (sign in to save).';
    }
  } else {
    msgEl.innerHTML = `<a style="color:var(--amber);cursor:pointer" onclick="location.href='${START_NG}/?return_to='+encodeURIComponent(location.origin+location.pathname)">Sign in to save your score!</a>`;
  }

  // Render leaderboard
  const board = await getLeaderboard(10);
  const playerUser = currentPlayer?.user;
  const lbList = document.getElementById('leaderboard-list');
  if (board.length === 0) {
    lbList.innerHTML = '<li style="opacity:.5">No scores yet — be the first!</li>';
  } else {
    lbList.innerHTML = board.map(e => `
      <li class="${playerUser && e.player_id === playerUser.id ? 'me' : ''}">
        <span class="lb-rank">#${e.rank}</span>
        <span>${e.name}</span>
        <span style="margin-left:auto;color:var(--amber)">${e.stats?.score ?? e.score ?? '—'} pts</span>
      </li>
    `).join('');
  }

  showScreen('screen-verdict');
}

document.getElementById('btn-play-again').addEventListener('click', () => {
  showScreen('screen-library');
  renderCaseLibrary();
});

// ============================================================
// SUSPENSE MUSIC (Web Audio API Synthesizer)
// ============================================================
let audioCtx = null;
let musicPlaying = false;
let musicInterval = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSuspenseNote(freq, duration, type = 'sine', gainVal = 0.08) {
  if (!audioCtx || !musicPlaying) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainVal, audioCtx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn(e);
  }
}

function toggleSuspenseMusic() {
  initAudio();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  musicPlaying = !musicPlaying;
  const btn = document.getElementById('btn-toggle-music');
  if (musicPlaying) {
    btn.textContent = '🎵 Music: ON';
    btn.classList.add('playing');
    // Dark moody suspense notes (D minor / noir intervals)
    const notes = [73.42, 82.41, 87.31, 98.00, 110.00, 130.81, 146.83];
    let step = 0;
    // Base drone
    playSuspenseNote(55, 6, 'triangle', 0.06);
    musicInterval = setInterval(() => {
      if (!musicPlaying) return;
      // Low drone pulse every 4 beats
      if (step % 4 === 0) {
        playSuspenseNote(55, 4.5, 'triangle', 0.07);
        playSuspenseNote(82.41, 3.5, 'sine', 0.04);
      }
      // Eerie suspense note
      const n = notes[Math.floor(Math.random() * notes.length)];
      playSuspenseNote(n, 2.5, 'sine', 0.05);
      step++;
    }, 1200);
  } else {
    btn.textContent = '🎵 Music: OFF';
    btn.classList.remove('playing');
    if (musicInterval) clearInterval(musicInterval);
  }
}

document.getElementById('btn-toggle-music').addEventListener('click', toggleSuspenseMusic);

// ============================================================
// DETECTIVE SAGE BARNABY (Hints & Companion)
// ============================================================
const sageSpeech = document.getElementById('sage-speech');
const sageText = document.getElementById('sage-text');
const sageAvatar = document.getElementById('sage-avatar');
const sageClose = document.getElementById('sage-close-speech');
const sageIndicator = document.getElementById('sage-indicator');

function speakSage(text) {
  sageText.textContent = text;
  sageSpeech.classList.remove('hidden');
  sageIndicator.style.display = 'none';
}

sageClose.addEventListener('click', (e) => {
  e.stopPropagation();
  sageSpeech.classList.add('hidden');
});

sageAvatar.addEventListener('click', () => {
  if (sageSpeech.classList.contains('hidden')) {
    generateSageHint();
  } else {
    generateSageHint();
  }
});

function generateSageHint() {
  const c = state.selectedCase;
  if (!c || !document.getElementById('screen-investigation').classList.contains('active')) {
    speakSage('"Select a case file and start investigating, partner. I’ll keep my eyes open."');
    return;
  }

  // Context-aware dynamic clues
  const activeTab = document.querySelector('.tab.active')?.dataset.tab || 'briefing';
  const culprit = c.suspects.find(s => s.id === c.culprit);

  const tips = [
    `"Keep an eye on ${culprit.name}'s statements. Liars always trip over timelines."`,
    `"Check the evidence locker. Have you examined the ${c.evidence[0].name} yet?"`,
    `"If someone claims they were in one place, verify with other witnesses in the notebook."`,
    `"Contradictions break cases wide open. Look for two notebook entries that clash directly!"`,
    `"Remember: don't accuse blindly. You'll need hard evidence to back your verdict in court."`
  ];

  if (activeTab === 'evidence') {
    speakSage(`"Found anything unusual in the evidence? Remember you can lock key items into your evidence file."`);
  } else if (activeTab === 'suspects') {
    speakSage(`"Listen between the lines. Notice how ${c.suspects[0].name} phrases their alibi?"`);
  } else if (activeTab === 'notebook') {
    speakSage(`"Compare statements! When two witnesses give conflicting times or places, flag it immediately."`);
  } else {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    speakSage(randomTip);
  }
}

// ============================================================
// THREE.JS 3D FINITE CRIME SCENE & DETECTIVE CONTROLLER
// ============================================================
let scene3D, camera3D, renderer3D;
let detectiveMesh, detectiveHat;
let interactiveObjects = [];
let keysPressed = {};
let sceneInitialized = false;
let currentNearbyTarget = null;
const ROOM_LIMIT = 11; // finite boundary [-11, 11]

function initOrUpdate3DScene() {
  const container = document.getElementById('three-canvas-container');
  if (!container || typeof THREE === 'undefined') return;

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 420;

  if (!sceneInitialized) {
    scene3D = new THREE.Scene();
    scene3D.background = new THREE.Color(0x0a0704);
    scene3D.fog = new THREE.FogExp2(0x0a0704, 0.035);

    camera3D = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera3D.position.set(0, 15, 17);
    camera3D.lookAt(0, 0, 0);

    renderer3D = new THREE.WebGLRenderer({ antialias: true });
    renderer3D.setSize(width, height);
    renderer3D.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer3D.domElement);

    // Noir Lighting
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.4);
    scene3D.add(ambientLight);

    const streetLamp = new THREE.PointLight(0xd4a017, 1.8, 30);
    streetLamp.position.set(0, 10, 0);
    streetLamp.castShadow = true;
    scene3D.add(streetLamp);

    // Finite Floor (Room / Alley)
    const floorGeo = new THREE.PlaneGeometry(ROOM_LIMIT * 2, ROOM_LIMIT * 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x181410, roughness: 0.85 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene3D.add(floor);

    // Finite Border Walls (Noir cobblestone boundary)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x241c14, roughness: 0.9 });
    const wallThick = 0.5, wallH = 2.5;
    
    // North, South, East, West walls
    const wN = new THREE.Mesh(new THREE.BoxGeometry(ROOM_LIMIT * 2 + 1, wallH, wallThick), wallMat);
    wN.position.set(0, wallH / 2, -ROOM_LIMIT);
    const wS = new THREE.Mesh(new THREE.BoxGeometry(ROOM_LIMIT * 2 + 1, wallH, wallThick), wallMat);
    wS.position.set(0, wallH / 2, ROOM_LIMIT);
    const wE = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, ROOM_LIMIT * 2 + 1), wallMat);
    wE.position.set(ROOM_LIMIT, wallH / 2, 0);
    const wW = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, ROOM_LIMIT * 2 + 1), wallMat);
    wW.position.set(-ROOM_LIMIT, wallH / 2, 0);
    scene3D.add(wN, wS, wE, wW);

    // Detective Character (Trench coat + Fedora hat)
    detectiveMesh = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x7c6241 }); // Khaki trenchcoat
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.6, 12), coatMat);
    body.position.y = 0.8;
    body.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), new THREE.MeshStandardMaterial({ color: 0xe0c8b0 }));
    head.position.y = 1.9;

    detectiveHat = new THREE.Group();
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0x2b2216 }));
    brim.position.y = 2.15;
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x2b2216 }));
    crown.position.y = 2.35;
    detectiveHat.add(brim, crown);

    detectiveMesh.add(body, head, detectiveHat);
    detectiveMesh.position.set(0, 0, 4);
    scene3D.add(detectiveMesh);

    // Movement Key Listeners
    window.addEventListener('keydown', (e) => {
      keysPressed[e.key.toLowerCase()] = true;
      if ((e.code === 'Space' || e.key === 'Enter') && currentNearbyTarget) {
        interactWithCurrentTarget();
      }
    });
    window.addEventListener('keyup', (e) => {
      keysPressed[e.key.toLowerCase()] = false;
    });

    // Touch/Mobile D-Pad
    const setupDpad = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', () => { keysPressed[key] = true; });
      el.addEventListener('pointerup', () => { keysPressed[key] = false; });
      el.addEventListener('pointerleave', () => { keysPressed[key] = false; });
    };
    setupDpad('dpad-up', 'arrowup');
    setupDpad('dpad-down', 'arrowdown');
    setupDpad('dpad-left', 'arrowleft');
    setupDpad('dpad-right', 'arrowright');

    document.getElementById('btn-scene-interact').addEventListener('click', interactWithCurrentTarget);

    window.addEventListener('resize', () => {
      if (!renderer3D || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera3D.aspect = w / h;
      camera3D.updateProjectionMatrix();
      renderer3D.setSize(w, h);
    });

    sceneInitialized = true;
    animate3DScene();
  }

  // Populate or re-populate case objects (Suspects & Evidence)
  buildCrimeSceneObjects();
}

function buildCrimeSceneObjects() {
  const c = state.selectedCase;
  if (!c || !scene3D) return;

  // Clear existing interactive objects
  interactiveObjects.forEach(obj => scene3D.remove(obj.mesh));
  interactiveObjects = [];

  // Place suspects around the room perimeter
  const suspects = c.suspects || [];
  suspects.forEach((s, idx) => {
    const angle = (idx / suspects.length) * Math.PI * 0.9 + 0.1;
    const radius = 8;
    const x = Math.cos(angle) * radius * (idx % 2 === 0 ? 1 : -1);
    const z = -Math.sin(angle) * radius;

    const group = new THREE.Group();
    // Suspect marker silhouette
    const sMat = new THREE.MeshStandardMaterial({ color: 0x8b1a1a, roughness: 0.5, emissive: 0x220505 });
    const sBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.7, 12), sMat);
    sBody.position.y = 0.85;
    const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), sMat);
    sHead.position.y = 1.9;
    
    // Glowing ring beacon on the ground
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.9, 16),
      new THREE.MeshBasicMaterial({ color: 0xd4a017, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;

    group.add(sBody, sHead, ring);
    group.position.set(x, 0, z);
    scene3D.add(group);

    interactiveObjects.push({
      type: 'suspect',
      data: s,
      mesh: group,
      name: `${s.emoji} Suspect: ${s.name} (${s.role})`
    });
  });

  // Place evidence items on pedestals
  const evidenceList = c.evidence || [];
  evidenceList.forEach((ev, idx) => {
    const angle = (idx / evidenceList.length) * Math.PI * 1.5;
    const radius = 4.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.7 - 1;

    const group = new THREE.Group();
    // Pedestal
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x292116 })
    );
    ped.position.y = 0.45;

    // Glowing clue orb
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3, 0),
      new THREE.MeshStandardMaterial({ color: 0xf0c040, emissive: 0x664400, roughness: 0.2 })
    );
    orb.position.y = 1.25;
    group.add(ped, orb);
    group.position.set(x, 0, z);
    scene3D.add(group);

    interactiveObjects.push({
      type: 'evidence',
      data: ev,
      mesh: group,
      name: `${ev.emoji} Clue: ${ev.name}`
    });
  });
}

function animate3DScene() {
  requestAnimationFrame(animate3DScene);
  if (!scene3D || !camera3D || !renderer3D || !detectiveMesh) return;

  // Detective Movement
  const speed = 0.13;
  let moveX = 0;
  let moveZ = 0;

  if (keysPressed['w'] || keysPressed['arrowup']) moveZ -= 1;
  if (keysPressed['s'] || keysPressed['arrowdown']) moveZ += 1;
  if (keysPressed['a'] || keysPressed['arrowleft']) moveX -= 1;
  if (keysPressed['d'] || keysPressed['arrowright']) moveX += 1;

  if (moveX !== 0 || moveZ !== 0) {
    const len = Math.hypot(moveX, moveZ);
    detectiveMesh.position.x += (moveX / len) * speed;
    detectiveMesh.position.z += (moveZ / len) * speed;

    // Rotate detective in facing direction
    detectiveMesh.rotation.y = Math.atan2(moveX, moveZ);

    // Keep detective inside finite bounds
    const maxBound = ROOM_LIMIT - 1.2;
    detectiveMesh.position.x = Math.max(-maxBound, Math.min(maxBound, detectiveMesh.position.x));
    detectiveMesh.position.z = Math.max(-maxBound, Math.min(maxBound, detectiveMesh.position.z));

    // Slight walking bob
    detectiveMesh.position.y = Math.abs(Math.sin(Date.now() * 0.012)) * 0.12;
  }

  // Smooth camera follow
  camera3D.position.x += (detectiveMesh.position.x - camera3D.position.x) * 0.06;
  camera3D.position.z += (detectiveMesh.position.z + 13 - camera3D.position.z) * 0.06;
  camera3D.lookAt(detectiveMesh.position.x, 1, detectiveMesh.position.z);

  // Animate clues (gentle float & spin)
  interactiveObjects.forEach(obj => {
    if (obj.type === 'evidence' && obj.mesh.children[1]) {
      obj.mesh.children[1].rotation.y += 0.02;
    }
  });

  // Proximity Detection
  checkNearbyInteractions();

  renderer3D.render(scene3D, camera3D);
}

function checkNearbyInteractions() {
  const hudTarget = document.getElementById('hud-target-name');
  const btnInteract = document.getElementById('btn-scene-interact');
  if (!hudTarget || !btnInteract || !detectiveMesh) return;

  let nearest = null;
  let minDist = 2.4;

  interactiveObjects.forEach(obj => {
    const dist = detectiveMesh.position.distanceTo(obj.mesh.position);
    if (dist < minDist) {
      minDist = dist;
      nearest = obj;
    }
  });

  currentNearbyTarget = nearest;

  if (nearest) {
    hudTarget.textContent = `Near: ${nearest.name}`;
    btnInteract.style.display = 'block';
    btnInteract.textContent = nearest.type === 'suspect' ? `Interrogate ${nearest.data.name}` : `Examine ${nearest.data.name}`;
  } else {
    hudTarget.textContent = 'Explore scene. Walk up to suspects or evidence pedestals.';
    btnInteract.style.display = 'none';
  }
}

function interactWithCurrentTarget() {
  if (!currentNearbyTarget) return;

  if (currentNearbyTarget.type === 'suspect') {
    switchTab('suspects');
    openInterview(currentNearbyTarget.data);
  } else if (currentNearbyTarget.type === 'evidence') {
    switchTab('evidence');
    showEvidenceDetail(currentNearbyTarget.data);
  }
}

// ============================================================
// INIT
// ============================================================
(async () => {
  await loadPlayer();
  showScreen('screen-title');
})();
