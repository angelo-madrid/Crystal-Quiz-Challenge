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

// ═══════════════════════════════════════════════════════════
// CRYSTAL LEDGER (banking layer — see MIGRATIONS.md)
// ═══════════════════════════════════════════════════════════
// Canonical balance rule: player_saves.data.total_crystals is
// authoritative. Mutations to it happen ONLY through approveOrCredit()
// below — which writes a matching crystal_ledger row first, then
// bumps the balance. Pending and declined ledger entries never touch
// the balance.

// Insert a new ledger entry. Returns the inserted row.
async function dbLedgerInsert(entry) {
  const { data, error } = await sb.from('crystal_ledger')
    .insert(entry).select().single();
  if (error) { console.error('Ledger insert error:', JSON.stringify(error)); return null; }
  return data;
}

// Update an existing ledger entry (typically host approves/declines).
async function dbLedgerUpdate(id, patch) {
  const { data, error } = await sb.from('crystal_ledger')
    .update(patch).eq('id', id).select().single();
  if (error) { console.error('Ledger update error:', JSON.stringify(error)); return null; }
  return data;
}

// List a single player's entries, newest first.
async function dbLedgerForPlayer(playerId, limit = 50) {
  const { data, error } = await sb.from('crystal_ledger')
    .select('*').eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('Ledger fetch error:', JSON.stringify(error)); return []; }
  return data || [];
}

// List every pending redemption request across all players (host view).
async function dbLedgerPending() {
  const { data, error } = await sb.from('crystal_ledger')
    .select('*').eq('status', 'pending')
    .order('created_at', { ascending: true });   // oldest pending first
  if (error) { console.error('Ledger pending fetch error:', JSON.stringify(error)); return []; }
  return data || [];
}

// True iff the player has at least one pending redeem_request.
async function dbHasPendingRedemption(playerId) {
  const { data, error } = await sb.from('crystal_ledger')
    .select('id').eq('player_id', playerId)
    .eq('type', 'redeem_request').eq('status', 'pending').limit(1);
  if (error) { console.error('Pending check error:', JSON.stringify(error)); return false; }
  return Array.isArray(data) && data.length > 0;
}

// Look up a player's save by id (for host's add-crystals form preview).
async function dbLookupPlayer(playerId) {
  const { data, error } = await sb.from('player_saves')
    .select('data').eq('player_id', playerId).single();
  if (error || !data) return null;
  return data.data;
}

// Mutate the canonical balance. Reads save, applies delta, writes back.
// Returns the new total or null on failure. NOT atomic at the DB level —
// concurrent writers to the same save can race; for a 5-kid game this is
// acceptable. The ledger is the audit trail of record.
async function dbBumpCrystals(playerId, delta) {
  const save = await dbLoad(playerId);
  if (!save) { console.warn('Save not found for bump:', playerId); return null; }
  save.total_crystals = Math.max(0, (save.total_crystals || 0) + delta);
  save.updated_at = new Date().toISOString();
  await dbSave(playerId, save);
  // If this is the local player, keep STATE.save in sync.
  if (STATE.player && STATE.player.id === playerId) {
    STATE.save = save;
  }
  return save.total_crystals;
}

// Write a ledger entry AND bump the balance in one go (for entries that
// are immediately approved: earn/bonus/adjustment, or for host
// approve/modify of a pending redemption). For declined entries, only
// the ledger row updates — no balance change.
//
// opts = { playerId, type, amount, room_code, note, status }
// Where status defaults to 'approved'. amount sign convention:
// positive = credit, negative = debit.
async function recordLedgerAndBump(opts) {
  const entry = {
    player_id:  opts.playerId,
    room_code:  opts.room_code || null,
    type:       opts.type,
    amount:     opts.amount,
    status:     opts.status || 'approved',
    note:       opts.note || null,
    resolved_at: (opts.status && opts.status !== 'approved' && opts.status !== 'modified')
                  ? null
                  : new Date().toISOString(),
  };
  const row = await dbLedgerInsert(entry);
  if (!row) return null;
  if (entry.status === 'approved' || entry.status === 'modified') {
    await dbBumpCrystals(opts.playerId, opts.amount);
  }
  return row;
}

