// ═══════════════════════════════════════════════════════════
// CRYSTAL QUIZ CHALLENGE — game.js
// Phase 1: Core mechanics, Kanto Gym 1, Save system
// ═══════════════════════════════════════════════════════════

// ── SUPABASE ────────────────────────────────────────────────
const SUPABASE_URL = 'https://ccveburbryrigaeeiheo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9jauwIGlTUqff9b3bMFbsQ_q_VGuvIy';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── DB HELPERS ──────────────────────────────────────────────
async function dbSave(playerId, saveData) {
  const { error } = await sb.from('player_saves').upsert({
    player_id: playerId,
    data: saveData,
    updated_at: new Date().toISOString()
  });
  if (error) console.error('Save error:', JSON.stringify(error));
  return !error;
}

async function dbLoad(playerId) {
  const { data, error } = await sb.from('player_saves')
    .select('data').eq('player_id', playerId).single();
  if (error || !data) return null;
  return data.data;
}

async function dbLoadAllPlayers() {
  const { data, error } = await sb.from('player_saves')
    .select('data').order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map(d => d.data);
}

async function dbWriteRoom(roomId, roomData) {
  const { error } = await sb.from('rooms').upsert({
    id: roomId, data: roomData, updated_at: new Date().toISOString()
  });
  if (error) console.error('Room write error:', JSON.stringify(error));
}

async function dbReadRoom(roomId) {
  const { data, error } = await sb.from('rooms')
    .select('data').eq('id', roomId).single();
  if (error || !data) return null;
  return data.data;
}

// ── CONSTANTS ────────────────────────────────────────────────
const TIER_TIME = { basic: 10, holo: 12, rare: 15, super: 18, ultra: 20 };
const TIER_BASE = { basic: 100, holo: 150, rare: 200, super: 300, ultra: 400 };
const TIER_SPEED_MAX = { basic: 50, holo: 75, rare: 100, super: 150, ultra: 200 };
const FORMAT_TIME_MOD = { mc: 0, tf: -3, closest: 5, unscramble: 8, chain: 0 };
const AGE_TIME_MOD = { senior: 0, junior: 5 };

const TIER_LABELS = {
  basic: '⬜ Basic', holo: '✨ Holo',
  rare: '💎 Rare', super: '🌟 Super Rare', ultra: '👑 Ultra Rare'
};

const CATEGORY_LABELS = {
  filipino: '🇵🇭 Filipino Culture',
  geography: '🌍 Geography & Travel',
  science: '🔬 Science & Nature',
  books: '📖 Books & Literature',
  pokemon: '🎮 Pokemon & Gaming',
  music: '🎵 Music & Film',
  sports: '⚽ Sports & Olympics',
  food: '🍕 Food & Cooking',
  languages: '🗣️ Languages',
  math: '🧮 Math & Logic'
};

const MEDALS = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣'];

// ── REGION DATA ──────────────────────────────────────────────
const REGIONS = [
  { id:1,  name:'Kanto',    theme:'The Beginning',      emoji:'🌿', badge:'r1', baseCrystals:100, speedMax:50,   pokeball:300,  badgeMin:200 },
  { id:2,  name:'Johto',    theme:'Ancient Traditions', emoji:'🌊', badge:'r2', baseCrystals:150, speedMax:75,   pokeball:500,  badgeMin:300 },
  { id:3,  name:'Hoenn',    theme:"Nature's Balance",   emoji:'🌸', badge:'r3', baseCrystals:200, speedMax:100,  pokeball:800,  badgeMin:400 },
  { id:4,  name:'Sinnoh',   theme:'Origin of Time',     emoji:'❄️', badge:'r4', baseCrystals:300, speedMax:150,  pokeball:1200, badgeMin:500 },
  { id:5,  name:'Unova',    theme:'Truth vs Ideals',    emoji:'⚡', badge:'r5', baseCrystals:400, speedMax:200,  pokeball:1800, badgeMin:600 },
  { id:6,  name:'Kalos',    theme:'Beauty & Elegance',  emoji:'🗼', badge:'r6', baseCrystals:550, speedMax:275,  pokeball:2600, badgeMin:700 },
  { id:7,  name:'Alola',    theme:'Island Spirit',      emoji:'🌺', badge:'r7', baseCrystals:700, speedMax:350,  pokeball:3600, badgeMin:800 },
  { id:8,  name:'Galar',    theme:'The Spectacle',      emoji:'⚔️', badge:'r8', baseCrystals:900, speedMax:450,  pokeball:5000, badgeMin:900 },
  { id:9,  name:'Paldea',   theme:'Open World Freedom', emoji:'🍃', badge:'r9', baseCrystals:1150,speedMax:575,  pokeball:7000, badgeMin:1000},
  { id:10, name:'Pilipinas', theme:'Bayanihan',         emoji:'🇵🇭',badge:'r10',baseCrystals:1500,speedMax:750,  pokeball:10000,badgeMin:1200}
];

// ── STARTER POKEMON ──────────────────────────────────────────
// Phase 1 step 1.4: starter data lives in pokemon.json under .starters.
// Access via STATE.pokemon?.starters after loadPokemon() has run.
// Schema per entry:
//   { id, name, emoji, type, rarity, ability, abilityEffect:{mechanic,value,description}, baseValue }
function getStartersList() {
  return (STATE.pokemon && STATE.pokemon.starters) || [];
}
function getRegionalList(regionId) {
  return (STATE.pokemon && STATE.pokemon.regional && STATE.pokemon.regional[String(regionId)]) || [];
}
function findStarter(id) {
  return getStartersList().find(p => p.id === id) || null;
}
function findRegional(regionId, id) {
  return getRegionalList(regionId).find(p => p.id === id) || null;
}
function getAbilityDesc(p) {
  // Prefer new schema; fall back to legacy abilityDesc for any old saves still around.
  return p?.abilityEffect?.description || p?.abilityDesc || '';
}

// ── GAME STATE ────────────────────────────────────────────────
let STATE = {
  player: null,      // { id, name, emoji, ageGroup }
  save: null,        // full save data from Supabase
  questions: null,   // loaded from questions-{junior|senior}.json
  pokemon: null,     // loaded from pokemon.json (starters + regional)
  currentRegion: 1,
  currentGym: 1,
  currentQ: 0,
  currentQData: [],
  currentChoices: [],
  answered: false,
  timerInt: null,
  timeLeft: 20,
  gymCrystals: 0,
  gymCorrect: 0,
  abilityUsedThisGym: false,
  pendingAbilityPokemon: null,
  // multiplayer
  isHost: false,
  roomCode: '',
  pollInt: null,
  // settings
  soundOn: true,
  musicOn: true
};

// Default save structure
function newSave(player) {
  return {
    player_id: player.id,
    player_name: player.name,
    player_emoji: player.emoji,
    age_group: player.ageGroup,
    total_crystals: 0,
    regions: {},           // { "1": { gymsCompleted: [], badges: [] } }
    pokemon_team: [],
    pokeballs: 3,          // start with 3 free pokeballs
    badges_earned: 0,
    total_correct: 0,
    fastest_answer: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// ── PARTICLES ────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#ffcb05','#a78bfa','#7b5ea7','#ffffff','#60a5fa'];
  const EMOJIS = ['⚡','🔮','✨','💎','🌟'];

  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight + window.innerHeight,
      speed: 0.3 + Math.random() * 0.7,
      size: 2 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.1 + Math.random() * 0.25,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.02
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y -= p.speed;
      p.wobble += p.wobbleSpeed;
      p.x += Math.sin(p.wobble) * 0.5;
      if (p.y < -20) {
        p.y = canvas.height + 20;
        p.x = Math.random() * canvas.width;
      }
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  animate();
})();

// ── SCREEN MANAGEMENT ────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ── LOGIN / PLAYER CREATION ──────────────────────────────────
let selectedEmoji = '🦁';
let selectedAge   = 'senior';
let joinEmoji     = '🦁';
let joinAge       = 'senior';

function selectEmoji(el, emoji) {
  document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  selectedEmoji = emoji;
}

function selectAge(age) {
  selectedAge = age;
  document.getElementById('age-senior').classList.toggle('selected', age === 'senior');
  document.getElementById('age-junior').classList.toggle('selected', age === 'junior');
}

