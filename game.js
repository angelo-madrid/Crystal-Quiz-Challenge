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
const STARTER_POKEMON = [
  { id:'pikachu',   name:'Pikachu',   emoji:'⚡', type:'Electric',      ability:'Thunderbolt', abilityDesc:'Eliminates 2 wrong answers',          region:0 },
  { id:'charmander',name:'Charmander',emoji:'🔥', type:'Fire',          ability:'Ember',       abilityDesc:'Adds +5 seconds to your timer',        region:0 },
  { id:'squirtle',  name:'Squirtle',  emoji:'💧', type:'Water',         ability:'Water Gun',   abilityDesc:'Skip question — no penalty',           region:0 },
  { id:'bulbasaur', name:'Bulbasaur', emoji:'🌿', type:'Grass/Poison',  ability:'Vine Whip',   abilityDesc:'Reveals category of next question',    region:0 },
  { id:'eevee',     name:'Eevee',     emoji:'🌙', type:'Normal',        ability:'Adapt',       abilityDesc:'Change your answer once after picking', region:0 },
  { id:'gengar',    name:'Gengar',    emoji:'👻', type:'Ghost/Poison',  ability:'Shadow Ball', abilityDesc:'Steal 150 🔮 from the leader if correct',region:0},
  { id:'snorlax',   name:'Snorlax',   emoji:'💤', type:'Normal',        ability:'Rest',        abilityDesc:'Freeze timer — no speed bonus though',  region:0 },
  { id:'alakazam',  name:'Alakazam',  emoji:'🔮', type:'Psychic',       ability:'Psychic',     abilityDesc:'Confirm if your answer is correct first',region:0},
  { id:'dratini',   name:'Dratini',   emoji:'🐉', type:'Dragon',        ability:'Dragon Rage', abilityDesc:'Double crystals if correct — 0 if wrong',region:0},
  { id:'jigglypuff',name:'Jigglypuff',emoji:'🎵', type:'Normal/Fairy',  ability:'Sing',        abilityDesc:'All players lose 5s from their timer',  region:0 }
];