// Phase B: list every room (active and archived) for the host landing
// screen. Read-only — never mutates a room. Returns rows ordered by
// recency desc, each row { id, data, updated_at }.
async function dbListRooms() {
  const { data, error } = await sb.from('rooms')
    .select('id, data, updated_at')
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data;
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

// ── PHASE 1 TEST BUILD GATE ──────────────────────────────────
// Step 1.6: the engine is being tested on Regions 1-2 only. Bump this when
// Regions 3+ are validated. Every code path that would advance past this
// region must first check it and route to showTestBuildComplete() instead.
const MAX_PLAYABLE_REGION = 2;

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
  totalTime: 20,                // Phase 1 step 1.5: tracked so TIME/FREEZE can adjust the bar correctly
  gymCrystals: 0,
  gymCorrect: 0,
  // Review feature: per-question answer log for the in-progress gym.
  // Indexed by question position; null = timeout/skip. Persisted to
  // save.regions[r].gymResults[g].questions[i].chosen at endGym.
  gymAnswerLog: [],
  abilityUsedThisGym: false,
  pendingAbilityPokemon: null,
  // 1.5: single-question modifiers set by an ability, consumed on next answer
  pendingMods: { multiplier: 1, doubleOrNothing: false, retry: false, shield: false },
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
    // UAT bug-fix 1.7-fix-1: track every question ID the player has seen
    // across their save. Ordered: oldest first → newest last. Used for
    // draw-without-replacement; on bucket exhaustion we reuse the least-
    // recently-seen one (then re-mark it as most-recent).
    seen_question_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// ── QUESTION DRAW HELPERS (UAT bug-fix 1.7) ───────────────────
// Single source of truth for "give me a question from this pool" — used
// by gym draws, pre-game catches, and regional catches. Tracks seen IDs
// in STATE.save.seen_question_ids so the same question never repeats
// within a save until that bucket is fully exhausted.
function _ensureSeenArr() {
  if (!STATE.save) return [];
  if (!Array.isArray(STATE.save.seen_question_ids)) STATE.save.seen_question_ids = [];
  return STATE.save.seen_question_ids;
}
function markQuestionSeen(qid) {
  if (!qid || !STATE.save) return;
  const arr = _ensureSeenArr();
  const idx = arr.indexOf(qid);
  if (idx >= 0) arr.splice(idx, 1);    // move to most-recent on reuse
  arr.push(qid);
}
function pickQuestion(pool) {
  if (!pool || pool.length === 0) {
    return { picked: null, exhausted: false, bucketEmpty: true };
  }
  const seen = new Set(_ensureSeenArr());
  const unseen = pool.filter(q => !seen.has(q.id));
  if (unseen.length > 0) {
    const picked = unseen[Math.floor(Math.random() * unseen.length)];
    return { picked: maybeScrambleUnscramble(picked), exhausted: false, bucketEmpty: false };
  }
  // Exhausted: pick the least-recently-seen entry from the seen list that
  // also lives in the pool. Lower index in seen_question_ids = older.
  const seenIds = _ensureSeenArr();
  const sorted = pool.slice().sort((a, b) => {
    const ai = seenIds.indexOf(a.id);
    const bi = seenIds.indexOf(b.id);
    return ai - bi;
  });
  return { picked: maybeScrambleUnscramble(sorted[0]), exhausted: true, bucketEmpty: false };
}

// UAT bug-fix 1.7-fix-2: unscramble questions in the JSON ship with
// the answer's letters already in correct order (e.g. "G-R-A-C-I-A-S"
// already spells GRACIAS). Shuffle the letters at draw time so the
// prompt is actually scrambled. Multiple-choice options stay untouched.
function maybeScrambleUnscramble(q) {
  if (!q || q.type !== 'unscramble') return q;
  // Capture the dashed-letters block in the question text. At least 3
  // letters required (regex matches the second '-LETTER' onwards).
  const re = /[A-Z](?:-[A-Z]){2,}/;
  const m = q.question.match(re);
  if (!m) return q;
  const letters = m[0].split('-');
  if (letters.length < 2) return q;
  const original = letters.join('');
  let shuffled = letters.slice();
  // Fisher-Yates a few times until we land on something different from
  // the original spelling (handles duplicate-letter words like MAGIKARP).
  for (let attempt = 0; attempt < 20; attempt++) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (shuffled.join('') !== original) break;
  }
  // Last resort if every shuffle happened to equal the original (only
  // possible on degenerate inputs like "A-A"): rotate by 1.
  if (shuffled.join('') === original && letters.length >= 2) {
    shuffled = letters.slice(1).concat(letters[0]);
  }
  return Object.assign({}, q, { question: q.question.replace(m[0], shuffled.join('-')) });
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

// Solo-create flow disabled. The legitimate new-player creation now lives
// inside `playerJoin()` which requires a valid Supabase room. If anything
// still reaches `screen-login` and calls createPlayer (e.g. a stale link),
// surface a clear message and redirect to the room-join entry. We do NOT
// write a save or generate a player ID outside a room context.
async function createPlayer() {
  const err = document.getElementById('login-err');
  if (err) {
    err.textContent = '🎮 New players join through a room code — ask Papa for one.';
  }
  showScreen('screen-join');
}

// Solo "Continue Journey" was removed from the home screen. The function
// is kept as a stub so any stale onclick / bookmark routes through the
// multiplayer entry — never silently restores a save and drops the kid
// onto the map without a room context. The legitimate rejoin path is
// `tryAutoRejoinFromURL(code)` triggered by `?room=CODE`, which is left
// untouched.
async function continueJourney() {
  showScreen('screen-join');
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

  // UAT bug-fix 1.7-fix-1: pickQuestion enforces save-wide draw-without-
  // replacement (subsumes the old per-session usedQuestions tracker) and
  // (fix-2) scrambles unscramble prompts.
  const { picked, exhausted } = pickQuestion(pbBank);
  if (!picked) { alert('Failed to pick a pokeball question.'); return; }
  if (exhausted) console.warn('[attemptCatch] pokeball_bank exhausted — reusing oldest');
  markQuestionSeen(picked.id);
  PREGAME_STATE.usedQuestions.push(picked.id);   // kept for backward-compat readers
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
  // 1.6: defensive — never run a regional catch for an out-of-scope region.
  if (regionId > MAX_PLAYABLE_REGION) { showTestBuildComplete(); return; }
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

async function buyRegionalPokeball() {
  const s = REGIONAL_CATCH_STATE;
  const region = s.region;
  const cost = region.pokeball;
  if (s.ballsThrown + s.pokeballs >= 3) { alert('Max 3 Pokeballs per region.'); return; }
  if ((STATE.save.total_crystals || 0) < cost) { alert(`Need ${cost} 🔮.`); return; }
  STATE.save.total_crystals -= cost;
  s.pokeballs += 1;
  // Crystal-banking audit: 'adjustment' ledger entry so the ledger sum
  // continues to mirror the canonical balance.
  if (STATE.player && STATE.player.id) {
    await dbLedgerInsert({
      player_id: STATE.player.id,
      room_code: STATE.roomCode || null,
      type: 'adjustment', amount: -cost, status: 'approved',
      note: `Bought Pokeball in ${region.name}`,
      resolved_at: new Date().toISOString(),
    });
  }
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

  // UAT bug-fix 1.7-fix-1: pickQuestion enforces save-wide draw-without-
  // replacement; (fix-2) scrambles unscramble prompts.
  const { picked, exhausted } = pickQuestion(pool);
  if (!picked) {
    alert(`No catch questions for region ${s.region.id}.`);
    return;
  }
  if (exhausted) console.warn(`[attemptRegionalCatch] catch_bank[${s.region.id}] exhausted — reusing oldest`);
  markQuestionSeen(picked.id);
  s.usedQuestions.push(picked.id);   // kept for backward-compat readers
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

  // 1.6: if the just-finished region is the final playable one in this test
  // build (Region 2 today), surface the celebratory test-build lid instead
  // of dumping the kid back onto a map of locked regions.
  const justFinished = REGIONAL_CATCH_STATE && REGIONAL_CATCH_STATE.region;
  const fullyClearedRegion = justFinished
    && ((STATE.save.regions || {})[justFinished.id]?.gymsCompleted || []).length >= 5;
  if (fullyClearedRegion && justFinished.id >= MAX_PLAYABLE_REGION) {
    showTestBuildComplete();
    return;
  }

  showMap();
}

// ── TEST BUILD LID (Phase 1 step 1.6) ─────────────────────────
// Single chokepoint for "you've reached the edge of the test build".
// Called from: locked-region clicks on the map, defensive guards in
// startGym / startRegionalCatch, and finishRegionalCatch when Region 2
// has just been completed.
function showTestBuildComplete() {
  // Clear any timers that might be running so we don't tick over a frozen
  // screen.
  if (STATE.timerInt) { clearInterval(STATE.timerInt); STATE.timerInt = null; }
  if (REGIONAL_CATCH_STATE && REGIONAL_CATCH_STATE.timerInt) {
    clearInterval(REGIONAL_CATCH_STATE.timerInt);
    REGIONAL_CATCH_STATE.timerInt = null;
  }
  showScreen('screen-test-build-complete');
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
    // 1.6: anything past MAX_PLAYABLE_REGION is a soft lock — clickable but
    // routes to the test-build-complete screen instead of loading the gym.
    const isComingSoon = region.id > MAX_PLAYABLE_REGION;
    const isLocked = !isComingSoon
      && idx > 0
      && ((save.regions || {})[REGIONS[idx-1].id]?.gymsCompleted || []).length < 5;
    const isCompleted = gymsCompleted >= 5;

    const card = document.createElement('div');
    const classes = ['region-card'];
    if (isComingSoon) classes.push('locked', 'coming-soon');
    else if (isLocked) classes.push('locked');
    if (isCompleted) classes.push('completed');
    card.className = classes.join(' ');

    const statusText = isComingSoon ? '🚧 Coming Soon'
                     : isCompleted  ? '✅ Complete'
                     : isLocked     ? '🔒 Locked'
                     :                '▶ In Progress';
    const statusIcon = isComingSoon ? '🚧'
                     : isCompleted  ? '✅'
                     : isLocked     ? '🔒'
                     :                '▶';

    card.innerHTML = `
      <div class="region-emoji">${region.emoji}</div>
      <div class="region-info">
        <div class="region-name">Region ${region.id}: ${region.name}</div>
        <div class="region-theme">${region.theme}</div>
        <div class="region-progress">${gymsCompleted}/5 gyms · ${statusText}</div>
      </div>
      <div class="region-status">${statusIcon}</div>
    `;
    if (isComingSoon) {
      // Coming-soon cards are clickable but lead to the test-build lid,
      // not the gym select. Prevents accidental access to unwired content.
      card.onclick = showTestBuildComplete;
    } else if (!isLocked) {
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
    // Review feature: completed gym → "Tap to review" subtitle so the kid
    // knows it's now read-only.
    const subtitle = isCompleted
      ? `${GYM_FORMATS[i-1]} · ✅ Tap to review`
      : `${GYM_FORMATS[i-1]} · ${region.badgeMin} 🔮 min`;
    card.innerHTML = `
      <div class="gym-num">${i}</div>
      <div class="gym-info">
        <div class="gym-name">${GYM_NAMES[i-1]}</div>
        <div class="gym-meta">${subtitle}</div>
      </div>
      <div class="gym-badge-status">${isCompleted ? '🏅' : isLocked ? '🔒' : '▶'}</div>
    `;
    if (!isLocked) {
      // Completed gyms → read-only review. In-progress/not-started → play.
      card.onclick = isCompleted
        ? () => openGymReview(regionId, i)
        : () => startGym(regionId, i);
    }
    container.appendChild(card);
  }

  showScreen('screen-gym-select');
}

// ═══════════════════════════════════════════════════════════
// CRYSTAL WALLET — player-facing banking dashboard
// ═══════════════════════════════════════════════════════════
async function openWallet() {
  if (!STATE.player) { showScreen('screen-join'); return; }
  showScreen('screen-crystal-dashboard');
  await renderWallet();
}

async function renderWallet() {
  const player = STATE.player;
  if (!player) return;
  // Refresh authoritative balance from Supabase before showing — covers
  // host-side bonuses that happened between the last local update and now.
  const fresh = await dbLoad(player.id);
  if (fresh) STATE.save = fresh;
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  const peso = (balance / 100).toFixed(2);

  document.getElementById('wallet-title').textContent = `💎 ${player.name}'s Crystal Wallet`;
  document.getElementById('wallet-balance').textContent = `${balance.toLocaleString()} 🔮`;
  document.getElementById('wallet-peso').textContent = peso;

  // Redeem button — disabled while a request is already pending.
  const redeemSection = document.getElementById('wallet-redeem-section');
  const hasPending = await dbHasPendingRedemption(player.id);
  redeemSection.innerHTML = hasPending
    ? `<div class="wallet-pending-banner">⏳ Redemption request pending — Papa will review it soon.</div>`
    : `<button class="btn-primary" id="wallet-redeem-toggle" onclick="walletShowRedeemForm()">🎁 Redeem Crystals</button>`;

  // Ledger rows
  const rows = await dbLedgerForPlayer(player.id, 50);
  const ledgerEl = document.getElementById('wallet-ledger');
  if (!rows.length) {
    ledgerEl.innerHTML = '<div class="wallet-empty">No activity yet. Earn crystals by clearing gyms!</div>';
    return;
  }
  ledgerEl.innerHTML = rows.map(walletRenderLedgerRow).join('');
}

function walletShowRedeemForm() {
  const player = STATE.player;
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  const max = balance;
  const section = document.getElementById('wallet-redeem-section');
  section.innerHTML = `
    <div class="wallet-redeem-form">
      <div class="wallet-form-row">
        <label>Amount to redeem (max ${max.toLocaleString()})</label>
        <input type="number" id="wallet-redeem-amount" min="1" max="${max}" placeholder="e.g. 500">
      </div>
      <div class="wallet-form-row">
        <label>Note (optional)</label>
        <input type="text" id="wallet-redeem-note" maxlength="80" placeholder="e.g. end of day payout">
      </div>
      <div class="err" id="wallet-redeem-err"></div>
      <div class="wallet-form-actions">
        <button class="btn-primary" onclick="walletSubmitRedeem()">Submit Redemption Request</button>
        <button class="btn-secondary" onclick="renderWallet()">Cancel</button>
      </div>
    </div>`;
}

async function walletSubmitRedeem() {
  const player = STATE.player;
  const err = document.getElementById('wallet-redeem-err');
  const amount = parseInt(document.getElementById('wallet-redeem-amount').value, 10);
  const note   = document.getElementById('wallet-redeem-note').value.trim();
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  if (!amount || amount <= 0) { if(err) err.textContent = '⚠️ Enter an amount > 0'; return; }
  if (amount > balance)       { if(err) err.textContent = `⚠️ You only have ${balance.toLocaleString()} crystals`; return; }
  // One pending at a time (defense in depth — the button is also disabled UI-side).
  const already = await dbHasPendingRedemption(player.id);
  if (already) { await renderWallet(); return; }

  await dbLedgerInsert({
    player_id:  player.id,
    room_code:  STATE.roomCode || null,
    type:       'redeem_request',
    amount:     -Math.abs(amount),
    status:     'pending',
    note:       note || null,
    resolved_at: null,
  });
  // Confirmation banner — re-render replaces the form with the pending notice.
  await renderWallet();
  const sec = document.getElementById('wallet-redeem-section');
  if (sec) sec.insertAdjacentHTML('beforeend',
    `<div class="wallet-toast">✅ Request sent! Papa will approve your redemption.</div>`);
  setTimeout(() => {
    const t = document.querySelector('.wallet-toast'); if (t) t.remove();
  }, 3500);
}

function walletRenderLedgerRow(row) {
  const icon = { approved: '✅', pending: '⏳', declined: '❌', modified: '✏️' }[row.status] || '·';
  const sign = row.amount > 0 ? '+' : (row.amount < 0 ? '−' : '');
  const abs = Math.abs(row.amount).toLocaleString();
  const amtClass = row.amount > 0 ? 'amt-credit' : (row.amount < 0 ? 'amt-debit' : '');
  const typeLabel = {
    'earn':           'Gym clear',
    'bonus':          'Papa bonus',
    'redeem_request': 'Redemption',
    'adjustment':     'Adjustment',
  }[row.type] || row.type;
  const room = row.room_code ? `Room ${row.room_code}` : '—';
  const when = walletRelTime(row.created_at);
  const noteHTML = row.note ? `<div class="ledger-note">${escapeHTML(row.note)}</div>` : '';
  return `
    <div class="ledger-row status-${row.status}">
      <div class="ledger-icon">${icon}</div>
      <div class="ledger-body">
        <div class="ledger-top">
          <span class="ledger-type">${typeLabel}</span>
          <span class="ledger-amount ${amtClass}">${sign}${abs} 🔮</span>
        </div>
        <div class="ledger-meta">
          <span>${room}</span>
          <span class="meta-sep">·</span>
          <span>${when}</span>
        </div>
        ${noteHTML}
      </div>
    </div>`;
}

function walletRelTime(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0) return '—';
  if (ms < 60_000)         return 'just now';
  if (ms < 3_600_000)      return `${Math.floor(ms/60_000)} min ago`;
  if (ms < 86_400_000)     return `${Math.floor(ms/3_600_000)} hr ago`;
  return `${Math.floor(ms/86_400_000)} days ago`;
}

// ── GYM REVIEW (read-only) ────────────────────────────────────
// Opens when a completed gym is tapped from gym-select. Renders the
// stored per-question record (kid's pick + correct answer per question).
// No timer, no scoring, no abilities, no submit — purely a recap.
//
// Backward-compat: if the save has gymsCompleted but no gymResults entry
// (i.e. completed before this feature shipped), shows a graceful fallback
// banner instead of attempting to draw fresh questions.
function openGymReview(regionId, gymNum) {
  STATE.currentRegion = regionId;
  STATE.currentGym    = gymNum;
  // Ensure no lingering quiz timer ticks under the review screen.
  if (STATE.timerInt) { clearInterval(STATE.timerInt); STATE.timerInt = null; }
  const regionSave = (STATE.save && STATE.save.regions || {})[regionId] || {};
  const results = (regionSave.gymResults || {})[gymNum] || null;
  renderGymReview(regionId, gymNum, results);
  showScreen('screen-gym-review');
}

function renderGymReview(regionId, gymNum, results) {
  const region = REGIONS.find(r => r.id === regionId);
  const titleEl   = document.getElementById('review-title');
  const contentEl = document.getElementById('review-content');
  titleEl.textContent = `${region.emoji} ${region.name} · Gym ${gymNum} — Review`;

  // Fallback for pre-feature saves: gym is in gymsCompleted but the
  // per-question record was never written. Show a friendly notice.
  if (!results || !Array.isArray(results.questions)) {
    contentEl.innerHTML = `
      <div class="review-fallback">
        <div class="review-fallback-icon">📜</div>
        <h3>Gym already cleared</h3>
        <p>This gym was completed before answer-review was turned on,
           so the questions you saw weren't recorded.</p>
        <p>Replay isn't available — but new gyms you finish from now on
           will be fully reviewable here.</p>
        <button class="btn-primary" onclick="showScreen('screen-gym-select')">← Back to Gyms</button>
      </div>`;
    return;
  }

  const correctCount = results.questions.reduce((n, qr) => n + (qr.correct ? 1 : 0), 0);
  const total = results.questions.length;

  const qsHTML = results.questions.map((qr, idx) => {
    const optsHTML = (qr.options || []).map(opt => {
      const isCorrect = opt === qr.answer;
      const isChosen  = qr.chosen === opt;
      let cls = 'review-option';
      let tag = '';
      if (isCorrect && isChosen) { cls += ' is-correct-chosen'; tag = '✅ Your pick (correct)'; }
      else if (isCorrect)        { cls += ' is-correct';        tag = '✅ Correct answer'; }
      else if (isChosen)         { cls += ' is-wrong-chosen';   tag = '❌ Your pick'; }
      return `<div class="${cls}">
        <span class="review-opt-text">${opt}</span>
        ${tag ? `<span class="review-opt-tag">${tag}</span>` : ''}
      </div>`;
    }).join('');

    let verdict, verdictClass;
    if (qr.chosen === null || qr.chosen === undefined) {
      verdict = '⏱ Timed out / skipped'; verdictClass = 'verdict-timeout';
    } else if (qr.correct) {
      verdict = '✅ Correct';             verdictClass = 'verdict-correct';
    } else {
      verdict = '❌ Wrong';                verdictClass = 'verdict-wrong';
    }
    const catLabel  = (typeof CATEGORY_LABELS !== 'undefined' && CATEGORY_LABELS[qr.category]) || qr.category;
    const tierLabel = (typeof TIER_LABELS     !== 'undefined' && TIER_LABELS[qr.tier])         || qr.tier;
    return `
      <div class="review-question">
        <div class="review-q-header">
          <span class="review-q-num">Q${idx+1}</span>
          <span class="review-q-meta">${catLabel} · ${tierLabel}</span>
          <span class="review-q-verdict ${verdictClass}">${verdict}</span>
        </div>
        <div class="review-q-text">${qr.question}</div>
        <div class="review-opts">${optsHTML}</div>
      </div>`;
  }).join('');

  const passText = results.passed ? '🏅 Passed' : '💔 Did not pass';
  contentEl.innerHTML = `
    <div class="review-stats">
      <div class="review-stat-cell"><div class="review-stat-val">${passText}</div></div>
      <div class="review-stat-cell"><div class="review-stat-val">${(results.gymCrystals||0).toLocaleString()} 🔮</div><div class="review-stat-label">Earned</div></div>
      <div class="review-stat-cell"><div class="review-stat-val">${correctCount} / ${total}</div><div class="review-stat-label">Correct</div></div>
    </div>
    <div class="review-note">📖 Read-only — re-entry does NOT earn crystals or use abilities.</div>
    <div class="review-questions">${qsHTML}</div>
    <div class="review-footer">
      <button class="btn-secondary" onclick="showScreen('screen-gym-select')">← Back to Gyms</button>
    </div>`;
}

// ── START GYM ─────────────────────────────────────────────────
async function startGym(regionId, gymId) {
  // 1.6: defensive — never load a gym from an out-of-scope region.
  if (regionId > MAX_PLAYABLE_REGION) { showTestBuildComplete(); return; }
  // Review feature: completed gyms are READ-ONLY. Any code path that
  // reaches startGym for a gym already in gymsCompleted gets redirected
  // to the review screen instead of running the timer/scoring loop.
  const _regSave = (STATE.save && STATE.save.regions || {})[regionId] || {};
  if ((_regSave.gymsCompleted || []).includes(gymId)) {
    openGymReview(regionId, gymId);
    return;
  }
  STATE.currentRegion = regionId;
  STATE.currentGym = gymId;
  STATE.currentQ = 0;
  STATE.gymCrystals = 0;
  STATE.gymCorrect = 0;
  STATE.gymAnswerLog = [];     // review feature: per-question answer log
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

  // UAT bug-fix 1.7-fix-1: draw without replacement through pickQuestion.
  // It also applies the unscramble shuffle (fix-2) at the same time.
  const drawn = [];
  for (const slot of blueprint.slots) {
    const pool = qData.gym_bank?.[slot.category]?.[slot.tier];
    const { picked, bucketEmpty, exhausted } = pickQuestion(pool);
    if (bucketEmpty || !picked) {
      alert(`Empty question bank for ${slot.category} / ${slot.tier}.`);
      return;
    }
    if (exhausted) {
      console.warn(`[startGym] bucket exhausted: ${slot.category}/${slot.tier} — reusing least-recently-seen`);
    }
    markQuestionSeen(picked.id);
    drawn.push(picked);
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
  // 1.5: clear any ability modifiers left over from the previous question.
  STATE.pendingMods = { multiplier: 1, doubleOrNothing: false, retry: false, shield: false };

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
// Phase 1 step 1.5: timer state lives on STATE so abilities can mutate it.
//   STATE.totalTime  — denominator for the bar % (TIME ability bumps both)
//   STATE.timeLeft   — counts down 0.1s per tick (TIME ability bumps it)
//   STATE.timerInt   — interval handle (null when paused by FREEZE)
function startTimer(totalTime, tier) {
  STATE.totalTime = totalTime;
  STATE.timeLeft  = totalTime;
  resumeTimer();
}

function resumeTimer() {
  if (STATE.timerInt) { clearInterval(STATE.timerInt); STATE.timerInt = null; }
  const bar = document.getElementById('timer-bar');
  const txt = document.getElementById('timer-text');
  if (!bar || !txt) return;
  const initPct = Math.max(0, Math.min(100, (STATE.timeLeft / STATE.totalTime) * 100));
  bar.style.width = initPct + '%';
  bar.style.opacity = '';
  bar.className = initPct < 25 ? 'timer-bar danger'
                : initPct < 50 ? 'timer-bar warning'
                :                'timer-bar';

  STATE.timerInt = setInterval(() => {
    STATE.timeLeft = Math.max(0, STATE.timeLeft - 0.1);
    const pct = (STATE.timeLeft / STATE.totalTime) * 100;
    bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
    txt.textContent = Math.ceil(STATE.timeLeft);
    if (pct < 25)      bar.className = 'timer-bar danger';
    else if (pct < 50) bar.className = 'timer-bar warning';
    else               bar.className = 'timer-bar';
    if (STATE.timeLeft <= 0) {
      clearInterval(STATE.timerInt);
      STATE.timerInt = null;
      if (!STATE.answered) timeUp();
    }
  }, 100);
}

// ── CHECK ANSWER ──────────────────────────────────────────────
function checkAnswer(idx) {
  if (STATE.answered) return;

  const q = STATE.currentQData[STATE.currentQ];
  const chosen = STATE.currentChoices[idx];
  const correct = q.answer;
  const correctIdx = STATE.currentChoices.indexOf(correct);
  const region = REGIONS.find(r => r.id === STATE.currentRegion);

  // 1.5: RETRY modifier — if wrong and a retry is pending, consume it and
  // let the player try again. Timer keeps running. The wrong button stays
  // disabled so they can't pick the same one twice.
  if (chosen !== correct && STATE.pendingMods.retry) {
    STATE.pendingMods.retry = false;
    const btn = document.getElementById(`ans${idx}`);
    if (btn) { btn.disabled = true; btn.style.opacity = '0.3'; btn.classList.add('wrong'); }
    const fb = document.getElementById('feedback-bar');
    fb.textContent = `🔁 Not quite — pick another! (1 retry consumed)`;
    fb.className = 'feedback-bar';
    return; // not answered yet
  }

  STATE.answered = true;
  clearInterval(STATE.timerInt);
  STATE.timerInt = null;
  // Review feature: record the kid's final pick for this question (indexed
  // by position so SKIP-gaps remain `undefined` → padded to null at endGym).
  STATE.gymAnswerLog[STATE.currentQ] = chosen;

  // Reveal answers
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`ans${i}`);
    btn.disabled = true;
    if (i === correctIdx) btn.classList.add('correct');
    else btn.classList.add('wrong');
  }

  const fb = document.getElementById('feedback-bar');
  const mods = STATE.pendingMods;
  if (chosen === correct) {
    // Base crystals
    const base = region.baseCrystals;
    const speedBonus = Math.round((STATE.timeLeft / (TIER_TIME[q.tier] + FORMAT_TIME_MOD[q.type] + AGE_TIME_MOD[STATE.player?.ageGroup])) * region.speedMax);
    let earned = base + speedBonus;

    // 1.5: apply DOUBLE_OR_NOTHING (×2 on correct) then MULTIPLY (×value)
    const modParts = [];
    if (mods.doubleOrNothing) { earned *= 2; modParts.push('×2 Double'); }
    if (mods.multiplier && mods.multiplier !== 1) {
      earned = Math.round(earned * mods.multiplier);
      modParts.push(`×${mods.multiplier} Multiply`);
    }

    STATE.gymCrystals += earned;
    STATE.gymCorrect++;
    STATE.save.total_crystals = (STATE.save.total_crystals || 0) + earned;
    STATE.save.total_correct = (STATE.save.total_correct || 0) + 1;

    document.getElementById('quiz-crystals').textContent = STATE.save.total_crystals.toLocaleString();

    fb.textContent = modParts.length
      ? `✅ Correct! +${earned} 🔮  (${modParts.join(' + ')})`
      : `✅ Correct! +${earned} 🔮`;
    fb.className = 'feedback-bar correct';
  } else {
    // 1.5: DOUBLE_OR_NOTHING wrong = 0 crystals (which is the default anyway).
    // SHIELD: noted in the feedback but no scoring change today (no wrong penalties exist).
    const note = mods.shield ? ' 🛡️ Shielded' : '';
    fb.textContent = `❌ Wrong! Answer: ${correct}${note}`;
    fb.className = 'feedback-bar wrong';
  }

  // Consume single-question mods
  STATE.pendingMods = { multiplier: 1, doubleOrNothing: false, retry: false, shield: false };

  // Auto advance after 2s
  setTimeout(() => advanceQuestion(), 2000);
}

function timeUp() {
  STATE.answered = true;
  // Review feature: timed-out questions log as null (no pick).
  STATE.gymAnswerLog[STATE.currentQ] = null;
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

  // Review feature: persist a per-gym results object so completed gyms
  // open in read-only review mode. Written on every attempt (pass or
  // fail) so the most recent run is what gets shown.
  if (!regionSave.gymResults) regionSave.gymResults = {};
  regionSave.gymResults[STATE.currentGym] = {
    passed,
    gymCrystals: STATE.gymCrystals,
    gymCorrect:  STATE.gymCorrect,
    completedAt: new Date().toISOString(),
    questions:   STATE.currentQData.map((q, i) => {
      const chosen = (STATE.gymAnswerLog[i] !== undefined) ? STATE.gymAnswerLog[i] : null;
      return {
        id:       q.id,
        category: q.category,
        tier:     q.tier,
        type:     q.type,
        question: q.question,   // already-scrambled for unscramble
        answer:   q.answer,
        options:  q.options,
        chosen:   chosen,
        correct:  chosen === q.answer,
      };
    }),
  };

  STATE.save.updated_at = new Date().toISOString();

  // Auto-save to Supabase
  await dbSave(STATE.player.id, STATE.save);

  // Crystal-banking: every gym attempt that earned > 0 crystals writes a
  // single 'earn' ledger row, status=approved. The per-question balance
  // updates in checkAnswer already mutated STATE.save.total_crystals, so
  // we record the ledger entry WITHOUT re-bumping the balance to avoid
  // double-counting. The ledger is the audit trail of record.
  if (STATE.gymCrystals > 0 && STATE.player && STATE.player.id) {
    await dbLedgerInsert({
      player_id:  STATE.player.id,
      room_code:  STATE.roomCode || null,
      type:       'earn',
      amount:     STATE.gymCrystals,
      status:     'approved',
      note:       `${region.name} Gym ${STATE.currentGym}${passed ? ' — passed' : ''}`,
      resolved_at: new Date().toISOString(),
    });
  }

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
// Phase 1 step 1.5: generic dispatcher for all 10 mechanics. Each caught
// Pokemon carries abilityEffect = { mechanic, value, description } from
// pokemon.json. The dispatcher reads .mechanic and routes to one of the
// applyAbility_* helpers below. Using an ability consumes the Pokemon
// (removes it from STATE.save.pokemon_team) and is rate-limited to ONE
// per gym via STATE.abilityUsedThisGym.

function activateAbility(pokemonIdx) {
  if (STATE.abilityUsedThisGym) {
    alert('⚠️ You can only use one Pokemon ability per gym!');
    return;
  }
  // 1.5: fixed the original `!STATE.answered === false` double-negative.
  if (STATE.answered) {
    alert('⚠️ Too late — you already answered this question.');
    return;
  }

  const pokemon = STATE.save.pokemon_team[pokemonIdx];
  if (!pokemon) return;
  STATE.pendingAbilityPokemon = { pokemon, idx: pokemonIdx };

  document.getElementById('modal-poke-emoji').textContent  = pokemon.emoji;
  document.getElementById('modal-poke-name').textContent   = pokemon.name;
  document.getElementById('modal-ability-name').textContent = pokemon.ability;
  document.getElementById('modal-ability-desc').textContent = getAbilityDesc(pokemon);

  document.getElementById('modal-confirm-btn').onclick = () => useAbility(pokemonIdx);
  document.getElementById('modal-ability').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-ability').style.display = 'none';
  STATE.pendingAbilityPokemon = null;
}

// Multiplier-value convention in pokemon.json: integers <= 10 mean N×;
// integers >= 11 are encoded as value*10 for fractional multipliers
// (12 → 1.2, 25 → 2.5, 33 → 3.3, etc.).
function normalizeMultiplier(v) {
  const n = Number(v) || 1;
  if (n >= 11) return n / 10;
  return n;
}

async function useAbility(pokemonIdx) {
  closeModal();
  const pokemon = STATE.save.pokemon_team[pokemonIdx];
  if (!pokemon) return;

  const eff = pokemon.abilityEffect || {};
  const mechanic = String(eff.mechanic || '').toUpperCase();
  const value    = Number(eff.value) || 0;

  let resultMsg = '';
  try {
    switch (mechanic) {
      case 'TIME':              resultMsg = applyAbilityTime(value); break;
      case 'ELIMINATE':         resultMsg = applyAbilityEliminate(value); break;
      case 'SKIP':              resultMsg = applyAbilitySkip(); break;
      case 'MULTIPLY':          resultMsg = applyAbilityMultiply(value); break;
      case 'STEAL':             resultMsg = await applyAbilitySteal(value); break;
      case 'FREEZE':            resultMsg = applyAbilityFreeze(value); break;
      case 'REVEAL':            resultMsg = applyAbilityReveal(); break;
      case 'RETRY':             resultMsg = applyAbilityRetry(); break;
      case 'SHIELD':            resultMsg = applyAbilityShield(); break;
      case 'DOUBLE_OR_NOTHING': resultMsg = applyAbilityDoN(value); break;
      default:                  resultMsg = `Unknown ability mechanic: ${mechanic || '(none)'}`;
    }
  } catch (e) {
    console.error('useAbility error:', e);
    resultMsg = `Ability error: ${e.message}`;
  }

  STATE.abilityUsedThisGym = true;

  // Consume the Pokemon
  STATE.save.pokemon_team.splice(pokemonIdx, 1);
  renderPokemonTeam();

  // Show what happened in the feedback bar (SKIP advances the question
  // before this fires, so the bar may already be reset — that's fine).
  const fb = document.getElementById('feedback-bar');
  if (fb && resultMsg) {
    fb.textContent = `${pokemon.emoji} ${pokemon.ability}: ${resultMsg}`;
    fb.className = 'feedback-bar';
  }
}

// ── ABILITY HELPERS (one per mechanic) ────────────────────────

// TIME — add seconds to the live timer. We bump both timeLeft and totalTime
// so the bar percentage stays sane.
function applyAbilityTime(seconds) {
  STATE.timeLeft  += seconds;
  STATE.totalTime += seconds;
  // Visual nudge: re-evaluate the bar at the new fraction
  const bar = document.getElementById('timer-bar');
  if (bar) bar.style.width = Math.min(100, (STATE.timeLeft / STATE.totalTime) * 100) + '%';
  return `+${seconds}s timer (now ${Math.ceil(STATE.timeLeft)}s left)`;
}

// ELIMINATE — grey out N wrong options. Will never remove the correct one.
function applyAbilityEliminate(count) {
  const q = STATE.currentQData[STATE.currentQ];
  const correctIdx = STATE.currentChoices.indexOf(q.answer);
  // Don't strip every wrong option — leave at least one wrong visible so the
  // pick isn't trivially the only un-greyed button when count >= choices-1.
  const maxRemovable = Math.max(0, STATE.currentChoices.length - 2);
  const target = Math.min(count, maxRemovable);
  let removed = 0;
  for (let i = 0; i < 4 && removed < target; i++) {
    const btn = document.getElementById(`ans${i}`);
    if (!btn) continue;
    if (i !== correctIdx && !btn.disabled && btn.style.display !== 'none') {
      btn.style.opacity = '0.15';
      btn.disabled = true;
      removed++;
    }
  }
  return `Eliminated ${removed} wrong option${removed === 1 ? '' : 's'}`;
}

// SKIP — abandon the question with no scoring, advance immediately.
function applyAbilitySkip() {
  clearInterval(STATE.timerInt);
  STATE.timerInt = null;
  STATE.answered = true; // suppress timeUp
  // Visually disable answer buttons so it's clear the player can't click.
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`ans${i}`);
    if (btn) { btn.disabled = true; btn.style.opacity = '0.3'; }
  }
  setTimeout(() => advanceQuestion(), 800);
  return 'Skipping question — no penalty';
}