function selectJoinEmoji(el, emoji) {
  document.querySelectorAll('#join-emoji-grid .emoji-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  joinEmoji = emoji;
}

function selectJoinAge(age) {
  joinAge = age;
  document.getElementById('join-age-senior').classList.toggle('selected', age === 'senior');
  document.getElementById('join-age-junior').classList.toggle('selected', age === 'junior');
}

async function createPlayer() {
  const name = document.getElementById('login-name').value.trim();
  const err = document.getElementById('login-err');
  if (!name) { err.textContent = '⚠️ Please enter your name!'; return; }

  const id = name.substring(0, 2).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
  const player = { id, name, emoji: selectedEmoji, ageGroup: selectedAge };
  STATE.player = player;

  // Save to localStorage for auto-recognition
  localStorage.setItem('cqc_player_id', id);
  localStorage.setItem('cqc_player', JSON.stringify(player));

  const save = newSave(player);
  STATE.save = save;

  // Save to Supabase
  const ok = await dbSave(id, save);
  if (!ok) {
    err.textContent = '❌ Could not connect to server. Check your internet connection.';
    return;
  }

  // Go to pre-game Pokemon catch before the map
  startPreGameCatch();
}

async function continueJourney() {
  const storedId = localStorage.getItem('cqc_player_id');
  const storedPlayer = localStorage.getItem('cqc_player');

  if (!storedId || !storedPlayer) {
    showScreen('screen-login');
    return;
  }

  STATE.player = JSON.parse(storedPlayer);
  const save = await dbLoad(storedId);
  if (!save) {
    showScreen('screen-login');
    return;
  }

  STATE.save = save;
  showMap();
}

// ── LOAD POKEMON ──────────────────────────────────────────────
// Phase 1 step 1.4: 10 starters + 100 regional Pokemon (10 per region).
async function loadPokemon() {
  if (STATE.pokemon) return STATE.pokemon;
  try {
    const res = await fetch('pokemon.json');
    STATE.pokemon = await res.json();
    const nStart = (STATE.pokemon.starters || []).length;
    const nReg   = Object.values(STATE.pokemon.regional || {})
                       .reduce((n, list) => n + list.length, 0);
    console.log(`[loadPokemon] loaded ${nStart} starters + ${nReg} regional`);
    return STATE.pokemon;
  } catch (e) {
    console.error('Failed to load pokemon.json:', e);
    return null;
  }
}

// ── CATCH RACE-RULE HELPERS ───────────────────────────────────
// Combine my-own-team (always present) with room.pokemonCaught (multiplayer
// only — empty in solo). A Pokemon is unavailable if it appears in EITHER set.
function getCaughtPokemonIds() {
  const fromMe   = new Set((STATE.save && STATE.save.pokemon_team || []).map(p => p.id));
  const fromRoom = new Set(Object.keys((HOST && HOST.pokemonCaught) || {}));
  return new Set([...fromMe, ...fromRoom]);
}
function getCaughtByMap() {
  return (HOST && HOST.pokemonCaught) || {};
}
async function recordCatchInRoom(pokemon) {
  // No-op in solo mode (no room code set).
  const code = (STATE.roomCode) || (HOST && HOST.roomCode) || '';
  if (!code) return;
  try {
    const room = await dbReadRoom(code);
    if (!room) return;
    if (!room.pokemonCaught) room.pokemonCaught = {};
    if (room.pokemonCaught[pokemon.id]) return; // someone got there first; respect first-write
    room.pokemonCaught[pokemon.id] = (STATE.player && STATE.player.name) || 'Unknown';
    await dbWriteRoom(code, room);
    // Keep local mirror in sync so the next render greys it out for me too.
    if (HOST) {
      if (!HOST.pokemonCaught) HOST.pokemonCaught = {};
      HOST.pokemonCaught[pokemon.id] = room.pokemonCaught[pokemon.id];
    }
  } catch (e) {
    console.error('recordCatchInRoom failed:', e);
  }
}

// ── LOAD QUESTIONS ────────────────────────────────────────────
// Phase 1 step 1: routes to the age-appropriate question bank based on
// STATE.player.ageGroup ('junior' | 'senior'). Defaults to senior if
// somehow unset (safer for older content). Downstream consumers of the
// returned JSON still expect the OLD v2.0 shape and will be migrated in
// the next Phase 1 step.
async function loadQuestions() {
  if (STATE.questions) return STATE.questions;
  const ageGroup = STATE.player?.ageGroup === 'junior' ? 'junior' : 'senior';
  const fileName = `questions-${ageGroup}.json`;
  try {
    const res = await fetch(fileName);
    STATE.questions = await res.json();
    console.log(`[loadQuestions] loaded ${fileName} for ageGroup=${ageGroup}`);
    return STATE.questions;
  } catch(e) {
    console.error(`Failed to load ${fileName}:`, e);
    return null;
  }
}


// ── PRE-GAME POKEMON CATCH ────────────────────────────────────
// Phase 1 step 1.3: pre-game catch questions are now drawn from
// pokeball_bank inside questions-{junior|senior}.json. The old hardcoded
// PREGAME_QUESTIONS array has been removed.

let PREGAME_STATE = {
  pokeballs: 3,
  selectedPokemon: null,
  usedQuestions: [],
  currentQuestion: null,
  currentChoices: [],
  answered: false,
  timerInt: null,
  timeLeft: 12,
  caughtPokemon: []
};

async function startPreGameCatch() {
  // Phase 1 step 1.4: load pokemon library (10 starters) once before rendering.
  await loadPokemon();

  PREGAME_STATE = {
    pokeballs: STATE.save.pokeballs || 3,
    selectedPokemon: null,
    usedQuestions: [],
    currentQuestion: null,
    currentChoices: [],
    answered: false,
    timerInt: null,
    timeLeft: 12,
    caughtPokemon: STATE.save.pokemon_team || []
  };

  renderStarterGrid();
  updatePokeballDisplay();

  // Show step 1, hide others
  document.getElementById('pregame-step-choose').style.display = 'block';
  document.getElementById('pregame-step-question').style.display = 'none';
  document.getElementById('pregame-step-result').style.display = 'none';

  showScreen('screen-pregame-catch');
}

function renderStarterGrid() {
  const container = document.getElementById('starter-grid');
  const starters = getStartersList();

  if (starters.length === 0) {
    container.innerHTML = `<div class="loading-msg">Loading Pokemon library…</div>`;
    return;
  }

  // Phase 1 step 1.4 race rule: greyed out if I already have it OR if any
  // player in the room has caught it (room.pokemonCaught).
  const caughtIds = getCaughtPokemonIds();
  const caughtBy  = getCaughtByMap();

  container.innerHTML = starters.map(p => {
    const isCaught = caughtIds.has(p.id);
    const catcher  = caughtBy[p.id];
    const tag      = isCaught
      ? (catcher ? `✅ Caught by ${catcher}` : '✅ Already on your team')
      : '';
    return `
      <div class="starter-card${isCaught ? ' caught' : ''}"
           id="sc-${p.id}"
           onclick="${isCaught ? '' : `selectStarterPokemon('${p.id}')`}">
        <div class="sc-emoji">${p.emoji}</div>
        <div class="sc-name">${p.name}</div>
        <div class="sc-type">${p.type}</div>
        <div class="sc-ability">⚡ ${p.ability}</div>
        <div class="sc-desc">${getAbilityDesc(p)}</div>
        ${tag ? `<div class="sc-caught">${tag}</div>` : ''}
      </div>
    `;
  }).join('');
}

function selectStarterPokemon(pokeId) {
  // Clear previous selection
  document.querySelectorAll('.starter-card').forEach(c => c.classList.remove('selected'));

  const card = document.getElementById(`sc-${pokeId}`);
  if (card) card.classList.add('selected');

  PREGAME_STATE.selectedPokemon = findStarter(pokeId);

  // Show throw button
  const btn = document.getElementById('btn-attempt-catch');
  btn.style.display = 'block';
  btn.textContent = `🔴 Throw Pokeball at ${PREGAME_STATE.selectedPokemon.emoji} ${PREGAME_STATE.selectedPokemon.name}!`;
}

function updatePokeballDisplay() {
  const el = document.getElementById('pregame-pokeballs');
  if (el) el.textContent = PREGAME_STATE.pokeballs;

  // Update dots if they exist
  const dots = document.getElementById('pregame-pokeball-dots');
  if (dots) {
    dots.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'pokeball-dot' + (i >= PREGAME_STATE.pokeballs ? ' used' : '');
      dots.appendChild(dot);
    }
  }
}

async function attemptCatch() {
  if (!PREGAME_STATE.selectedPokemon) return;
  if (PREGAME_STATE.pokeballs <= 0) {
    alert('No Pokeballs left!');
    return;
  }

  // Phase 1 step 1.3: draw from pokeball_bank in the age file.
  const qData = await loadQuestions();
  const pbBank = qData && Array.isArray(qData.pokeball_bank) ? qData.pokeball_bank : [];
  if (pbBank.length === 0) {
    alert('Failed to load pokeball question pool.');
    return;
  }

  // Use a pokeball
  PREGAME_STATE.pokeballs--;
  STATE.save.pokeballs = PREGAME_STATE.pokeballs;
  updatePokeballDisplay();

  // Show selected pokemon
  const poke = PREGAME_STATE.selectedPokemon;
  document.getElementById('pregame-selected-display').innerHTML = `
    <div class="psd-emoji">${poke.emoji}</div>
    <div class="psd-info">
      <div class="psd-name">${poke.name}</div>
      <div class="psd-ability">⚡ ${poke.ability} — ${getAbilityDesc(poke)}</div>
      <div class="psd-hint">✨ Answer correctly to catch!</div>
    </div>
  `;

  // Pick a random question from pokeball_bank, avoiding ones already shown
  // this session. usedQuestions now tracks question IDs (was indices).
  const usedIds = new Set(PREGAME_STATE.usedQuestions);
  const available = pbBank.filter(q => !usedIds.has(q.id));
  const pool = available.length > 0 ? available : pbBank;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  PREGAME_STATE.usedQuestions.push(picked.id);
  PREGAME_STATE.currentQuestion = picked;

  // Shuffle choices
  const choices = [...picked.options].sort(() => Math.random() - 0.5);
  PREGAME_STATE.currentChoices = choices;
  PREGAME_STATE.answered = false;

  // Render question
  document.getElementById('pregame-q-category').textContent = '✨ Holo Question — Answer to Catch!';
  document.getElementById('pregame-q-text').textContent = picked.question;

  const colors = ['#e21b3c','#1368ce','#d89e00','#26890c'];
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`pans${i}`);
    const txt = document.getElementById(`pans${i}-txt`);
    txt.textContent = choices[i] || '';
    btn.style.background = colors[i];
    btn.style.opacity = '';
    btn.classList.remove('correct','wrong');
    btn.disabled = false;
  }

  const fb = document.getElementById('pregame-feedback');
  fb.textContent = '';
  fb.className = 'feedback-bar';

  // Show question step
  document.getElementById('pregame-step-choose').style.display = 'none';
  document.getElementById('pregame-step-question').style.display = 'block';
  document.getElementById('pregame-step-result').style.display = 'none';

  // Start timer (Holo = 12s + age modifier)
  startPregameTimer();
}

function startPregameTimer() {
  clearInterval(PREGAME_STATE.timerInt);
  const ageMod = AGE_TIME_MOD[STATE.player?.ageGroup] || 0;
  const total = 12 + ageMod; // Holo base = 12s
  PREGAME_STATE.timeLeft = total;

  const bar = document.getElementById('pregame-timer-bar');
  const txt = document.getElementById('pregame-timer-text');
  bar.style.width = '100%';
  bar.className = 'timer-bar';

  PREGAME_STATE.timerInt = setInterval(() => {
    PREGAME_STATE.timeLeft = Math.max(0, PREGAME_STATE.timeLeft - 0.1);
    const pct = (PREGAME_STATE.timeLeft / total) * 100;
    bar.style.width = pct + '%';
    txt.textContent = Math.ceil(PREGAME_STATE.timeLeft);
    if (pct < 25) bar.className = 'timer-bar danger';
    else if (pct < 50) bar.className = 'timer-bar warning';
    if (PREGAME_STATE.timeLeft <= 0) {
      clearInterval(PREGAME_STATE.timerInt);
      if (!PREGAME_STATE.answered) pregameTimeUp();
    }
  }, 100);
}

function checkCatchAnswer(idx) {
  if (PREGAME_STATE.answered) return;
  PREGAME_STATE.answered = true;
  clearInterval(PREGAME_STATE.timerInt);

  const chosen = PREGAME_STATE.currentChoices[idx];
  const correct = PREGAME_STATE.currentQuestion.answer;
  const correctIdx = PREGAME_STATE.currentChoices.indexOf(correct);

  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`pans${i}`);
    btn.disabled = true;
    if (i === correctIdx) btn.classList.add('correct');
    else btn.classList.add('wrong');
  }

  const caught = chosen === correct;
  setTimeout(() => showCatchResult(caught), 1500);
}

function pregameTimeUp() {
  PREGAME_STATE.answered = true;
  const correctIdx = PREGAME_STATE.currentChoices.indexOf(PREGAME_STATE.currentQuestion.answer);
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`pans${i}`);
    btn.disabled = true;
    if (i === correctIdx) btn.classList.add('correct');
    else btn.classList.add('wrong');
  }
  setTimeout(() => showCatchResult(false), 1500);
}

