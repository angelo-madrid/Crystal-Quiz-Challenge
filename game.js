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
// PERSISTENT PLAYER IDENTITY (see MIGRATIONS.md 2026-05-22)
// ═══════════════════════════════════════════════════════════
// Each player chooses their own 6-char A-Z0-9 ID at registration.
// The row on player_saves carries name/age/gender at the column level
// and game state inside the data JSONB blob.

const PLAYER_ID_RE = /^[A-Z0-9]{6}$/;
function normalizePlayerId(s) { return String(s || '').trim().toUpperCase(); }
function isValidPlayerId(s)   { return PLAYER_ID_RE.test(normalizePlayerId(s)); }

// Junior 9-11, Senior 12-13 per CLAUDE.md "Players" section.
function ageGroupFromAge(age) { return Number(age) >= 12 ? 'senior' : 'junior'; }

// We still need an emoji for existing renderers (host cards, waiting
// lobby slots, player save shape). Derive from gender so kids don't
// need to pick a separate one.
function emojiFromGender(g) {
  const v = String(g || '').toLowerCase();
  if (v.startsWith('boy'))  return '🦁';
  if (v.startsWith('girl')) return '🦋';
  return '🐲';   // "Prefer not to say" / other
}

// True iff this exact player_id is already on player_saves.
async function dbIsIdTaken(playerId) {
  const id = normalizePlayerId(playerId);
  if (!isValidPlayerId(id)) return false;
  const { data, error } = await sb.from('player_saves')
    .select('player_id').eq('player_id', id).maybeSingle();
  if (error) { console.error('id-check error:', JSON.stringify(error)); return false; }
  return !!data;
}