// MULTIPLY — set a multiplier consumed by the next correct answer.
function applyAbilityMultiply(rawValue) {
  const mult = normalizeMultiplier(rawValue);
  STATE.pendingMods.multiplier = mult;
  return `Next correct answer × ${mult}`;
}

// STEAL — take crystals from the current room leader. Solo no-op.
async function applyAbilitySteal(value) {
  const code = STATE.roomCode || (typeof HOST !== 'undefined' && HOST.roomCode) || '';
  if (!code) return 'No room — solo play, no one to steal from';

  const room = await dbReadRoom(code);
  if (!room) return 'Room not found';

  const myId = STATE.player && STATE.player.id;
  const roomIds = (room.players || []).map(p => p.id).filter(id => id && id !== myId);
  if (roomIds.length === 0) return 'No other players in this room';

  const allSaves = await dbLoadAllPlayers();
  const others = allSaves.filter(s => roomIds.includes(s.player_id));
  if (others.length === 0) return 'No saved data for room players yet';

  others.sort((a, b) => (b.total_crystals || 0) - (a.total_crystals || 0));
  const leader = others[0];
  const available = Math.max(0, leader.total_crystals || 0);
  const amount = Math.min(value, available);
  if (amount <= 0) return `${leader.player_name || 'Leader'} has no crystals to steal`;

  leader.total_crystals = available - amount;
  STATE.save.total_crystals = (STATE.save.total_crystals || 0) + amount;
  await dbSave(leader.player_id, leader);
  await dbSave(STATE.player.id, STATE.save);

  // Crystal-banking audit: pair of 'adjustment' ledger entries so the
  // ledger sum stays equal to the canonical balance for both sides.
  await dbLedgerInsert({
    player_id: leader.player_id, room_code: code,
    type: 'adjustment', amount: -amount, status: 'approved',
    note: `Stolen by ${STATE.player.name || 'player'} (Pokemon ability)`,
    resolved_at: new Date().toISOString(),
  });
  await dbLedgerInsert({
    player_id: STATE.player.id, room_code: code,
    type: 'adjustment', amount: +amount, status: 'approved',
    note: `Stole ${amount} from ${leader.player_name || 'leader'}`,
    resolved_at: new Date().toISOString(),
  });

  const crystEl = document.getElementById('quiz-crystals');
  if (crystEl) crystEl.textContent = STATE.save.total_crystals.toLocaleString();
  return `Stole ${amount} 🔮 from ${leader.player_name || 'leader'}`;
}