function showCatchResult(caught) {
  const poke = PREGAME_STATE.selectedPokemon;
  const resultEl = document.getElementById('catch-result-display');
  const catchAgainBtn = document.getElementById('btn-catch-again');
  const doneBtn = document.getElementById('btn-done-catching');

  if (caught) {
    // Add to team — MAX 1 POKEMON, waive remaining pokeballs.
    // We spread the full pokemon.json record (preserves rarity, baseValue,
    // abilityEffect, type) and add the runtime fields level + caughtAt.
    const newPokemon = { ...poke, level: 1, caughtAt: 'pregame' };
    PREGAME_STATE.caughtPokemon.push(newPokemon);
    STATE.save.pokemon_team = PREGAME_STATE.caughtPokemon;
    // Waive all remaining pokeballs
    PREGAME_STATE.pokeballs = 0;
    STATE.save.pokeballs = 0;

    // Phase 1 step 1.4: race rule — broadcast this catch to the room so
    // other players see this Pokemon as taken. No-op in solo play.
    recordCatchInRoom(newPokemon);

    resultEl.innerHTML = `
      <div class="catch-result-emoji">🎉</div>
      <h3>${poke.emoji} ${poke.name} was caught!</h3>
      <p class="catch-result-msg">
        <b>${poke.name}</b> joins your team!<br>
        Ability: <span style="color:var(--crystal)">⚡ ${poke.ability}</span><br>
        <em>${getAbilityDesc(poke)}</em>
      </p>
      <p class="catch-result-msg" style="margin-top:10px;color:var(--gold);font-weight:800">
        ✅ You can only catch 1 Pokemon at the start.<br>Remaining Pokeballs waived!
      </p>
      <div class="pokeball-dots" id="pregame-pokeball-dots"></div>
    `;

    // Never show catch again — only 1 allowed
    catchAgainBtn.style.display = 'none';
    doneBtn.textContent = `✅ Start My Journey! (${poke.emoji} ${poke.name} on your team)`;

  } else {
    resultEl.innerHTML = `
      <div class="catch-result-emoji">💨</div>
      <h3>${poke.emoji} ${poke.name} broke free!</h3>
      <p class="catch-result-msg">
        The Pokemon escaped! Wrong answer or time ran out.<br>
        ${PREGAME_STATE.pokeballs > 0
          ? `You have <b style="color:var(--gold)">${PREGAME_STATE.pokeballs} Pokeball(s)</b> left. Try again!`
          : `No more Pokeballs! Start your journey with what you have.`}
      </p>
      <div class="pokeball-dots" id="pregame-pokeball-dots"></div>
    `;

    if (PREGAME_STATE.pokeballs > 0) {
      catchAgainBtn.style.display = 'block';
      catchAgainBtn.textContent = `🔴 Try Again (${PREGAME_STATE.pokeballs} Pokeball(s) left)`;
    } else {
      catchAgainBtn.style.display = 'none';
    }

    const label = PREGAME_STATE.caughtPokemon.length > 0
      ? `✅ Start Journey! (${PREGAME_STATE.caughtPokemon.length} Pokemon caught)`
      : `✅ Start Journey Without Pokemon`;
    doneBtn.textContent = label;
  }

  // Show dots
  document.getElementById('pregame-step-choose').style.display = 'none';
  document.getElementById('pregame-step-question').style.display = 'none';
  document.getElementById('pregame-step-result').style.display = 'block';

  updatePokeballDisplay();
  setTimeout(() => {
    const dotsEl = document.getElementById('pregame-pokeball-dots');
    if (dotsEl) {
      dotsEl.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'pokeball-dot' + (i >= PREGAME_STATE.pokeballs ? ' used' : '');
        dotsEl.appendChild(dot);
      }
    }
  }, 100);
}

function catchAgain() {
  // Go back to choose step
  PREGAME_STATE.selectedPokemon = null;
  document.getElementById('btn-attempt-catch').style.display = 'none';

  // Re-render grid (in case a pokemon was just caught)
  renderStarterGrid();

  document.getElementById('pregame-step-choose').style.display = 'block';
  document.getElementById('pregame-step-question').style.display = 'none';
  document.getElementById('pregame-step-result').style.display = 'none';
}

async function finishPreGame() {
  // Save progress to Supabase
  STATE.save.updated_at = new Date().toISOString();
  await dbSave(STATE.player.id, STATE.save);
  showMap();
}

// ─────────────────────────────────────────────────────────────────────────
// REGIONAL POKEMON CATCH  (Phase 1 step 1.3)
// Triggered from endGym() after a region's 5th gym is passed for the first
// time. The kid can buy up to 3 Pokeballs (region.pokeball cost each), and
// each ball draws ONE random question from catch_bank[regionId]. A correct
// answer catches a stub region Pokemon; a wrong answer (or timeout) consumes
// the ball with no catch. Up to 3 catches per region.
// ─────────────────────────────────────────────────────────────────────────

let REGIONAL_CATCH_STATE = {
  region:          null,
  pokeballs:       0,         // balls bought, not yet thrown
  ballsThrown:     0,         // total balls used (cap: 3 per region visit)
  caughtPokemon:   [],        // pokemon caught this visit
  usedQuestions:   [],        // question IDs already drawn this visit
  currentQuestion: null,
  currentChoices:  [],
  answered:        false,
  timerInt:        null,
  timeLeft:        15,
};

async function startRegionalCatch(regionId) {
  // Phase 1 step 1.4: ensure pokemon.json is loaded before rendering the grid.
  await loadPokemon();

  const region = REGIONS.find(r => r.id === regionId);
  REGIONAL_CATCH_STATE = {
    region,
    pokeballs:        0,
    ballsThrown:      0,
    selectedPokemon:  null,   // 1.4: must be picked before throwing
    caughtPokemon:    [],
    usedQuestions:    [],
    currentQuestion:  null,
    currentChoices:   [],
    answered:         false,
    timerInt:         null,
    timeLeft:         15,
  };
  renderRegionalCatch();
  showScreen('screen-catch');
}

function selectRegionalPokemon(pokeId) {
  const s = REGIONAL_CATCH_STATE;
  const poke = findRegional(s.region.id, pokeId);
  if (!poke) return;
  // Race rule: cannot pick a Pokemon already caught by anyone.
  const caughtIds = getCaughtPokemonIds();
  if (caughtIds.has(pokeId)) return;
  s.selectedPokemon = poke;
  // Update visuals in place — don't re-render (would wipe question UI if mid-throw).
  document.querySelectorAll('#catch-content .starter-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`rsc-${pokeId}`);
  if (card) card.classList.add('selected');
  // Update Throw button label/state
  const throwBtn = document.getElementById('rc-btn-throw');
  if (throwBtn) {
    const canThrow = s.pokeballs > 0 && s.selectedPokemon;
    throwBtn.disabled = !canThrow;
    throwBtn.style.opacity = canThrow ? '' : '0.4';
    throwBtn.textContent = canThrow
      ? `⚡ Throw Pokeball at ${poke.emoji} ${poke.name}!`
      : `⚡ ${s.pokeballs <= 0 ? 'Buy a Pokeball first' : 'Throw Pokeball!'}`;
  }
}

function renderRegionalCatch() {
  const s      = REGIONAL_CATCH_STATE;
  const region = s.region;
  const cost   = region.pokeball;
  const have   = STATE.save.total_crystals || 0;
  const canBuy = s.ballsThrown + s.pokeballs < 3 && have >= cost;
  const canThrow = s.pokeballs > 0 && s.selectedPokemon;
  const caughtNames = s.caughtPokemon.length > 0
    ? s.caughtPokemon.map(p => `${p.emoji} ${p.name}`).join(', ')
    : '—';

  // Phase 1 step 1.4: 10 catchable region Pokemon with race-rule greyout.
  const regionPokemon = getRegionalList(region.id);
  const caughtIds = getCaughtPokemonIds();
  const caughtBy  = getCaughtByMap();
  const rarityBadge = { common:'⚪', rare:'💎', super:'🌟', legendary:'👑' };

  const gridHTML = regionPokemon.length === 0
    ? `<div class="loading-msg" style="padding:20px;text-align:center;opacity:0.7">Loading region Pokemon…</div>`
    : regionPokemon.map(p => {
        const isCaught   = caughtIds.has(p.id);
        const isSelected = s.selectedPokemon && s.selectedPokemon.id === p.id;
        const catcher    = caughtBy[p.id];
        const tag = isCaught
          ? (catcher ? `✅ Caught by ${catcher}` : '✅ On your team')
          : `${rarityBadge[p.rarity] || ''} ${p.rarity}`;
        return `
          <div class="starter-card${isCaught ? ' caught' : ''}${isSelected ? ' selected' : ''}"
               id="rsc-${p.id}"
               onclick="${isCaught ? '' : `selectRegionalPokemon('${p.id}')`}">
            <div class="sc-emoji">${p.emoji}</div>
            <div class="sc-name">${p.name}</div>
            <div class="sc-type">${p.type}</div>
            <div class="sc-ability">⚡ ${p.ability}</div>
            <div class="sc-desc">${getAbilityDesc(p)}</div>
            <div class="sc-caught">${tag}</div>
          </div>
        `;
      }).join('');

  document.getElementById('catch-content').innerHTML = `
    <div class="catch-hero" style="text-align:center;padding:20px">
      <div style="font-size:3rem">${region.emoji}</div>
      <h3 style="margin:6px 0">${region.name} Region Cleared!</h3>
      <p style="opacity:0.8">Pick a Pokemon, buy a Pokeball, then answer to catch it.<br>
      Up to <b>3 balls</b> per region · 1 ball = 1 question = 1 attempt · wrong answer wastes the ball.</p>
    </div>

    <div class="catch-status" style="padding:10px 20px;font-weight:800">
      🔴 Ready: <span style="color:var(--gold)">${s.pokeballs}</span> ·
      🎯 Used: <span style="color:var(--gold)">${s.ballsThrown}/3</span> ·
      🐾 Caught: ${caughtNames}<br>
      🔮 Crystals: <span style="color:var(--gold)">${have.toLocaleString()}</span>
    </div>

    <div class="panel-label" style="padding:14px 20px 6px">🐾 ${region.name.toUpperCase()} POKEMON — pick one to throw at</div>
    <div class="starter-grid" id="regional-pokemon-grid" style="padding:0 14px">
      ${gridHTML}
    </div>

    <div id="regional-catch-actions" style="padding:14px 20px 0;display:flex;flex-direction:column;gap:10px">
      <button class="btn-primary" ${canBuy ? '' : 'disabled style="opacity:0.4"'} onclick="buyRegionalPokeball()">
        🔴 Buy Pokeball (${cost.toLocaleString()} 🔮)
      </button>
      <button class="btn-primary" id="rc-btn-throw"
              ${canThrow ? '' : 'disabled style="opacity:0.4"'}
              onclick="attemptRegionalCatch()">
        ${canThrow
          ? `⚡ Throw Pokeball at ${s.selectedPokemon.emoji} ${s.selectedPokemon.name}!`
          : (s.pokeballs <= 0 ? '⚡ Buy a Pokeball first' : '⚡ Pick a Pokemon first')}
      </button>
      <button class="btn-secondary" onclick="finishRegionalCatch()">
        ✅ Done — Continue to Map
      </button>
    </div>

    <div id="regional-catch-question" style="display:none;padding:14px 20px">
      <div class="timer-container">
        <div class="timer-bar-wrap"><div class="timer-bar" id="rc-timer-bar"></div></div>
        <div class="timer-text" id="rc-timer-text">15</div>
      </div>
      <div class="question-card">
        <div class="q-category" id="rc-q-category">💎 Rare Question</div>
        <div class="q-text" id="rc-q-text">Loading...</div>
      </div>
      <div class="answers-grid">
        <button class="ans-btn" id="rc-ans0" onclick="checkRegionalCatchAnswer(0)"><span class="ans-icon">▲</span><span class="ans-txt" id="rc-ans0-txt"></span></button>
        <button class="ans-btn" id="rc-ans1" onclick="checkRegionalCatchAnswer(1)"><span class="ans-icon">◆</span><span class="ans-txt" id="rc-ans1-txt"></span></button>
        <button class="ans-btn" id="rc-ans2" onclick="checkRegionalCatchAnswer(2)"><span class="ans-icon">●</span><span class="ans-txt" id="rc-ans2-txt"></span></button>
        <button class="ans-btn" id="rc-ans3" onclick="checkRegionalCatchAnswer(3)"><span class="ans-icon">■</span><span class="ans-txt" id="rc-ans3-txt"></span></button>
      </div>
      <div class="feedback-bar" id="rc-feedback"></div>
    </div>
  `;
}

function buyRegionalPokeball() {
  const s = REGIONAL_CATCH_STATE;
  const region = s.region;
  const cost = region.pokeball;
  if (s.ballsThrown + s.pokeballs >= 3) { alert('Max 3 Pokeballs per region.'); return; }
  if ((STATE.save.total_crystals || 0) < cost) { alert(`Need ${cost} 🔮.`); return; }
  STATE.save.total_crystals -= cost;
  s.pokeballs += 1;
  renderRegionalCatch();
}

async function attemptRegionalCatch() {
  const s = REGIONAL_CATCH_STATE;
  if (s.pokeballs <= 0) return;
  // Phase 1 step 1.4: must have selected a target Pokemon first.
  if (!s.selectedPokemon) {
    alert('Pick a Pokemon to throw at first.');
    return;
  }
  // Race-rule re-check at throw time (another player may have caught it
  // while you were deciding).
  const caughtIds = getCaughtPokemonIds();
  if (caughtIds.has(s.selectedPokemon.id)) {
    alert(`${s.selectedPokemon.name} was just caught by someone else!`);
    s.selectedPokemon = null;
    renderRegionalCatch();
    return;
  }

  // Phase 1 step 1.3: draw from catch_bank[regionId] in the age file.
  const qData = await loadQuestions();
  const pool = qData && qData.catch_bank ? (qData.catch_bank[String(s.region.id)] || []) : [];
  if (pool.length === 0) {
    alert(`No catch questions for region ${s.region.id}.`);
    return;
  }

  // Consume one ball up front (correct-or-wrong, it's used either way).
  s.pokeballs    -= 1;
  s.ballsThrown  += 1;

  // Pick a random unused (this-visit) question. Falls back to the full pool
  // if every question has already been shown this visit.
  const usedIds   = new Set(s.usedQuestions);
  const available = pool.filter(q => !usedIds.has(q.id));
  const choices   = available.length > 0 ? available : pool;
  const picked    = choices[Math.floor(Math.random() * choices.length)];
  s.usedQuestions.push(picked.id);
  s.currentQuestion = picked;

  // Shuffle answer options (and handle T/F which has only 2)
  const shuffled = [...picked.options].sort(() => Math.random() - 0.5);
  s.currentChoices = shuffled;
  s.answered = false;

  // Show question UI, hide buy/throw buttons
  document.getElementById('regional-catch-actions').style.display = 'none';
  document.getElementById('regional-catch-question').style.display = 'block';

  // Tier badge in the category bar
  const tierLabel = TIER_LABELS[picked.tier] || picked.tier;
  document.getElementById('rc-q-category').textContent = `${tierLabel} · ${CATEGORY_LABELS[picked.category] || picked.category}`;
  document.getElementById('rc-q-text').textContent = picked.question;

  const colors = ['#e21b3c','#1368ce','#d89e00','#26890c'];
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`rc-ans${i}`);
    const txt = document.getElementById(`rc-ans${i}-txt`);
    if (i < shuffled.length) {
      txt.textContent = shuffled[i];
      btn.style.display = '';
    } else {
      btn.style.display = 'none';   // hide unused slot for T/F
    }
    btn.style.background = colors[i];
    btn.style.opacity = '';
    btn.classList.remove('correct','wrong');
    btn.disabled = false;
  }

  const fb = document.getElementById('rc-feedback');
  fb.textContent = '';
  fb.className = 'feedback-bar';

  // Start timer using the question's own tier (Rare default = 15s)
  const ageMod   = AGE_TIME_MOD[STATE.player?.ageGroup] || 0;
  const fmtMod   = FORMAT_TIME_MOD[picked.type] || 0;
  const totalTime = (TIER_TIME[picked.tier] || 15) + fmtMod + ageMod;
  startRegionalCatchTimer(totalTime);
}