// ── GAME STATE ────────────────────────────────────────────────
let STATE = {
  player: null,      // { id, name, emoji, ageGroup }
  save: null,        // full save data from Supabase
  questions: null,   // loaded from questions.json
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
let selectedAge = 'senior';

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

// ── LOAD QUESTIONS ────────────────────────────────────────────
async function loadQuestions() {
  if (STATE.questions) return STATE.questions;
  try {
    const res = await fetch('questions.json');
    STATE.questions = await res.json();
    return STATE.questions;
  } catch(e) {
    console.error('Failed to load questions:', e);
    return null;
  }
}


// ── PRE-GAME POKEMON CATCH ────────────────────────────────────
const PREGAME_QUESTIONS = [
  { q:"What type is Pikachu?", a:"Electric", opts:["Electric","Fire","Water","Normal"] },
  { q:"What is the name of Harry Potter's school?", a:"Hogwarts", opts:["Hogwarts","Beauxbatons","Durmstrang","Ilvermorny"] },
  { q:"What is the capital city of Japan?", a:"Tokyo", opts:["Tokyo","Osaka","Kyoto","Hiroshima"] },
  { q:"True or False: Pasta originally comes from Italy.", a:"True", opts:["True","False","Maybe","Sometimes"] },
  { q:"What does 'Salamat' mean in English?", a:"Thank you", opts:["Thank you","Sorry","Hello","Goodbye"] },
  { q:"What is the national flower of the Philippines?", a:"Sampaguita", opts:["Sampaguita","Rose","Sunflower","Orchid"] },
  { q:"What color is Elphaba's skin in Wicked?", a:"Green", opts:["Green","Blue","Purple","Grey"] },
  { q:"How many members are in BTS?", a:"7", opts:["7","5","6","8"] },
  { q:"What is the main ingredient in guacamole?", a:"Avocado", opts:["Avocado","Tomato","Onion","Lime"] },
  { q:"What planet is closest to the Sun?", a:"Mercury", opts:["Mercury","Venus","Mars","Earth"] },
  { q:"How many legs does a spider have?", a:"8", opts:["8","6","10","12"] },
  { q:"What does 'Buenos días' mean in English?", a:"Good morning", opts:["Good morning","Good night","Goodbye","Good evening"] },
  { q:"What is 12 × 12?", a:"144", opts:["144","124","132","148"] },
  { q:"What is the name of Annie's dog?", a:"Sandy", opts:["Sandy","Buddy","Max","Spot"] },
  { q:"Who plays Buddy the Elf in the movie?", a:"Will Ferrell", opts:["Will Ferrell","Jim Carrey","Adam Sandler","Jack Black"] },
  { q:"True or False: The Moon produces its own light.", a:"False", opts:["False","True","Sometimes","Only at night"] },
  { q:"What is the largest ocean in the world?", a:"Pacific Ocean", opts:["Pacific Ocean","Atlantic Ocean","Indian Ocean","Arctic Ocean"] },
  { q:"What is the Filipino word for 'house'?", a:"Bahay", opts:["Bahay","Kalsada","Tubig","Langit"] },
  { q:"What is 100 ÷ 4?", a:"25", opts:["25","20","30","40"] },
  { q:"What does Magikarp evolve into?", a:"Gyarados", opts:["Gyarados","Lapras","Dragonair","Vaporeon"] },
  { q:"What is the name of Simba's father in The Lion King?", a:"Mufasa", opts:["Mufasa","Scar","Rafiki","Zazu"] },
  { q:"True or False: BTS is from South Korea.", a:"True", opts:["True","False","Japan","China"] },
  { q:"What is the national animal of the Philippines?", a:"Carabao", opts:["Carabao","Eagle","Tarsier","Tamaraw"] },
  { q:"What is the Spanish word for 'water'?", a:"Agua", opts:["Agua","Fuego","Tierra","Aire"] },
  { q:"How many continents are there on Earth?", a:"7", opts:["7","5","6","8"] },
  { q:"In The BFG what does BFG stand for?", a:"Big Friendly Giant", opts:["Big Friendly Giant","Big Funny Giraffe","Bold Flying Giant","Brave Friendly Goblin"] },
  { q:"What is the powerhouse of the cell?", a:"Mitochondria", opts:["Mitochondria","Nucleus","Ribosome","Cell Wall"] },
  { q:"What is 5 × 8?", a:"40", opts:["40","35","45","48"] },
  { q:"True or False: Lionel Messi is from Argentina.", a:"True", opts:["True","False","Brazil","Spain"] },
  { q:"What is the first Pokemon in the Pokedex?", a:"Bulbasaur", opts:["Bulbasaur","Caterpie","Charmander","Squirtle"] }
];

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

function startPreGameCatch() {
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
  const alreadyCaught = PREGAME_STATE.caughtPokemon.map(p => p.id);

  container.innerHTML = STARTER_POKEMON.map(p => {
    const isCaught = alreadyCaught.includes(p.id);
    return `
      <div class="starter-card${isCaught ? ' caught' : ''}" 
           id="sc-${p.id}"
           onclick="${isCaught ? '' : `selectStarterPokemon('${p.id}')`}">
        <div class="sc-emoji">${p.emoji}</div>
        <div class="sc-name">${p.name}</div>
        <div class="sc-type">${p.type}</div>
        <div class="sc-ability">⚡ ${p.ability}</div>
        <div class="sc-desc">${p.abilityDesc}</div>
        ${isCaught ? '<div class="sc-caught">✅ Already caught!</div>' : ''}
      </div>
    `;
  }).join('');
}

function selectStarterPokemon(pokeId) {
  // Clear previous selection
  document.querySelectorAll('.starter-card').forEach(c => c.classList.remove('selected'));

  const card = document.getElementById(`sc-${pokeId}`);
  if (card) card.classList.add('selected');

  PREGAME_STATE.selectedPokemon = STARTER_POKEMON.find(p => p.id === pokeId);

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

function attemptCatch() {
  if (!PREGAME_STATE.selectedPokemon) return;
  if (PREGAME_STATE.pokeballs <= 0) {
    alert('No Pokeballs left!');
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
      <div class="psd-ability">⚡ ${poke.ability} — ${poke.abilityDesc}</div>
      <div class="psd-hint">✨ Answer correctly to catch!</div>
    </div>
  `;

  // Pick a random unused question
  const available = PREGAME_QUESTIONS.filter((_, i) => !PREGAME_STATE.usedQuestions.includes(i));
  const idx = Math.floor(Math.random() * available.length);
  const originalIdx = PREGAME_QUESTIONS.indexOf(available[idx]);
  PREGAME_STATE.usedQuestions.push(originalIdx);
  PREGAME_STATE.currentQuestion = available[idx];

  // Shuffle choices
  const choices = [...PREGAME_STATE.currentQuestion.opts].sort(() => Math.random() - 0.5);
  PREGAME_STATE.currentChoices = choices;
  PREGAME_STATE.answered = false;

  // Render question
  document.getElementById('pregame-q-category').textContent = '✨ Holo Question — Answer to Catch!';
  document.getElementById('pregame-q-text').textContent = PREGAME_STATE.currentQuestion.q;

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
  const correct = PREGAME_STATE.currentQuestion.a;
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
  const correctIdx = PREGAME_STATE.currentChoices.indexOf(PREGAME_STATE.currentQuestion.a);
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
    // Add to team!
    const newPokemon = { ...poke, level: 1, caughtAt: 'pregame' };
    PREGAME_STATE.caughtPokemon.push(newPokemon);
    STATE.save.pokemon_team = PREGAME_STATE.caughtPokemon;

    resultEl.innerHTML = `
      <div class="catch-result-emoji">🎉</div>
      <h3>${poke.emoji} ${poke.name} was caught!</h3>
      <p class="catch-result-msg">
        <b>${poke.name}</b> joins your team!<br>
        Ability: <span style="color:var(--crystal)">⚡ ${poke.ability}</span><br>
        <em>${poke.abilityDesc}</em>
      </p>
      <div class="pokeball-dots" id="pregame-pokeball-dots"></div>
    `;

    // Mark as caught in grid
    renderStarterGrid();

    if (PREGAME_STATE.pokeballs > 0) {
      catchAgainBtn.style.display = 'block';
      catchAgainBtn.textContent = `🔴 Use Another Pokeball (${PREGAME_STATE.pokeballs} left)`;
    } else {
      catchAgainBtn.style.display = 'none';
    }
    doneBtn.textContent = `✅ Start My Journey! (${PREGAME_STATE.caughtPokemon.length} Pokemon caught)`;

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

  const regionData = qData.regions.find(r => r.id === regionId);
  if (!regionData) {
    alert(`No questions found for Region ${regionId} yet. Coming in Phase 2!`);
    return;
  }

  const gymData = regionData.gyms.find(g => g.id === gymId);
  if (!gymData) {
    alert(`Gym ${gymId} questions coming soon!`);
    return;
  }

  STATE.currentQData = [...gymData.questions];
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

  // Next gym button
  if (STATE.currentGym < 5) {
    nextBtn.style.display = 'block';
    nextBtn.textContent = `Next Gym ▶`;
  } else {
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
        <div class="poke-ability-desc">${p.abilityDesc}</div>
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
  document.getElementById('modal-ability-desc').textContent = pokemon.abilityDesc;

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
  const name = document.getElementById('host-name').value.trim();
  const code = document.getElementById('host-code').value.trim();
  const err = document.getElementById('host-err');
  const btn = document.getElementById('host-create-btn');

  if (!name) { err.textContent = '⚠️ Enter your name!'; return; }
  if (!code) { err.textContent = '⚠️ Enter a room code!'; return; }

  btn.textContent = '⏳ Creating…'; btn.disabled = true; err.textContent = '';

  try {
    STATE.isHost = true;
    STATE.roomCode = code;

    const room = {
      code,
      phase: 'lobby',
      currentRegion: 1,
      currentGym: 1,
      currentQ: 0,
      questionStartTime: 0,
      players: [{
        id: 'host_' + Date.now(),
        name,
        emoji: '👑',
        total: 0,
        correct: 0,
        isHost: true
      }]
    };

    await dbWriteRoom(code, room);

    document.getElementById('lobby-code-display').textContent = code;
    const base = location.href.split('?')[0].split('#')[0];
    document.getElementById('player-link-box').textContent = `${base}?room=${code}`;

    renderLobbySlots(room.players, 'host-slots');
    document.getElementById('host-lobby-status').textContent = '1/8 players joined';
    showScreen('screen-host-lobby');
    startPoll();
  } catch(e) {
    err.textContent = '❌ Error: ' + e.message;
    btn.textContent = '🚀 Create Room';
    btn.disabled = false;
  }
}

async function playerJoin() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim();
  const err = document.getElementById('join-err');
  const btn = document.getElementById('join-btn');

  if (!name) { err.textContent = '⚠️ Enter your name!'; return; }
  if (!code) { err.textContent = '⚠️ Enter the room code!'; return; }

  btn.textContent = '⏳ Joining…'; btn.disabled = true; err.textContent = '';

  try {
    const room = await dbReadRoom(code);
    if (!room) { err.textContent = `❌ Room "${code}" not found.`; btn.textContent='🚀 Join!'; btn.disabled=false; return; }
    if (room.players.length >= 8) { err.textContent = '❌ Room is full!'; btn.textContent='🚀 Join!'; btn.disabled=false; return; }

    const EMOJIS = ['🦁','🐯','🐻','🦊','🐼','🐸','🦋','🐬'];
    room.players.push({
      id: 'p_' + Date.now(),
      name,
      emoji: EMOJIS[room.players.length % EMOJIS.length],
      total: 0,
      correct: 0,
      isHost: false
    });

    STATE.roomCode = code;
    STATE.isHost = false;
    await dbWriteRoom(code, room);

    renderLobbySlots(room.players, 'player-slots');
    document.getElementById('player-lobby-status').textContent = `${room.players.length}/8 joined — waiting for Host…`;
    showScreen('screen-player-lobby');
    startPoll();
  } catch(e) {
    err.textContent = '❌ Error: ' + e.message;
    btn.textContent = '🚀 Join!';
    btn.disabled = false;
  }
}

function renderLobbySlots(players, containerId, max = 8) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < Math.min(max, 8); i++) {
    const p = players[i];
    const d = document.createElement('div');
    d.className = 'player-slot' + (p ? ' joined' : '');
    d.innerHTML = p
      ? `<div class="ps-emoji">${p.emoji}</div><div class="ps-name">${p.name}</div><div class="ps-tag">${p.isHost ? '👑 Host' : 'P'+i}</div>`
      : `<div class="ps-emoji" style="opacity:.3">❓</div>`;
    el.appendChild(d);
  }
}

function startPoll() {
  stopPoll();
  pollInt = setInterval(doPoll, 2000);
}

function stopPoll() {
  if (pollInt) { clearInterval(pollInt); pollInt = null; }
}

async function doPoll() {
  const room = await dbReadRoom(STATE.roomCode);
  if (!room) return;
  const cur = document.querySelector('.screen.active')?.id;

  if (cur === 'screen-host-lobby') {
    renderLobbySlots(room.players, 'host-slots');
    document.getElementById('host-lobby-status').textContent = `${room.players.length}/8 players joined`;
    document.getElementById('btn-start-mp').style.display = room.players.length >= 2 ? 'block' : 'none';
  }
  if (cur === 'screen-player-lobby') {
    renderLobbySlots(room.players, 'player-slots');
    if (room.phase === 'playing') { stopPoll(); startGym(room.currentRegion, room.currentGym); }
  }
}

function copyPlayerLink() {
  const url = document.getElementById('player-link-box').textContent;
  navigator.clipboard.writeText(url).then(() => {
    const ok = document.getElementById('copy-ok');
    ok.style.display = 'block';
    setTimeout(() => ok.style.display = 'none', 2500);
  }).catch(() => prompt('Copy this link:', url));
}

async function hostStartMP() { await doStartMP(); }
async function hostForceStart() { await doStartMP(); }

async function doStartMP() {
  stopPoll();
  const room = await dbReadRoom(STATE.roomCode);
  if (!room) return;
  room.phase = 'playing';
  room.questionStartTime = Date.now();
  await dbWriteRoom(STATE.roomCode, room);
  startGym(1, 1);
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