// FREEZE — pause the timer interval for N seconds, then resume from the
// frozen value. The bar fades to half-opacity while paused.
function applyAbilityFreeze(seconds) {
  if (!STATE.timerInt) return 'Timer is not running';
  clearInterval(STATE.timerInt);
  STATE.timerInt = null;
  const bar = document.getElementById('timer-bar');
  if (bar) bar.style.opacity = '0.5';

  setTimeout(() => {
    if (STATE.answered) return;  // user answered during the freeze; nothing to resume
    if (bar) bar.style.opacity = '';
    resumeTimer();
  }, Math.max(0, seconds) * 1000);

  return `Timer frozen for ${seconds}s`;
}

// REVEAL — show a hint. We surface the category (the question text already
// shows the question; revealing category narrows the topic).
function applyAbilityReveal() {
  const q = STATE.currentQData[STATE.currentQ];
  if (!q) return 'No active question to reveal';
  const cat = CATEGORY_LABELS[q.category] || q.category;
  const tier = TIER_LABELS[q.tier] || q.tier;
  return `Hint — Category: ${cat}, Tier: ${tier}`;
}

// RETRY — flag the next wrong pick as recoverable. Handled in checkAnswer().
function applyAbilityRetry() {
  STATE.pendingMods.retry = true;
  return 'One retry on this question — wrong picks won\'t end the round';
}