function startRegionalCatchTimer(totalTime) {
  clearInterval(REGIONAL_CATCH_STATE.timerInt);
  REGIONAL_CATCH_STATE.timeLeft = totalTime;
  const bar = document.getElementById('rc-timer-bar');
  const txt = document.getElementById('rc-timer-text');
  bar.style.width = '100%';
  bar.className = 'timer-bar';
  REGIONAL_CATCH_STATE.timerInt = setInterval(() => {
    REGIONAL_CATCH_STATE.timeLeft = Math.max(0, REGIONAL_CATCH_STATE.timeLeft - 0.1);
    const pct = (REGIONAL_CATCH_STATE.timeLeft / totalTime) * 100;
    bar.style.width = pct + '%';
    txt.textContent = Math.ceil(REGIONAL_CATCH_STATE.timeLeft);
    if (pct < 25) bar.className = 'timer-bar danger';
    else if (pct < 50) bar.className = 'timer-bar warning';
    if (REGIONAL_CATCH_STATE.timeLeft <= 0) {
      clearInterval(REGIONAL_CATCH_STATE.timerInt);
      if (!REGIONAL_CATCH_STATE.answered) regionalCatchTimeUp();
    }
  }, 100);
}

function checkRegionalCatchAnswer(idx) {
  const s = REGIONAL_CATCH_STATE;
  if (s.answered) return;
  s.answered = true;
  clearInterval(s.timerInt);
  const chosen = s.currentChoices[idx];
  const correct = s.currentQuestion.answer;
  const correctIdx = s.currentChoices.indexOf(correct);
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`rc-ans${i}`);
    if (btn.style.display === 'none') continue;
    btn.disabled = true;
    if (i === correctIdx) btn.classList.add('correct');
    else btn.classList.add('wrong');
  }
  setTimeout(() => showRegionalCatchResult(chosen === correct), 1300);
}

function regionalCatchTimeUp() {
  const s = REGIONAL_CATCH_STATE;
  s.answered = true;
  const correctIdx = s.currentChoices.indexOf(s.currentQuestion.answer);
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`rc-ans${i}`);
    if (btn.style.display === 'none') continue;
    btn.disabled = true;
    if (i === correctIdx) btn.classList.add('correct');
    else btn.classList.add('wrong');
  }
  setTimeout(() => showRegionalCatchResult(false), 1300);
}

function showRegionalCatchResult(caught) {
  const s = REGIONAL_CATCH_STATE;
  const fb = document.getElementById('rc-feedback');
  const target = s.selectedPokemon;
  if (caught && target) {
    // Phase 1 step 1.4: award the REAL Pokemon from pokemon.json (spread
    // preserves name/type/rarity/ability/abilityEffect/baseValue). Add
    // level + caughtAt for runtime tracking.
    const newPokemon = { ...target, level: 1, caughtAt: `region${s.region.id}` };
    s.caughtPokemon.push(newPokemon);
    if (!STATE.save.pokemon_team) STATE.save.pokemon_team = [];
    STATE.save.pokemon_team.push(newPokemon);
    // Race rule: tell the room this Pokemon is now taken.
    recordCatchInRoom(newPokemon);
    fb.textContent = `🎉 ${target.emoji} ${target.name} caught! (${target.rarity})`;
    fb.className = 'feedback-bar correct';
  } else {
    fb.textContent = target
      ? `💨 ${target.emoji} ${target.name} broke free! Ball wasted.`
      : `💨 It broke free! Ball wasted.`;
    fb.className = 'feedback-bar wrong';
  }
  // Clear selection so the player must pick again for the next ball.
  s.selectedPokemon = null;
  setTimeout(() => {
    document.getElementById('regional-catch-question').style.display = 'none';
    renderRegionalCatch();
  }, 1500);
}

async function finishRegionalCatch() {
  STATE.save.updated_at = new Date().toISOString();
  await dbSave(STATE.player.id, STATE.save);
  showMap();
}

// ── MAP SCREEN ────────────────────────────────────────────────
function showMap() {
  const save = STATE.save;
  const player = STATE.player;
  document.getElementById('map-player-name').textContent = `${player.emoji} ${player.name}'s Journey`;
  document.getElementById('map-crystals').textContent = (save.total_crystals || 0).toLocaleString();
  document.getElementById('map-badges').textContent = save.badges_earned || 0;
  document.getElementById('map-pokemon-count').textContent = (save.pokemon_team || []).length;

  const container = document.getElementById('region-map');
  container.innerHTML = '';

  REGIONS.forEach((region, idx) => {
    const regionSave = (save.regions || {})[region.id] || {};
    const gymsCompleted = (regionSave.gymsCompleted || []).length;
    const isLocked = idx > 0 && ((save.regions || {})[REGIONS[idx-1].id]?.gymsCompleted || []).length < 5;
    const isCompleted = gymsCompleted >= 5;

    const card = document.createElement('div');
    card.className = `region-card${isLocked ? ' locked' : ''}${isCompleted ? ' completed' : ''}`;
    card.innerHTML = `
      <div class="region-emoji">${region.emoji}</div>
      <div class="region-info">
        <div class="region-name">Region ${region.id}: ${region.name}</div>
        <div class="region-theme">${region.theme}</div>
        <div class="region-progress">${gymsCompleted}/5 gyms · ${isCompleted ? '✅ Complete' : isLocked ? '🔒 Locked' : '▶ In Progress'}</div>
      </div>
      <div class="region-status">${isCompleted ? '✅' : isLocked ? '🔒' : '▶'}</div>
    `;
    if (!isLocked) {
      card.onclick = () => showGymSelect(region.id);
    }
    container.appendChild(card);
  });

  showScreen('screen-map');
}

// ── GYM SELECT ────────────────────────────────────────────────
function showGymSelect(regionId) {
  STATE.currentRegion = regionId;
  const region = REGIONS.find(r => r.id === regionId);
  const save = STATE.save;
  const regionSave = (save.regions || {})[regionId] || {};
  const gymsCompleted = regionSave.gymsCompleted || [];

  document.getElementById('gym-select-title').textContent = `${region.emoji} ${region.name} Region`;

  const container = document.getElementById('gym-grid');
  container.innerHTML = '';

  const GYM_NAMES = ['The Starter Gym','The Knowledge Gym','The Precision Gym','The Speed Gym','The Champion Gym'];
  const GYM_FORMATS = ['Multiple Choice + T/F','MC Heavy + Chain','Precision + Unscramble','Speed + Chain','All Formats'];

  for (let i = 1; i <= 5; i++) {
    const isCompleted = gymsCompleted.includes(i);
    const isLocked = i > 1 && !gymsCompleted.includes(i-1);

    const card = document.createElement('div');
    card.className = `gym-card${isLocked ? ' locked' : ''}${isCompleted ? ' completed' : ''}`;
    card.innerHTML = `
      <div class="gym-num">${i}</div>
      <div class="gym-info">
        <div class="gym-name">${GYM_NAMES[i-1]}</div>
        <div class="gym-meta">${GYM_FORMATS[i-1]} · ${region.badgeMin} 🔮 min</div>
      </div>
      <div class="gym-badge-status">${isCompleted ? '🏅' : isLocked ? '🔒' : '▶'}</div>
    `;
    if (!isLocked) {
      card.onclick = () => startGym(regionId, i);
    }
    container.appendChild(card);
  }

  showScreen('screen-gym-select');
}