// Insert a brand-new player_saves row. Includes the identity columns
// (name/age/gender/created_at) and an initial game-state blob in `data`.
// Returns { ok:true, player } on success or { ok:false, reason } on
// duplicate-id / DB error.
async function dbRegisterPlayer({ player_id, name, age, gender }) {
  const id = normalizePlayerId(player_id);
  if (!isValidPlayerId(id)) return { ok:false, reason:'invalid_id' };
  // Build the canonical player object and the initial save blob.
  const player = {
    id, name, age, gender,
    emoji:    emojiFromGender(gender),
    ageGroup: ageGroupFromAge(age),
  };
  const save = newSave(player);
  // Insert via the regular table — fails on duplicate primary key, which
  // we treat as "ID already taken".
  const { error } = await sb.from('player_saves').insert({
    player_id:  id,
    name,
    age,
    gender,
    data:       save,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    if ((error.code || '') === '23505') return { ok:false, reason:'taken' };
    console.error('register error:', JSON.stringify(error));
    return { ok:false, reason:'db_error' };
  }
  return { ok:true, player, save };
}

// Login: read the row by id and return { player, save } or null.
async function dbLoginPlayer(playerId) {
  const id = normalizePlayerId(playerId);
  if (!isValidPlayerId(id)) return null;
  const { data, error } = await sb.from('player_saves')
    .select('player_id, name, age, gender, created_at, data, updated_at')
    .eq('player_id', id).single();
  if (error || !data) return null;
  const player = {
    id:       data.player_id,
    name:     data.name || (data.data && data.data.player_name) || '',
    age:      data.age,
    gender:   data.gender,
    emoji:    (data.data && data.data.player_emoji) || emojiFromGender(data.gender),
    ageGroup: ageGroupFromAge(data.age),
  };
  return { player, save: data.data || newSave(player) };
}

// ═══════════════════════════════════════════════════════════
// CRYSTAL LEDGER (banking layer — see MIGRATIONS.md)
// ═══════════════════════════════════════════════════════════
// Canonical balance rule: player_saves.data.total_crystals is
// authoritative. Mutations to it happen ONLY through approveOrCredit()
// below — which writes a matching crystal_ledger row first, then
// bumps the balance. Pending and declined ledger entries never touch
// the balance.

// Insert a new ledger entry. Returns the inserted row on success, or
// null on failure (logged with [LEDGER WRITE FAILED]). Every caller
// MUST check for null and surface the failure to the user — silent
// failures here would let the kid see a false "Request sent" toast
// while the row never reaches Supabase. Most common cause of null
// return: RLS blocking anon inserts on the crystal_ledger table.
async function dbLedgerInsert(entry) {
  try {
    const { data, error } = await sb.from('crystal_ledger')
      .insert(entry).select().single();
    if (error) {
      console.error('[LEDGER WRITE FAILED]', error, 'entry:', entry);
      return null;
    }
    if (!data) {
      console.error('[LEDGER WRITE FAILED] insert returned no row', 'entry:', entry);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[LEDGER WRITE FAILED]', err, 'entry:', entry);
    return null;
  }
}

// Update an existing ledger entry (typically host approves/declines).
async function dbLedgerUpdate(id, patch) {
  const { data, error } = await sb.from('crystal_ledger')
    .update(patch).eq('id', id).select().single();
  if (error) { console.error('Ledger update error:', JSON.stringify(error)); return null; }
  return data;
}

// List a single player's entries, newest first. Reads ALL statuses
// (approved, pending, declined, modified) — no status filter. The
// player ledger UI shows the kid every entry they ever touched.
async function dbLedgerForPlayer(playerId, limit = 50) {
  const { data, error } = await sb.from('crystal_ledger')
    .select('*').eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('Ledger fetch error:', JSON.stringify(error)); return []; }
  console.log(`[LEDGER CHECK] ${playerId} entries:`, data ? data.length : 0, data);
  return data || [];
}

// List every pending row across all players (host view). Includes
// redeem_request rows (redemption) AND adjustment rows whose note
// starts "Abandon request" (player wants to abandon a room).
async function dbLedgerPending() {
  const { data, error } = await sb.from('crystal_ledger')
    .select('*').eq('status', 'pending')
    .order('created_at', { ascending: true });   // oldest pending first
  if (error) { console.error('[LEDGER PENDING FAILED]', error); return []; }
  const rows = data || [];
  // Split-log so the user can see redemption vs abandon counts clearly.
  const redemptions = rows.filter(r => r.type === 'redeem_request');
  const abandons    = rows.filter(r => r.type === 'adjustment'
                                    && (r.note || '').startsWith('Abandon request'));
  console.log('[CRYSTAL REQUESTS]', { total: rows.length, redemptions, abandons, all: rows });
  console.log('[REDEEM READ] pending requests:', rows.length, rows);
  return rows;
}

// Ledger invariant — sum every approved/modified row for a player and
// compare against the canonical balance on player_saves.data.total_crystals.
// Logs a console.warn on divergence so we can spot drift during UAT.
// Returns the ledger-derived sum (or null on failure).
async function balanceFromLedger(playerId) {
  if (!playerId) return null;
  try {
    const { data, error } = await sb.from('crystal_ledger')
      .select('amount, status')
      .eq('player_id', playerId)
      .in('status', ['approved', 'modified']);
    if (error) { console.error('balanceFromLedger fetch error:', JSON.stringify(error)); return null; }
    const ledgerSum = (data || []).reduce((s, r) => s + (r.amount || 0), 0);
    const save = await dbLoad(playerId);
    const savedBalance = (save && save.total_crystals) || 0;
    if (ledgerSum !== savedBalance) {
      console.warn(`[LEDGER DRIFT] player ${playerId}: ledger=${ledgerSum}, save=${savedBalance}`);
    }
    return ledgerSum;
  } catch (e) {
    console.warn('balanceFromLedger threw:', e);
    return null;
  }
}

// True iff the player has at least one pending redeem_request.
async function dbHasPendingRedemption(playerId) {
  const { data, error } = await sb.from('crystal_ledger')
    .select('id').eq('player_id', playerId)
    .eq('type', 'redeem_request').eq('status', 'pending').limit(1);
  if (error) { console.error('Pending check error:', JSON.stringify(error)); return false; }
  return Array.isArray(data) && data.length > 0;
}

// Look up a player by id. Returns a normalized object combining the
// new column-level identity fields (name/age/gender) with the data
// JSON blob. Host's Add Crystals preview reads name/balance from the
// returned object.
async function dbLookupPlayer(playerId) {
  const id = normalizePlayerId(playerId);
  if (!id) return null;
  const { data, error } = await sb.from('player_saves')
    .select('player_id, name, age, gender, data').eq('player_id', id).maybeSingle();
  if (error || !data) return null;
  const blob = data.data || {};
  return {
    // identity (column-level)
    player_id:    data.player_id,
    name:         data.name || blob.player_name || '',
    age:          data.age,
    gender:       data.gender,
    // legacy aliases for callers that still read save-blob fields
    player_name:  data.name || blob.player_name || data.player_id,
    player_emoji: blob.player_emoji || emojiFromGender(data.gender),
    age_group:    blob.age_group || ageGroupFromAge(data.age),
    total_crystals: blob.total_crystals || 0,
    // raw save for anyone who needs it
    _data: blob,
  };
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

// Cap on simultaneous kids per room — kept in sync with CLAUDE.md
// "Up to 5 kids per game". Drives the waiting-lobby slot grid, the
// "X/5 players joined" counter, and the playerJoin "Room is full" guard.
const MAX_PLAYERS = 5;

// ── PHASE 2: all 10 regions unlocked ─────────────────────────
// The Phase-1 test-build lid is gone — Regions 1-10 are all playable.
// We keep the constant at 10 so any defensive guard that checks
// "regionId > MAX_PLAYABLE_REGION" still short-circuits cleanly past
// the last region (e.g. catch-pool exhaustion fallbacks).
const MAX_PLAYABLE_REGION = 10;

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
  // Persistent-identity: rendering the join screen shows who's logged in.
  if (id === 'screen-join' && typeof refreshJoinIdentityCard === 'function') {
    refreshJoinIdentityCard();
  }
  if (id === 'screen-register' && typeof registerResetState === 'function') {
    // Fresh wizard each visit
    registerResetState();
  }
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

// Legacy createPlayer / continueJourney are gone — the persistent-identity
// system replaces them. Stubs kept so any stale onclick still lands the
// user somewhere sane (the account gate).
async function createPlayer()    { showScreen('screen-account-gate'); }
async function continueJourney() { showScreen('screen-account-gate'); }

// ═══════════════════════════════════════════════════════════
// PERSISTENT-IDENTITY FLOW (registration + login + dashboard)
// ═══════════════════════════════════════════════════════════

// Home → Join a Room routing. If localStorage already has a valid
// player_id, jump straight to the dashboard; otherwise show the gate.
function homeJoinARoom() {
  const stored = localStorage.getItem('cqc_player_id');
  if (stored && isValidPlayerId(stored)) {
    openPlayerDashboard();
  } else {
    showScreen('screen-account-gate');
  }
}

// ── REGISTRATION (4-step wizard + welcome) ───────────────────
let REGISTER_STATE = { name: '', age: 0, gender: '', id: '', idChecked: null /* null|true|false */ };

function registerResetState() {
  REGISTER_STATE = { name: '', age: 0, gender: '', id: '', idChecked: null };
  // Clear any previous form state
  ['reg-name','reg-age','reg-id'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  document.querySelectorAll('#reg-step-3 .age-btn').forEach(b => b.classList.remove('selected'));
  registerShowStep(1);
  const status = document.getElementById('reg-id-status');
  if (status) { status.textContent = 'Pick 6 letters or numbers, then check availability.'; status.className = 'reg-id-status'; }
  const confirmBtn = document.getElementById('reg-confirm-btn');
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.4'; }
}

function registerShowStep(step) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('reg-step-' + i);
    if (el) el.style.display = (i === step) ? 'block' : 'none';
  }
  const welcome = document.getElementById('reg-welcome');
  if (welcome) welcome.style.display = (step === 'welcome') ? 'block' : 'none';
  const progress = document.getElementById('register-progress');
  if (progress) progress.textContent = (step === 'welcome') ? '✓ Complete' : `Step ${step} of 4`;
}

function registerSelectGender(btn) {
  document.querySelectorAll('#reg-step-3 .age-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  REGISTER_STATE.gender = btn.getAttribute('data-gender') || '';
}

function registerNext(fromStep) {
  if (fromStep === 1) {
    const name = (document.getElementById('reg-name').value || '').trim();
    const err = document.getElementById('reg-err-1');
    if (!name) { err.textContent = '⚠️ Enter your name'; return; }
    if (name.length > 32) { err.textContent = '⚠️ Keep it under 32 characters'; return; }
    err.textContent = '';
    REGISTER_STATE.name = name;
    registerShowStep(2);
  } else if (fromStep === 2) {
    const age = parseInt(document.getElementById('reg-age').value, 10);
    const err = document.getElementById('reg-err-2');
    if (!age || age < 9 || age > 13) { err.textContent = '⚠️ Age must be 9 to 13'; return; }
    err.textContent = '';
    REGISTER_STATE.age = age;
    registerShowStep(3);
  } else if (fromStep === 3) {
    const err = document.getElementById('reg-err-3');
    if (!REGISTER_STATE.gender) { err.textContent = '⚠️ Pick one'; return; }
    err.textContent = '';
    registerShowStep(4);
  }
}

function registerIdChanged() {
  // Any keystroke invalidates a prior "available" check
  REGISTER_STATE.id = document.getElementById('reg-id').value;
  REGISTER_STATE.idChecked = null;
  const status = document.getElementById('reg-id-status');
  status.className = 'reg-id-status';
  if (!isValidPlayerId(REGISTER_STATE.id)) {
    status.textContent = `${REGISTER_STATE.id.length} / 6 characters — A–Z and 0–9 only.`;
  } else {
    status.textContent = 'Looks good — tap Check Availability to confirm.';
  }
  const confirmBtn = document.getElementById('reg-confirm-btn');
  confirmBtn.disabled = true;
  confirmBtn.style.opacity = '0.4';
}

async function registerCheckId() {
  const id = normalizePlayerId(document.getElementById('reg-id').value);
  const status = document.getElementById('reg-id-status');
  const err = document.getElementById('reg-err-4');
  err.textContent = '';
  if (!isValidPlayerId(id)) {
    status.textContent = '❌ Must be exactly 6 characters (A–Z, 0–9)';
    status.className = 'reg-id-status reg-id-bad';
    return;
  }
  status.textContent = '⏳ Checking…';
  status.className = 'reg-id-status';
  const taken = await dbIsIdTaken(id);
  if (taken) {
    status.textContent = `❌ ${id} is already taken. Try another.`;
    status.className = 'reg-id-status reg-id-bad';
    REGISTER_STATE.idChecked = false;
    const confirmBtn = document.getElementById('reg-confirm-btn');
    confirmBtn.disabled = true; confirmBtn.style.opacity = '0.4';
    return;
  }
  status.textContent = `✅ ${id} is available!`;
  status.className = 'reg-id-status reg-id-ok';
  REGISTER_STATE.id = id;
  REGISTER_STATE.idChecked = true;
  const confirmBtn = document.getElementById('reg-confirm-btn');
  confirmBtn.disabled = false; confirmBtn.style.opacity = '';
}

async function registerConfirm() {
  const err = document.getElementById('reg-err-4');
  err.textContent = '';
  if (REGISTER_STATE.idChecked !== true) { err.textContent = '⚠️ Tap Check Availability first'; return; }
  const result = await dbRegisterPlayer({
    player_id: REGISTER_STATE.id,
    name:      REGISTER_STATE.name,
    age:       REGISTER_STATE.age,
    gender:    REGISTER_STATE.gender,
  });
  if (!result.ok) {
    if (result.reason === 'taken') {
      err.textContent = '⚠️ Someone grabbed that ID a moment ago. Pick another.';
      REGISTER_STATE.idChecked = false;
      const confirmBtn = document.getElementById('reg-confirm-btn');
      confirmBtn.disabled = true; confirmBtn.style.opacity = '0.4';
      return;
    }
    err.textContent = '❌ Could not create account. ' + (result.reason || '');
    return;
  }
  // Persist identity to localStorage and STATE.
  STATE.player = result.player;
  STATE.save   = result.save;
  localStorage.setItem('cqc_player_id', result.player.id);
  localStorage.setItem('cqc_player',    JSON.stringify(result.player));
  // Welcome screen
  document.getElementById('welcome-emoji').textContent = result.player.emoji || '🎉';
  document.getElementById('welcome-greeting').textContent = `Welcome, ${result.player.name}!`;
  document.getElementById('welcome-id').textContent = result.player.id;
  registerShowStep('welcome');
}

async function dashboardFromRegister() {
  openPlayerDashboard();
}

// ── LOGIN ────────────────────────────────────────────────────
async function loginSubmit() {
  const id = normalizePlayerId(document.getElementById('login-id').value);
  const err = document.getElementById('login-err');
  err.textContent = '';
  if (!isValidPlayerId(id)) { err.textContent = '⚠️ ID must be exactly 6 characters (A–Z, 0–9)'; return; }
  const result = await dbLoginPlayer(id);
  if (!result) { err.textContent = '❌ No account with that ID. Tap Back to register.'; return; }
  STATE.player = result.player;
  STATE.save   = result.save;
  localStorage.setItem('cqc_player_id', result.player.id);
  localStorage.setItem('cqc_player',    JSON.stringify(result.player));
  openPlayerDashboard();
}

// ═══════════════════════════════════════════════════════════
// PLAYER DASHBOARD — three-column landscape layout
// ═══════════════════════════════════════════════════════════
// Replaces the legacy single-column dashboard. The three columns:
//   Col 1 — Game Rooms (Active / Pending / Archived) + Join form
//   Col 2 — Crystal Wallet (balance, redeem form, filtered ledger)
//   Col 3 — My Journey (top gym scores, all Pokemon, broadcast)
// Auto-rejoin from ?room=CODE lands here with the URL's room
// highlighted in Active.
let _dashboardHighlightRoom = null;

const PLAYER_UI = {
  archivedExpanded: false,
  ledgerFilter: 'all',           // 'all' | 'earned' | 'redeemed'
  ledgerLimit: 10,
  pollInt: null,
  ledgerCache: [],
  showAllScores: false,
  abandonOpenFor: null,          // room code with abandon confirmation visible
};

async function openPlayerDashboard() {
  if (!STATE.player) { showScreen('screen-home'); return; }
  // Reset transient UI state on every entry (so a fresh login doesn't
  // inherit a stale "show all scores" toggle, etc.).
  PLAYER_UI.archivedExpanded = false;
  PLAYER_UI.ledgerFilter     = 'all';
  PLAYER_UI.ledgerLimit      = 10;
  PLAYER_UI.showAllScores    = false;
  PLAYER_UI.abandonOpenFor   = null;
  showScreen('screen-player-dashboard');
  await renderPlayerDashboard();
  pdcStartPoll();
}

function pdcStartPoll() {
  if (PLAYER_UI.pollInt) clearInterval(PLAYER_UI.pollInt);
  PLAYER_UI.pollInt = setInterval(() => {
    if (document.querySelector('.screen.active')?.id === 'screen-player-dashboard') {
      renderPlayerDashboard();
    }
  }, 15000);
}
function pdcStopPoll() {
  if (PLAYER_UI.pollInt) { clearInterval(PLAYER_UI.pollInt); PLAYER_UI.pollInt = null; }
}

async function renderPlayerDashboard() {
  const player = STATE.player;
  if (!player) return;
  // Refresh authoritative save (host bonuses, abandon approvals, etc.).
  const fresh = await dbLoad(player.id);
  if (fresh) STATE.save = fresh;

  // Diagnostic — log the canonical balance and trigger a balance-vs-
  // ledger drift check on every dashboard mount. If the player has
  // pre-ledger crystals (saves predating the ledger layer), the drift
  // warning makes it visible immediately.
  console.log('[SAVE CHECK]', player.id, 'crystals:', (STATE.save && STATE.save.total_crystals) || 0);
  balanceFromLedger(player.id);

  pdcRenderHeader();
  await Promise.all([
    pdcRenderCol1Rooms(),
    pdcRenderCol2Wallet(),
    pdcRenderCol3Journey(),
  ]);
}

// ── HEADER ───────────────────────────────────────────────────
function pdcRenderHeader() {
  const p = STATE.player;
  if (!p) return;
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  const band = ageGroupFromAge(p.age);
  document.getElementById('pdc-h-emoji').textContent = p.emoji || '👤';
  document.getElementById('pdc-h-id').textContent    = p.id;
  document.getElementById('pdc-h-name').textContent  = p.name;
  document.getElementById('pdc-h-band').textContent  = band === 'junior' ? '🌱 Junior' : '⚡ Senior';
  document.getElementById('pdc-h-balance').textContent = balance.toLocaleString();
}

// ── COLUMN 1 — GAME ROOMS ────────────────────────────────────
async function pdcRenderCol1Rooms() {
  const player = STATE.player;
  if (!player) return;
  const allRooms = await dbListRooms();
  // Saves carry an `abandoned_rooms` array of room codes the player
  // has abandoned (host-approved). Treat those as Archived/Abandoned.
  const abandoned = new Set((STATE.save && STATE.save.abandoned_rooms) || []);
  // Pending abandon-request room codes (from crystal_ledger).
  const myPending = await dbLedgerForPlayer(player.id, 100);
  const pendingAbandons = new Set(
    myPending.filter(r => r.status === 'pending'
        && r.type === 'adjustment'
        && (r.note || '').startsWith('Abandon request'))
      .map(r => r.room_code)
  );

  const mine = allRooms.filter(r =>
    (r.data?.players || []).some(p => p.id === player.id)
  );
  const active = mine.filter(r =>
    !r.data?.archived && r.data?.phase !== 'GAME_OVER' && r.data?.phase !== 'lobby'
    && !abandoned.has(r.id));
  const pending = mine.filter(r =>
    !r.data?.archived && r.data?.phase === 'lobby'
    && !abandoned.has(r.id));
  const archived = mine.filter(r =>
    r.data?.archived || r.data?.phase === 'GAME_OVER' || abandoned.has(r.id));

  document.getElementById('pdc-active-count').textContent   = active.length;
  document.getElementById('pdc-pending-count').textContent  = pending.length;
  document.getElementById('pdc-archived-count').textContent = archived.length;

  const activeEl   = document.getElementById('pdc-active-list');
  const pendingEl  = document.getElementById('pdc-pending-list');
  const archivedEl = document.getElementById('pdc-archived-list');

  activeEl.innerHTML = active.length
    ? active.map(r => pdcRoomCard(r, 'active', pendingAbandons.has(r.id))).join('')
    : '<div class="pdc-empty">No active games — wait for Papa to create one! 🎮</div>';
  pendingEl.innerHTML = pending.length
    ? pending.map(r => pdcRoomCard(r, 'pending', pendingAbandons.has(r.id))).join('')
    : '<div class="pdc-empty">No pending games.</div>';
  archivedEl.innerHTML = archived.length
    ? archived.map(r => pdcRoomCard(r, 'archived', false, abandoned.has(r.id))).join('')
    : '<div class="pdc-empty">No past games yet.</div>';

  archivedEl.style.display = PLAYER_UI.archivedExpanded ? 'flex' : 'none';
  document.getElementById('pdc-archived-chevron').textContent = PLAYER_UI.archivedExpanded ? '▼' : '▶';
}

function pdcRoomCard(r, type, hasPendingAbandon, isAbandonedArchive) {
  const code = r.id;
  const data = r.data || {};
  const status = deriveRoomStatus(data);
  const region = REGIONS.find(x => x.id === data.currentRegion) || REGIONS[0];
  const isHighlight = (_dashboardHighlightRoom && _dashboardHighlightRoom === code);

  // Per-player stats in this room — pull from STATE.save which is the
  // player's global save (gym progress is per-region/gym, not per-room).
  const myBadges = countBadgesForRoom(code);
  const myCaught = pokemonCaughtInRoom(code);
  const myCrystals = crystalsEarnedInRoom(code);

  if (type === 'archived') {
    const subtype = isAbandonedArchive ? 'abandoned' : 'finished';
    const pill = isAbandonedArchive ? '🗄️ Abandoned' : '🏁 Finished';
    const regionLabel = data.currentRegion
      ? `${region.emoji} ${region.name} reached`
      : 'No regions completed';
    return `
      <div class="pdc-room-card archived">
        <div class="pdc-rc-top">
          <div class="pdc-rc-code">${escapeHTML(code)}</div>
          <span class="pdc-archived-pill ${subtype}">${pill}</span>
        </div>
        <div class="pdc-rc-region">${regionLabel}</div>
        <div class="pdc-rc-stats">
          <div class="pdc-rc-stat-row">💎 ${myCrystals.toLocaleString()} crystals earned</div>
          <div class="pdc-rc-stat-row">🏅 ${myBadges} badges earned</div>
        </div>
      </div>`;
  }

  const phaseLabel = (type === 'pending')
    ? '⏳ Waiting'
    : (data.isPaused ? '⏸️ Paused' : '🟢 Playing');
  const regionInfo = (type === 'pending')
    ? '<div class="pdc-rc-region">Lobby — waiting for Papa to start</div>'
    : `<div class="pdc-rc-region">${region.emoji} ${region.name} · Gym ${data.currentGym || 1}/5</div>`;

  const pokeNames = myCaught.length
    ? myCaught.slice(0, 3).map(pk => `${pk.emoji} ${escapeHTML(pk.name)}`).join(', ')
        + (myCaught.length > 3 ? ` +${myCaught.length - 3} more` : '')
    : 'None yet';

  const resumeLabel = (type === 'pending') ? '▶️ Open Lobby' : '▶️ Resume';

  // Abandon UI state per card
  let abandonBlock = '';
  if (hasPendingAbandon) {
    abandonBlock = `
      <div class="pdc-abandon-pending">
        ⏳ Abandon request sent to Papa. Waiting for approval…
      </div>`;
  } else if (PLAYER_UI.abandonOpenFor === code) {
    abandonBlock = `
      <div class="pdc-abandon-inline">
        Send abandon request to Papa?<br>
        <span style="opacity:0.75;font-size:0.78rem">You won't be able to rejoin this room.</span>
        <div class="pdc-abandon-actions">
          <button class="btn-danger" style="flex:1;padding:7px;font-size:0.82rem" onclick="pdcConfirmAbandon('${escapeAttr(code)}')">Yes, Send Request</button>
          <button class="btn-secondary" style="flex:1;padding:7px;font-size:0.82rem" onclick="pdcCancelAbandon()">Cancel</button>
        </div>
      </div>`;
  }

  const resumeBtn = hasPendingAbandon
    ? `<button class="btn-primary" disabled style="flex:1;opacity:0.45">${resumeLabel}</button>`
    : `<button class="btn-primary" onclick="pdcResumeRoom('${escapeAttr(code)}')">${resumeLabel}</button>`;

  const moreBtn = hasPendingAbandon
    ? `<button class="btn-secondary" onclick="pdcOpenRoomDetail('${escapeAttr(code)}')">📋 Details</button>`
    : `<button class="btn-secondary" onclick="pdcToggleMore('${escapeAttr(code)}')">··· More</button>`;

  let moreMenu = '';
  if (PLAYER_UI.moreOpenFor === code && !hasPendingAbandon) {
    moreMenu = `
      <div class="pdc-more-dropdown" id="pdc-more-${escapeAttr(code)}">
        <button onclick="pdcOpenRoomDetail('${escapeAttr(code)}')">📋 View Room Details</button>
        <button onclick="pdcRequestAbandon('${escapeAttr(code)}')">🚪 Abandon Room</button>
      </div>`;
  }

  return `
    <div class="pdc-room-card ${isHighlight ? 'highlight' : ''}">
      <div class="pdc-rc-top">
        <div class="pdc-rc-code">${escapeHTML(code)}</div>
        <span class="status-pill status-${status.cls}">${phaseLabel}</span>
      </div>
      ${regionInfo}
      ${type === 'active' ? `
        <div class="pdc-rc-stats">
          <div class="pdc-rc-stat-row">
            🏅 Badges:
            <div class="pdc-rc-bar-wrap"><div class="pdc-rc-bar" style="width:${Math.min(100, myBadges * 10)}%"></div></div>
            <span style="font-family:var(--font-mono);font-weight:900">${myBadges}/10</span>
          </div>
          <div class="pdc-rc-stat-row">🐾 Caught: <span style="font-size:0.78rem;opacity:0.85">${pokeNames}</span></div>
          <div class="pdc-rc-stat-row">💎 Earned: <span style="font-family:var(--font-mono);font-weight:900;color:var(--crystal)">${myCrystals.toLocaleString()}</span></div>
        </div>` : ''}
      ${abandonBlock}
      <div class="pdc-rc-actions">${resumeBtn}${moreBtn}</div>
      ${moreMenu}
    </div>`;
}

// Helpers — aggregate per-room stats from the player's global save
function countBadgesForRoom(_code) {
  // Saves don't yet track which room earned which badge, so report the
  // global badge count. Same data is fine because saves are per-player,
  // not per-room — playing in multiple rooms still uses one save.
  return (STATE.save && STATE.save.badges_earned) || 0;
}
function pokemonCaughtInRoom(code) {
  const team = (STATE.save && STATE.save.pokemon_team) || [];
  if (!code) return team;
  // If pokemon entries carry a roomCode, filter by it; else fall back
  // to the whole team.
  const tagged = team.filter(p => p.roomCode === code);
  return tagged.length ? tagged : team;
}
function crystalsEarnedInRoom(code) {
  // Sum all approved/modified earn+adjustment rows scoped to this room.
  const rows = (PLAYER_UI.ledgerCache || []);
  return rows
    .filter(r => r.room_code === code
              && (r.status === 'approved' || r.status === 'modified')
              && (r.type === 'earn' || r.type === 'bonus'))
    .reduce((sum, r) => sum + (r.amount || 0), 0);
}

// ── COLUMN 1 actions ─────────────────────────────────────────
function pdcShowJoinForm() {
  const zone = document.getElementById('pdc-join-zone');
  zone.innerHTML = `
    <div class="pdc-join-inline">
      <input type="text" id="pdc-join-code" placeholder="ROOM CODE" maxlength="8"
        oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')">
      <div class="pdc-join-inline-actions">
        <button class="btn-primary" onclick="pdcDoJoin()">Join</button>
        <button class="btn-secondary" onclick="pdcResetJoinZone()">Cancel</button>
      </div>
      <div class="pdc-join-err" id="pdc-join-err"></div>
    </div>`;
  setTimeout(() => document.getElementById('pdc-join-code')?.focus(), 50);
}
function pdcResetJoinZone() {
  document.getElementById('pdc-join-zone').innerHTML =
    `<button class="btn-primary" onclick="pdcShowJoinForm()">＋ Join a Room</button>`;
}
async function pdcDoJoin() {
  const code = (document.getElementById('pdc-join-code')?.value || '').trim().toUpperCase();
  if (!code) {
    const e = document.getElementById('pdc-join-err');
    if (e) e.textContent = '⚠️ Enter a room code';
    return;
  }
  // Mirror screen-join's hidden input so the existing playerJoin path
  // works without changes.
  const hidden = document.getElementById('join-code');
  if (hidden) hidden.value = code;
  // Ensure the join-err target is present (playerJoin writes to it).
  // playerJoin will navigate to the right next screen on success.
  await playerJoin();
}

async function pdcResumeRoom(code) {
  // Pre-fill the join screen's hidden code field, then route through the
  // existing playerJoin flow (which handles roster-match → reconnect or
  // fresh join, plus the locked-room guard).
  const hidden = document.getElementById('join-code');
  if (hidden) hidden.value = code;
  await playerJoin();
}

function pdcToggleMore(code) {
  PLAYER_UI.moreOpenFor = (PLAYER_UI.moreOpenFor === code) ? null : code;
  pdcRenderCol1Rooms();
}
function pdcRequestAbandon(code) {
  PLAYER_UI.abandonOpenFor = code;
  PLAYER_UI.moreOpenFor    = null;
  pdcRenderCol1Rooms();
}
function pdcCancelAbandon() {
  PLAYER_UI.abandonOpenFor = null;
  pdcRenderCol1Rooms();
}
async function pdcConfirmAbandon(code) {
  if (!STATE.player) return;
  await dbLedgerInsert({
    player_id:  STATE.player.id,
    room_code:  code,
    type:       'adjustment',
    amount:     0,
    status:     'pending',
    note:       'Abandon request — awaiting host approval',
    resolved_at: null,
  });
  PLAYER_UI.abandonOpenFor = null;
  showToast(`🚪 Abandon request sent for ${code}`);
  await renderPlayerDashboard();
}

// ── COLUMN 1 — Room Detail Overlay (player, read-only) ──────
async function pdcOpenRoomDetail(code) {
  PLAYER_UI.moreOpenFor = null;
  const room = await dbReadRoom(code);
  if (!room) { showToast('⚠️ Room not found'); return; }
  document.getElementById('pdc-rd-code').textContent = code;
  const status = deriveRoomStatus(room);
  const statusEl = document.getElementById('pdc-rd-status');
  statusEl.className = `status-pill status-${status.cls}`;
  statusEl.textContent = status.label;

  // Region progress R1..R10
  const progress = REGIONS.map(r => {
    let cls = 'rd-progress-pill';
    let icon = '○';
    if (r.id < room.currentRegion) { cls += ' done'; icon = '✅'; }
    else if (r.id === room.currentRegion) { cls += ' active'; icon = '🔄'; }
    return `<span class="${cls}">${icon} R${r.id}</span>`;
  }).join('');
  document.getElementById('pdc-rd-progress').innerHTML = progress;

  const myBadges = countBadgesForRoom(code);
  const myCaught = pokemonCaughtInRoom(code);
  const myCrystals = crystalsEarnedInRoom(code);
  document.getElementById('pdc-rd-stats').innerHTML = `
    <div class="pdc-rc-stats">
      <div class="pdc-rc-stat-row">🏅 Badges earned: <b>${myBadges}/10</b></div>
      <div class="pdc-rc-stat-row">🐾 Pokemon caught: <b>${myCaught.length}</b></div>
      <div class="pdc-rc-stat-row">💎 Crystals earned: <b style="color:var(--crystal);font-family:var(--font-mono)">${myCrystals.toLocaleString()}</b></div>
    </div>`;
  document.getElementById('pdc-room-detail-overlay').style.display = 'flex';
}
function pdcCloseRoomDetail() {
  document.getElementById('pdc-room-detail-overlay').style.display = 'none';
}
function pdcRoomDetailMaybeClose(e) {
  if (e.target.classList.contains('modal-overlay')) pdcCloseRoomDetail();
}

function pdcToggleArchived() {
  PLAYER_UI.archivedExpanded = !PLAYER_UI.archivedExpanded;
  pdcRenderCol1Rooms();
}

// ── COLUMN 2 — CRYSTAL WALLET ────────────────────────────────
async function pdcRenderCol2Wallet() {
  const player = STATE.player;
  if (!player) return;
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  document.getElementById('pdc-balance-big').textContent = balance.toLocaleString();
  document.getElementById('pdc-peso').textContent = (balance / 100).toFixed(2);

  // Redeem button — disabled while a redemption is already pending
  const hasPending = await dbHasPendingRedemption(player.id);
  const zone = document.getElementById('pdc-redeem-zone');
  if (hasPending) {
    // Find the pending amount for display
    const pendings = await dbLedgerForPlayer(player.id, 50);
    const p = pendings.find(r => r.type === 'redeem_request' && r.status === 'pending');
    const amt = p ? Math.abs(p.amount) : 0;
    zone.innerHTML = `
      <div class="pdc-redeem-pending">
        ⏳ Redemption pending — ${amt.toLocaleString()} 💎
      </div>`;
  } else {
    zone.innerHTML = `<button class="btn-primary" id="pdc-redeem-toggle" onclick="pdcShowRedeemForm()">🎁 Redeem Crystals</button>`;
  }

  // Ledger
  PLAYER_UI.ledgerCache = await dbLedgerForPlayer(player.id, 200);
  pdcRenderLedger();
}

function pdcRenderLedger() {
  const all = PLAYER_UI.ledgerCache || [];
  const f = PLAYER_UI.ledgerFilter;
  const filtered = all.filter(r => {
    if (f === 'all') return true;
    if (f === 'earned')   return r.type === 'earn' || r.type === 'bonus';
    if (f === 'redeemed') return r.type === 'redeem_request';
    return true;
  });
  const limit = PLAYER_UI.ledgerLimit;
  const visible = filtered.slice(0, limit);
  const list = document.getElementById('pdc-ledger-list');
  if (!visible.length) {
    list.innerHTML = '<div class="pdc-empty">No entries yet.</div>';
  } else {
    list.innerHTML = visible.map(pdcLedgerRow).join('');
  }
  const more = document.getElementById('pdc-ledger-more');
  more.style.display = (filtered.length > limit) ? 'block' : 'none';
}

function pdcLedgerRow(row) {
  const icon = { approved: '✅', pending: '⏳', declined: '❌', modified: '✏️' }[row.status] || '·';
  const sign = row.amount > 0 ? '+' : (row.amount < 0 ? '−' : '');
  const abs = Math.abs(row.amount).toLocaleString();
  const amtCls = row.amount > 0 ? 'amt-credit' : (row.amount < 0 ? 'amt-debit' : '');
  let label;
  if (row.type === 'earn') {
    label = (row.note && row.note.includes('Gym')) ? escapeHTML(row.note) : `Gym clear — ${row.note ? escapeHTML(row.note) : ''}`;
  } else if (row.type === 'bonus')          label = 'Papa bonus';
    else if (row.type === 'redeem_request') label = 'Redemption request';
    else if (row.type === 'adjustment')     label = (row.note && row.note.startsWith('Abandon')) ? 'Abandon request' : (row.note && row.note.startsWith('Broadcast')) ? 'Broadcast' : 'Adjustment';
    else label = row.type;
  const room = row.room_code ? escapeHTML(row.room_code) : '—';
  const when = walletRelTime(row.created_at);
  const note = (row.note && row.type !== 'adjustment') ? `<span class="pdc-ledger-note">${escapeHTML(row.note)}</span>` : '';
  return `
    <div class="pdc-ledger-row status-${row.status}">
      <div>${icon}</div>
      <div class="pdc-ledger-label">${label}</div>
      <div class="pdc-ledger-amt ${amtCls}">${sign}${abs} 💎</div>
      <div class="pdc-ledger-sub">
        <span>${room}</span>
        <span>·</span>
        <span>${when}</span>
        ${note}
      </div>
    </div>`;
}

function pdcSetLedgerFilter(f) {
  PLAYER_UI.ledgerFilter = f;
  PLAYER_UI.ledgerLimit  = 10;
  ['all', 'earned', 'redeemed'].forEach(k => {
    const el = document.getElementById('pdc-tab-' + k);
    if (el) el.classList.toggle('active', k === f);
  });
  pdcRenderLedger();
}
function pdcShowMoreLedger() {
  PLAYER_UI.ledgerLimit += 10;
  pdcRenderLedger();
}

function pdcShowRedeemForm() {
  const player = STATE.player;
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  const zone = document.getElementById('pdc-redeem-zone');
  zone.innerHTML = `
    <div class="pdc-redeem-form">
      <label>Amount (max ${balance.toLocaleString()})</label>
      <input type="number" id="pdc-redeem-amount" min="1" max="${balance}" placeholder="e.g. 500">
      <label>Note (optional)</label>
      <input type="text" id="pdc-redeem-note" maxlength="80" placeholder="e.g. end of day payout">
      <div class="pdc-join-err" id="pdc-redeem-err"></div>
      <div class="pdc-redeem-actions">
        <button class="btn-primary" onclick="pdcSubmitRedeem()">Submit Request</button>
        <button class="btn-secondary" onclick="pdcRenderCol2Wallet()">Cancel</button>
      </div>
    </div>`;
  setTimeout(() => document.getElementById('pdc-redeem-amount')?.focus(), 50);
}
async function pdcSubmitRedeem() {
  const player = STATE.player;
  if (!player) return;
  const err = document.getElementById('pdc-redeem-err');
  const amount = parseInt(document.getElementById('pdc-redeem-amount').value, 10);
  const note   = document.getElementById('pdc-redeem-note').value.trim();
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  if (!amount || amount <= 0) { if(err) err.textContent = '⚠️ Enter an amount > 0'; return; }
  if (amount > balance)       { if(err) err.textContent = `⚠️ You only have ${balance.toLocaleString()} 💎`; return; }
  const already = await dbHasPendingRedemption(player.id);
  if (already) { await pdcRenderCol2Wallet(); return; }
  const ledgerRow = {
    player_id:  player.id,
    room_code:  STATE.roomCode || null,
    type:       'redeem_request',
    amount:     -Math.abs(amount),
    status:     'pending',
    note:       note || '',
    resolved_at: null,
  };
  const inserted = await dbLedgerInsert(ledgerRow);
  if (!inserted) {
    // Insert failed (RLS, schema mismatch, network). Surface the
    // error to the player — DO NOT show the success confirmation.
    console.error('[REDEEM WRITE] INSERT FAILED', ledgerRow);
    if (err) err.textContent = '❌ Could not send request — check console and ask Papa to retry.';
    return;
  }
  console.log('[REDEEM WRITE]', inserted);
  // Inline confirmation block; refresh after a beat.
  const zone = document.getElementById('pdc-redeem-zone');
  zone.innerHTML = `<div class="pdc-redeem-confirm">✅ Request sent! Papa will approve your redemption.</div>`;
  setTimeout(() => pdcRenderCol2Wallet(), 1800);
}

// ── COLUMN 3 — MY JOURNEY ────────────────────────────────────
async function pdcRenderCol3Journey() {
  pdcRenderTopScores();
  await pdcRenderPokemonTeam();
  await pdcRenderBroadcastSection();
}

function pdcRenderTopScores() {
  const save = STATE.save || {};
  const regions = save.regions || {};
  // Flatten every gymResults entry across every region this player
  // has touched, regardless of room.
  const flat = [];
  for (const rid of Object.keys(regions)) {
    const region = REGIONS.find(r => r.id === parseInt(rid, 10));
    const results = (regions[rid] && regions[rid].gymResults) || {};
    for (const gid of Object.keys(results)) {
      const res = results[gid] || {};
      flat.push({
        region: region || { id: parseInt(rid,10), name: `R${rid}` },
        gym:    parseInt(gid, 10),
        crystals:    res.gymCrystals || 0,
        correct:     res.gymCorrect  || 0,
        speedBonus:  res.speedBonus  || 0,
        roomCode:    res.roomCode    || null,
        completedAt: res.completedAt || null,
      });
    }
  }
  flat.sort((a,b) => (b.crystals - a.crystals) || ((b.correct||0) - (a.correct||0)));

  const container = document.getElementById('pdc-top-scores');
  if (!flat.length) {
    container.innerHTML = `<div class="pdc-empty">No gym scores yet — start playing to see your bests! 🎮</div>`;
    document.getElementById('pdc-show-all-scores').style.display = 'none';
    return;
  }
  const top = PLAYER_UI.showAllScores ? flat : flat.slice(0, 3);
  container.innerHTML = top.map((s, i) => {
    const medal = (PLAYER_UI.showAllScores)
      ? (i < 3 ? ['🥇','🥈','🥉'][i] : (i + 1))
      : ['🥇','🥈','🥉'][i] || '·';
    const sb = s.speedBonus ? `<span> · ⚡ Speed bonus: +${s.speedBonus}</span>` : '';
    const room = s.roomCode ? `Room ${escapeHTML(s.roomCode)}` : 'Unknown room';
    const when = s.completedAt ? walletRelTime(s.completedAt) : '';
    return `
      <div class="pdc-score-card">
        <div class="pdc-score-medal">${medal}</div>
        <div class="pdc-score-title">${escapeHTML(s.region.name)} · Gym ${s.gym}</div>
        <div class="pdc-score-stats">${s.correct}/10 · 💎 ${s.crystals.toLocaleString()}</div>
        <div class="pdc-score-sub">${room} · ${when}${sb}</div>
      </div>`;
  }).join('');
  const btn = document.getElementById('pdc-show-all-scores');
  if (flat.length > 3) {
    btn.style.display = 'block';
    btn.textContent = PLAYER_UI.showAllScores ? 'Show top 3 ▲' : `Show all ${flat.length} scores ▼`;
  } else {
    btn.style.display = 'none';
  }
}
function pdcToggleAllScores() {
  PLAYER_UI.showAllScores = !PLAYER_UI.showAllScores;
  pdcRenderTopScores();
}

async function pdcRenderPokemonTeam() {
  const team = (STATE.save && STATE.save.pokemon_team) || [];
  const container = document.getElementById('pdc-pokemon-team');
  if (!team.length) {
    container.innerHTML = `<div class="pdc-empty">No Pokemon caught yet — catch your first in the pre-game! 🎮</div>`;
    return;
  }
  const ORDER = ['legendary', 'super', 'rare', 'common'];
  const LABEL = { legendary:'👑 Legendary', super:'🌟 Super Rare', rare:'💎 Rare', common:'⬜ Common' };
  const groups = {};
  for (const p of team) {
    const rarity = (p.rarity || 'common').toLowerCase();
    if (!groups[rarity]) groups[rarity] = [];
    groups[rarity].push(p);
  }
  container.innerHTML = ORDER.filter(r => groups[r]).map(r => {
    const rows = groups[r].map(p => `
      <div class="pdc-pokemon-row">
        <span class="pdc-poke-emoji">${p.emoji || '🐾'}</span>
        <span class="pdc-poke-name">${escapeHTML(p.name || '?')}</span>
        <span class="pdc-poke-rarity ${r}">${(p.rarity || 'common').toUpperCase()}</span>
        ${p.roomCode ? `<span class="pdc-poke-room">${escapeHTML(p.roomCode)}</span>` : ''}
      </div>`).join('');
    return `
      <div class="pdc-pokemon-group">
        <div class="pdc-pokemon-group-label">${LABEL[r] || r}</div>
        ${rows}
      </div>`;
  }).join('');
}

async function pdcRenderBroadcastSection() {
  const player = STATE.player;
  if (!player) return;
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  const after = Math.max(0, balance - 10);
  document.getElementById('pdc-broadcast-after-val').textContent = after.toLocaleString();
  // Has any active room?
  const allRooms = await dbListRooms();
  const activeMine = allRooms.find(r =>
    (r.data?.players || []).some(p => p.id === player.id)
    && !r.data?.archived && r.data?.phase !== 'GAME_OVER' && r.data?.phase !== 'lobby');
  PLAYER_UI.broadcastRoomCode = activeMine ? activeMine.id : null;
  pdcBroadcastValidate();
}

function pdcBroadcastValidate() {
  const txt = (document.getElementById('pdc-broadcast-text')?.value || '').trim();
  const charEl = document.getElementById('pdc-broadcast-char');
  if (charEl) charEl.textContent = txt.length;
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  const warn = document.getElementById('pdc-broadcast-warn');
  const btn  = document.getElementById('pdc-broadcast-send');
  let ok = true, msg = '';
  if (!PLAYER_UI.broadcastRoomCode) { ok = false; msg = '⚠️ Join an active room to broadcast'; }
  else if (balance < 10)            { ok = false; msg = '⚠️ You need at least 10 crystals to broadcast'; }
  else if (!txt)                    { ok = false; msg = ''; }
  if (warn) warn.textContent = msg;
  if (btn)  { btn.disabled = !ok; btn.style.opacity = ok ? '' : '0.4'; }
}

async function pdcSendBroadcast() {
  const player = STATE.player;
  if (!player) return;
  const txtEl = document.getElementById('pdc-broadcast-text');
  const text = (txtEl?.value || '').trim();
  const code = PLAYER_UI.broadcastRoomCode;
  if (!text || !code) return;
  const balance = (STATE.save && STATE.save.total_crystals) || 0;
  if (balance < 10) { showToast('⚠️ Not enough crystals'); return; }

  // Deduct 10 from total_crystals (canonical balance).
  await dbBumpCrystals(player.id, -10);
  // Refresh local save so the header updates immediately.
  const fresh = await dbLoad(player.id);
  if (fresh) STATE.save = fresh;

  // Audit row.
  await dbLedgerInsert({
    player_id:  player.id,
    room_code:  code,
    type:       'adjustment',
    amount:     -10,
    status:     'approved',
    note:       `Broadcast: ${text}`,
    resolved_at: new Date().toISOString(),
  });

  // Push to recipients via room.announcement (existing pipeline).
  const room = await dbReadRoom(code);
  if (room) {
    room.announcement = {
      text: `${player.name}: ${text}`,
      ts:   new Date().toISOString(),
      source: player.id,
    };
    room.updated_at = new Date().toISOString();
    await dbWriteRoom(code, room);
  }

  if (txtEl) txtEl.value = '';
  showToast('📢 Message sent!');
  balanceFromLedger(player.id);
  await renderPlayerDashboard();
}

// ── LOG OUT ──────────────────────────────────────────────────
function pdcLogout() {
  localStorage.removeItem('cqc_player_id');
  localStorage.removeItem('cqc_player');
  localStorage.removeItem('cqc_player_name');
  localStorage.removeItem('cqc_room_code');
  STATE.player = null;
  STATE.save   = null;
  STATE.roomCode = null;
  _dashboardHighlightRoom = null;
  pdcStopPoll();
  showScreen('screen-home');
}

// Legacy aliases retained so any pre-existing onclick references still
// land somewhere sane.
async function renderPlayerDashboard_legacy() { return renderPlayerDashboard(); }
function dashboardLogout() { return pdcLogout(); }
async function playerDashboardOpenRoom(code)  { return pdcResumeRoom(code); }

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
    const newPokemon = { ...poke, level: 1, caughtAt: 'pregame', roomCode: STATE.roomCode || null };
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
  // Defensive — Regions go 1..10. Anything past the lid is a logic bug,
  // not a soft lock; bail with a warning and route back to the map.
  if (regionId > MAX_PLAYABLE_REGION) {
    console.warn(`[startRegionalCatch] regionId ${regionId} out of range`);
    showMap();
    return;
  }
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
    balanceFromLedger(STATE.player.id);
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
    const newPokemon = {
      ...target,
      level: 1,
      caughtAt: `region${s.region.id}`,
      roomCode: STATE.roomCode || null,  // for the player-dashboard "caught in" tag
    };
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

  // Phase 2: all 10 regions are playable. If the player just cleared the
  // final region's last gym, flip the room to GAME_OVER (which auto-
  // archives via the host's hostNextPhase wiring) and route to the prize
  // screen / map for now. No more test-build lid.
  const justFinished = REGIONAL_CATCH_STATE && REGIONAL_CATCH_STATE.region;
  const fullyClearedRegion = justFinished
    && ((STATE.save.regions || {})[justFinished.id]?.gymsCompleted || []).length >= 5;
  if (fullyClearedRegion && justFinished.id >= MAX_PLAYABLE_REGION) {
    // Mark the room GAME_OVER so the host dashboard buckets it as Finished.
    const code = STATE.roomCode;
    if (code) {
      const room = await dbReadRoom(code);
      if (room && room.phase !== 'GAME_OVER') {
        room.phase = 'GAME_OVER';
        room.archived = true;
        room.updated_at = new Date().toISOString();
        await dbWriteRoom(code, room);
      }
    }
    showFinalCompleteScreen();
    return;
  }

  showMap();
}

// ── FINAL COMPLETE (Region 10 cleared) ────────────────────────
// Routed to from finishRegionalCatch when the kid clears Region 10's
// final gym. Used to be the Phase-1 test-build lid; Phase 2 repurposes
// it as the legitimate end-of-game screen.
function showFinalCompleteScreen() {
  if (STATE.timerInt) { clearInterval(STATE.timerInt); STATE.timerInt = null; }
  if (REGIONAL_CATCH_STATE && REGIONAL_CATCH_STATE.timerInt) {
    clearInterval(REGIONAL_CATCH_STATE.timerInt);
    REGIONAL_CATCH_STATE.timerInt = null;
  }
  showScreen('screen-test-build-complete');
}
// Legacy alias so any pre-Phase-2 call sites keep working.
function showTestBuildComplete() { return showFinalCompleteScreen(); }

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
    // Phase 2: all 10 regions are unlocked. The only soft-lock left is
    // sequential progression — Region N is locked until Region N-1 is
    // fully cleared (all 5 gyms). The test-build "coming soon" tier is
    // gone.
    const isLocked = idx > 0
      && ((save.regions || {})[REGIONS[idx-1].id]?.gymsCompleted || []).length < 5;
    const isCompleted = gymsCompleted >= 5;

    const card = document.createElement('div');
    const classes = ['region-card'];
    if (isLocked) classes.push('locked');
    if (isCompleted) classes.push('completed');
    card.className = classes.join(' ');

    const statusText = isCompleted  ? '✅ Complete'
                     : isLocked     ? '🔒 Locked'
                     :                '▶ In Progress';
    const statusIcon = isCompleted  ? '✅'
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

  const ledgerRow = {
    player_id:  player.id,
    room_code:  STATE.roomCode || null,
    type:       'redeem_request',
    amount:     -Math.abs(amount),
    status:     'pending',
    note:       note || '',
    resolved_at: null,
  };
  const inserted = await dbLedgerInsert(ledgerRow);
  if (!inserted) {
    console.error('[REDEEM WRITE] INSERT FAILED', ledgerRow);
    if (err) err.textContent = '❌ Could not send request — check console and ask Papa to retry.';
    return;
  }
  console.log('[REDEEM WRITE]', inserted);
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
  // Defensive — Regions go 1..10. Anything past the lid is a logic bug.
  if (regionId > MAX_PLAYABLE_REGION) {
    console.warn(`[startGym] regionId ${regionId} out of range`);
    showMap();
    return;
  }
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
  // Lock the canonical question time limit. The TIME ability mutates
  // STATE.timeLeft + STATE.totalTime to give the player a safety buffer,
  // but the speed-bonus denominator in checkAnswer reads originalTimeLimit
  // — so TIME can only buy seconds, never inflate crystal earnings.
  STATE.originalTimeLimit = totalTime;
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
    // Base crystals — speed bonus is capped to STATE.originalTimeLimit so
    // the TIME ability buys safety only, never inflates earnings.
    const base = region.baseCrystals;
    const denom = STATE.originalTimeLimit
      || (TIER_TIME[q.tier] + FORMAT_TIME_MOD[q.type] + AGE_TIME_MOD[STATE.player?.ageGroup]);
    // Clamp timeLeft to the original limit — if TIME ability pushed timeLeft
    // beyond the original window, the surplus does not earn extra bonus.
    const effectiveTimeLeft = Math.min(STATE.timeLeft, denom);
    const speedBonus = Math.round((effectiveTimeLeft / denom) * region.speedMax);
    const baseEarned = base + speedBonus;
    let earned = baseEarned;

    // 1.5: apply DOUBLE_OR_NOTHING (×2 on correct) then MULTIPLY (×value)
    const modParts = [];
    const usedDoN = !!mods.doubleOrNothing;
    const usedMult = mods.multiplier && mods.multiplier !== 1;
    if (usedDoN)  { earned *= 2; modParts.push('×2 Double'); }
    if (usedMult) { earned = Math.round(earned * mods.multiplier); modParts.push(`×${mods.multiplier} Multiply`); }

    STATE.gymCrystals += earned;
    STATE.gymCorrect++;
    STATE.save.total_crystals = (STATE.save.total_crystals || 0) + earned;
    STATE.save.total_correct = (STATE.save.total_correct || 0) + 1;

    document.getElementById('quiz-crystals').textContent = STATE.save.total_crystals.toLocaleString();

    fb.textContent = modParts.length
      ? `✅ Correct! +${earned} 🔮  (${modParts.join(' + ')})`
      : `✅ Correct! +${earned} 🔮`;
    fb.className = 'feedback-bar correct';

    // Crystal-banking audit: write 'adjustment' ledger rows for the
    // EXTRA crystals contributed by modifier abilities (on top of the
    // base earn row that endGym writes for the full gym total). This
    // gives players a per-ability history without double-counting —
    // amount here is the delta the modifier added, not the full earned.
    if (STATE.player && STATE.player.id && (usedDoN || usedMult)) {
      const code = STATE.roomCode || null;
      // Reconstruct the deltas in the same order the multipliers stack.
      let runningBase = baseEarned;
      if (usedDoN) {
        const donDelta = runningBase;  // doubled = added one full base
        runningBase *= 2;
        dbLedgerInsert({
          player_id: STATE.player.id, room_code: code,
          type: 'adjustment', amount: +donDelta, status: 'approved',
          note: `DOUBLE_OR_NOTHING — won`,
          resolved_at: new Date().toISOString(),
        }).then(() => balanceFromLedger(STATE.player.id));
      }
      if (usedMult) {
        const after = Math.round(runningBase * mods.multiplier);
        const multDelta = after - runningBase;
        if (multDelta !== 0) {
          dbLedgerInsert({
            player_id: STATE.player.id, room_code: code,
            type: 'adjustment', amount: +multDelta, status: 'approved',
            note: `MULTIPLY ability used`,
            resolved_at: new Date().toISOString(),
          }).then(() => balanceFromLedger(STATE.player.id));
        }
      }
    }
  } else {
    // 1.5: DOUBLE_OR_NOTHING wrong = 0 crystals (which is the default anyway).
    // SHIELD: noted in the feedback but no scoring change today (no wrong penalties exist).
    const note = mods.shield ? ' 🛡️ Shielded' : '';
    fb.textContent = `❌ Wrong! Answer: ${correct}${note}`;
    fb.className = 'feedback-bar wrong';
    // DOUBLE_OR_NOTHING — even a "lose" outcome writes an audit row so
    // the ledger reflects the risked attempt. amount=0 keeps the canonical
    // balance unchanged. Only fired when the player explicitly used DoN.
    if (mods.doubleOrNothing && STATE.player && STATE.player.id) {
      dbLedgerInsert({
        player_id: STATE.player.id, room_code: STATE.roomCode || null,
        type: 'adjustment', amount: 0, status: 'approved',
        note: `DOUBLE_OR_NOTHING — lost`,
        resolved_at: new Date().toISOString(),
      }).then(() => balanceFromLedger(STATE.player.id));
    }
  }

  // Consume single-question mods
  STATE.pendingMods = { multiplier: 1, doubleOrNothing: false, retry: false, shield: false };

  // Auto advance after 2s
  setTimeout(() => advanceQuestion(), 2000);
}