// SHIELD — flag the next wrong answer as protected (no crystal loss). The
// current scoring rules don't deduct on wrong, so this is informational
// today; the modifier is still set so future wrong-penalty rules pick it up.
function applyAbilityShield() {
  STATE.pendingMods.shield = true;
  return 'Shield up — wrong answer won\'t cost crystals';
}

// DOUBLE_OR_NOTHING — modifier consumed by next answer. Correct = ×2 (or
// ×value/10 for values >= 11). Wrong = 0 crystals (no change from default).
function applyAbilityDoN(rawValue) {
  // For starters: dratini value=2 -> 2×; others vary. Normalize like MULTIPLY.
  const mult = normalizeMultiplier(rawValue || 2);
  // We use both flags: DoN suppresses any normal earning AND multiplies.
  // The actual ×mult logic in checkAnswer treats doubleOrNothing as ×2 baseline,
  // and the MULTIPLY mod stacks on top — so wire mult through MULTIPLY too.
  STATE.pendingMods.doubleOrNothing = true;
  STATE.pendingMods.multiplier = mult / 2;  // doubled then × this = × mult overall
  return `Risk: × ${mult} if correct, 0 if wrong`;
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

    // Phase A rejoin: if my stored playerId is already on this room's
    // roster, restore my save and reconnect instead of creating a new
    // player. Same-device only (cross-device rejoin via name matching is
    // out of scope per the agreed plan).
    const storedId = localStorage.getItem('cqc_player_id');
    const isReturning = !!storedId && (room.players || []).some(p => p.id === storedId);
    if (isReturning) {
      const ok = await reconnectExistingPlayer(code, room, storedId);
      if (!ok) { btn.textContent = '🚀 Join Room!'; btn.disabled = false; }
      return;
    }

    // Not a returning player. Game already started? Reject strangers.
    if (room.phase !== 'lobby') {
      err.textContent = `❌ Game already started — only returning players can rejoin.`;
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }
    if ((room.players||[]).length >= 8) {
      err.textContent = '❌ Room is full (8/8)!';
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }

    // Brand-new lobby joiner. Existing fresh-save path.
    const playerId = name.substring(0,2).toUpperCase() + '-' + Math.floor(1000+Math.random()*9000);
    const player = { id: playerId, name, emoji: joinEmoji, ageGroup: joinAge };
    STATE.player   = player;
    STATE.roomCode = code;
    STATE.isHost   = false;

    // Save to localStorage (include room code so the home screen can
    // discover an active multiplayer context if the player navigates away).
    localStorage.setItem('cqc_player_id', playerId);
    localStorage.setItem('cqc_player', JSON.stringify(player));
    localStorage.setItem('cqc_room_code', code);

    // Create save
    const save = newSave(player);
    save.last_seen = new Date().toISOString();
    STATE.save = save;
    await dbSave(playerId, save);

    // Add to room
    if (!room.players) room.players = [];
    room.players.push({ id: playerId, name, emoji: joinEmoji, ageGroup: joinAge });
    await dbWriteRoom(code, room);

    ensureHeartbeat();
    showWaitingLobby(code, room.players, playerId, false);
    startWaitingPoll(code, playerId, false);

  } catch(e) {
    err.textContent = '❌ Error: ' + e.message;
    btn.textContent = '🚀 Join Room!'; btn.disabled = false;
  }
}