// ── START GYM ─────────────────────────────────────────────────
async function startGym(regionId, gymId) {
  STATE.currentRegion = regionId;
  STATE.currentGym = gymId;
  STATE.currentQ = 0;
  STATE.gymCrystals = 0;
  STATE.gymCorrect = 0;
  STATE.answered = false;
  STATE.abilityUsedThisGym = false;

  const qData = await loadQuestions();
  if (!qData) {
    alert('Failed to load questions. Please refresh the page.');
    return;
  }

  // Phase 1 step 2: build this gym's 10 questions from the blueprint + bank.
  // Each blueprint defines 10 slots (category + tier). For each slot we
  // draw ONE random question from gym_bank[category][tier]. Each browser
  // instance draws independently, so two kids on the same gym at the same
  // time see different question sets. Fresh draw on every call to startGym,
  // so restarting a gym reshuffles.
  const blueprint = (qData.gym_blueprints || []).find(
    b => b.region === regionId && b.gym === gymId
  );
  if (!blueprint) {
    alert(`No blueprint found for Region ${regionId} Gym ${gymId}.`);
    return;
  }

  const drawn = [];
  for (const slot of blueprint.slots) {
    const pool = qData.gym_bank?.[slot.category]?.[slot.tier];
    if (!pool || pool.length === 0) {
      alert(`Empty question bank for ${slot.category} / ${slot.tier}.`);
      return;
    }
    drawn.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  STATE.currentQData = drawn;
  const region = REGIONS.find(r => r.id === regionId);

  document.getElementById('quiz-region-gym').textContent = `${region.emoji} ${region.name} · Gym ${gymId}`;
  document.getElementById('quiz-crystals').textContent = '0';

  renderPokemonTeam();
  showScreen('screen-quiz');
  loadQuestion();
}

// ── LOAD QUESTION ─────────────────────────────────────────────
function loadQuestion() {
  clearInterval(STATE.timerInt);
  STATE.answered = false;

  const q = STATE.currentQData[STATE.currentQ];
  const region = REGIONS.find(r => r.id === STATE.currentRegion);

  // Update header
  document.getElementById('quiz-q-count').textContent = `Q${STATE.currentQ+1}/${STATE.currentQData.length}`;

  // Tier badge
  const tierBadge = document.getElementById('quiz-tier-badge');
  tierBadge.textContent = TIER_LABELS[q.tier] || q.tier;
  tierBadge.className = `tier-badge ${q.tier}`;

  // Category + question
  document.getElementById('q-category').textContent = CATEGORY_LABELS[q.category] || q.category;
  document.getElementById('q-text').textContent = q.question;

  // Shuffle choices
  let choices = [...q.options].sort(() => Math.random() - 0.5);
  STATE.currentChoices = choices;

  const colors = ['#e21b3c','#1368ce','#d89e00','#26890c'];
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`ans${i}`);
    const txt = document.getElementById(`ans${i}-txt`);
    txt.textContent = choices[i] || '';
    btn.style.background = colors[i];
    btn.classList.remove('correct','wrong');
    btn.style.opacity = '';
    btn.disabled = false;
  }

  // Clear feedback
  const fb = document.getElementById('feedback-bar');
  fb.textContent = '';
  fb.className = 'feedback-bar';

  // Calculate time
  let baseTime = TIER_TIME[q.tier] || 15;
  let formatMod = FORMAT_TIME_MOD[q.type] || 0;
  let ageMod = AGE_TIME_MOD[STATE.player?.ageGroup] || 0;
  let totalTime = baseTime + formatMod + ageMod;

  STATE.timeLeft = totalTime;
  startTimer(totalTime, q.tier);
}

// ── TIMER ─────────────────────────────────────────────────────
function startTimer(totalTime, tier) {
  const bar = document.getElementById('timer-bar');
  const txt = document.getElementById('timer-text');
  STATE.timeLeft = totalTime;

  bar.style.width = '100%';
  bar.className = 'timer-bar';

  STATE.timerInt = setInterval(() => {
    STATE.timeLeft = Math.max(0, STATE.timeLeft - 0.1);
    const pct = (STATE.timeLeft / totalTime) * 100;
    bar.style.width = pct + '%';
    txt.textContent = Math.ceil(STATE.timeLeft);

    if (pct < 25) {
      bar.className = 'timer-bar danger';
    } else if (pct < 50) {
      bar.className = 'timer-bar warning';
    }

    if (STATE.timeLeft <= 0) {
      clearInterval(STATE.timerInt);
      if (!STATE.answered) timeUp();
    }
  }, 100);
}

// ── CHECK ANSWER ──────────────────────────────────────────────
function checkAnswer(idx) {
  if (STATE.answered) return;
  STATE.answered = true;
  clearInterval(STATE.timerInt);

  const q = STATE.currentQData[STATE.currentQ];
  const chosen = STATE.currentChoices[idx];
  const correct = q.answer;
  const correctIdx = STATE.currentChoices.indexOf(correct);
  const region = REGIONS.find(r => r.id === STATE.currentRegion);

  // Reveal answers
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`ans${i}`);
    btn.disabled = true;
    if (i === correctIdx) btn.classList.add('correct');
    else btn.classList.add('wrong');
  }

  const fb = document.getElementById('feedback-bar');
  if (chosen === correct) {
    // Calculate crystals
    const base = region.baseCrystals;
    const speedBonus = Math.round((STATE.timeLeft / (TIER_TIME[q.tier] + FORMAT_TIME_MOD[q.type] + AGE_TIME_MOD[STATE.player?.ageGroup])) * region.speedMax);
    const earned = base + speedBonus;

    STATE.gymCrystals += earned;
    STATE.gymCorrect++;
    STATE.save.total_crystals = (STATE.save.total_crystals || 0) + earned;
    STATE.save.total_correct = (STATE.save.total_correct || 0) + 1;

    document.getElementById('quiz-crystals').textContent = STATE.save.total_crystals.toLocaleString();

    fb.textContent = `✅ Correct! +${earned} 🔮`;
    fb.className = 'feedback-bar correct';
  } else {
    fb.textContent = `❌ Wrong! Answer: ${correct}`;
    fb.className = 'feedback-bar wrong';
  }

  // Auto advance after 2s
  setTimeout(() => advanceQuestion(), 2000);
}

function timeUp() {
  STATE.answered = true;
  const q = STATE.currentQData[STATE.currentQ];
  const correctIdx = STATE.currentChoices.indexOf(q.answer);

  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`ans${i}`);
    btn.disabled = true;
    if (i === correctIdx) btn.classList.add('correct');
    else btn.classList.add('wrong');
  }

  const fb = document.getElementById('feedback-bar');
  fb.textContent = `⏰ Time's up! Answer: ${q.answer}`;
  fb.className = 'feedback-bar timeout';

  setTimeout(() => advanceQuestion(), 2000);
}

function advanceQuestion() {
  STATE.currentQ++;
  if (STATE.currentQ >= STATE.currentQData.length) {
    endGym();
  } else {
    loadQuestion();
  }
}

// ── END GYM ───────────────────────────────────────────────────
async function endGym() {
  clearInterval(STATE.timerInt);

  const region = REGIONS.find(r => r.id === STATE.currentRegion);
  const passed = STATE.gymCrystals >= region.badgeMin;

  // Update save
  if (!STATE.save.regions) STATE.save.regions = {};
  if (!STATE.save.regions[STATE.currentRegion]) {
    STATE.save.regions[STATE.currentRegion] = { gymsCompleted: [], badges: [] };
  }

  const regionSave = STATE.save.regions[STATE.currentRegion];
  if (passed && !regionSave.gymsCompleted.includes(STATE.currentGym)) {
    regionSave.gymsCompleted.push(STATE.currentGym);
    STATE.save.badges_earned = (STATE.save.badges_earned || 0) + 1;
  }

  STATE.save.updated_at = new Date().toISOString();

  // Auto-save to Supabase
  await dbSave(STATE.player.id, STATE.save);

  // Show complete screen
  const icon = document.getElementById('complete-icon');
  const title = document.getElementById('complete-title');
  const resultMsg = document.getElementById('complete-result-msg');
  const statsEl = document.getElementById('complete-stats');
  const offerEl = document.getElementById('complete-pokemon-offer');
  const nextBtn = document.getElementById('btn-next-gym');

  icon.textContent = passed ? '🏅' : '💔';
  title.textContent = `Gym ${STATE.currentGym} ${passed ? 'Complete!' : 'Failed'}`;

  resultMsg.textContent = passed
    ? `Badge earned! +${STATE.gymCrystals} 🔮`
    : `Need ${region.badgeMin} 🔮 — you earned ${STATE.gymCrystals} 🔮`;
  resultMsg.className = `result-msg ${passed ? 'passed' : 'failed'}`;

  const pct = Math.round((STATE.gymCorrect / STATE.currentQData.length) * 100);
  const grade = pct===100?'🏆 Perpekto!':pct>=80?'🥇 Mahusay!':pct>=60?'🥈 Magaling!':pct>=40?'🥉 Kaya mo pa!':'😅 Mag-aral pa!';

  statsEl.innerHTML = `
    <div class="stat-cell"><div class="stat-val">${STATE.gymCrystals.toLocaleString()} 🔮</div><div class="stat-label">Crystals Earned</div></div>
    <div class="stat-cell"><div class="stat-val">${STATE.gymCorrect}/${STATE.currentQData.length}</div><div class="stat-label">Correct</div></div>
    <div class="stat-cell"><div class="stat-val">${grade}</div><div class="stat-label">Grade</div></div>
  `;

  // Pokemon offer placeholder (Phase 2)
  offerEl.style.display = 'none';

  // Next gym button (Phase 1 step 1.3): on gym 5, if the whole region is
  // now complete, offer Regional Pokemon Catch instead of hiding the button.
  const regionComplete = (regionSave.gymsCompleted || []).length >= 5;
  if (STATE.currentGym < 5) {
    nextBtn.style.display = 'block';
    nextBtn.textContent   = `Next Gym ▶`;
    nextBtn.onclick       = goNextGym;
  } else if (regionComplete) {
    nextBtn.style.display = 'block';
    nextBtn.textContent   = `🎯 Catch ${region.name} Pokemon`;
    nextBtn.onclick       = () => startRegionalCatch(STATE.currentRegion);
  } else {
    // Failed gym 5 — nothing to advance to; user must redo via the map.
    nextBtn.style.display = 'none';
  }

  showScreen('screen-gym-complete');
}

function goNextGym() {
  startGym(STATE.currentRegion, STATE.currentGym + 1);
}

// ── POKEMON TEAM RENDER ───────────────────────────────────────
function renderPokemonTeam() {
  const container = document.getElementById('pokemon-team-list');
  const team = STATE.save?.pokemon_team || [];

  if (team.length === 0) {
    container.innerHTML = `
      <div class="no-pokemon-msg">
        No Pokemon yet! Complete gyms to catch Pokemon. 🔮
        <br><small>You have ${STATE.save?.pokeballs || 0} Pokeball(s) ready.</small>
      </div>`;
    return;
  }

  container.innerHTML = team.map((p, idx) => {
    const stars = '⭐'.repeat(p.level || 1);
    return `
      <div class="pokemon-card">
        <div class="poke-emoji">${p.emoji}</div>
        <div class="poke-name">${p.name}</div>
        <div class="poke-level">${stars}</div>
        <button class="poke-ability-btn" onclick="activateAbility(${idx})">
          ${p.emoji} ${p.ability}
        </button>
        <div class="poke-ability-desc">${getAbilityDesc(p)}</div>
      </div>
    `;
  }).join('');
}