function timeUp() {
  // Defensive guard — if the host paused the room between the interval
  // firing and this function running, don't penalize the player. The
  // pause poll (checkPauseState) clears STATE.timerInt and restarts on
  // resume, but a lone tick can still slip through; swallow it.
  if (STATE.paused) return;
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
    roomCode:    STATE.roomCode || null,  // for the player-dashboard "Room CODE" tag
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

  // Crystal-banking: every gym attempt writes an 'earn' ledger row,
  // status=approved. Earned > 0 → labeled with crystal amount + region.
  // Earned 0 (gym fail with no correct answers) → amount=0 row, kept
  // so the audit shows every attempt. The per-question balance updates
  // in checkAnswer already mutated STATE.save.total_crystals, so we
  // record the ledger entry WITHOUT re-bumping the balance.
  if (STATE.player && STATE.player.id) {
    const verdict = passed ? 'passed' : (STATE.gymCrystals > 0 ? 'partial' : 'failed');
    await dbLedgerInsert({
      player_id:  STATE.player.id,
      room_code:  STATE.roomCode || null,
      type:       'earn',
      amount:     STATE.gymCrystals,
      status:     'approved',
      note:       `Gym ${STATE.currentGym} ${verdict} · ${region.name}`,
      resolved_at: new Date().toISOString(),
    });
    balanceFromLedger(STATE.player.id);
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
// (totalTime drives the visible bar percentage) but DO NOT touch
// STATE.originalTimeLimit — that's the canonical denominator the speed
// bonus reads in checkAnswer, so TIME ability only buys safety, never
// extra crystals.
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

  // Invariant check on both sides.
  balanceFromLedger(leader.player_id);
  balanceFromLedger(STATE.player.id);

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

// ── PLAYER JOIN — identity-aware (post-persistent-identity rewrite) ──
// The player's identity (id, name, emoji, age, gender) is established
// at registration/login and lives in STATE.player + localStorage. This
// function ONLY needs a room code from the form. It dispatches:
//   - returning player (id already on the roster) → reconnectExistingPlayer
//   - lobby phase + space available + not a stranger → add to room
//   - everything else → friendly rejection
async function playerJoin() {
  const code = (document.getElementById('join-code').value || '').trim().toUpperCase();
  const err  = document.getElementById('join-err');
  const btn  = document.getElementById('join-btn');

  // Identity guard: the persistent-identity flow must have happened first.
  const storedId = localStorage.getItem('cqc_player_id');
  if (!STATE.player || !storedId || !isValidPlayerId(storedId)) {
    if (err) err.textContent = '⚠️ Log in or create an account first.';
    showScreen('screen-account-gate');
    return;
  }

  if (!code) { err.textContent = '⚠️ Enter the room code!'; return; }

  btn.textContent = '⏳ Joining…'; btn.disabled = true; err.textContent = '';

  try {
    const room = await dbReadRoom(code);
    if (!room) {
      err.textContent = `❌ Room "${code}" not found. Ask Papa for the right code.`;
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }

    // Returning player — already on this room's roster.
    const isReturning = (room.players || []).some(p => p.id === storedId);
    if (isReturning) {
      const ok = await reconnectExistingPlayer(code, room, storedId);
      if (!ok) { btn.textContent = '🚀 Join Room!'; btn.disabled = false; }
      return;
    }

    // Fresh joiner — must be lobby phase.
    if (room.phase !== 'lobby') {
      err.textContent = `❌ Game already started — only returning players can rejoin.`;
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }
    // Room Lock — host has frozen new joiners. Returning players (handled
    // above) bypass this; only first-time joiners are rejected.
    if (room.locked) {
      err.textContent = '🔒 Room is locked — ask Papa to open it before joining.';
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }
    if ((room.players||[]).length >= MAX_PLAYERS) {
      err.textContent = `❌ Room is full (${MAX_PLAYERS}/${MAX_PLAYERS})!`;
      btn.textContent = '🚀 Join Room!'; btn.disabled = false; return;
    }

    // Add the logged-in player to the room. No fresh save — their save
    // already exists from registration/login.
    STATE.roomCode = code;
    STATE.isHost   = false;
    localStorage.setItem('cqc_room_code', code);

    // Ensure save loaded (refresh from Supabase in case of stale local copy).
    if (!STATE.save) {
      STATE.save = await dbLoad(storedId) || newSave(STATE.player);
    }
    STATE.save.last_seen = new Date().toISOString();
    await dbSave(storedId, STATE.save);

    if (!room.players) room.players = [];
    room.players.push({
      id:       STATE.player.id,
      name:     STATE.player.name,
      emoji:    STATE.player.emoji,
      ageGroup: STATE.player.ageGroup,
    });
    await dbWriteRoom(code, room);

    ensureHeartbeat();
    showWaitingLobby(code, room.players, storedId, false);
    startWaitingPoll(code, storedId, false);

  } catch(e) {
    err.textContent = '❌ Error: ' + (e && e.message ? e.message : e);
    btn.textContent = '🚀 Join Room!'; btn.disabled = false;
  }
}

// Render the "you're logged in as" card inside screen-join. Called when
// the screen activates.
function refreshJoinIdentityCard() {
  const el = document.getElementById('join-identity-card');
  if (!el) return;
  if (!STATE.player) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="join-identity-line">
      <span class="join-identity-emoji">${STATE.player.emoji || '👤'}</span>
      <div>
        <div class="join-identity-name">${escapeHTML(STATE.player.name)}</div>
        <div class="join-identity-id">${escapeHTML(STATE.player.id)}</div>
      </div>
    </div>`;
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
  for (let i = 0; i < MAX_PLAYERS; i++) {
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
      // Scoped entry — Papa opened ?host=true&room=CODE. Bind HOST.* to
      // that room and land on the three-column dashboard (Column 3
      // controls that specific room).
      HOST.roomCode  = roomCode;
      STATE.roomCode = roomCode;
      dbReadRoom(roomCode).then(room => {
        if (room) {
          HOST.currentPhase  = room.phase || 'lobby';
          HOST.archived      = !!room.archived;
          HOST.isPaused      = !!room.isPaused;
          HOST.locked        = !!room.locked;
          HOST.players       = (room.players || []).filter(p => p.id !== 'HOST_VIEWER');
          HOST.pokemonCaught = room.pokemonCaught || {};
          HOST.currentRegion = room.currentRegion || 1;
          HOST.currentGym    = room.currentGym || 1;
        }
        // Always land on the three-column dashboard — whether the
        // ?room=CODE row exists or not. The renderer handles "no
        // active room" gracefully.
        initHostDashboard();
      });
    } else {
      // Unscoped entry — Papa opened ?host=true with no room. Skip
      // screen-host-landing and go straight to the three-column
      // dashboard. Column 1 shows all rooms, Column 2 shows all
      // accounts, Column 3 auto-targets the most-recently-active
      // non-archived room.
      HOST.roomCode = null;
      STATE.roomCode = null;
      showHostDashboardUnscoped();
    }
    return true;
  }
  return false;
}

// Land on the three-column dashboard with no specific room binding.
// renderCol1Rooms() discovers the most-recently-updated non-archived
// room and writes it to HOST_UI.activeRoomCode for Column 3 to scope to.
async function showHostDashboardUnscoped() {
  HOST.isHost = true;
  // Clear any stale URL ?room= so a refresh doesn't accidentally
  // re-scope. We're intentionally global here.
  try {
    const url = new URL(location.href);
    url.searchParams.delete('room');
    history.replaceState({}, '', url);
  } catch (_) {}
  // Reset scoped fields so col 3 doesn't display stale data from a
  // previous in-memory state.
  HOST.currentPhase = null; HOST.isPaused = false;
  HOST.archived = false;    HOST.locked = false;
  HOST.players  = [];       HOST.pokemonCaught = {};
  HOST.currentRegion = 1;   HOST.currentGym = 1;
  showScreen('screen-host');
  renderHostDashboard();
  startHostPoll();
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

// ═══════════════════════════════════════════════════════════
// HOST DASHBOARD — three-column landscape layout
// ═══════════════════════════════════════════════════════════
// The legacy single-column renderHostDashboard has been replaced by
// the three column renderers below. They reuse all existing handlers
// (hostNextPhase, hostTogglePause, dbBumpCrystals, etc.) — only the
// presentation surface changed.

// State scoped to the new dashboard layout
const HOST_UI = {
  activeRoomCode: null,        // most-recently-active non-archived non-GAME_OVER room
  activeRoomCodes: [],         // every truly-active room code (used by the banner to validate HOST.roomCode)
  archivedExpanded: false,     // Column 1 archived rooms section
  archivedAccountsExpanded: false,
  searchTerm: '',
  detailRoomCode: null,        // currently-open Room Detail Overlay
  ledgerModalPid: null,        // currently-open ledger modal
  uiPollInt: null,             // 15s slow poll for the 3-col data
};

async function renderHostDashboard() {
  // Render Column 1 first so HOST_UI.activeRoomCode is populated by the
  // time the banner and Column 3 read it. Columns 2/3 are independent of
  // col1's side-effects so they can fire concurrently.
  await renderCol1Rooms();
  await Promise.all([renderCol2Accounts(), renderCol3Controls()]);

  // Persistent banner — shows ONLY when an active (non-archived,
  // non-GAME_OVER) room exists. If Papa opened ?host=true&room=CODE
  // we honour that code only when the room is still active; otherwise
  // we fall back to renderCol1Rooms's most-recent active candidate.
  // No active room → banner fully hidden (display: none, no empty space).
  const bannerEl   = document.getElementById('host-persistent-banner');
  const bannerCode = document.getElementById('hpb-code');
  const activeSet  = HOST_UI.activeRoomCodes || [];
  const scopedOk   = HOST.roomCode && activeSet.includes(HOST.roomCode);
  const code = scopedOk ? HOST.roomCode : (HOST_UI.activeRoomCode || null);
  if (bannerEl && bannerCode) {
    if (code) {
      bannerCode.textContent = code;
      bannerEl.style.display = 'flex';
    } else {
      bannerEl.style.display = 'none';
    }
  }
}

// ═══════════════════════════════════════════════════════════
// COLUMN 1 — ROOMS
// ═══════════════════════════════════════════════════════════
async function renderCol1Rooms() {
  const rooms = await dbListRooms();
  const norm = rooms.map(r => ({
    code: r.id, data: r.data || {}, updated_at: r.updated_at,
    archived: !!(r.data && r.data.archived),
  }));
  // Bucketing — non-overlapping per design call we surfaced to the user.
  const live = norm.filter(r =>
    !r.archived && r.data.phase !== 'lobby' && r.data.phase !== 'GAME_OVER');
  const waiting  = norm.filter(r => !r.archived && r.data.phase === 'lobby');
  const archived = norm.filter(r =>  r.archived || r.data.phase === 'GAME_OVER');

  document.getElementById('col1-live-count').textContent     = live.length;
  document.getElementById('col1-waiting-count').textContent  = waiting.length;
  document.getElementById('col1-archived-count').textContent = archived.length;

  const renderList = (list, type) => list.length
    ? list.map(r => col1RoomCard(r, type)).join('')
    : `<div class="col1-empty">No ${type} rooms.</div>`;
  document.getElementById('col1-live-list').innerHTML     = renderList(live,     'live');
  document.getElementById('col1-waiting-list').innerHTML  = renderList(waiting,  'waiting');
  document.getElementById('col1-archived-list').innerHTML = renderList(archived, 'archived');

  // Track the active room set — non-archived AND not finished (GAME_OVER
  // rooms are read-only / archived in spirit and must NOT light up the
  // banner). dbListRooms returns rows ordered by updated_at desc so the
  // first candidate is the most-recently-active.
  const candidates = norm.filter(r => !r.archived && r.data.phase !== 'GAME_OVER');
  HOST_UI.activeRoomCode  = candidates.length ? candidates[0].code : null;
  HOST_UI.activeRoomCodes = candidates.map(c => c.code);
}

function col1RoomCard(r, type) {
  const status = deriveRoomStatus(r.data);
  const playerCount = (r.data.players || []).length;
  const region = REGIONS.find(x => x.id === r.data.currentRegion) || REGIONS[0];
  return `
    <div class="room-card-mini">
      <div class="rcm-top">
        <div class="rcm-code">${escapeHTML(r.code)}</div>
        <span class="status-pill status-${status.cls}">${status.label}</span>
      </div>
      <div class="rcm-meta">
        <span>👥 ${playerCount} player${playerCount === 1 ? '' : 's'}</span>
        <span class="meta-sep">·</span>
        <span>${region.emoji} ${region.name} · Gym ${r.data.currentGym || 1}/5</span>
        <span class="meta-sep">·</span>
        <span>🕒 ${relTime(r.updated_at)}</span>
      </div>
      <div class="rcm-actions">
        <button class="btn-secondary" onclick="openRoomDetail('${escapeAttr(r.code)}')">View →</button>
        ${type === 'archived' ? `<button class="btn-secondary" onclick="col1UnarchiveRoom('${escapeAttr(r.code)}')">📤 Unarchive</button>` : ''}
      </div>
    </div>`;
}

function col1ToggleArchived() {
  HOST_UI.archivedExpanded = !HOST_UI.archivedExpanded;
  document.getElementById('col1-archived-list').style.display = HOST_UI.archivedExpanded ? 'block' : 'none';
  document.getElementById('col1-archived-chevron').textContent = HOST_UI.archivedExpanded ? '▼' : '▶';
}

function col1ShowCreateForm() {
  const zone = document.getElementById('host-col1-create');
  zone.innerHTML = `
    <input type="text" id="col1-create-input" placeholder="e.g. GAME1" maxlength="8"
      style="width:100%;padding:10px;font-family:var(--font-mono);letter-spacing:3px;text-align:center;text-transform:uppercase;font-weight:900;font-size:1rem;background:rgba(255,255,255,0.06);border:2px solid rgba(255,203,5,0.4);border-radius:10px;color:white;margin-bottom:8px;outline:none"
      oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')">
    <div style="display:flex;gap:8px">
      <button class="btn-primary" style="flex:1;padding:9px;font-size:0.85rem" onclick="col1ConfirmCreate()">Create</button>
      <button class="btn-secondary" style="flex:1;padding:9px;font-size:0.85rem" onclick="col1ResetCreateZone()">Cancel</button>
    </div>`;
  setTimeout(() => document.getElementById('col1-create-input')?.focus(), 50);
}
function col1ResetCreateZone() {
  document.getElementById('host-col1-create').innerHTML =
    `<button class="btn-primary" onclick="col1ShowCreateForm()">＋ Create New Game</button>`;
}
async function col1ConfirmCreate() {
  const code = (document.getElementById('col1-create-input')?.value || '').trim();
  if (!code) { showToast('⚠️ Enter a room code'); return; }
  const room = {
    code, phase: 'lobby', isPaused: false, archived: false, locked: false,
    currentRegion: 1, currentGym: 1, players: [], pokemonCaught: {},
    hostConnected: true, updated_at: new Date().toISOString(),
  };
  await dbWriteRoom(code, room);
  HOST.roomCode = code; HOST.archived = false;
  STATE.roomCode = code;
  const url = new URL(location.href);
  url.searchParams.set('room', code); history.replaceState({}, '', url);
  // Don't switch to waiting lobby — stay in the 3-col dashboard
  showToast(`✅ Room ${code} created`);
  col1ResetCreateZone();
  renderHostDashboard();
}

async function col1UnarchiveRoom(code) {
  const room = await dbReadRoom(code);
  if (!room) return;
  room.archived = false;
  room.updated_at = new Date().toISOString();
  await dbWriteRoom(code, room);
  showToast(`📤 ${code} unarchived`);
  renderHostDashboard();
}

// ═══════════════════════════════════════════════════════════
// COLUMN 2 — CRYSTALS
// ═══════════════════════════════════════════════════════════
async function renderCol2Accounts() {
  // Pull every player save + every pending row (redemption + abandon).
  const allSaves = await dbLoadAllPlayersFull();
  const pending  = await dbLedgerPending();
  // Index pending by player as an ARRAY — a player may have multiple
  // pending rows (e.g. one abandon + one redemption). Showing only the
  // first hid newer requests behind older ones. Bug-fix 2026-05-23.
  const pendingByPid = {};
  for (const e of pending) {
    if (!pendingByPid[e.player_id]) pendingByPid[e.player_id] = [];
    pendingByPid[e.player_id].push(e);
  }

  const term = (HOST_UI.searchTerm || '').toLowerCase();
  const matches = save => {
    if (!term) return true;
    const t = `${save.player_id || ''} ${save.name || ''}`.toLowerCase();
    return t.includes(term);
  };

  const active = allSaves.filter(s => !s.archivedAccount && matches(s));
  const archived = allSaves.filter(s => s.archivedAccount && matches(s));

  // Sort active: any pending first (oldest pending first), then by
  // total_crystals desc among non-pending players.
  active.sort((a, b) => {
    const ap = pendingByPid[a.player_id];
    const bp = pendingByPid[b.player_id];
    if (ap && !bp) return -1;
    if (bp && !ap) return 1;
    if (ap && bp)  return new Date(ap[0].created_at) - new Date(bp[0].created_at);
    return (b.total_crystals || 0) - (a.total_crystals || 0);
  });

  document.getElementById('col2-active-count').textContent   = active.length;
  document.getElementById('col2-archived-count').textContent = archived.length;

  const activeEl   = document.getElementById('col2-active-list');
  const archivedEl = document.getElementById('col2-archived-list');
  activeEl.innerHTML = active.length
    ? active.map(s => col2AccountCard(s, pendingByPid[s.player_id])).join('')
    : `<div class="col1-empty">${term ? 'No matches.' : 'No active accounts.'}</div>`;
  archivedEl.innerHTML = archived.length
    ? archived.map(s => col2ArchivedAccountCard(s)).join('')
    : `<div class="col1-empty">No archived accounts.</div>`;
  archivedEl.style.display = HOST_UI.archivedAccountsExpanded ? 'block' : 'none';
  document.getElementById('col2-archived-chevron').textContent = HOST_UI.archivedAccountsExpanded ? '▼' : '▶';
}

function col2AccountCard(s, pendingEntries) {
  // pendingEntries is now an ARRAY (or undefined). Render one block per
  // pending row so multiple requests show separately. Bug-fix 2026-05-23.
  const ageBand = ageGroupFromAge(s.age);
  const bandLabel = ageBand === 'junior' ? '🌟 Junior' : '🎓 Senior';
  const balance = s.total_crystals || 0;
  const peso = (balance / 100).toFixed(2);
  const entries = Array.isArray(pendingEntries) ? pendingEntries : (pendingEntries ? [pendingEntries] : []);
  const pendingHTML = entries.length
    ? entries.map(e => col2PendingBlock(e, s)).join('')
    : `<div class="ac-no-pending">No pending requests</div>`;
  return `
    <div class="account-card${entries.length ? ' has-pending' : ''}" id="ac-${escapeAttr(s.player_id)}">
      <div class="ac-header">
        <span class="ac-name">${escapeHTML(s.name || s.player_id)}</span>
        <span class="ac-pid">${escapeHTML(s.player_id)}</span>
        <span class="ac-band-pill">${bandLabel}</span>
      </div>
      <div class="ac-balance">💎 ${balance.toLocaleString()}<span class="ac-peso">≈ ₱${peso}</span></div>
      ${pendingHTML}
      <div class="ac-bottom-actions">
        <button class="btn-secondary" onclick="openLedgerModal('${escapeAttr(s.player_id)}')">📋 View Ledger</button>
        <button class="btn-secondary" onclick="col2ArchiveAccount('${escapeAttr(s.player_id)}','${escapeAttr(s.name||s.player_id)}')">··· Archive</button>
      </div>
    </div>`;
}

function col2PendingBlock(entry, save) {
  // Two pending types live here:
  //   redeem_request  → player asks to convert crystals to peso credit
  //   adjustment (amount=0, note starts "Abandon request") → player asks
  //   to abandon a room
  const isAbandon = entry.type === 'adjustment'
                  && (entry.note || '').startsWith('Abandon request');
  const abs = Math.abs(entry.amount);
  const peso = (abs / 100).toFixed(2);
  if (isAbandon) {
    return `
      <div class="ac-pending">
        <div class="ac-pending-label">🚪 Abandon Request</div>
        <div class="ac-pending-note">Room: <b>${escapeHTML(entry.room_code || '—')}</b></div>
        ${entry.note ? `<div class="ac-pending-note">${escapeHTML(entry.note)}</div>` : ''}
        <div class="ac-pending-time">Submitted ${relTime(entry.created_at)}</div>
        <div class="ac-pending-actions">
          <button class="btn-primary" onclick="col2ApproveAbandon('${escapeAttr(entry.id)}')">✅ Approve</button>
          <button class="btn-danger" onclick="col2DeclineRequest('${escapeAttr(entry.id)}')">❌ Decline</button>
        </div>
      </div>`;
  }
  return `
    <div class="ac-pending">
      <div class="ac-pending-label">⏳ Redemption Request</div>
      <div class="ac-pending-amount">−${abs.toLocaleString()} 💎 <span style="color:var(--crystal);font-size:0.78rem">≈ ₱${peso}</span></div>
      ${entry.note ? `<div class="ac-pending-note">Note: ${escapeHTML(entry.note)}</div>` : ''}
      <div class="ac-pending-time">Submitted ${relTime(entry.created_at)}</div>
      <div class="ac-pending-actions">
        <button class="btn-primary" onclick="col2ApproveRequest('${escapeAttr(entry.id)}')">✅ Approve</button>
        <button class="btn-secondary" onclick="col2ShowModifyForm('${escapeAttr(entry.id)}', ${abs})">✏️ Modify</button>
        <button class="btn-danger" onclick="col2DeclineRequest('${escapeAttr(entry.id)}')">❌ Decline</button>
      </div>
      <div id="ac-mod-${escapeAttr(entry.id)}" style="display:none" class="ac-modify-form"></div>
    </div>`;
}

// Approve an abandon request — marks the ledger row approved AND writes
// the room code into the player's save.abandoned_rooms list. That list
// is what the player's three-column dashboard reads to bucket the room
// as Archived/Abandoned. The room itself stays intact for other players.
async function col2ApproveAbandon(entryId) {
  const row = await dbLedgerUpdate(entryId, {
    status: 'approved', resolved_at: new Date().toISOString(),
  });
  if (!row) { showToast('❌ Could not approve abandon'); return; }
  const save = await dbLoad(row.player_id);
  if (save) {
    const list = Array.isArray(save.abandoned_rooms) ? save.abandoned_rooms : [];
    if (row.room_code && !list.includes(row.room_code)) list.push(row.room_code);
    save.abandoned_rooms = list;
    save.updated_at = new Date().toISOString();
    await dbSave(row.player_id, save);
  }
  showToast(`🚪 Abandon approved for ${row.room_code || row.player_id}`);
  renderCol2Accounts();
}

function col2ArchivedAccountCard(s) {
  const balance = s.total_crystals || 0;
  return `
    <div class="account-card archived">
      <div class="ac-header">
        <span class="ac-name">${escapeHTML(s.name || s.player_id)}</span>
        <span class="ac-pid">${escapeHTML(s.player_id)}</span>
      </div>
      <div class="ac-balance">💎 ${balance.toLocaleString()}</div>
      <div class="ac-bottom-actions">
        <button class="btn-secondary" onclick="col2UnarchiveAccount('${escapeAttr(s.player_id)}')">📤 Unarchive</button>
      </div>
    </div>`;
}

function col2ToggleArchived() {
  HOST_UI.archivedAccountsExpanded = !HOST_UI.archivedAccountsExpanded;
  renderCol2Accounts();
}

function col2ApplySearch() {
  const inp = document.getElementById('col2-search');
  HOST_UI.searchTerm = inp ? inp.value : '';
  renderCol2Accounts();
}

async function col2ApproveRequest(entryId) {
  const row = await dbLedgerUpdate(entryId, {
    status: 'approved', resolved_at: new Date().toISOString(),
  });
  if (!row) { showToast('❌ Could not approve'); return; }
  await dbBumpCrystals(row.player_id, row.amount);  // amount is negative
  const save = await dbLookupPlayer(row.player_id);
  showToast(`✅ ${save?.name || row.player_id}'s redemption approved`);
  renderCol2Accounts();
}
function col2ShowModifyForm(entryId, original) {
  const el = document.getElementById('ac-mod-' + entryId);
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `
    <label style="font-size:0.72rem;letter-spacing:1px;color:var(--gold);text-transform:uppercase;font-weight:800;display:block;margin-bottom:4px">Revised amount</label>
    <input type="number" id="mod-${escapeAttr(entryId)}" min="1" value="${original}" style="width:100%">
    <div style="display:flex;gap:6px;margin-top:6px">
      <button class="btn-primary" style="flex:1;padding:6px;font-size:0.78rem" onclick="col2ConfirmModify('${escapeAttr(entryId)}')">Confirm Modify</button>
      <button class="btn-secondary" style="flex:1;padding:6px;font-size:0.78rem" onclick="document.getElementById('ac-mod-${escapeAttr(entryId)}').style.display='none'">Cancel</button>
    </div>`;
}
async function col2ConfirmModify(entryId) {
  const v = parseInt(document.getElementById('mod-' + entryId)?.value, 10);
  if (!v || v <= 0) { showToast('⚠️ Enter a positive amount'); return; }
  const row = await dbLedgerUpdate(entryId, {
    status: 'modified', amount: -Math.abs(v), resolved_at: new Date().toISOString(),
  });
  if (!row) { showToast('❌ Could not modify'); return; }
  await dbBumpCrystals(row.player_id, row.amount);
  showToast(`✏️ Redemption modified and approved`);
  renderCol2Accounts();
}
async function col2DeclineRequest(entryId) {
  const row = await dbLedgerUpdate(entryId, {
    status: 'declined', resolved_at: new Date().toISOString(),
  });
  if (!row) { showToast('❌ Could not decline'); return; }
  showToast(`❌ Redemption declined`);
  renderCol2Accounts();
}

// Account archive flag lives inside data.account_archived (JSONB, no schema change).
async function col2ArchiveAccount(pid, name) {
  confirmDialog(`Archive ${name}'s account?`,
    `They won't appear in active accounts. You can unarchive any time.`,
    async () => {
      const save = await dbLoad(pid);
      if (!save) return;
      save.account_archived = true;
      save.updated_at = new Date().toISOString();
      await dbSave(pid, save);
      showToast(`📦 ${name} archived`);
      renderCol2Accounts();
    });
}
async function col2UnarchiveAccount(pid) {
  const save = await dbLoad(pid);
  if (!save) return;
  delete save.account_archived;
  save.updated_at = new Date().toISOString();
  await dbSave(pid, save);
  showToast(`📤 Account restored`);
  renderCol2Accounts();
}

function col2BonusValidate() {
  const pid  = (document.getElementById('host-add-pid')?.value || '').trim();
  const amt  = parseInt(document.getElementById('host-add-amount')?.value, 10);
  const note = (document.getElementById('host-add-note')?.value || '').trim();
  const ok = isValidPlayerId(pid) && amt > 0 && note.length > 0;
  const btn = document.getElementById('col2-bonus-submit');
  if (btn) { btn.disabled = !ok; btn.style.opacity = ok ? '' : '0.4'; }
}

// Helper: load all player_saves rows with the new identity columns
// so the dashboard knows name/age/gender/archived without parsing the
// data blob. dbLoadAllPlayers returns only the data blob, so we use
// a direct call here that includes everything we need.
async function dbLoadAllPlayersFull() {
  const { data, error } = await sb.from('player_saves')
    .select('player_id, name, age, gender, data, updated_at')
    .order('updated_at', { ascending: false });
  if (error || !data) { console.warn('dbLoadAllPlayersFull error:', error); return []; }
  return data.map(r => ({
    player_id: r.player_id,
    name:      r.name || (r.data && r.data.player_name) || r.player_id,
    age:       r.age,
    gender:    r.gender,
    updated_at: r.updated_at,
    total_crystals: (r.data && r.data.total_crystals) || 0,
    last_seen:      (r.data && r.data.last_seen) || null,
    pokemon_team:   (r.data && r.data.pokemon_team) || [],
    archivedAccount: !!(r.data && r.data.account_archived),
    _data: r.data,
  }));
}

// ═══════════════════════════════════════════════════════════
// COLUMN 3 — CONTROLS (active-room scoped)
// ═══════════════════════════════════════════════════════════
async function renderCol3Controls() {
  const code = HOST_UI.activeRoomCode;
  const label = document.getElementById('col3-active-room-label');
  const phaseEl = document.getElementById('col3-current-phase');
  const advLbl  = document.getElementById('col3-advance-label');
  const pauseLbl = document.getElementById('col3-pause-label');
  const lockBtn  = document.getElementById('col3-lock-toggle');

  if (!code) {
    if (label)   label.textContent = 'No active room';
    if (phaseEl) phaseEl.textContent = 'Current phase: —';
    if (advLbl)  advLbl.textContent  = 'Advance Phase';
    if (pauseLbl) pauseLbl.textContent = 'Pause All Players';
    if (lockBtn) { lockBtn.textContent = 'OFF'; lockBtn.classList.remove('on'); }
    return;
  }

  const room = await dbReadRoom(code);
  if (!room) return;
  if (label)   label.textContent = `Active room: ${code}`;
  const niceMap = {
    PREGAME_CATCH: 'Pre-Game Catch', REGION_SELECT: 'Region Select',
    GYM_ACTIVE: 'Playing', GYM_COMPLETE: 'Gym Complete',
    REGION_COMPLETE: 'Region Complete', REGION_CATCH: 'Regional Catch',
    BREAK: 'Break', GAME_OVER: 'Game Over', lobby: 'Lobby (Waiting)',
  };
  const phaseName = niceMap[room.phase] || room.phase;
  if (phaseEl) phaseEl.textContent = `Current phase: ${room.isPaused ? 'Paused — ' : ''}${phaseName}`;
  // Compute next-phase label for the Advance button
  const transitions = {
    lobby:'PREGAME_CATCH', PREGAME_CATCH:'REGION_SELECT', REGION_SELECT:'GYM_ACTIVE',
    GYM_ACTIVE:'GYM_COMPLETE', GYM_COMPLETE:'GYM_ACTIVE',
    REGION_COMPLETE:'REGION_CATCH', REGION_CATCH:'REGION_SELECT',
    BREAK:'GYM_ACTIVE', GAME_OVER:'GAME_OVER',
  };
  const next = transitions[room.phase] || room.phase;
  if (advLbl) advLbl.textContent = `${phaseName} → ${niceMap[next] || next}`;
  if (pauseLbl) pauseLbl.textContent = room.isPaused ? 'Resume All Players' : 'Pause All Players';
  if (lockBtn) {
    lockBtn.textContent = room.locked ? 'ON' : 'OFF';
    lockBtn.classList.toggle('on', !!room.locked);
  }
}

async function col3AdvancePhase() {
  const code = HOST_UI.activeRoomCode;
  if (!code) { showToast('⚠️ No active room'); return; }
  const room = await dbReadRoom(code);
  if (!room) return;
  // Point HOST.* at this room so the existing hostNextPhase works.
  HOST.roomCode = code;
  HOST.currentPhase = room.phase; HOST.isPaused = !!room.isPaused;
  HOST.archived = !!room.archived;
  HOST.players = room.players || []; HOST.pokemonCaught = room.pokemonCaught || {};
  HOST.currentRegion = room.currentRegion || 1; HOST.currentGym = room.currentGym || 1;
  await hostNextPhase();
  showToast(`▶️ Advanced`);
  renderHostDashboard();
}

async function col3TogglePause() {
  const code = HOST_UI.activeRoomCode;
  if (!code) { showToast('⚠️ No active room'); return; }
  const room = await dbReadRoom(code);
  if (!room) return;
  room.isPaused = !room.isPaused;
  room.updated_at = new Date().toISOString();
  await dbWriteRoom(code, room);
  // Keep HOST.* in sync if it points at this room
  if (HOST.roomCode === code) HOST.isPaused = room.isPaused;
  showToast(room.isPaused ? '⏸️ Paused' : '▶️ Resumed');
  renderHostDashboard();
}

async function col3EndGame() {
  const code = HOST_UI.activeRoomCode;
  if (!code) { showToast('⚠️ No active room'); return; }
  confirmDialog('End the game?',
    'This sets the room to GAME_OVER and auto-archives it. This cannot be undone.',
    async () => {
      const room = await dbReadRoom(code);
      if (!room) return;
      room.phase = 'GAME_OVER'; room.archived = true;
      room.updated_at = new Date().toISOString();
      await dbWriteRoom(code, room);
      if (HOST.roomCode === code) { HOST.currentPhase = 'GAME_OVER'; HOST.archived = true; }
      showToast('🏁 Game ended');
      renderHostDashboard();
    });
}

async function col3ToggleLock() {
  const code = HOST_UI.activeRoomCode;
  if (!code) { showToast('⚠️ No active room'); return; }
  const room = await dbReadRoom(code);
  if (!room) return;
  room.locked = !room.locked;
  room.updated_at = new Date().toISOString();
  await dbWriteRoom(code, room);
  showToast(room.locked ? '🔒 Room locked' : '🔓 Room open');
  renderHostDashboard();
}

async function col3ForceSaveAll() {
  // The actual saves are written by players themselves (auto-save). The
  // host's "Force Save All" is a sync ack — bumps room.updated_at so the
  // poll picks up immediately.
  const code = HOST_UI.activeRoomCode;
  if (code) {
    const room = await dbReadRoom(code);
    if (room) { room.updated_at = new Date().toISOString(); await dbWriteRoom(code, room); }
  }
  showToast('✅ All players saved');
}

async function col3SendBroadcast() {
  const code = HOST_UI.activeRoomCode;
  if (!code) { showToast('⚠️ No active room'); return; }
  const inp = document.getElementById('col3-broadcast-input');
  const text = (inp?.value || '').trim();
  if (!text) { showToast('⚠️ Enter a message'); return; }
  const room = await dbReadRoom(code);
  if (!room) return;
  room.announcement = { text, ts: new Date().toISOString() };
  room.updated_at = new Date().toISOString();
  await dbWriteRoom(code, room);
  if (inp) inp.value = '';
  showToast('📢 Announcement sent');
}
function col3PresetBroadcast(text) {
  const inp = document.getElementById('col3-broadcast-input');
  if (inp) inp.value = text;
  col3SendBroadcast();
}

async function col3ResetRoom() {
  const code = HOST_UI.activeRoomCode;
  if (!code) { showToast('⚠️ No active room'); return; }
  confirmDialog(`Reset room ${code}?`,
    `This kicks all players, clears Pokemon availability, and returns the room to lobby. Player accounts and crystal balances stay intact. This cannot be undone.`,
    async () => {
      const room = await dbReadRoom(code);
      if (!room) return;
      room.phase = 'lobby'; room.isPaused = false;
      room.players = []; room.pokemonCaught = {};
      room.currentRegion = 1; room.currentGym = 1;
      room.announcement = null;
      room.updated_at = new Date().toISOString();
      await dbWriteRoom(code, room);
      if (HOST.roomCode === code) {
        HOST.currentPhase = 'lobby'; HOST.players = []; HOST.pokemonCaught = {};
        HOST.currentRegion = 1; HOST.currentGym = 1;
      }
      showToast(`🗑️ Room ${code} reset to lobby`);
      renderHostDashboard();
    });
}

// ═══════════════════════════════════════════════════════════
// ROOM DETAIL OVERLAY
// ═══════════════════════════════════════════════════════════
async function openRoomDetail(code) {
  HOST_UI.detailRoomCode = code;
  await renderRoomDetail();
  document.getElementById('room-detail-overlay').style.display = 'flex';
}
function closeRoomDetail() {
  HOST_UI.detailRoomCode = null;
  document.getElementById('room-detail-overlay').style.display = 'none';
}
function roomDetailMaybeClose(e) {
  if (e.target.classList.contains('modal-overlay')) closeRoomDetail();
}

async function renderRoomDetail() {
  const code = HOST_UI.detailRoomCode;
  if (!code) return;
  const room = await dbReadRoom(code);
  if (!room) { closeRoomDetail(); return; }
  document.getElementById('rd-code').textContent = code;
  const status = deriveRoomStatus(room);
  const statusEl = document.getElementById('rd-status');
  statusEl.className = `status-pill status-${status.cls}`;
  statusEl.textContent = status.label;

  // Players — pull saves and sort by presence then crystals
  const ids = (room.players || []).map(p => p.id);
  let saves = [];
  if (ids.length) {
    const { data } = await sb.from('player_saves')
      .select('player_id, name, age, data, updated_at')
      .in('player_id', ids);
    saves = data || [];
  }
  const enriched = (room.players || []).map(p => {
    const s = saves.find(x => x.player_id === p.id) || {};
    const blob = s.data || {};
    return {
      player_id: p.id, name: s.name || p.name || p.id,
      age: s.age, ageGroup: ageGroupFromAge(s.age),
      total_crystals: blob.total_crystals || 0,
      pokemon_team: blob.pokemon_team || [],
      regions: blob.regions || {},
      last_seen: blob.last_seen || null,
    };
  });
  const PRESENCE_RANK = { connected: 0, reconnecting: 1, absent: 2 };
  const presenceFor = ls => presenceStatus(ls).cls;
  enriched.sort((a, b) => {
    const pa = PRESENCE_RANK[presenceFor(a.last_seen)] ?? 9;
    const pb = PRESENCE_RANK[presenceFor(b.last_seen)] ?? 9;
    if (pa !== pb) return pa - pb;
    return (b.total_crystals || 0) - (a.total_crystals || 0);
  });
  const connectedCount = enriched.filter(p => presenceFor(p.last_seen) !== 'absent').length;
  document.getElementById('rd-player-count').textContent = `${connectedCount}/${enriched.length} connected`;

  document.getElementById('rd-player-list').innerHTML = enriched.length
    ? enriched.map(p => {
        const pres = presenceStatus(p.last_seen);
        const region = REGIONS.find(r => r.id === room.currentRegion) || REGIONS[0];
        const pokeNames = (p.pokemon_team || []).slice(0, 3).map(pk => pk.name).join(', ') || '—';
        const band = p.ageGroup === 'junior' ? 'Junior' : 'Senior';
        return `
          <div class="rd-player">
            <div class="rd-player-presence">${pres.label.split(' ')[0]}</div>
            <div class="rd-player-info">
              <div class="rd-player-name">${escapeHTML(p.name)} <span class="ac-pid">${escapeHTML(p.player_id)}</span> <span class="ac-band-pill">${band}</span></div>
              <div class="rd-player-sub">${region.emoji} ${region.name} · Gym ${room.currentGym}/5</div>
              <div class="rd-player-pokemon">🐾 ${escapeHTML(pokeNames)}</div>
            </div>
            <div class="rd-player-crystals">💎 ${(p.total_crystals||0).toLocaleString()}</div>
          </div>`;
      }).join('')
    : '<div class="col1-empty">No players yet.</div>';

  // Game progress R1..R10
  const progressHTML = REGIONS.map(r => {
    let cls = 'rd-progress-pill';
    let icon = '○';
    if (r.id < room.currentRegion) { cls += ' done'; icon = '✅'; }
    else if (r.id === room.currentRegion) { cls += ' active'; icon = '🔄'; }
    return `<span class="${cls}">${icon} R${r.id}</span>`;
  }).join('');
  document.getElementById('rd-progress').innerHTML = progressHTML;

  // Pokemon Available — only show during catch phases
  const pokeSection = document.getElementById('rd-pokemon-section');
  const showPoke = ['PREGAME_CATCH','REGION_CATCH'].includes(room.phase);
  pokeSection.style.display = showPoke ? 'block' : 'none';
  if (showPoke) {
    await loadPokemon();
    const pool = room.phase === 'REGION_CATCH'
      ? getRegionalList(room.currentRegion)
      : getStartersList();
    const caughtMap = room.pokemonCaught || {};
    document.getElementById('rd-pokemon-pool').innerHTML = pool.map(p => {
      const catcher = caughtMap[p.id];
      return `
        <div class="rd-pokemon-pill ${catcher ? 'caught' : ''}">
          <div class="rdp-emoji">${p.emoji}</div>
          <div>${escapeHTML(p.name)}</div>
          <div style="opacity:0.65">${catcher ? '✅ ' + escapeHTML(catcher) : '🔓 Free'}</div>
        </div>`;
    }).join('');
  }

  // Action buttons — phase-driven visibility.
  //   lobby phase  → [🚀 Start Game]  [🗄️ Archive]  [🏁 End Game]
  //   any other    → [⏸️ Pause / ▶️ Resume]  [🗄️ Archive]  [🏁 End Game]
  const startBtn = document.getElementById('rd-start-btn');
  const pauseBtn = document.getElementById('rd-pause-btn');
  const isLobby  = room.phase === 'lobby';
  if (startBtn) startBtn.style.display = isLobby ? '' : 'none';
  if (pauseBtn) {
    pauseBtn.style.display = isLobby ? 'none' : '';
    pauseBtn.textContent = room.isPaused ? '▶️ Resume Room' : '⏸️ Pause Room';
  }
  document.getElementById('rd-archive-btn').textContent = room.archived ? '📤 Unarchive' : '🗄️ Archive';
}

async function rdTogglePause() {
  const code = HOST_UI.detailRoomCode;
  if (!code) return;
  const room = await dbReadRoom(code);
  if (!room) return;
  room.isPaused = !room.isPaused;
  room.updated_at = new Date().toISOString();
  await dbWriteRoom(code, room);
  showToast(room.isPaused ? '⏸️ Paused' : '▶️ Resumed');
  renderRoomDetail();
  renderHostDashboard();
}
// Start the room's game from the Room Detail Overlay. Mirrors the
// hostStartGame() transition (lobby → PREGAME_CATCH) but scoped to
// the overlay's room — does NOT switch the host's view, so Papa
// stays on the three-column dashboard.
async function rdStartGame() {
  const code = HOST_UI.detailRoomCode;
  if (!code) return;
  const room = await dbReadRoom(code);
  if (!room) return;
  if (room.phase !== 'lobby') {
    showToast('⚠️ Game already started');
    return;
  }
  // Strip out any legacy host-viewer entries the way hostStartGame does.
  const realPlayers = (room.players || []).filter(p =>
    p.id !== 'HOST_VIEWER' && p.id !== 'host' && !p.isHost
  );
  if (realPlayers.length === 0) {
    showToast('⚠️ At least 1 player must join before starting');
    return;
  }
  room.phase         = 'PREGAME_CATCH';
  room.players       = realPlayers;
  room.currentRegion = 1;
  room.currentGym    = 1;
  room.isPaused      = false;
  room.startedAt     = new Date().toISOString();
  room.updated_at    = new Date().toISOString();
  await dbWriteRoom(code, room);
  // Keep HOST.* in sync if it points at this room so Column 3 reflects
  // the new phase on the next render.
  if (HOST.roomCode === code) {
    HOST.currentPhase  = 'PREGAME_CATCH';
    HOST.players       = realPlayers;
    HOST.currentRegion = 1;
    HOST.currentGym    = 1;
    HOST.isPaused      = false;
  }
  showToast(`🚀 ${code} — game started`);
  renderRoomDetail();
  renderHostDashboard();
}
async function rdArchive() {
  const code = HOST_UI.detailRoomCode;
  if (!code) return;
  const room = await dbReadRoom(code);
  if (!room) return;
  room.archived = !room.archived;
  room.updated_at = new Date().toISOString();
  await dbWriteRoom(code, room);
  showToast(room.archived ? '🗄️ Archived ✓' : '📤 Unarchived ✓');
  renderRoomDetail();
  renderHostDashboard();
}
async function rdEndGame() {
  const code = HOST_UI.detailRoomCode;
  if (!code) return;
  confirmDialog('End this game?', 'This sets the room to GAME_OVER and auto-archives it. This cannot be undone.', async () => {
    const room = await dbReadRoom(code);
    if (!room) return;
    room.phase = 'GAME_OVER'; room.archived = true;
    room.updated_at = new Date().toISOString();
    await dbWriteRoom(code, room);
    showToast('🏁 Game ended');
    closeRoomDetail();
    renderHostDashboard();
  });
}

// ═══════════════════════════════════════════════════════════
// PER-PLAYER LEDGER MODAL
// ═══════════════════════════════════════════════════════════
async function openLedgerModal(pid) {
  HOST_UI.ledgerModalPid = pid;
  const save = await dbLookupPlayer(pid);
  document.getElementById('lm-name').textContent = save?.name || pid;
  document.getElementById('lm-pid').textContent  = pid;
  const bal = save?.total_crystals || 0;
  document.getElementById('lm-balance').textContent = bal.toLocaleString();
  document.getElementById('lm-peso').textContent    = (bal / 100).toFixed(2);

  const rows = await dbLedgerForPlayer(pid, 200);
  const body = document.getElementById('lm-body');
  if (!rows.length) { body.innerHTML = '<div class="lm-empty">No ledger entries yet.</div>'; }
  else body.innerHTML = `<div class="lm-table">${rows.map(lmRow).join('')}</div>`;
  document.getElementById('ledger-modal-overlay').style.display = 'flex';
}
function closeLedgerModal() {
  HOST_UI.ledgerModalPid = null;
  document.getElementById('ledger-modal-overlay').style.display = 'none';
}
function ledgerModalMaybeClose(e) {
  if (e.target.classList.contains('modal-overlay')) closeLedgerModal();
}
function lmRow(row) {
  const icon = { approved: '✅', pending: '⏳', declined: '❌', modified: '✏️' }[row.status] || '·';
  const sign = row.amount > 0 ? '+' : (row.amount < 0 ? '−' : '');
  const abs = Math.abs(row.amount).toLocaleString();
  const amtCls = row.amount > 0 ? 'amt-credit' : (row.amount < 0 ? 'amt-debit' : '');
  const typeLabel = {
    'earn':'Gym clear','bonus':'Papa bonus',
    'redeem_request':'Redemption','adjustment':'Adjustment',
  }[row.type] || row.type;
  return `
    <div class="lm-row status-${row.status}">
      <div>${icon}</div>
      <div class="lm-amount ${amtCls}">${sign}${abs} 💎</div>
      <div>${typeLabel}</div>
      <div class="lm-room">${row.room_code ? escapeHTML(row.room_code) : '—'}</div>
      <div class="lm-note">${row.note ? escapeHTML(row.note) : ''}</div>
      <div class="lm-when">${relTime(row.created_at)}</div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// GENERIC CONFIRMATION DIALOG
// ═══════════════════════════════════════════════════════════
function confirmDialog(title, message, onConfirm) {
  document.getElementById('confirm-dialog-title').textContent = title;
  document.getElementById('confirm-dialog-message').textContent = message;
  const yes = document.getElementById('confirm-dialog-yes');
  yes.onclick = () => { confirmDialogCancel(); onConfirm(); };
  document.getElementById('confirm-dialog-overlay').style.display = 'flex';
}
function confirmDialogCancel() {
  document.getElementById('confirm-dialog-overlay').style.display = 'none';
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
  // Three-column dashboard refresh. We refresh ALL columns on every poll
  // because the host needs near-real-time visibility into rooms (col 1),
  // pending crystal requests (col 2), and the active room's phase (col 3).
  // Each column renderer is self-contained; legacy renderHost*Cards / *Leaderboard
  // / *PokemonPool functions are retained only for the Room-Detail overlay's
  // helper logic and are no longer invoked from the poll loop.
  if (HOST.roomCode) {
    const room = await dbReadRoom(HOST.roomCode);
    if (room) {
      HOST.currentPhase = room.phase || HOST.currentPhase;
      HOST.isPaused     = !!room.isPaused;
      HOST.archived     = !!room.archived;
      HOST.locked       = !!room.locked;
      HOST.players      = room.players || [];
      HOST.pokemonCaught= room.pokemonCaught || {};
      HOST.currentRegion= room.currentRegion || HOST.currentRegion || 1;
      HOST.currentGym   = room.currentGym   || HOST.currentGym   || 1;
    }
  }

  // Re-render every column on every tick. Each renderer is async and
  // independently safe — failures in one don't block the others.
  try { await renderCol1Rooms();    } catch(e) { console.error('col1 render', e); }
  try { await renderCol2Accounts(); } catch(e) { console.error('col2 render', e); }
  try { await renderCol3Controls(); } catch(e) { console.error('col3 render', e); }

  // If the room-detail overlay is open, refresh its body live too.
  if (HOST_UI.detailRoomCode) {
    try { await renderRoomDetail(HOST_UI.detailRoomCode); } catch(e) { /* swallow */ }
  }
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

  // Pause / resume — freeze the player's local quiz timer so the kid
  // doesn't lose a question while the host has the room paused.
  if (!HOST.isHost) {
    if (room.isPaused && !STATE.paused) {
      // Transitioning into paused state. Snapshot remaining time and
      // stop the interval so it can't fire timeUp() mid-pause.
      STATE.paused = true;
      if (STATE.timerInt) {
        STATE.pausedTimeRemaining = STATE.timeLeft;
        clearInterval(STATE.timerInt);
        STATE.timerInt = null;
        // Freeze the displayed countdown number at the snapshot value.
        const txt = document.getElementById('timer-text');
        if (txt) txt.textContent = Math.ceil(STATE.pausedTimeRemaining);
      }
    } else if (!room.isPaused && STATE.paused) {
      // Transitioning out of paused state. Restore from the snapshot
      // and continue counting down from there. Only restart if the
      // player is still mid-question (interval was cleared by us).
      STATE.paused = false;
      const remaining = STATE.pausedTimeRemaining;
      STATE.pausedTimeRemaining = null;
      if (remaining != null && !STATE.answered && !STATE.timerInt) {
        STATE.timeLeft = remaining;
        resumeTimer();
      }
    }
  }

  // Broadcast banner — show host announcement until the player dismisses
  // THIS specific message (keyed by ts) or the host clears it.
  if (!HOST.isHost) renderPlayerBroadcast(room.announcement);

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

// ── BROADCAST BANNER (player side) ────────────────────────────
// Host writes `room.announcement = { text, ts }` (or null to clear).
// Players show the banner until either the host clears it OR the player
// dismisses this specific timestamp (so a new message re-pops).
function renderPlayerBroadcast(ann) {
  const el = document.getElementById('player-broadcast-banner');
  const txt = document.getElementById('player-broadcast-text');
  if (!el || !txt) return;
  if (!ann || !ann.text) { el.style.display = 'none'; return; }
  const dismissed = localStorage.getItem('cqc_broadcast_dismissed_ts');
  if (dismissed && dismissed === ann.ts) { el.style.display = 'none'; return; }
  txt.textContent = ann.text;
  el.style.display = 'flex';
  el.dataset.ts = ann.ts || '';
}
function dismissPlayerBroadcast() {
  const el = document.getElementById('player-broadcast-banner');
  if (!el) return;
  const ts = el.dataset.ts || '';
  if (ts) localStorage.setItem('cqc_broadcast_dismissed_ts', ts);
  el.style.display = 'none';
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
    const codeInp   = document.getElementById('join-code');
    const bannerEl  = document.getElementById('join-banner');
    const bannerCd  = document.getElementById('join-banner-code');
    if (codeInp)  codeInp.value = roomParam;
    if (bannerCd) bannerCd.textContent = roomParam;
    if (bannerEl) bannerEl.style.display = 'block';
    showScreen('screen-join');
    // Phase A: try a silent auto-rejoin if localStorage knows who we are
    // AND we're already on this room's roster. Falls through to the join
    // form if no match. tryAutoRejoinFromURL lands the player on the
    // dashboard with _dashboardHighlightRoom set.
    tryAutoRejoinFromURL(roomParam);
  } else {
    // No ?room=. If we have a saved identity in localStorage, skip the
    // login screen and go straight to the three-column dashboard. This
    // matches the spec: "If cqc_player_id exists in localStorage: skip
    // screen-home entirely".
    const storedId = localStorage.getItem('cqc_player_id');
    if (storedId && isValidPlayerId(storedId)) {
      (async () => {
        const result = await dbLoginPlayer(storedId);
        if (result) {
          STATE.player = result.player;
          STATE.save   = result.save;
          openPlayerDashboard();
        }
        // If the lookup fails (e.g. row deleted in Supabase), fall back
        // silently to screen-home which is the default `.active` screen.
      })();
    }
    // If no localStorage, screen-home is already `.active` in the HTML
    // and we leave the user there to pick Create Account / Log In.
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
  if (!storedId || !isValidPlayerId(storedId)) return;
  try {
    const room = await dbReadRoom(code);
    if (!room) return;
    const isOnRoster = (room.players || []).some(p => p.id === storedId);
    if (!isOnRoster) return;
    // Restore identity + save from Supabase so STATE is correct.
    const result = await dbLoginPlayer(storedId);
    if (!result) return;
    STATE.player   = result.player;
    STATE.save     = result.save;
    STATE.roomCode = code;
    STATE.isHost   = false;
    // Persistent-identity update: bring the user to the dashboard with
    // the URL's room highlighted as the active resumable game. Replaces
    // the older "drop straight into the game screen" behavior.
    _dashboardHighlightRoom = code;
    ensureHeartbeat();
    // Update last_seen so the host's presence dot turns green within a poll.
    STATE.save.last_seen = new Date().toISOString();
    await dbSave(storedId, STATE.save);
    await openPlayerDashboard();
  } catch (e) {
    console.warn('auto-rejoin failed:', e);
  }
}