// ── PHASE A: reconnect a returning player whose ID is already in the room.
// Restores their full save (crystals, Pokemon, gymsCompleted, gymResults,
// seen-question set) and routes them to the right screen based on the
// current room phase. Never creates a new player object, never overwrites
// the existing save. Returns true on success.
async function reconnectExistingPlayer(code, room, playerId) {
  const err = document.getElementById('join-err');
  // Restore the player's authoritative save from Supabase.
  const save = await dbLoad(playerId);
  if (!save) {
    if (err) {
      err.textContent = `⚠️ Your save couldn't be loaded. Please clear and rejoin as new.`;
    }
    return false;
  }

  // Prefer the localStorage player object (camelCase ageGroup); fall back
  // to reconstituting from save's snake_case fields.
  let player;
  const storedPlayer = localStorage.getItem('cqc_player');
  if (storedPlayer) {
    try { player = JSON.parse(storedPlayer); } catch (_) { player = null; }
  }
  if (!player || player.id !== playerId) {
    player = {
      id:       playerId,
      name:     save.player_name,
      emoji:    save.player_emoji,
      ageGroup: save.age_group,
    };
    localStorage.setItem('cqc_player', JSON.stringify(player));
    localStorage.setItem('cqc_player_id', playerId);
  }
  localStorage.setItem('cqc_room_code', code);

  STATE.player   = player;
  STATE.save     = save;
  STATE.roomCode = code;
  STATE.isHost   = false;

  // Bump heartbeat immediately so the host sees the player rejoined within
  // one dashboard poll.
  STATE.save.last_seen = new Date().toISOString();
  await dbSave(playerId, STATE.save);
  ensureHeartbeat();

  // Route based on the current room phase.
  if (room.phase === 'lobby') {
    showWaitingLobby(code, room.players, playerId, false);
    startWaitingPoll(code, playerId, false);
  } else if (room.phase === 'PREGAME_CATCH'
             && (STATE.save.pokemon_team || []).length === 0) {
    // They never finished the pre-game catch — drop them back into it.
    startPreGameCatch();
  } else {
    // Mid-game (any of GYM_ACTIVE, GYM_COMPLETE, REGION_CATCH, etc.) — send
    // them to the map; their gymsCompleted / current state guides them.
    showMap();
  }
  return true;
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

// ═══════════════════════════════════════════════════════════
// PHASE B — HOST LANDING SCREEN
// ═══════════════════════════════════════════════════════════
// Lists every room with active/archived sections. Reading from rooms
// table never mutates a row. The only writes triggered here are:
//   - Archive / Unarchive (explicit user action)
//   - Auto-archive on GAME_OVER (in hostNextPhase — already wired)
//   - Fresh-room creation (via existing connectHostToRoom)

let _archivedExpanded = false;

function deriveRoomStatus(roomData) {
  const phase = roomData?.phase || 'lobby';
  if (phase === 'GAME_OVER')        return { label: '🏁 Finished',    cls: 'finished'    };
  if (roomData?.isPaused)           return { label: '⏸️ Paused',      cls: 'paused'      };
  if (phase === 'lobby')            return { label: '⏳ Waiting',      cls: 'waiting'     };
  return { label: '🟢 In progress', cls: 'in-progress' };
}

function relTime(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0)    return '—';
  if (ms < 60_000)            return 'just now';
  if (ms < 3_600_000)         return `${Math.floor(ms/60_000)} min ago`;
  if (ms < 86_400_000)        return `${Math.floor(ms/3_600_000)} hr ago`;
  return `${Math.floor(ms/86_400_000)} days ago`;
}

function presenceStatus(lastSeenIso) {
  if (!lastSeenIso) return { label: '⚪ Not yet rejoined', cls: 'absent' };
  const ms = Date.now() - new Date(lastSeenIso).getTime();
  if (isNaN(ms) || ms < 0) return { label: '⚪ Not yet rejoined', cls: 'absent' };
  if (ms < 20_000)         return { label: '🟢 Connected',       cls: 'connected'    };
  if (ms < 60_000)         return { label: '⏳ Reconnecting',     cls: 'reconnecting' };
  return { label: '⚪ Not yet rejoined', cls: 'absent' };
}

async function showHostLanding() {
  HOST.isHost = true;
  // Clear any URL room param so the landing isn't immediately overridden
  // by checkHostMode on a manual refresh — we expose Resume buttons.
  try {
    const url = new URL(location.href);
    url.searchParams.delete('room');
    history.replaceState({}, '', url);
  } catch (_) {}
  showScreen('screen-host-landing');
  await renderHostLanding();
}

async function renderHostLanding() {
  const rows = await dbListRooms();
  // Defend against legacy rows missing the archived flag.
  const norm = rows.map(r => ({
    code:       r.id,
    data:       r.data || {},
    updated_at: r.updated_at || r.data?.updated_at || null,
    archived:   !!(r.data && r.data.archived),
  }));
  const active   = norm.filter(r => !r.archived).slice(0, 15);
  const archived = norm.filter(r =>  r.archived);

  document.getElementById('host-active-count').textContent   = active.length;
  document.getElementById('host-archived-count').textContent = `(${archived.length})`;

  const activeEl   = document.getElementById('host-active-list');
  const archivedEl = document.getElementById('host-archived-list');
  activeEl.innerHTML   = active.length   ? active.map(renderActiveCard).join('')     : '<div class="host-landing-empty">No active games. Create one to start.</div>';
  archivedEl.innerHTML = archived.length ? archived.map(renderArchivedCard).join('') : '<div class="host-landing-empty">No archived games.</div>';

  // Persist expanded state across renders
  archivedEl.style.display = _archivedExpanded ? 'block' : 'none';
  document.getElementById('host-archive-chevron').textContent = _archivedExpanded ? '▼' : '▶';
}

function renderActiveCard(r) {
  const status = deriveRoomStatus(r.data);
  const players = (r.data.players || []).length;
  const updated = relTime(r.updated_at);
  return `
    <div class="game-card">
      <div class="game-card-top">
        <div class="room-code-box" title="Room code">${escapeHTML(r.code)}</div>
        <button class="copy-btn" onclick="landingCopyCode('${escapeAttr(r.code)}')">📋 Copy</button>
      </div>
      <div class="game-card-meta">
        <span class="status-pill status-${status.cls}">${status.label}</span>
        <span class="meta-sep">·</span>
        <span>👥 ${players} player${players === 1 ? '' : 's'}</span>
        <span class="meta-sep">·</span>
        <span>🕒 ${updated}</span>
      </div>
      <div class="game-card-actions">
        <button class="btn-primary" onclick="landingResumeRoom('${escapeAttr(r.code)}')">▶ Resume</button>
        <button class="btn-secondary" onclick="landingArchiveRoom('${escapeAttr(r.code)}')">📥 Archive</button>
      </div>
    </div>`;
}