// ── POKEMON ABILITY ───────────────────────────────────────────
function activateAbility(pokemonIdx) {
  if (STATE.abilityUsedThisGym) {
    alert('⚠️ You can only use one Pokemon ability per gym!');
    return;
  }
  if (!STATE.answered === false) return; // only before answering

  const pokemon = STATE.save.pokemon_team[pokemonIdx];
  STATE.pendingAbilityPokemon = { pokemon, idx: pokemonIdx };

  document.getElementById('modal-poke-emoji').textContent = pokemon.emoji;
  document.getElementById('modal-poke-name').textContent = pokemon.name;
  document.getElementById('modal-ability-name').textContent = pokemon.ability;
  document.getElementById('modal-ability-desc').textContent = getAbilityDesc(pokemon);

  document.getElementById('modal-confirm-btn').onclick = () => useAbility(pokemonIdx);
  document.getElementById('modal-ability').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-ability').style.display = 'none';
  STATE.pendingAbilityPokemon = null;
}

function useAbility(pokemonIdx) {
  closeModal();
  const pokemon = STATE.save.pokemon_team[pokemonIdx];
  STATE.abilityUsedThisGym = true;

  // Apply ability effect
  switch(pokemon.id) {
    case 'pikachu': // 50/50 — remove 2 wrong answers
      const q = STATE.currentQData[STATE.currentQ];
      const correctIdx = STATE.currentChoices.indexOf(q.answer);
      let removed = 0;
      for (let i = 0; i < 4 && removed < 2; i++) {
        if (i !== correctIdx) {
          document.getElementById(`ans${i}`).style.opacity = '0.15';
          document.getElementById(`ans${i}`).disabled = true;
          removed++;
        }
      }
      break;
    case 'charmander': // +5 seconds
      STATE.timeLeft += 5;
      break;
    case 'squirtle': // skip
      clearInterval(STATE.timerInt);
      advanceQuestion();
      break;
    case 'snorlax': // freeze timer
      clearInterval(STATE.timerInt);
      break;
    // Add more abilities in Phase 2
  }

  // Remove pokemon from team
  STATE.save.pokemon_team.splice(pokemonIdx, 1);
  renderPokemonTeam();
}

// ── LEADERBOARD ───────────────────────────────────────────────
async function loadLeaderboard() {
  const container = document.getElementById('lb-content');
  container.innerHTML = '<div class="loading-msg">Loading scores…</div>';

  const players = await dbLoadAllPlayers();
  if (players.length === 0) {
    container.innerHTML = '<div class="loading-msg">No scores yet. Be the first!</div>';
    return;
  }

  const sorted = players.sort((a, b) => (b.total_crystals||0) - (a.total_crystals||0));

  // Fun stats
  const mostPokemon = players.reduce((best, p) => (p.pokemon_team||[]).length > (best.pokemon_team||[]).length ? p : best, players[0]);
  const mostBadges = players.reduce((best, p) => (p.badges_earned||0) > (best.badges_earned||0) ? p : best, players[0]);

  container.innerHTML = `
    <div class="lb-stats-row">
      <div class="lb-stat-pill">🐾 Most Pokemon: ${mostPokemon.player_emoji} ${mostPokemon.player_name} (${(mostPokemon.pokemon_team||[]).length})</div>
      <div class="lb-stat-pill">🏅 Most Badges: ${mostBadges.player_emoji} ${mostBadges.player_name} (${mostBadges.badges_earned||0})</div>
    </div>
    ${sorted.map((p, i) => `
      <div class="lb-row rank-${i+1}">
        <div class="lb-rank">${MEDALS[i]||i+1}</div>
        <div class="lb-emoji">${p.player_emoji}</div>
        <div style="flex:1">
          <div class="lb-name">${p.player_name}${p.player_id === STATE.player?.id ? ' (You)' : ''}</div>
          <div class="lb-sub">${p.total_correct||0} correct · ${p.badges_earned||0} badges · ${(p.pokemon_team||[]).length} pokemon</div>
        </div>
        <div class="lb-crystals">${(p.total_crystals||0).toLocaleString()} 🔮</div>
      </div>
    `).join('')}
  `;
}

// ── SETTINGS ──────────────────────────────────────────────────
function toggleSound() {
  STATE.soundOn = !STATE.soundOn;
  const btn = document.getElementById('toggle-sound');
  btn.textContent = STATE.soundOn ? 'ON' : 'OFF';
  btn.className = STATE.soundOn ? 'toggle-btn' : 'toggle-btn off';
}

function toggleMusic() {
  STATE.musicOn = !STATE.musicOn;
  const btn = document.getElementById('toggle-music');
  btn.textContent = STATE.musicOn ? 'ON' : 'OFF';
  btn.className = STATE.musicOn ? 'toggle-btn' : 'toggle-btn off';
}

function confirmReset() {
  if (confirm('⚠️ Are you sure? This will delete ALL your progress!')) {
    localStorage.removeItem('cqc_player_id');
    localStorage.removeItem('cqc_player');
    STATE.player = null;
    STATE.save = null;
    showScreen('screen-home');
  }
}

// ── MULTIPLAYER ───────────────────────────────────────────────
let pollInt = null;

async function hostCreate() {
  // Host creates room from host dashboard — handled by connectHostToRoom()
  // This is kept as fallback
}

async function playerJoin() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim();
  const err  = document.getElementById('join-err');
  const btn  = document.getElementById('join-btn');

  if (!code) { err.textContent = '⚠️ Enter the room code!'; return; }
  if (!name) { err.textContent = '⚠️ Enter your name!'; return; }

  btn.textContent = '⏳ Joining…'; btn.disabled = true; err.textContent = '';

  try {
    const room = await dbReadRoom(code);
    if (!room) {
      err.textContent = `❌ Room "${code}" not found. Ask Papa to open the Host page first!`;
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }
    if (room.phase !== 'lobby') {
      err.textContent = `❌ Game already started or not accepting players!`;
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }
    if ((room.players||[]).length >= 8) {
      err.textContent = '❌ Room is full (8/8)!';
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }
    if (room.phase === 'playing') {
      err.textContent = '❌ Game already started!';
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }

    // Create player identity
    const playerId = name.substring(0,2).toUpperCase() + '-' + Math.floor(1000+Math.random()*9000);
    const player = { id: playerId, name, emoji: joinEmoji, ageGroup: joinAge };
    STATE.player  = player;
    STATE.roomCode = code;
    STATE.isHost  = false;

    // Save to localStorage
    localStorage.setItem('cqc_player_id', playerId);
    localStorage.setItem('cqc_player', JSON.stringify(player));

    // Create save
    const save = newSave(player);
    STATE.save = save;
    await dbSave(playerId, save);

    // Add to room
    if (!room.players) room.players = [];
    room.players.push({ id: playerId, name, emoji: joinEmoji, ageGroup: joinAge });
    await dbWriteRoom(code, room);

    // Show waiting lobby
    showWaitingLobby(code, room.players, playerId, false);
    startWaitingPoll(code, playerId, false);

  } catch(e) {
    err.textContent = '❌ Error: ' + e.message;
    btn.textContent = '🚀 Join Room!'; btn.disabled = false;
  }
}

// ── WAITING LOBBY ─────────────────────────────────────────────
function showWaitingLobby(code, players, myPlayerId, isHost) {
  // Set room code display
  document.getElementById('wl-room-code').textContent = code;

  // Show/hide host controls vs player message
  document.getElementById('wl-host-controls').style.display = isHost ? 'block' : 'none';
  document.getElementById('wl-player-msg').style.display   = isHost ? 'none'  : 'block';

  // Filter out any host entries from player slots
  const realPlayers = (players||[]).filter(p => p.id !== 'HOST_VIEWER' && p.id !== 'host');

  // Render the 8 slots
  renderWaitingSlots(realPlayers, myPlayerId);

  showScreen('screen-waiting-lobby');
}

function renderWaitingSlots(players, myPlayerId) {
  const grid = document.getElementById('wl-slots-grid');
  const countEl = document.getElementById('wl-player-count');
  if (!grid) return;

  // Filter out host from player slots
  const realPlayers = (players||[]).filter(p => p.id !== 'HOST_VIEWER' && p.id !== 'host');
  players = realPlayers;

  const filledCount = players.length;
  if (countEl) countEl.textContent = filledCount;

  grid.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const p = (players||[])[i];
    const slot = document.createElement('div');
    const isMe = p && p.id === myPlayerId;
    slot.className = 'wl-slot' + (p ? ' filled' : '') + (isMe ? ' is-me' : '');
    slot.innerHTML = p
      ? `<div class="wl-slot-num">${i+1}</div>
         <div class="wl-slot-emoji">${p.emoji}</div>
         <div class="wl-slot-name">${p.name}${isMe ? ' 👈' : ''}</div>
         <div class="wl-slot-tag">${p.ageGroup === 'junior' ? '🌟 Junior' : '🎓 Senior'}</div>`
      : `<div class="wl-slot-num">${i+1}</div>
         <div class="wl-slot-empty-icon">❓</div>
         <div class="wl-slot-empty-txt">Empty</div>`;
    grid.appendChild(slot);
  }
}

let waitingPollInt = null;
function startWaitingPoll(code, myPlayerId, isHost) {
  if (waitingPollInt) clearInterval(waitingPollInt);
  waitingPollInt = setInterval(async () => {
    const room = await dbReadRoom(code);
    if (!room) return;

    // Filter out host — only show real players in slots
    const realPlayers = (room.players || []).filter(p =>
      p.id !== 'HOST_VIEWER' && p.id !== 'host' && !p.isHost
    );
    renderWaitingSlots(realPlayers, myPlayerId);

    // If host started → players go to pregame catch
    if (!isHost && room.phase === 'PREGAME_CATCH') {
      clearInterval(waitingPollInt);
      startPreGameCatch();
    }
  }, 2000);
}

function stopWaitingPoll() {
  if (waitingPollInt) { clearInterval(waitingPollInt); waitingPollInt = null; }
}

async function hostStartGame() {
  const btn = document.getElementById('wl-start-btn');
  btn.textContent = '⏳ Starting…'; btn.disabled = true;

  const code = HOST.roomCode || STATE.roomCode;
  if (!code) {
    alert('No room code found. Please refresh and try again.');
    btn.textContent = '🚀 Start Game!'; btn.disabled = false; return;
  }

  try {
    const room = await dbReadRoom(code);
    if (!room) {
      alert('Room not found. Please refresh.');
      btn.textContent = '🚀 Start Game!'; btn.disabled = false; return;
    }

    // Filter out any host entries from players
    const realPlayers = (room.players||[]).filter(p =>
      p.id !== 'HOST_VIEWER' && p.id !== 'host' && !p.isHost
    );

    // Signal all players to start
    room.phase = 'PREGAME_CATCH';
    room.players = realPlayers;
    room.currentRegion = 1;
    room.currentGym = 1;
    room.startedAt = new Date().toISOString();
    await dbWriteRoom(code, room);

    stopWaitingPoll();

    // Update HOST state
    HOST.currentPhase  = 'PREGAME_CATCH';
    HOST.currentRegion = 1;
    HOST.currentGym    = 1;
    HOST.players       = realPlayers;

    // Host goes to HOST DASHBOARD
    initHostDashboard();

  } catch(e) {
    console.error('Start game error:', e);
    alert('Error starting game: ' + e.message);
    btn.textContent = '🚀 Start Game!'; btn.disabled = false;
  }
}

function copyPlayerLink() {
  const base = location.href.split('?')[0].split('#')[0];
  const code = HOST.roomCode || STATE.roomCode;
  const url  = `${base}?room=${code}`;
  navigator.clipboard.writeText(url)
    .then(() => alert('✅ Link copied! Send it to players.'))
    .catch(() => prompt('Copy this link:', url));
}