function renderArchivedCard(r) {
  const status = deriveRoomStatus(r.data);
  const finished = r.data?.phase === 'GAME_OVER';
  const players = (r.data.players || []).length;
  const updated = relTime(r.updated_at);

  if (finished) {
    // Finished games: no Resume, no prominent room code reuse.
    return `
      <div class="game-card archived">
        <div class="game-card-top compact">
          <div class="room-code-box small">${escapeHTML(r.code)}</div>
          <span class="status-pill status-${status.cls}">${status.label}</span>
        </div>
        <div class="game-card-meta">
          <span>👥 ${players}</span>
          <span class="meta-sep">·</span>
          <span>🕒 ${updated}</span>
        </div>
        <div class="game-card-actions">
          <button class="btn-primary" onclick="landingViewResults('${escapeAttr(r.code)}')">📊 View Results</button>
          <button class="btn-secondary" onclick="landingUnarchiveRoom('${escapeAttr(r.code)}')">📤 Unarchive</button>
        </div>
      </div>`;
  }
  // Abandoned (manually archived, not finished). Still resumable — code stays prominent.
  return `
    <div class="game-card archived abandoned">
      <div class="game-card-top">
        <div class="room-code-box">${escapeHTML(r.code)}</div>
        <button class="copy-btn" onclick="landingCopyCode('${escapeAttr(r.code)}')">📋 Copy</button>
      </div>
      <div class="game-card-meta">
        <span class="status-pill status-${status.cls}">${status.label}</span>
        <span class="meta-sep">·</span>
        <span>👥 ${players}</span>
        <span class="meta-sep">·</span>
        <span>🕒 ${updated}</span>
      </div>
      <div class="game-card-actions">
        <button class="btn-primary" onclick="landingResumeRoom('${escapeAttr(r.code)}')">▶ Resume</button>
        <button class="btn-secondary" onclick="landingUnarchiveRoom('${escapeAttr(r.code)}')">📤 Unarchive</button>
      </div>
    </div>`;
}

function landingToggleArchived() {
  _archivedExpanded = !_archivedExpanded;
  const el = document.getElementById('host-archived-list');
  if (el) el.style.display = _archivedExpanded ? 'block' : 'none';
  const chev = document.getElementById('host-archive-chevron');
  if (chev) chev.textContent = _archivedExpanded ? '▼' : '▶';
}

// + Create — show the inline code-entry form within the landing.
function landingShowCreate() {
  const zone = document.getElementById('host-landing-create-zone');
  if (!zone) return;
  zone.innerHTML = `
    <div class="host-landing-create-inline">
      <input type="text" id="landing-room-input" placeholder="Pick a room code (e.g. PAPA2)"
        maxlength="8"
        oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')">
      <div class="host-landing-create-actions">
        <button class="btn-primary" onclick="landingConfirmCreate()">🚀 Create</button>
        <button class="btn-secondary" onclick="renderHostLanding()">Cancel</button>
      </div>
      <div id="landing-create-err" class="err"></div>
    </div>`;
  setTimeout(() => document.getElementById('landing-room-input')?.focus(), 50);
}

async function landingConfirmCreate() {
  const input = document.getElementById('landing-room-input');
  const err   = document.getElementById('landing-create-err');
  const code  = (input?.value || '').trim();
  if (!code) { if (err) err.textContent = '⚠️ Enter a room code'; return; }

  // Reuse the existing fresh-room logic but skip the showHostSetup DOM
  // shim (we render directly).
  const room = {
    code, phase: 'lobby', isPaused: false, archived: false,
    currentRegion: 1, currentGym: 1,
    players: [], pokemonCaught: {},
    hostConnected: true,
    updated_at: new Date().toISOString(),
  };
  await dbWriteRoom(code, room);
  HOST.roomCode  = code;
  HOST.archived  = false;
  STATE.roomCode = code;
  const url = new URL(location.href);
  url.searchParams.set('room', code);
  history.replaceState({}, '', url);
  showWaitingLobby(code, [], 'HOST_VIEWER', true);
  startWaitingPoll(code, 'HOST_VIEWER', true);
}

async function landingResumeRoom(code) {
  // Reconnect the host viewer to an existing room. Reuses the same path
  // as ?host=true&room=CODE — load the latest state from Supabase, then
  // route to either the waiting lobby (if still in lobby phase) or the
  // active dashboard.
  HOST.roomCode = code;
  STATE.roomCode = code;
  const url = new URL(location.href);
  url.searchParams.set('room', code);
  history.replaceState({}, '', url);
  const room = await dbReadRoom(code);
  if (!room) { showToast('Room not found.'); return; }
  if (['PREGAME_CATCH','GYM_ACTIVE','GYM_COMPLETE','REGION_COMPLETE',
       'REGION_CATCH','GAME_OVER','BREAK'].includes(room.phase)) {
    HOST.currentPhase  = room.phase;
    HOST.isPaused      = !!room.isPaused;
    HOST.archived      = !!room.archived;
    HOST.players       = (room.players||[]).filter(p => p.id !== 'HOST_VIEWER');
    HOST.currentRegion = room.currentRegion || 1;
    HOST.currentGym    = room.currentGym || 1;
    HOST.pokemonCaught = room.pokemonCaught || {};
    initHostDashboard();
  } else {
    const players = (room.players||[]).filter(p => p.id !== 'HOST_VIEWER');
    showWaitingLobby(code, players, 'HOST_VIEWER', true);
    startWaitingPoll(code, 'HOST_VIEWER', true);
  }
}

async function landingArchiveRoom(code) {
  const room = await dbReadRoom(code);
  if (!room) return;
  room.archived = true;
  room.updated_at = new Date().toISOString();
  await dbWriteRoom(code, room);
  showToast('Archived ✓');
  await renderHostLanding();
}

async function landingUnarchiveRoom(code) {
  const room = await dbReadRoom(code);
  if (!room) return;
  room.archived = false;
  room.updated_at = new Date().toISOString();
  await dbWriteRoom(code, room);
  showToast('Unarchived ✓');
  await renderHostLanding();
}

async function landingViewResults(code) {
  // Finished rooms — open the host dashboard in read-only-ish form. The
  // existing renderHostDashboard already shows the leaderboard panel
  // when phase === GAME_OVER. We pass through landingResumeRoom which
  // routes correctly.
  await landingResumeRoom(code);
}

function landingCopyCode(code) {
  if (!code) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code)
      .then(() => showToast(`Room code copied: ${code}`))
      .catch(() => showToast(`Code: ${code}`));
  } else {
    showToast(`Code: ${code}`);
  }
}

function copyRoomCodeFromBanner() {
  const code = HOST.roomCode;
  if (code) landingCopyCode(code);
}

// ── Toast ────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('host-landing-toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2200);
}