// ── AUTO DETECT PLAYER LINK ───────────────────────────────────
window.addEventListener('load', () => {
  const params = new URLSearchParams(location.search);
  const roomParam = params.get('room');
  if (roomParam) {
    document.getElementById('join-code').value = roomParam;
    document.getElementById('join-banner-code').textContent = roomParam;
    document.getElementById('join-banner').style.display = 'block';
    showScreen('screen-join');
  }

  // Wire up leaderboard button
  document.querySelectorAll('[onclick="showScreen(\'screen-leaderboard\')"]').forEach(btn => {
    btn.onclick = () => {
      showScreen('screen-leaderboard');
      loadLeaderboard();
    };
  });
});

// ═══════════════════════════════════════════════════════════
// HOST DASHBOARD
// ═══════════════════════════════════════════════════════════

const HOST_PHASES = {
  PREGAME_CATCH:    { icon:'🎁', name:'Pre-Game Pokemon Catch',   desc:'Players are catching their starter Pokemon',    label:'PRE-GAME'  },
  REGION_SELECT:    { icon:'🗺️', name:'Region Selection',          desc:'Players are choosing their region',             label:'SELECTING' },
  GYM_ACTIVE:       { icon:'⚡', name:'Gym In Progress',           desc:'Players are answering questions',               label:'LIVE'      },
  GYM_COMPLETE:     { icon:'🏅', name:'Gym Complete',              desc:'Review results before moving on',               label:'RESULTS'   },
  REGION_COMPLETE:  { icon:'🌟', name:'Region Complete',           desc:'Pokemon catch phase available',                 label:'REGION ✅' },
  REGION_CATCH:     { icon:'🔴', name:'Regional Pokemon Catch',   desc:'Players are catching regional Pokemon',         label:'CATCHING'  },
  BREAK:            { icon:'💾', name:'Session Saved — On Break', desc:'Progress saved. Safe to close browsers.',       label:'BREAK'     },
  GAME_OVER:        { icon:'🏆', name:'Game Complete!',           desc:'Final standings and prize conversion',          label:'FINAL'     }
};

let HOST = {
  isHost: false,
  roomCode: '',
  currentPhase: 'PREGAME_CATCH',
  isPaused: false,
  pollInt: null,
  players: [],        // latest from Supabase
  pokemonCaught: {},  // { pokemonId: playerName }
  currentRegion: 1,
  currentGym: 1
};

// ── DETECT HOST MODE ──────────────────────────────────────────
function checkHostMode() {
  const params = new URLSearchParams(location.search);
  if (params.get('host') === 'true') {
    HOST.isHost = true;
    const roomCode = params.get('room') || '';
    if (roomCode) {
      HOST.roomCode  = roomCode;
      STATE.roomCode = roomCode;
      dbReadRoom(roomCode).then(room => {
        if (!room) {
          showHostSetup();
        } else if (['PREGAME_CATCH','GYM_ACTIVE','GYM_COMPLETE',
                    'REGION_COMPLETE','REGION_CATCH','GAME_OVER'].includes(room.phase)) {
          // Game in progress — go to dashboard
          HOST.currentPhase  = room.phase;
          HOST.players       = (room.players||[]).filter(p => p.id !== 'HOST_VIEWER');
          HOST.currentRegion = room.currentRegion || 1;
          HOST.currentGym    = room.currentGym || 1;
          initHostDashboard();
        } else {
          // Lobby phase — show waiting room
          const players = (room.players||[]).filter(p => p.id !== 'HOST_VIEWER');
          showWaitingLobby(roomCode, players, 'HOST_VIEWER', true);
          startWaitingPoll(roomCode, 'HOST_VIEWER', true);
        }
      });
    } else {
      showHostSetup();
    }
    return true;
  }
  return false;
}

function showHostSetup() {
  // Show a simple room code entry for host
  const app = document.getElementById('app');
  const setupDiv = document.createElement('div');
  setupDiv.style.cssText = 'padding:40px 20px;text-align:center;';
  setupDiv.innerHTML = `
    <div style="font-size:3rem;margin-bottom:16px">👑</div>
    <h2 style="font-size:1.6rem;font-weight:900;margin-bottom:8px;color:#ffcb05">Host Dashboard</h2>
    <p style="opacity:0.7;margin-bottom:6px">Create a room code for this session</p>
    <p style="opacity:0.5;font-size:0.8rem;margin-bottom:20px">Each session should use a fresh code (e.g. GAME1, PAPA2)</p>
    <input type="text" id="host-room-input" placeholder="e.g. PAPA2"
      style="width:100%;max-width:300px;padding:14px;border-radius:12px;border:2px solid rgba(255,203,5,0.4);background:rgba(255,255,255,0.08);color:white;font-size:1.2rem;font-weight:900;letter-spacing:4px;text-align:center;outline:none;margin-bottom:14px;font-family:monospace"
      oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')">
    <br>
    <button onclick="connectHostToRoom()" style="padding:14px 40px;background:linear-gradient(135deg,#ffcb05,#ff9800);border:none;border-radius:12px;font-weight:900;font-size:1rem;cursor:pointer;color:#1a1a2e">
      🚀 Create Room & Wait for Players
    </button>
    <div id="host-connect-err" style="color:#ef4444;margin-top:10px;font-weight:700"></div>
  `;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  app.appendChild(setupDiv);
}

async function connectHostToRoom() {
  const code = document.getElementById('host-room-input')?.value.trim();
  const err = document.getElementById('host-connect-err');
  if (!code) { if(err) err.textContent = '⚠️ Enter a room code'; return; }

  // Always create a FRESH room — clears any old saved data
  const room = {
    code,
    phase: 'lobby',
    isPaused: false,
    currentRegion: 1,
    currentGym: 1,
    players: [],           // starts empty — no host in player list
    pokemonCaught: {},
    hostConnected: true,
    updated_at: new Date().toISOString()
  };
  await dbWriteRoom(code, room);

  HOST.roomCode = code;
  STATE.roomCode = code;

  // Update URL without reload
  const url = new URL(location.href);
  url.searchParams.set('room', code);
  history.replaceState({}, '', url);

  // Show waiting lobby — 0 players at start
  showWaitingLobby(code, [], 'HOST_VIEWER', true);
  startWaitingPoll(code, 'HOST_VIEWER', true);
}

async function initHostDashboard() {
  // Load latest room state
  const room = await dbReadRoom(HOST.roomCode);
  if (room) {
    HOST.currentPhase = room.phase || 'PREGAME_CATCH';
    HOST.isPaused     = room.isPaused || false;
    HOST.players      = room.players || [];
    HOST.pokemonCaught= room.pokemonCaught || {};
    HOST.currentRegion= room.currentRegion || 1;
    HOST.currentGym   = room.currentGym || 1;
  } else {
    await syncHostRoom();
  }

  renderHostDashboard();
  showScreen('screen-host');
  startHostPoll();
}

// ── RENDER HOST DASHBOARD ─────────────────────────────────────
function renderHostDashboard() {
  const phase = HOST_PHASES[HOST.currentPhase] || HOST_PHASES.PREGAME_CATCH;
  const region = REGIONS.find(r => r.id === HOST.currentRegion) || REGIONS[0];

  // Phase info
  document.getElementById('host-phase-icon').textContent = phase.icon;
  document.getElementById('host-phase-name').textContent = phase.name;
  document.getElementById('host-phase-desc').textContent = phase.desc;
  document.getElementById('host-phase-label').textContent = phase.label;
  document.getElementById('host-status-text').textContent =
    `${region.emoji} ${region.name} · Gym ${HOST.currentGym}/5 · Room: ${HOST.roomCode}`;

  // Paused state
  const pausedBanner = document.getElementById('host-paused-banner');
  pausedBanner.style.display = HOST.isPaused ? 'block' : 'none';

  // Update next phase button
  updateNextPhaseButton();

  // Pause button state
  const pauseIcon = document.getElementById('host-pause-icon');
  const pauseLabel = document.getElementById('host-pause-label');
  const pauseBtn = document.getElementById('host-btn-pause');
  if (HOST.isPaused) {
    pauseIcon.textContent = '▶️';
    pauseLabel.textContent = 'Resume Game';
    pauseBtn.classList.add('active');
  } else {
    pauseIcon.textContent = '⏸️';
    pauseLabel.textContent = 'Pause Game';
    pauseBtn.classList.remove('active');
  }

  // Show/hide restart button
  const restartBtn = document.getElementById('host-btn-restart');
  restartBtn.style.display = HOST.currentPhase === 'GYM_ACTIVE' ? 'flex' : 'none';

  // Render player cards
  renderHostPlayerCards();

  // Show/hide leaderboard
  const lbSection = document.getElementById('host-leaderboard-section');
  const showLB = ['GYM_COMPLETE','REGION_COMPLETE','GAME_OVER'].includes(HOST.currentPhase);
  lbSection.style.display = showLB ? 'block' : 'none';
  if (showLB) renderHostLeaderboard();

  // Show/hide pokemon pool
  const pokeSection = document.getElementById('host-pokemon-section');
  const showPoke = ['PREGAME_CATCH','REGION_CATCH'].includes(HOST.currentPhase);
  pokeSection.style.display = showPoke ? 'block' : 'none';
  if (showPoke) renderHostPokemonPool();
}

function updateNextPhaseButton() {
  const btn = document.getElementById('host-btn-next-phase');
  const icon = document.getElementById('host-next-phase-icon');
  const label = document.getElementById('host-next-phase-label');

  const configs = {
    PREGAME_CATCH:   { icon:'🗺️', label:'End Catch → Open Region Map' },
    REGION_SELECT:   { icon:'⚡', label:'Lock Regions → Start Gym 1'  },
    GYM_ACTIVE:      { icon:'🏅', label:'End Gym → Show Results'      },
    GYM_COMPLETE:    { icon:'▶️', label:`Continue → Gym ${Math.min(HOST.currentGym+1,5)}` },
    REGION_COMPLETE: { icon:'🔴', label:'Open Pokemon Catch Phase'    },
    REGION_CATCH:    { icon:'🌍', label:'End Catch → Next Region'     },
    BREAK:           { icon:'▶️', label:'Resume Game'                  },
    GAME_OVER:       { icon:'💾', label:'Save Final Results'           }
  };

  // Special case: last gym of region
  if (HOST.currentPhase === 'GYM_COMPLETE' && HOST.currentGym >= 5) {
    configs.GYM_COMPLETE = { icon:'🌟', label:'Region Complete → Catch Pokemon!' };
  }

  const cfg = configs[HOST.currentPhase] || { icon:'⏭️', label:'Next Phase' };
  icon.textContent = cfg.icon;
  label.textContent = cfg.label;
}

function renderHostPlayerCards() {
  const container = document.getElementById('host-player-grid');

  if (HOST.players.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px;opacity:0.5;font-size:0.9rem">
        No players connected yet.<br>
        Share room code: <b style="color:#ffcb05;letter-spacing:2px">${HOST.roomCode}</b>
      </div>`;
    return;
  }

  const sortedPlayers = [...HOST.players].sort((a,b) => (b.total_crystals||0) - (a.total_crystals||0));

  container.innerHTML = sortedPlayers.map(p => {
    const statusInfo = getPlayerStatusInfo(p);
    const crystals = (p.total_crystals || 0).toLocaleString();
    const gymProgress = p.current_gym_correct || 0;
    const gymTotal = p.current_gym_questions || 10;
    const progressPct = (gymProgress / gymTotal) * 100;
    const pokemon = (p.pokemon_team || []).map(pk => pk.emoji).join('') || '—';

    return `
      <div class="host-player-card status-${statusInfo.statusClass}">
        <div class="hpc-emoji">${p.player_emoji || '👤'}</div>
        <div class="hpc-info">
          <div class="hpc-name">${p.player_name || 'Unknown'}</div>
          <div class="hpc-detail">${statusInfo.detail}</div>
          <div class="hpc-detail" style="margin-top:2px">🐾 ${pokemon} · 🏅 ${p.badges_earned||0} badges</div>
          ${HOST.currentPhase === 'GYM_ACTIVE' ? `
            <div class="hpc-progress">
              <div class="hpc-progress-fill" style="width:${progressPct}%"></div>
            </div>` : ''}
        </div>
        <div style="text-align:right">
          <div class="hpc-crystals">${crystals} 🔮</div>
          <div class="hpc-crystal-sub">total</div>
          <div class="hpc-status">${statusInfo.icon}</div>
        </div>
      </div>
    `;
  }).join('');
}

function getPlayerStatusInfo(player) {
  switch(HOST.currentPhase) {
    case 'PREGAME_CATCH':
    case 'REGION_CATCH':
      const caught = (player.pokemon_team||[]).length > 0;
      return {
        icon: caught ? '✅' : '⏳',
        statusClass: caught ? 'done' : 'active',
        detail: caught
          ? `Caught: ${(player.pokemon_team||[]).map(p=>p.emoji+' '+p.name).join(', ')}`
          : `Pokeballs left: ${player.pokeballs ?? 3}`
      };
    case 'GYM_ACTIVE':
      const answered = player.current_q_answered || false;
      return {
        icon: answered ? '✅' : '⏳',
        statusClass: answered ? 'done' : 'active',
        detail: `Q${(player.current_q||0)+1}/10 · ${player.current_gym_correct||0} correct`
      };
    case 'GYM_COMPLETE':
      const gymCrystals = player.last_gym_crystals || 0;
      const region = REGIONS.find(r => r.id === HOST.currentRegion) || REGIONS[0];
      const passed = gymCrystals >= region.badgeMin;
      return {
        icon: passed ? '🏅' : '❌',
        statusClass: passed ? 'done' : 'failed',
        detail: `${player.last_gym_correct||0}/10 correct · ${gymCrystals} 🔮 · ${passed ? 'PASSED' : 'FAILED'}`
      };
    default:
      return {
        icon: '▶',
        statusClass: 'waiting',
        detail: `Region ${HOST.currentRegion} · Gym ${HOST.currentGym}`
      };
  }
}

function renderHostLeaderboard() {
  const container = document.getElementById('host-lb');
  const sorted = [...HOST.players].sort((a,b) => (b.total_crystals||0) - (a.total_crystals||0));

  container.innerHTML = sorted.map((p, i) => {
    const gymC = p.last_gym_crystals || 0;
    const region = REGIONS.find(r => r.id === HOST.currentRegion) || REGIONS[0];
    const passed = gymC >= region.badgeMin;
    return `
      <div class="host-lb-row rank-${i+1}">
        <div class="hlb-rank">${MEDALS[i]||i+1}</div>
        <div class="hlb-emoji">${p.player_emoji||'👤'}</div>
        <div style="flex:1">
          <div class="hlb-name">${p.player_name||'?'}</div>
          <div class="hlb-pass">
            ${HOST.currentPhase==='GYM_COMPLETE'
              ? `<span class="gym-status-badge ${passed?'gsb-passed':'gsb-failed'}">${passed?'🏅 PASSED':'❌ FAILED'}</span>`
              : `🏅 ${p.badges_earned||0} badges · 🐾 ${(p.pokemon_team||[]).length} pokemon`}
          </div>
        </div>
        <div class="hlb-crystals">${(p.total_crystals||0).toLocaleString()} 🔮</div>
      </div>
    `;
  }).join('');
}

async function renderHostPokemonPool() {
  // Phase 1 step 1.4: starters come from pokemon.json. During pre-game
  // catch we show the 10 starters; during a regional catch we show the
  // active region's 10 Pokemon. Load on demand.
  await loadPokemon();
  const container = document.getElementById('host-pokemon-pool');
  const caughtMap = HOST.pokemonCaught || {};

  let pool;
  if (HOST.currentPhase === 'REGION_CATCH' && HOST.currentRegion) {
    pool = getRegionalList(HOST.currentRegion);
  } else {
    pool = getStartersList();
  }

  if (pool.length === 0) {
    container.innerHTML = `<div class="loading-msg" style="opacity:0.7">Loading Pokemon pool…</div>`;
    return;
  }

  container.innerHTML = pool.map(p => {
    const catcher = caughtMap[p.id];
    return `
      <div class="host-poke-pill ${catcher ? 'caught' : 'available'}">
        <div class="host-poke-pill-emoji">${p.emoji}</div>
        <div class="host-poke-pill-name">${p.name}</div>
        <div class="host-poke-pill-catcher">${catcher ? '✅ '+catcher : '🔓 Free'}</div>
      </div>
    `;
  }).join('');
}

// ── HOST CONTROLS ─────────────────────────────────────────────
async function hostNextPhase() {
  const transitions = {
    PREGAME_CATCH:   'REGION_SELECT',
    REGION_SELECT:   'GYM_ACTIVE',
    GYM_ACTIVE:      'GYM_COMPLETE',
    GYM_COMPLETE:    HOST.currentGym >= 5 ? 'REGION_COMPLETE' : 'GYM_ACTIVE',
    REGION_COMPLETE: 'REGION_CATCH',
    REGION_CATCH:    'REGION_SELECT',
    BREAK:           HOST.currentPhase,
    GAME_OVER:       'GAME_OVER'
  };

  const nextPhase = transitions[HOST.currentPhase];
  if (!nextPhase) return;

  // Advance gym/region counters
  if (HOST.currentPhase === 'GYM_COMPLETE' && HOST.currentGym < 5) {
    HOST.currentGym++;
  } else if (HOST.currentPhase === 'REGION_CATCH') {
    HOST.currentRegion = Math.min(HOST.currentRegion + 1, 10);
    HOST.currentGym = 1;
  }

  HOST.currentPhase = nextPhase;
  await syncHostRoom();
  renderHostDashboard();
}

async function hostTogglePause() {
  HOST.isPaused = !HOST.isPaused;
  await syncHostRoom();
  renderHostDashboard();

  // Show/hide pause overlay on THIS device if also playing
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.style.display = 'none'; // host never sees overlay
}

async function hostSaveAll() {
  // Force save all players to Supabase (they already auto-save, this is a manual confirmation)
  await syncHostRoom();

  const msg = document.getElementById('host-save-msg');
  msg.style.display = 'block';
  msg.textContent = `✅ Game state saved at ${new Date().toLocaleTimeString()}`;
  setTimeout(() => msg.style.display = 'none', 3000);
}

async function hostRestartGym() {
  if (!confirm(`⚠️ Restart Gym ${HOST.currentGym}?\nThis will reset all player progress for this gym.`)) return;

  HOST.currentPhase = 'GYM_ACTIVE';
  // Signal players to restart via room state
  await syncHostRoom();
  renderHostDashboard();
}

async function syncHostRoom() {
  const roomData = {
    code: HOST.roomCode,
    phase: HOST.currentPhase,
    isPaused: HOST.isPaused,
    currentRegion: HOST.currentRegion,
    currentGym: HOST.currentGym,
    players: HOST.players,
    pokemonCaught: HOST.pokemonCaught,
    hostConnected: true,
    updated_at: new Date().toISOString()
  };
  await dbWriteRoom(HOST.roomCode, roomData);
}

// ── HOST POLLING ──────────────────────────────────────────────
function startHostPoll() {
  if (HOST.pollInt) clearInterval(HOST.pollInt);
  HOST.pollInt = setInterval(hostDoPoll, 2500);
}

async function hostDoPoll() {
  const room = await dbReadRoom(HOST.roomCode);
  if (!room) return;

  // Load all player saves matching this room's players
  const allSaves = await dbLoadAllPlayers();

  HOST.players = allSaves;
  HOST.pokemonCaught = room.pokemonCaught || {};

  // Re-render player cards and leaderboard
  renderHostPlayerCards();

  const showLB = ['GYM_COMPLETE','REGION_COMPLETE','GAME_OVER'].includes(HOST.currentPhase);
  if (showLB) renderHostLeaderboard();

  const showPoke = ['PREGAME_CATCH','REGION_CATCH'].includes(HOST.currentPhase);
  if (showPoke) renderHostPokemonPool();
}

// ── PLAYER: RESPOND TO HOST COMMANDS ─────────────────────────
// Players poll for pause state AND (Phase 1 step 1.4) for race-rule
// updates to room.pokemonCaught while on catch screens.
async function checkPauseState() {
  if (!HOST.roomCode && !STATE.roomCode) return;
  const code = HOST.roomCode || STATE.roomCode;
  const room = await dbReadRoom(code);
  if (!room) return;

  const overlay = document.getElementById('pause-overlay');
  if (overlay && !HOST.isHost) {
    overlay.style.display = room.isPaused ? 'flex' : 'none';
  }

  // 1.4: refresh local mirror of pokemonCaught so catch grids grey out
  // Pokemon that other players caught in the last few seconds.
  const remoteCaught = room.pokemonCaught || {};
  const localCaught  = HOST.pokemonCaught  || {};
  const changed = JSON.stringify(remoteCaught) !== JSON.stringify(localCaught);
  HOST.pokemonCaught = remoteCaught;
  if (changed) {
    const cur = document.querySelector('.screen.active')?.id;
    if (cur === 'screen-pregame-catch') {
      // Only re-render the chooser grid if it's currently visible.
      const choose = document.getElementById('pregame-step-choose');
      if (choose && choose.style.display !== 'none') renderStarterGrid();
    } else if (cur === 'screen-catch') {
      // Only refresh the Pokemon grid; skip if a question is mid-attempt.
      const qPanel = document.getElementById('regional-catch-question');
      if (!qPanel || qPanel.style.display !== 'block') renderRegionalCatch();
    }
  }
}

// ── INIT: CHECK HOST MODE ON LOAD ─────────────────────────────
// Extend existing load listener
const _origLoad = window.onload;
window.addEventListener('load', () => {
  // Check if host mode
  if (checkHostMode()) return; // host mode takes over

  // Otherwise normal player flow
  const params = new URLSearchParams(location.search);
  const roomParam = params.get('room');
  if (roomParam) {
    STATE.roomCode = roomParam;
    document.getElementById('join-code').value = roomParam;
    document.getElementById('join-banner-code').textContent = roomParam;
    document.getElementById('join-banner').style.display = 'block';
    showScreen('screen-join');
  }

  // Wire leaderboard
  document.querySelectorAll('[onclick*="screen-leaderboard"]').forEach(btn => {
    btn.onclick = () => { showScreen('screen-leaderboard'); loadLeaderboard(); };
  });

  // Poll for pause state every 3s when in a game; same poll also refreshes
  // room.pokemonCaught for the race rule (1.4) on catch screens.
  setInterval(() => {
    const cur = document.querySelector('.screen.active')?.id;
    if (['screen-quiz','screen-pregame-catch','screen-gym-complete','screen-catch'].includes(cur)) {
      checkPauseState();
    }
  }, 3000);
});