// ── Small escape helpers (room codes are uppercase alnum, but be safe) ──
function escapeHTML(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(s) {
  return String(s == null ? '' : s).replace(/'/g, "\\'");
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
  archived: false,         // Phase B: surfaces on landing; auto-true on GAME_OVER
  pollInt: null,
  players: [],             // latest from Supabase
  pokemonCaught: {},       // { pokemonId: playerName }
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
          // Room code in URL but no row exists → land on the dashboard
          // (host can pick another room or create from there).
          showHostLanding();
        } else if (['PREGAME_CATCH','GYM_ACTIVE','GYM_COMPLETE',
                    'REGION_COMPLETE','REGION_CATCH','GAME_OVER'].includes(room.phase)) {
          // Game in progress — go to dashboard
          HOST.currentPhase  = room.phase;
          HOST.archived      = !!room.archived;
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
      // Phase B: no ?room= → land on the dashboard with active/archived lists.
      showHostLanding();
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
    archived: false,        // Phase B
    currentRegion: 1,
    currentGym: 1,
    players: [],           // starts empty — no host in player list
    pokemonCaught: {},
    hostConnected: true,
    updated_at: new Date().toISOString()
  };
  await dbWriteRoom(code, room);
  HOST.archived = false;

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
    HOST.archived     = !!room.archived;          // Phase B
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

  // Phase B: persistent room-code banner at the very top.
  const bannerEl = document.getElementById('host-persistent-banner');
  const bannerCode = document.getElementById('hpb-code');
  if (bannerEl && bannerCode) {
    bannerCode.textContent = HOST.roomCode || '----';
    bannerEl.style.display = HOST.roomCode ? 'flex' : 'none';
  }

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
    // Phase B: presence from the 15s heartbeat in save.last_seen
    const presence = presenceStatus(p.last_seen);

    return `
      <div class="host-player-card status-${statusInfo.statusClass}">
        <div class="hpc-emoji">${p.player_emoji || '👤'}</div>
        <div class="hpc-info">
          <div class="hpc-name">${p.player_name || 'Unknown'}</div>
          <div class="hpc-detail">${statusInfo.detail}</div>
          <div class="hpc-detail presence-${presence.cls}" style="margin-top:2px">${presence.label}</div>
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
  // Phase B: auto-archive any room that reaches GAME_OVER.
  if (HOST.currentPhase === 'GAME_OVER') HOST.archived = true;
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
    archived: !!HOST.archived,    // Phase B: write-through
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

  // Crystal-banking: refresh the pending-requests panel on every host poll.
  await renderHostCrystalRequests();
}

// ═══════════════════════════════════════════════════════════
// HOST CRYSTAL-BANKING PANELS
// ═══════════════════════════════════════════════════════════
async function renderHostCrystalRequests() {
  const list = document.getElementById('host-crystal-requests');
  const badge = document.getElementById('host-request-badge');
  if (!list || !badge) return;

  const pending = await dbLedgerPending();
  badge.textContent = pending.length;
  badge.style.display = pending.length > 0 ? 'inline-block' : 'none';

  if (!pending.length) {
    list.innerHTML = '<div class="host-landing-empty">No pending requests.</div>';
    return;
  }

  // Index saves by player_id so we can show names cheaply.
  const nameById = {};
  (HOST.players || []).forEach(s => { if (s && s.player_id) nameById[s.player_id] = s; });

  list.innerHTML = pending.map(r => {
    const who = nameById[r.player_id];
    const playerLabel = who
      ? `${who.player_emoji || '👤'} ${who.player_name || r.player_id}`
      : r.player_id;
    const abs = Math.abs(r.amount);
    const peso = (abs / 100).toFixed(2);
    const when = walletRelTime(r.created_at);
    const noteHTML = r.note ? `<div class="ledger-note">Note: ${escapeHTML(r.note)}</div>` : '';
    return `
      <div class="host-request-card" id="hreq-${escapeAttr(r.id)}">
        <div class="hrq-top">
          <span class="hrq-player">${playerLabel}</span>
          <span class="hrq-pid">${escapeHTML(r.player_id)}</span>
        </div>
        <div class="hrq-amount">−${abs.toLocaleString()} 🔮  <span class="hrq-peso">≈ ₱${peso}</span></div>
        <div class="hrq-meta">
          <span>Room ${escapeHTML(r.room_code || '—')}</span>
          <span class="meta-sep">·</span>
          <span>${when}</span>
        </div>
        ${noteHTML}
        <div class="hrq-actions">
          <button class="btn-primary" onclick="hostApproveRequest('${escapeAttr(r.id)}', ${abs})">✅ Approve</button>
          <button class="btn-secondary" onclick="hostShowModifyRequest('${escapeAttr(r.id)}', ${abs})">✏️ Modify</button>
          <button class="btn-danger" onclick="hostDeclineRequest('${escapeAttr(r.id)}')">❌ Decline</button>
        </div>
        <div id="hreq-modify-${escapeAttr(r.id)}" style="display:none" class="hrq-modify-form"></div>
      </div>`;
  }).join('');
}

async function hostApproveRequest(entryId, originalAmount) {
  // The entry's amount is stored negative (redemption = debit). On approve
  // we keep the same amount, flip status to 'approved', and bump balance.
  const row = await dbLedgerUpdate(entryId, {
    status: 'approved',
    resolved_at: new Date().toISOString(),
  });
  if (!row) { alert('Could not approve.'); return; }
  await dbBumpCrystals(row.player_id, row.amount);     // amount is negative
  showToast(`✅ Approved ${Math.abs(row.amount).toLocaleString()} 🔮 redemption`);
  await renderHostCrystalRequests();
}

function hostShowModifyRequest(entryId, originalAmount) {
  const el = document.getElementById('hreq-modify-' + entryId);
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `
    <div class="hrq-modify-row">
      <label>Revised amount (positive)</label>
      <input type="number" id="hreq-mod-${escapeAttr(entryId)}" min="1" value="${originalAmount}">
    </div>
    <button class="btn-primary" onclick="hostConfirmModifyRequest('${escapeAttr(entryId)}')">Confirm Modify</button>
    <button class="btn-secondary" onclick="document.getElementById('hreq-modify-${escapeAttr(entryId)}').style.display='none'">Cancel</button>
  `;
}

async function hostConfirmModifyRequest(entryId) {
  const inp = document.getElementById('hreq-mod-' + entryId);
  const newAmt = parseInt(inp?.value, 10);
  if (!newAmt || newAmt <= 0) { alert('Enter a positive amount.'); return; }
  const row = await dbLedgerUpdate(entryId, {
    status: 'modified',
    amount: -Math.abs(newAmt),
    resolved_at: new Date().toISOString(),
  });
  if (!row) { alert('Could not modify.'); return; }
  await dbBumpCrystals(row.player_id, row.amount);
  showToast(`✏️ Modified to ${newAmt.toLocaleString()} 🔮`);
  await renderHostCrystalRequests();
}

async function hostDeclineRequest(entryId) {
  const row = await dbLedgerUpdate(entryId, {
    status: 'declined',
    resolved_at: new Date().toISOString(),
  });
  if (!row) { alert('Could not decline.'); return; }
  // No balance change on decline.
  showToast('❌ Request declined');
  await renderHostCrystalRequests();
}

// ── HOST: ADD-CRYSTALS BONUS FORM ────────────────────────────
let _hostAddLookupTimer = null;
async function hostAddCrystalsLookup() {
  if (_hostAddLookupTimer) clearTimeout(_hostAddLookupTimer);
  _hostAddLookupTimer = setTimeout(async () => {
    const pid = document.getElementById('host-add-pid').value.trim();
    const preview = document.getElementById('host-add-preview');
    if (!pid) { preview.textContent = 'Enter a player ID to look up their name.'; return; }
    const save = await dbLookupPlayer(pid);
    if (!save) {
      preview.textContent = '⚠️ No player found with that ID.';
      preview.style.color = 'var(--red)';
      return;
    }
    preview.style.color = '';
    preview.innerHTML = `✓ ${save.player_emoji || '👤'} <b>${escapeHTML(save.player_name || pid)}</b> · balance ${(save.total_crystals||0).toLocaleString()} 🔮`;
  }, 250);
}

async function hostAddCrystals() {
  const err = document.getElementById('host-add-err');
  const pid = document.getElementById('host-add-pid').value.trim();
  const amt = parseInt(document.getElementById('host-add-amount').value, 10);
  const note = document.getElementById('host-add-note').value.trim();
  if (!pid)        { err.textContent = '⚠️ Player ID required'; return; }
  if (!amt || amt <= 0) { err.textContent = '⚠️ Enter a positive amount'; return; }
  if (!note)       { err.textContent = '⚠️ Note is required'; return; }
  err.textContent = '';

  const save = await dbLookupPlayer(pid);
  if (!save) { err.textContent = '⚠️ No player with that ID'; return; }

  // Atomic-ish: write the approved ledger row, then bump the balance.
  await dbLedgerInsert({
    player_id: pid,
    room_code: HOST.roomCode || null,
    type:      'bonus',
    amount:    Math.abs(amt),
    status:    'approved',
    note:      note,
    resolved_at: new Date().toISOString(),
  });
  await dbBumpCrystals(pid, Math.abs(amt));

  showToast(`✅ ${amt.toLocaleString()} 🔮 added to ${save.player_name || pid}`);
  // Clear form
  document.getElementById('host-add-pid').value = '';
  document.getElementById('host-add-amount').value = '';
  document.getElementById('host-add-note').value = '';
  document.getElementById('host-add-preview').textContent = 'Enter a player ID to look up their name.';
  // Refresh the pending list in case this was a follow-up after an approve.
  await renderHostCrystalRequests();
}

// ── PHASE A: PLAYER PRESENCE HEARTBEAT ────────────────────────
// Every 15 seconds while STATE.roomCode is set, the player upserts
// their save with a fresh `last_seen` timestamp. The host's dashboard
// reads this field to render presence ("Connected / Reconnecting /
// Not yet rejoined"). Heartbeat is throttled to avoid hot writes.
const HEARTBEAT_INTERVAL_MS = 15000;
let _heartbeatInt = null;
function ensureHeartbeat() {
  if (_heartbeatInt) return;
  _heartbeatInt = setInterval(async () => {
    if (!STATE.player || !STATE.roomCode || !STATE.save) return;
    // Skip if we're the host viewer (shouldn't write a player save).
    if (typeof HOST !== 'undefined' && HOST.isHost) return;
    STATE.save.last_seen = new Date().toISOString();
    try { await dbSave(STATE.player.id, STATE.save); }
    catch (e) { console.warn('heartbeat write failed:', e); }
  }, HEARTBEAT_INTERVAL_MS);
}
function stopHeartbeat() {
  if (_heartbeatInt) { clearInterval(_heartbeatInt); _heartbeatInt = null; }
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
    // Phase A: try a silent auto-rejoin if localStorage knows who we are
    // AND we're already on this room's roster. Falls through to the join
    // form if no match.
    tryAutoRejoinFromURL(roomParam);
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

  // Phase A: start the heartbeat. The interval no-ops while STATE.roomCode
  // is unset, so it's safe to start once globally.
  ensureHeartbeat();
});

// Phase A: silent auto-rejoin attempt fired from the `?room=CODE` URL path.
// If localStorage holds a player ID that's already in the room's roster,
// we restore their save and skip the join form entirely. If anything fails
// (no localStorage, room missing, no roster match), we leave the join form
// up — the user can manually retry.
async function tryAutoRejoinFromURL(code) {
  const storedId = localStorage.getItem('cqc_player_id');
  if (!storedId) return;
  try {
    const room = await dbReadRoom(code);
    if (!room) return;
    const isOnRoster = (room.players || []).some(p => p.id === storedId);
    if (!isOnRoster) return;
    // Show a small "Reconnecting…" status in the existing banner so the
    // user knows something's happening if there's lag.
    const bc = document.getElementById('join-banner-code');
    if (bc) bc.textContent = `${code} — reconnecting…`;
    const ok = await reconnectExistingPlayer(code, room, storedId);
    if (!ok && bc) bc.textContent = code;  // restore the banner on failure
  } catch (e) {
    console.warn('auto-rejoin failed:', e);
  }
}
