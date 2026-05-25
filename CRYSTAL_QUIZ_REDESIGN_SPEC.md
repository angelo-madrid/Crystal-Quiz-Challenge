# Crystal Quiz Challenge — Economy, Learning & Story Redesign Spec

```
┌─────────────────────────────────────────────────────────────┐
│ DESIGN VERSION: v3.7   ·   LAST UPDATED: 2026-05-25          │
│ STATUS: active design bible (source of truth for DESIGN)     │
│ This file's version advances each design session that locks  │
│ decisions. CLAUDE.md carries a "Synced to SPEC: v3.X" line   │
│ — if it lags this number, CLAUDE.md is behind.               │
└─────────────────────────────────────────────────────────────┘
```

**v3.7 (2026-05-25):** BATTLE SESSION (Part 14G — fully locked). Boss/villain casting
(10 minor villains + Darkrai Big Boss R3/R7/R10 cameos, all from bench); boss reward
Pokémon (one offered per beatable fight, 10 total: 6 bench + 4 PH legendaries; keep-or-
release into normal team cap; only exception to uniqueness rule); battle structure (3v1
shared HP bar, simultaneous questions, N=3 minimum contribution per kid, Team Strike 3×
damage on all-correct); turn structure (simultaneous + random villain attack per round);
boss HP scaling (R1 500→R10 8,000; tune at playtest); boss enrage abilities (trigger at
50% HP, unique per boss; Darkrai Nightmare = harder questions + damage +50%); BATTLE-
ability population (all 193 Pokémon assigned, thematic not rarity-based; 7 abilities:
Critical Hit / Freeze-Stun / Heal / Protect / Guard / Second Wind-Revive / Combo-Team
Strike); ALLY mechanic = battle-only (gym phase stays individual); collective-clean = ⭐
star rating per fight (⭐⭐⭐ flawless / ⭐⭐ solid / ⭐ clear); R10 gate = every kid
fields a Legendary (Papa override if short); in-game Legendary reminders at R5/R7/R8.
Supersedes 14G placeholder.

**v3.6 (2026-05-25):** PRIZE NUMBERS (Part 13I) — Effort Score formula (0–100 rate-
based, age-fair), picks-per-effort (tight 2–4 band @ 40/60/80), team-tier thresholds
(Bronze 0 / Silver ~90 / Gold ~160), placeholder shelf prices (8k/20k/40k, tune vs
real inventory), per-game-day SHELF-STOCK refresh as the budget bound (crystals persist
per 12I; PRIZES/stock are what expire). Recognition HONORS (13K — cosmetic, mixed
performance+character; excellence seen not paid). Tier→category map + pick-spending
(13L — 1 pick = any unlocked tier you can afford; picks don't bank). SKU framework
(13M — per-SKU fields + tier composition rules + Gold-stock fairness; items/prices =
DESIGN pass). Real-peso budget model (13N — formula + tier→card-market mapping + raw-
only/Gold-cap discipline; card costs plug in). Pokémon TCG API integration (13O — build
scope: hybrid cache+refresh, auto-by-band eligibility + host filters + fulfilment veto,
fulfilment checklist; store = catalog+tracker, host buys locally). 5th TEAM PRIZE BONUS
tier (13P — boss-gated 3/6/10, ONE shared prize, crystals-free) + SIMPLIFICATION to
host-assigned gifts. BOSS CRYSTALS REMOVED (14B — bosses reward team prize + trophy, not
crystals; leveling unaffected, gym-only economy still affords the Pokemon ladder).
Formulas locked;
REAL BUDGET LOCKED (13Q — ₱800–1,200/kid cards (raised from ₱500, restores singles-lean:
Gold = real ex ~₱600); TEAM prize = grandparent-SPONSORED, NO host budget; tiers Floor 15/
Bronze 50/Silver 250/Gold 600, Gold=1-pick-max, planning-ceiling not hard cap; 3-kid run
≈₱2,400 cards). TIER VOUCHER model (13R — crystals buy Bronze/Silver/Gold tier vouchers
not cards directly; consolidate-or-spread agency; change persists; printable PNG keepsake
w/ unique anti-copy code; redeemed for real card at store later; two-gate preserved).
Supersedes v3.5.
**v3.6 release/categories update:** TEAM PRIZE = MYSTERY GIFT (13P — NO category choice/
menu/vote/tap; offering a choice on a SHARED prize creates kid-vs-kid winners&losers, the
exact dynamic the design removes). Trophy VISIBLE as PROGRESSION during play; end-of-game
BIG SHARED-SCREEN REVEAL (confetti + 3→6→10 journey + "Mystery Team Prize"); no screen
interaction beyond the celebration. HIGHEST-TIER-ONLY; gift ideally SPONSORED (e.g.
grandparents → STEM set). COLLAPSES the earlier 5-category menu + pick/tap/vote machinery.
**v3.5 (2026-05-25):** BOSS MECHANICS & CRYSTALS (Part 14) — closes the last economy
input. 10 winnable fights (R1–9 minor + R10 final) + R3/R7 unbeatable cameos; reward =
crystals + unique trophy pokemon (effort-points excluded to protect prize fairness);
flat base (5× region) + up to +50% COLLECTIVE bonus (no individual speed); full-game
range ~57k–116k crystals/kid. PRIZE PARITY LOCKED (14E/13E): fixed-price shelves +
earned picks → crystal gap is irrelevant to prize fairness. Supersedes v3.4.
**v3.4 (2026-05-25):** PRIZE STORE & BAYANIHAN mechanics (Part 13) — solves the UAT
social problem (crystal-comparison, age-fairness complaints, money-as-motivator).
Effort-not-score (age-fair blend A40/B35/C25/D0), team unlocks shelf tiers, 50/50
team/individual, one-currency two-gates (effort unlocks / crystals buy), guaranteed
finish-floor, no money framing, fair spend order (gap-closing all shelves + one-pick-
per-round on Gold). Supersedes v3.3.
**v3.3 (2026-05-25):** ECONOMY session — Path B earning (per-gym, accuracy-driven),
rarity-based pokeball ladder (replaces region-based), redeem-value model, trade-in
numbers, pity softener, **cap GROWS with player level 3→4→5** (supersedes the v3.2
"cap=3 locked"), upgrade-ladder progression spine (3 Legendaries by R10 for bosses),
prize-store backlog, **crystal persistence = lifetime wallet + redeem-and-burn, NO
cash-out (12I)**. Supersedes v3.2.
**v3.2 (2026-05-24):** catch mechanics (9 principles), snake-draft shared-exclusive
pool, team cap 3, cosmetic evolution (A1), 183-line library v2.0, Philippine R10,
document hygiene + versioning. Supersedes v3.1 (rarity-only, same day).
**Prior:** v3.1 — rarity/MOVE pairing/distribution · v3 — abilities, leveling,
appreciating-asset, battle system.
**Purpose:** Complete design decisions from the post-UAT redesign. Carry into
fresh Claude Code sessions, one feature at a time.

> **📐 SOURCE OF TRUTH (read this first) — 4-HOME MODEL (v3.6):** THIS SPEC owns all
> DESIGN (decisions, principles, mechanics, region themes). **CLAUDE.md** owns BUILD STATE
> (tech stack, conventions, git workflow, what's implemented + the Track-B architecture
> plan). **BACKLOG.md** owns the TODO list (all pending work — design + build + ops; the
> single source for "what's left"). **FILES.md** owns the MANIFEST (current file versions).
> Each points to the others; none duplicates another's content. When they could conflict,
> SPEC wins on design, CLAUDE.md wins on "what's live," BACKLOG.md wins on "what's pending."
> See Document Hygiene below.

> **DESIGN PHILOSOPHY (north star):** The point of the game is LEARNING. Every
> mechanic must reward answering correctly over rushing, teach without
> punishing, and protect emotionally-sensitive kids. UAT showed the old game
> rewarded rushing (kids raced for Pikachu’s ELIMINATE, ignored correctness;
> one kid cried over a wrong answer, another over STEAL). This redesign
> realigns everything around mastery, generosity, and teamwork.

> **CORE ABILITY MESSAGE (v3):** Abilities NEVER touch crystals. Abilities help
> you LEARN (answer questions / win badges) and WIN FIGHTS (defeat villains &
> bosses). Crystals are what you EARN for doing those things well.

-----

## 📐 DOCUMENT HYGIENE (source-of-truth rules)

**Why this exists:** in the catch-mechanics session, R10's Philippine theme was
missing from the working CLAUDE.md and nearly got overwritten with generic
legendaries. Root cause: design lived in two places that drifted. This section
prevents recurrence.

### Who owns what (no overlap)
- **THIS SPEC = DESIGN.** All locked decisions, principles, mechanics, the rarity
  grid, catch system, region themes (incl. R10 = Philippine), evolution rules.
  If a design decision isn't here, it doesn't exist. Cross-session brain. (The
  BACKLOG moved OUT to BACKLOG.md as of v3.6 — see below.)
- **BACKLOG.md = TODO.** The single source of truth for all pending work (design +
  build + ops). Was formerly split between SPEC + CLAUDE.md (caused drift); now its
  own home. Add pending items THERE, not here.
- **CLAUDE.md = BUILD STATE.** Tech stack, file structure, git workflow,
  conventions, and a short STATUS section (version + implemented-vs-designed). It
  REFERENCES the SPEC for design ("themes per SPEC Part 10C") and never restates
  design details. Prevents drift by not duplicating.
- **pokemon.json / game.js = LIVE TRUTH** for data/code — only updated when a
  decision is actually BUILT (via Claude Code).
- **Prompt files, POKEMON_LIBRARY_v2.md, etc. = DISPOSABLE SCAFFOLDING.** Snapshots
  that go stale on the next decision. Regenerate freely; never a source of truth.

### Refresh checklist — on every major design change
1. **SPEC** — ALWAYS for design. Record the decision + reasoning; update CHANGE LOG.
   (Backlog updates go to **BACKLOG.md** now, not here.)
2. **CLAUDE.md** — only its STATUS line, and only if implementation state changed
   (e.g. "designed" → "live"). Never copy design details in.
3. **Live data/code** — only when actually built, via Claude Code.
4. **Scaffolding** — regenerate as needed; don't maintain as truth.

### Start-of-session ritual (prevents stale-state bugs)
- Pull the LATEST repo CLAUDE.md (not an old upload) and the latest SPEC.
- If a design question arises, the SPEC is authoritative — if it's silent, decide
  and record it in the SPEC immediately.
- If CLAUDE.md and SPEC disagree on design, trust the SPEC and fix CLAUDE.md.

### Versioning (independent numbers + sync line)
- **SPEC = DESIGN version (v3.X).** Bump the MINOR each design session that locks
  decisions (v3.1 → v3.2 → …). Update the header date + the change-log line.
- **CLAUDE.md = BUILD version (v0.X.0)**, advancing when code SHIPS — a different
  clock. It also carries **`Synced to SPEC: v3.X`**.
- **The check:** if CLAUDE.md's "Synced to SPEC" < the SPEC's version, CLAUDE.md
  is behind — reconcile before trusting it. This one line is the staleness alarm
  that the R10 miss lacked.
- Do NOT force one shared number — design and build advance on different clocks;
  a single number would either lie about the build or stop tracking design.

-----

-----

## ⚡ v3.1 CHANGE LOG (POKEMON RARITY session — 2026-05-24)

Locked the three open rarity pieces. See new PART 10 for full detail.

- **Abilities per Pokemon = TWO (1 MOVE + 1 BATTLE).** Strict specialists ruled
  out (punish planning mistakes). BATTLE ability is a DEFERRED field until boss
  mechanics are designed. Constraint recorded: rarity gates the MOVE, NOT battle
  strength — battle power comes only from HP/XP (effort dial), so a Legendary and
  a Basic may share the same BATTLE ability.
- **MOVE↔rarity pairing locked** (sliding-window table). Leverage ranking:
  CLUE < CLOCK < SWAP < EXTRA SHOT < TIME TRAVEL < ELIMINATE. Ranked by LEVERAGE
  (desirability/swing), NOT magnitude — magnitude stays the player-level dial.
- **Distribution re-deal locked** = HYBRID model (safe difficulty-driven backbone
  + single R10 finale north-star teaser showcase). Replaces the unusable
  pokemon.json spread.

-----

## ⚡ v3 CHANGE LOG (what this revision supersedes)

This session locked major changes. Where v3 conflicts with earlier parts, **v3 wins**:

- **Ability categories reduced to 2: MOVES + BATTLE** (was the Part 5 ability list). “LIFELINE” was the working name → renamed **MOVES**.
- **AMPLIFIER-type abilities CUT** — no crystal betting/multiplying. **MULTIPLY and DOUBLE_OR_NOTHING removed.** (Supersedes Part 5 power ranking S-tier.)
- **STEAL removed; FREEZE-others CUT** (decision finalized; was “leaning cut”).
- **Consume-on-use ECONOMY REPLACED** by the appreciating-asset / XP-growth model (supersedes Part 3 “Use = consume” and burn-fuel ROI, and Part 7 refund math is now under review).
- **3/5-per-region leveling gate REMOVED.** Leveling now driven by cumulative badges → player level (supersedes Part 3 level-growth trigger).
- **Cumulative-badge rarity gating MERGED into player level** (supersedes Part 4 standalone thresholds 0–6/7–16/17–29/30+).
- **Villain fight mechanics now DESIGNED** (was deferred in Part 5d). See new PART 9.

-----

## PART 1 — BADGE SYSTEM (keystone)  *(stands)*

- **Badge = accuracy, not crystals.** `passed = gymCorrect >= 8`. Must get
  **8/10 correct**. Stop using badgeMin for pass/fail (keep field).
- **Badge bonus crystals:** at gym end if passed: 8/10 +baseCrystals×1.0,
  9/10 ×1.5, 10/10 ×2.0. Ledger type=‘bonus’, note “Badge bonus — N/10”.
- **No wrong-answer penalty.** Wrong = 0, no deduction. Encouraging framing
  (“The answer was X! 💪”), never “❌ Wrong”, no red “you lost” energy.
- **Badge pass-threshold = MASTER DIFFICULTY DIAL (v3):** 7/10 easy · 8/10
  normal · 9/10 hard · 10/10 insane. **Ships at 8/10.** 10/10 stays a
  bonus-reward tier (the ×2.0), never the default pass bar for this audience.
- **5 badges per region, 50 total** (v3: replaces any region-gate counting).

## PART 2 — SPEED BONUS REBALANCE  *(stands)*

“Answers first, speed secondary.” Cut from ~50% to **20% of baseCrystals**.
New speedMax: R1 20, R2 30, R3 40, R4 60, R5 80, R6 110, R7 140, R8 180,
R9 230, R10 300. Correct answers only. Keep TIME-ability cap (originalTimeLimit).
Remove dead TIER_BASE/TIER_SPEED_MAX. Speed bonus is one of the four honest
crystal channels (see Part 3A).

## PART 3 — POKEMON AS APPRECIATING ASSET (v3 REWRITE)

> **SUPERSEDES the old consume-on-use / burn-fuel economy.** Kids wanted to
> GROW Pokemon through use, not lose them. This matches real Pokemon play and
> teaches treating Pokemon as an appreciating asset, not a spend.

**3A — How crystals grow (the ONLY four honest channels):**
Crystals grow ONLY through: **(1) speed bonus · (2) badges earned · (3) leveling
Pokemon · (4) defeating villains/bosses.** Every channel traces back to learning
or teamwork. **Abilities never generate or manipulate crystals.** No betting.

**3B — Appreciating-asset core loop:** CATCH → USE (ability) + ANSWER CORRECTLY
→ Pokemon gains XP → GROWS (more HP, stronger battle impact). Using an ability
no longer consumes the Pokemon. **Wrong answer after using = neutral** (no XP,
never shrinkage). Growth-or-nothing, never loss.

**3C — HP & XP structure (see Part 8 for numbers):**

- **Level (1–5) = band + ability tier.** Equals player level (single gate).
- **HP varies PER-POKEMON within the band**, by **rarity** (start position) +
  **accumulated XP** (climb via skilled use). Same level across team, but HP
  differs per Pokemon.
- **Two separate dials (do NOT double-scale):** Level → ability TIER (what it
  does); HP/XP → MAGNITUDE (how hard it hits in battle).

**3D — Starter:** still ability-only, 0 redeem value (confirm at build).

**OPEN (backlog):** catch cost per rarity/region; redeem value model (old
baseValue = catchCost × rarityPremium needs rework under XP-growth); whether the
old pokeball-cost ladder (R1 300 … R10 10000) still applies.

## PART 4 — RARITY & LEVELING (v3 UNIFIED MODEL)

> **SUPERSEDES Part 4’s standalone badge thresholds AND Part 3’s 3/5 level gate.
> Leveling and rarity access are now ONE system driven by player level.**

- **Player level (from cumulative badges) is the SINGLE master gate.** It sets:
1. **Ability access** — L1 player uses L1 abilities … L5 uses L5.
1. **Rarity access** — which Pokemon you may catch.
1. **Pokemon level** — whole team is ALWAYS exactly the player’s level.
- **Whole team = player level.** A Basic caught at L1 becomes L4 when player
  hits L4. Newly-caught Pokemon are born at the player’s current level.
- **Rarity’s only lasting effects:** (1) gates WHEN you can catch it, (2) which
  ABILITIES + redeem value it carries, (3) HP start-position within the band.
  Rarity does NOT give a different level from the rest of the team.

**Access ladder:**

|Player Level|Can catch up to       |Abilities up to|HP start in band|
|------------|----------------------|---------------|----------------|
|L1          |Basic                 |L1             |bottom          |
|L2          |Holo                  |L2             |~25%            |
|L3          |Rare                  |L3             |~50%            |
|L4          |Super Rare            |L4             |~75%            |
|L5          |Legendary (Ultra Rare)|L5             |top             |

**Difficulty via badges-to-L5 (the L5 threshold is the dial):**
Easy 25 · **Normal 35 (default)** · Hard ~40+.

**Normal curve (front-loaded — quick early wins, hard final climb):**

|Player Level|Cumulative badges|≈ reached    |
|------------|-----------------|-------------|
|L1          |0–4              |start        |
|L2          |5–11             |~Region 2    |
|L3          |12–20            |~Region 4    |
|L4          |21–34            |~Region 6–7  |
|L5          |35+              |~end Region 7|

L5 ~Region 7 leaves R8–10 to enjoy max power & prep finale. ELIMINATE (needs L3)
unlocks ~12 badges (~R4); Legendary catch ~35 badges (~R7).
**Locked Pokemon shown greyed “🔒 Reach Level N”** (visible goal; reuses pattern).
**Boss-reward exception:** beating a villain → chance to catch higher rarity
right after (confirm interaction at build).

## PART 5 — MOVES (quiz abilities)  *(v3 — replaces old Part 5 ability list)*

**Purpose:** help the player answer questions & win badges. Gym = 10 questions,
need 8 correct. **Abilities never touch crystals.** Level = player level.

**The 6 MOVES:**

1. **⭐ ELIMINATE** *(prized; only on Pokemon usable at L3+)* — attacks the
   answer options. L3: clear wrongs on 1 question · L4: 2 questions · L5: reveal
   correct answer BUT kid still taps it (learning preserved; “Did You Know”
   still shows).
1. **⏱️ CLOCK** *(absorbs old FREEZE + THINK)* — time as **% of the question’s
   own limit** (scales Junior/Senior). L1 +15% · L2 +30% · L3 +50% · L4 +75% ·
   **L5 STOP TIMER**.
1. **⏪ TIME TRAVEL** *(fix the past)* — redo wrong questions, **including from
   prior completed gyms** (can convert 7/10→8/10 for a badge). L1:1 → L5:5.
   ⚠️ **Deliberately breaks forward-only. Biggest structural build** — see flag.
1. **🔄 SWAP** *(change the present)* — skip current question for an easier one.
   Restarts full timer. Full crystal credit. **Crystal-neutral (no bonus
   crystals).** L1 same-tier · L2 one tier easier · L3 two tiers easier · L4
   basic · L5 basic + more control (small choice / friendly format). Tiers:
   basic → holo → rare → super → ultra.
1. **➕ EXTRA SHOT** *(add a future chance)* — bonus questions that **only count
   UP toward 8, never grow the denominator**; excluded from TIME TRAVEL. L1:1 →
   L5:5. Preserves badge = mastery.
1. **💡 CLUE** — 3 content tiers (vague/medium/strong) mapped L1–2 vague, L3–4
   medium, L5 strong. **Content-gated → build Regions 1–2 first.** Authored
   alongside “Did You Know” (same pipeline). See Content Backlog.

*Differentiation:* TIME TRAVEL = past · SWAP = present · EXTRA SHOT = future ·
ELIMINATE = attacks answer · CLOCK = attacks timer · CLUE = teaches toward answer.

**RESOLVED (v3.1, see Part 10):** ability-to-rarity pairing → locked (sliding
window, Part 10B); abilities-per-Pokemon → TWO, 1 MOVE + 1 BATTLE (Part 10A).
**STILL OPEN:** whether ALLY/teamwork survives as a MOVES targeting option or
lives only in battle.

## PART 6 — TEACHING MOMENT → “DID YOU KNOW”  *(stands; relabeled)*

Flow: Answer → reveal → 📖 **“Did You Know”** box (explanation + fun fact) → kid
reads at OWN pace → taps [Next Question →]. Shows for right AND wrong. Content =
2–3 sentence explanation + 1 fun fact, encouraging tone, graceful fallback if
absent. **Pacing:** timed question UNCHANGED; box self-paced/UNTIMED; host NEVER
forces forward; host pause freezes each kid’s question timer. Schema: add
`explanation` + `funFact` per question. **Pilot R1 first**, then scale to 1,458.
**Shares content pipeline with CLUE (see backlog).**

## PART 7 — TEAM CAP & RELEASE  *(v3.2 — cap reasoning locked)*

- **Cap = 3 *(⚠️ SUPERSEDED by v3.3 Part 12E — cap now GROWS 3→4→5 with player
  level; see there)*.** [Original v3.2 reasoning retained below for history.] Set by the catch-mechanics
  principles (Part 11, Principle 4). Earlier this session we reasoned toward 4
  (deep growth + flex slot); the user then set 3 as a tighter investment balance.
  3 is humane *because* of the trade-in model (release isn't a loss), and it
  cleanly matches "3 ability helps per 10-question gym" (Part 11 Principle 5).
- **RELEASE = TRADE-IN VALUE (LOCKED framing).** Releasing a grown Pokemon is
  NOT a loss — it's a trade-in, like an old cherished car toward a newer, more
  powerful one. A grown Pokemon (high XP/HP) is worth MORE on release, and that
  value funds the next catch. This is what lets a tight cap of 4 stay humane:
  growth is never wasted even when you let a Pokemon go. Reframes hold-vs-release
  from "abandon" to "cash in accumulated effort."
- ⚠️ **The cap number and the release-value model are ONE decision** — a tight
  cap only stays humane if release returns real value. So the refund/trade-in
  math is designed in the ECONOMY session (next), alongside redeem value.
- **DEFERRED to economy session:** exact trade-in/refund math (old L1 20%…L5 80%
  ladder to be revisited under XP-growth); whether a protected "starter slot"
  sits outside the 4 (so a first companion never gets traded); whether the cap
  grows with player level (3→4→5). All parked next to trade-in value because they
  interact.
- **Confirmation-required release** to prevent accidents *(stands)*. Framing
  should read as trade-in / "sending them to train", never "delete/lose".

## PART 8 — HP, XP & DAMAGE NUMBERS  *(NEW in v3)*

**Target duel length:** ~10 rounds.
**HP = the single strength stat (INPUT). Attack damage = OUTPUT, derived from
HP** (default ~20% of current HP). One number drives survivability AND hitting
power — growing a Pokemon improves everything. No separate attack stat.

**HP bands by level (default — retunable):**

|Level|HP band (low→high)|≈ survivable misses|
|-----|------------------|-------------------|
|L1   |100–140           |~3–4               |
|L2   |150–210           |~4–5               |
|L3   |220–300           |~5–6               |
|L4   |310–410           |~6–8               |
|L5   |420–550           |~8–11              |

**Start position in band by rarity:** Basic bottom · Holo ~25% · Rare ~50% ·
Super ~75% · Legendary top.
**XP climb:** “use ability + answer correctly” → ~+5–10 HP, climbs within current
band to ceiling. **Effort closes the rarity gap** (a well-used Basic can rival a
fresh Rare — protects the hard-working kid).

**XP CURVE (v3.6 — LOCKED):**
- **1 XP event = use a MOVE ability AND answer that question correctly** (Part 11 P6).
- **~10 XP events climb a full band** (start-position → band top). Achievable in ~1
  region of active use (5 gyms × ~3 ability uses, when correct). Tunable constant.
- **xpRatio ∈ [0,1]** = `min(1, xpEvents/10)`. Position in band =
  `startRatio + (1−startRatio) × xpRatio`, where startRatio is the rarity start (below).
  HP = `bandLow + (bandHigh−bandLow) × position`.
- **HP gain per event** ≈ band-width ÷ 10 (L1 ~4 → L5 ~13 HP/event — scales with band).
- **Verified — effort closes the gap:** a fully-grown Basic (xpRatio 1 → band top) BEATS
  a fresh Rare (xpRatio 0 → 50% of band) at EVERY level (e.g. L5: grown Basic 550 vs
  fresh Rare 485). The hard-working kid's care literally out-muscles a luckier catch.
- **redeemValue / tradeIn (Part 12) read this same xpRatio** — so growth raises both
  battle power AND cash-in value from one effort track. No separate dials.
**Damage tuning knob:** one enemy hit ≈ 35 dmg (sets the survivable-misses
column). Single lever to lengthen/shorten all duels.
⚠️ **Tuning watch:** low level → low HP → low attack = struggling kid is doubly
behind. Guardrails 1 & 5 (Part 9) protect against this. **Test lowest-level kid
vs matched enemy** when tuning real numbers.

## PART 9 — VILLAIN FIGHT / BATTLE SYSTEM  *(NEW in v3 — was deferred 5d)*

**Structure — parallel duels:**

- Each kid fights their OWN counterpart enemy Pokemon. Villain/boss fields **one
  enemy per player** (scales to room size).
- **One Pokemon per player, NO substitutions** — send your strongest (your
  best-grown asset). Faint → only a teammate’s heal/revive saves you.
- **Win condition:** boss falls only when **ALL** enemy Pokemon are defeated.
  Strong players must support weak ones to clear the board → bayanihan.
- **Game-over:** if the team can’t clear all enemies → **immediately
  re-attemptable** boss fight, framed collectively (“the villain got away —
  train together and try again!”). Recoverable, never a hard wall.
  ⚠️ Re-attempt path interacts with forward-only — define at build.

**Combat loop:** real-time **parallel question streams**. **Correct = your
Pokemon attacks; wrong = enemy attacks you (HP damage).** Abilities modify.

**Cross-player help:** reviving/healing a teammate **costs the helper a
turn/action**, done between their own questions → real tradeoff (help them vs.
push my own duel). Support-NOT-substitution: a weak kid can be helped (revived/
healed) but must still defeat their OWN enemy (answer correctly). Teaches pulling
your weight + not slacking in a group.

**BATTLE abilities (8, trimmed from a 14 pool):**

|⚔️ ATTACK                                                                        |🛡️ DEFEND                                                                                  |
|--------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
|**Basic Attack** — correct answer damages enemy (scales w/ HP)                  |**Heal** — restore HP                                                                     |
|**Critical Hit** — correct AND fast = bonus damage *(rewards mastery)*          |**Protect** — reduce damage; immunity at high level                                       |
|**Freeze/Stun** — cancel enemy’s attack turn *(control)*                        |**Guard** — take a hit for / shield a teammate *(teamwork — mandatory)*                   |
|**Combo/Team Strike** — kids stack correct answers into one big hit *(teamwork)*|**Second Wind/Revive** — return a downed teammate at partial HP *(safety net — mandatory)*|

*Backups (cut from ship set):* Poison, Weaken/Expose, Charge/Overload (attack);
Hypnosis, Reflect/Counter, Calm/Steady (defend).

**HP model:** per-kid (Part 8). HP tied to the one Pokemon you field. Wrong answer
→ HP damage. All-fainted = rely on teammate revive (no bench).

**PROTECTING THE VULNERABLE KID (mandatory guardrails — the parallel-duel
shared-failure structure points a loaded gun at the weakest kid; these defuse it):**

1. **Invisible difficulty-match:** each kid’s counterpart poses questions from
   THEIR band/level — personally winnable. Strong kids get tougher counterparts.
   Never shown.
1. **Collective defeat framing:** loss is the VILLAIN’s, never a kid’s. No
   per-duel results on the loss screen.
1. **Recoverable game-over:** immediate re-attempt, low emotional stakes.
1. **Revive/heal capped** so it’s support not full substitution, but generous
   enough that a stuck kid gets real help. (Tuning = the whole ballgame.)
1. **Team-lift assist (LOCKED):** each duel won → remaining enemies get a small
   cumulative debuff, surfaced as “your team’s spirit is lifting [teammate]!” —
   the struggling kid still lands their own final blows (answers correctly), but
   the team’s effort tilts it winnable. Bayanihan made mechanical.

**VILLAIN ARC (stands from 5d):** R1–9 minor villain each. Big Boss CAMEOS R3 &
R7 = UNBEATABLE (scripted loss, builds dread/hype). R10 Pilipinas FINAL SHOWDOWN
= beatable only with enough cumulative badges (mastery) AND a well-cared-for
(high-XP/HP) Pokemon. “Bayanihan.” The whole economy is the literal win condition.

-----

## PART 10 — POKEMON RARITY (v3.2 — LOCKED)

> Settles the three open rarity pieces. Economy (redeem value, catch cost,
> Part 7 refund) was deliberately deferred to AFTER rarity, since the math
> depends on what each rarity carries.

### 10A — Abilities per Pokemon: TWO (1 MOVE + 1 BATTLE)

Each Pokemon carries **two distinct abilities**: one MOVE (gym phase) and one
BATTLE ability (villain phase). Reasoning trail:

- **Strict specialists RULED OUT** — forcing a kid to reserve scarce team slots
  (cap 4) for a phase they may rarely use punishes a *planning* mistake with
  finale defeat. That's the "punish without teaching" failure mode the redesign
  exists to kill.
- "One identity expressed in both phases" considered and rejected — the 6 MOVES
  vs 8 BATTLE abilities don't map 1:1, forcing arbitrary translations.
- **BATTLE ability is a DEFERRED FIELD.** Battle *frequency* is a boss-mechanics
  question (deferred by user). We do not need it to fix ability COUNT, because
  the composition trap only existed under specialists. So: author the MOVE↔rarity
  layer now; populate each Pokemon's BATTLE ability when boss mechanics are
  designed.

⚠️ **RICH-GET-RICHER GUARDRAIL (constraint for the future battle session):**
Rarity gates the **MOVE**, never battle strength. BATTLE abilities must stay
**magnitude-neutral across rarities** — battle power comes ONLY from HP/XP (the
effort dial). A Legendary and a Basic may carry the SAME battle ability; the
Legendary merely starts with more HP, and a well-grown Basic catches up. This
preserves "effort closes the gap" (Part 8). Do NOT let BATTLE abilities rebuild a
rarity power ladder.

### 10B — MOVE ↔ RARITY pairing (sliding-window, LOCKED)

**Leverage ranking** (weakest→strongest *desirability/swing*, NOT magnitude —
magnitude is the player-level dial, do not double-scale):
`CLUE < CLOCK < SWAP < EXTRA SHOT < TIME TRAVEL < ELIMINATE`

ELIMINATE is the emotional apex (UAT: kids raced for it), not the mechanically
strongest (that's arguably TIME TRAVEL). Scarcity tracks desire.

**Distribution shape:** premium moves exclusive, basic moves widespread. Each
tier draws from a **sliding 2–3 move window** on the ladder, climbing with rarity.
Adjacent tiers OVERLAP so no move is hyper-scarce and tiers feel related.

| Rarity      | Catch at | MOVE pool                          |
|-------------|----------|------------------------------------|
| Basic       | L1       | CLUE, CLOCK                        |
| Holo        | L2       | CLOCK, SWAP                        |
| Rare        | L3       | SWAP, EXTRA SHOT, **ELIMINATE**    |
| Super Rare  | L4       | EXTRA SHOT, TIME TRAVEL, ELIMINATE |
| Legendary   | L5       | TIME TRAVEL, ELIMINATE             |

- ELIMINATE first appears at **Rare (L3)** — matches its hard L3+ constraint AND
  lets a kid USE it the moment their level earns it (Legendary-only was rejected:
  it would strand the L3 unlock for ~3 regions).
- ELIMINATE/TIME TRAVEL power still scales by PLAYER LEVEL, so a Rare ELIMINATE
  and a Legendary ELIMINATE differ only because the holder is higher-level by the
  time they own the Legendary. No double-scaling.
- CLUE sits only on Basic (content-gated; R1–2 pilot first — fine).

### 10C — DISTRIBUTION RE-DEAL (HYBRID model, LOCKED)

> R10 — 🇵🇭 PILIPINAS (Philippine finale, LOCKED). 10 Filipino-mythology
> legendaries — Bakunawa, Minokawa, Sarimanok, Maria Makiling, Maria Sinukuan,
> Tikbalang, Sarangay, Diwata, **Bathala** (supreme creator — apex), **Mayari**
> (moon goddess, pairs with Bakunawa) — all authentic; + 8 real PH endemic fauna as
> Super/Rare (Philippine Eagle, Tamaraw, Philippine Crocodile, Carabao, Visayan
> Warty Pig, Cloud Rat, Philippine Tarsier, Palawan Peacock-Pheasant). Majestic/
> heroic only — NO scary aswang/manananggal horror folklore (kid-appropriate).
> Adds real biodiversity/conservation education. ⚠️ Mythology drawn from general
> knowledge — USER to verify cultural accuracy. The 18 generic creatures formerly
> in R10 → BENCH (candidate boss pool / future expansion; pokemon_v2_final.json
> `bench_displaced`). Legendary count preserved at 29 (one-for-one swap).
> R7 legendaries = 3 (intentional: legendary on-ramp; few kids are L5 yet so the
> ≥5 buffer doesn't bind until R8).


> ⚠️ **COUNT SUPERSEDED (v3.1, Part 11 Principle 9):** the per-region SHAPE below
> (rarity climbs by region, gate-as-ceiling, finale north-star) still holds, but
> the COUNTS were set when we assumed ~100 regional / 10-per-region with a
> *personal* pool. The later SHARED EXCLUSIVE pool decision raises this to
> **~18/region (~180 regional)** with a choice-buffer and **8–10 late-region
> legendaries**. Use Part 11's pool-size rules as the binding count; keep 10C's
> SHAPE/curve logic. The two must be reconciled when the library is rebuilt.

Replaces the unusable pokemon.json spread (R1 had 2 legendaries, some regions 0
commons, 28 legendaries). Two stacked layers:

**Layer 1 — safe difficulty-driven backbone.** Difficulty climbs R1→R10 and
drives the rarity mix; the player-level access gate acts as a **CEILING** so a
region never offers a rarity the expected level can't catch. Within a region,
locked ❓ boxes appear ONLY for the next tier just barely ahead — never long-range
dangling. (Decision: "difficulty determines both questions AND rarity" honored as
difficulty-drives-mix with gate-as-ceiling, NOT difficulty-runs-ahead.)

**Layer 2 — single R10 finale north-star.** The only exception to "don't show
what you can't catch": the **5 Region-10 finale Legendaries** appear early as
mystery ❓ boxes in a persistent "🏆 Pilipinas Finale" showcase (map/dashboard,
~R3 onward), framed "🔒 Reach the final region to discover." One shining goal for
the whole climb — aspiration focused on a destination, not a wall of locks.
(Rejected "Grid B" — full ladder dangled every region — as the out-of-reach
pattern that made a UAT kid cry.)

**Per-region counts** (B/H/R/S/L = Basic/Holo/Rare/Super/Legendary):

| Region | Exp. level | B  | H  | R  | S  | L  | Notes                         |
|--------|-----------|----|----|----|----|----|-------------------------------|
| R1     | L1        | 10 | –  | –  | –  | –  | all Basic; on-ramp            |
| R2     | L2        | 7  | 3  | –  | –  | –  | Holo arrives                  |
| R3     | L2–3      | 5  | 4  | 1  | –  | –  | first Rare                    |
| R4     | L3        | 4  | 4  | 2  | –  | –  | Rare established              |
| R5     | L3        | 3  | 4  | 3  | –  | –  | Rare-rich                     |
| R6     | L4        | 2  | 3  | 3  | 2  | –  | Super arrives                 |
| R7     | L4–5      | 1  | 2  | 3  | 3  | 1  | first catchable Legendary     |
| R8     | L5        | 1  | 1  | 3  | 3  | 2  | all tiers live                |
| R9     | L5        | –  | 1  | 2  | 4  | 3  | top-heavy                     |
| R10    | L5        | –  | –  | 2  | 3  | 5  | finale — north-star legends   |
| **Tot**|           |**33**|**22**|**19**|**18**|**11**| **103**                   |

- R10 is rare-only (treasure vault) — no Basics/Holos; every kid is L5 by then.
- **Legendary total = 11** (scarce enough to stay special vs Grid B's deflating
  16). User OK'd ~103; trivially trimmable to exactly 100 if desired at build.
- ❓ locked boxes framed as discovery ("Reach Level N to discover!"), never denial.

### 10D — NEW BUILD ITEMS surfaced this session

1. **pokemon.json rarity re-deal** (data) — re-tag the regional Pokemon to the
   10C grid. Cheap data edit. Must also assign each a MOVE per the 10B pool.
2. **🏆 Pilipinas Finale showcase** (UI) — NEW persistent cross-region component
   showing the 5 R10 legendaries as ❓ teasers. NOT the existing per-region
   locked-box pattern. Can ship later/polish phase; degrades gracefully to
   pure-backbone (legendaries hidden until R10) if deferred.
3. **BATTLE-ability slot** (deferred) — populate per Pokemon when boss mechanics
   are designed, honoring the 10A rich-get-richer guardrail.

### 10E — RESOLVED in v3.3 (see PART 12 — ECONOMY)

- ~~Redeem value per rarity/level under XP-growth~~ → Part 12D.
- ~~Catch cost per rarity/region~~ → Part 12C (rarity-based; old region ladder dead).
- ~~Part 7 release/refund rework~~ → Part 12F.
- ~~Starter redeem-value confirm~~ → 0, Part 12D. Final 100-vs-103 trim → still parked.

-----

## PART 11 — CATCH MECHANICS PRINCIPLES (v3.2 — LOCKED)

> User-authored principles that govern all catch decisions. Open catch questions
> (scramble/race rule, catch timing, ball-burn punishment, catch cost) are to be
> answered by RUNNING THEM THROUGH these principles, not decided ad hoc.

**PRINCIPLE 1 — Endemic, level-appropriate regions (LOCKED).**
Every region's Pokemon are UNIQUE to that region (no Pokemon appears in two
regions — clean partition). A region holds ONLY rarities appropriate to its
level: if a region's level can't support a rarity, that rarity simply doesn't
exist there (e.g. NO Legendary lives in Region 1). This is the PRINCIPLE BEHIND
the hybrid grid (Part 10C) — rarity climbs with region because rarity is
region-appropriate, not because legendaries were "moved." Consequence: kills the
re-deal duplication problem — each creature is assigned to exactly one region
whose rarity band it matches.

> (More principles incoming — user is authoring the set.)

**PRINCIPLE 2 — Catch loop (LOCKED).** To catch: BUY a pokeball → throw at an
available wild pokemon → answer its catch-question. Correct = caught. Wrong =
pokemon STAYS available, ball is lost, kid may re-buy and retry the SAME pokemon
(Tension A resolved: no "ran away forever," no single catastrophic loss; the
cost + harder questions provide the "bet" stakes).

**PRINCIPLE 3 — Pokeball cost scales with rarity (LOCKED structure; numbers
pending economy session).** Higher tier = pricier ball + harder catch-question.
The ball is a "bet" whose stakes scale with the prize. Recommended ladder
(ratios matter; absolute numbers TBD vs final crystal earn-rates):
Basic 50 (~85%) · Holo 150 (~80%) · Rare 400 (~70%) · Super 1000 (~60%) ·
Legendary 2500 (~50%). Expected crystals-to-catch ranges ~59 (Basic) → ~5000
(Legendary). OPTIONAL pity-softener (easier Q bank after N consecutive misses) —
flagged for playtest.

**PRINCIPLE 4 — Team cap *(⚠️ SUPERSEDED by v3.3 Part 12E — cap GROWS 3→4→5 with
player level)*.** [v3.2 reasoning retained:] A kid holds up to 3 pokemon at any time. The trade-in model (Principle 7) is what
makes 3 humane — releasing isn't a loss. To catch a 4th, must release one.

**PRINCIPLE 5 — Gym ability use: NO COOLDOWN; each pokemon's ability fires ONCE
per gym (LOCKED).** Over a 10-question gym, a full team of 3 → up to 3 ability
helps (~3/10 questions assisted). Self-balancing via the cap (3 pokemon = 3 uses)
— no separate cooldown rule. Using all 3 also lets all 3 earn XP that gym. This
is the core reason to invest crystals in catching/holding pokemon.

**PRINCIPLE 6 — XP growth (LOCKED, from v3 Part 3/8).** A pokemon earns XP when
BOTH: its ability is chosen for a question AND the player answers correctly.
Extends naturally to post-gym moves (each creates a question+answer moment).

**MOVE TIMING — two natural categories (no imposed rule; bucket = which move a
pokemon has):**
- IN-QUESTION (fire on a live question): ELIMINATE, CLOCK, SWAP, CLUE.
- POST-GYM (fire on the gym outcome, via prompt): EXTRA SHOT, TIME TRAVEL.
  A kid is PROMPTED after a gym to use these (see post-gym rule, pending tap).
  ⚠️ COVERAGE NOTE: EXTRA SHOT/TIME TRAVEL live only on Rare+ tiers, so low-level
  kids (all Basic/Holo team) can't field a post-gym rescue. Watch whether this
  disadvantages the struggling kid; may need a baseline retry for all.

**PRINCIPLE 8 — Starting pokeballs = 1 free (LOCKED; was 3).** No starting
crystals means a 2nd attempt was never affordable anyway, so 1 is honest. Next
catch chance comes after Gym 1 once the kid has earned crystals to buy balls.

**PRINCIPLE — Catch timing (LOCKED):** catch (a) pre-game with the 1 free ball;
(b) after every completed gym, using own crystals, no limit on balls bought
(crystals are the gate); (c) always bounded by the team cap (grows 3→4→5 with
player level, Part 12E) — exceed only by releasing.

**PRINCIPLE 7 — Trade-in on release (LOCKED structure; numbers pending economy).**
"Cherished car" model: release returns a DISCOUNTED crystal value, BOOSTED by how
much the pokemon was GROWN (XP). Recommended: base 40% of ball cost (ungrown) →
up to 80% (fully grown). Never exceeds a fresh ball's cost (no farm exploit).
Growth is never wasted; trading up partially self-funds.

*RELEASED = GONE FOREVER (LOCKED).* A released species is removed from the room's
shared pool permanently — no other kid can ever catch it again, no reset, no
recirculation. Maximizes uniqueness ("what you had was truly singular") and keeps
the model simple (no reset/inheritance/recirculation logic). Makes release a
weighty choice (it's gone from the whole room), reinforcing the cherished-car
gravity. Confirm-on-release guard (already locked) prevents accidental permanent
loss. SAFE because the economy discourages churn (grown = valuable, trade-in
discounted, cap-of-3 bonding all push toward HOLDING).
⚠️ WATCH (economy session): if releases turn out COMMON (not rare), "gone forever"
could starve the ~182 pool — re-examine pool size or switch to recirculation.
Tune the economy so releasing is RARE (only to trade up a tier).

**ABILITY-USE UI GUARD (LOCKED):** choosing to use an ability shows a brief
confirm so a kid can't misclick away a pokemon's single per-gym use.

**POST-GYM MOVES — RESCUE-ONLY (LOCKED).** EXTRA SHOT and TIME TRAVEL are
offered ONLY when the badge was MISSED (<8/10) AND the badge is still
mathematically reachable with that move. NOT available after a pass (prevents
XP/crystal farming and gap-widening; keeps the moment dramatic). When TIME TRAVEL
fixes a past answer, frame as LEARNING ("You got it right this time! 🎉") so the
rescue reinforces mastery. Do not dangle the prompt when the badge can't actually
be reached.

**MOVE TIMING — NO IMPOSED RULE (LOCKED).** Bucket = which of the 6 moves a
pokemon carries; each fires when it physically can (in-question moves during the
gym, post-gym moves on the outcome). Simplest model, no edge cases.

**PRINCIPLE 10 — Cosmetic evolution (A1, LOCKED).**

A caught pokemon VISIBLY EVOLVES as the PLAYER levels up — your Charmander
becomes Charmeleon then Charizard as you climb L1→L5. The creature YOU raised
transforms (the personal-bond fantasy), not "evolved forms appear in later
regions."

*Two INDEPENDENT ladders (do not conflate):*
- **Rarity tier** — fixed at catch (Basic/Holo/Rare/Super/Legendary). Sets price,
  catch-question difficulty, region, HP band. NEVER changes.
- **Evolution stage** — 1–3 cosmetic stages (real Pokédex chains; max 3),
  revealed by PLAYER level. Picture-only; does NOT change tier/power.
  Mapping: 3-stage → s1 at L1-2, s2 at L3-4, s3 at L5; 2-stage → s1 L1-3, s2 L4-5;
  1-stage → never changes.

*TIER BY FINAL FORM (LOCKED).* A line's tier = its FINAL form's prestige, so a
humble Charmander is RARE (because Charizard is rare-tier), caught in a Rare
region at Rare price. Rationale: keeps the rarity system COHERENT — tier reliably
signals power, so pokeball pricing, HP bands, draft buffer, and access gate all
keep their anchor. (Rejected tier-by-base-form: a Basic→Dragonite would make
"tier" meaningless and detonate the economy/draft/HP systems. Equity is already
served by other levers — gap-closing draft, trade-in, effort-XP — so we don't
sacrifice tier coherence to buy equity twice.)

*MANDATORY CATCH-PREVIEW (LOCKED).* The catch screen MUST show the evolution
destination ("Charmander → ✨Charizard") so the Rare price of a humble base form
is legible — the kid sees they're investing in the Charizard.

*Scope:* legendaries are SINGLE-STAGE (don't evolve — already final). Lower tiers
carry the multi-stage chains. Authentic Pokédex evolution only.

*BUILD COST (accepted):* catchable entries are now LINES (catch the base form);
evolved forms are RESERVED (never separately catchable); each line needs art for
every stage; the catch UI re-renders the owned creature per player level. Roster
rebuilt as 183 LINES with {fixed tier, 1–3 stages}.

**PRINCIPLE 9 — Shared EXCLUSIVE pool + gap-closing snake draft (LOCKED).**

*Why exclusive:* the GOAL is UNIQUE OWNERSHIP, not competition. No two kids ever
own the same species, so a caught pokemon feels truly "mine," kids invest in
growing it, and there's no "my Pikachu vs your Pikachu" comparison/fighting.
(Abilities are deliberately NOT unique — many pokemon share the same MOVE — so a
kid can always get a given ability via a different species. Species unique,
abilities shared.)

*The model (NBA-fantasy snake draft with two twists):*
- After each gym, a CATCH PHASE opens. All kids see the SAME shared regional pool
  (sorted by rarity; tiers above a kid's level shown as locked ❓). Claimed
  species are removed permanently — persistent shared stock.
- **Draft order is GAP-CLOSING (lottery-style):** lowest player level picks
  first, ties broken by fewest crystals. Order SNAKES (reverses each round) so
  the first picker isn't perpetually advantaged. Shown transparently on the host
  dashboard ("Catch order: …"). Kids may PASS.
- **A pick is NOT automatic — it must be EARNED.** Claiming gives the RIGHT TO
  ATTEMPT: the kid buys a pokeball + answers the catch-question. Correct = caught,
  removed from pool forever (unique). Wrong = pokemon stays, re-buy & retry
  (Principle 2). So the draft sets order+exclusivity; the quiz gates the catch.
- A kid can only claim pokemon at/below their player level (access gate).
- Soft per-turn timer (gentle, non-punishing) to keep pacing.

*Why this beats a speed scramble:* delivers identical unique ownership WITHOUT
"fast beats slow." Speed-resolution would structurally make the struggling kid
lose every contested catch (the UAT-cry pattern) and stack a 2nd disadvantage on
a lower-level kid; it also turns catch-questions into reflex tests, killing the
learning moment. Gap-closing draft = anticipatory excitement (board-game "is it
still there when my turn comes?"), which suits ages 9–13 better than reactive
speed-pressure.

*Cost (accepted):* adds turn-management to the host dashboard (order calc, whose-
turn indicator, pass handling, soft timer); catch phase is more deliberate/longer
than a free-for-all. Bounded feature, lives mostly in Papa's dashboard.

**BOSS/VILLAIN POKEMON — SEPARATE SET (LOCKED; details deferred to boss session).**
Boss/villain pokemon do NOT come from the ~183 catchable roster. They're a
separate set with their own (boss-tier) stats. Rationale: (1) preserves
uniqueness — a boss fielding Mewtwo while a kid can also catch Mewtwo would break
"no two of same species"; (2) bosses need tougher, different stats; (3) keeps the
catchable roster clean (kids' wild catches only — no slots reserved for villains).
The "catch a DEFEATED boss's signature pokemon as a unique trophy" mechanic is ON
THE TABLE for the boss session — if adopted, such a creature is a SEPARATE
addition (e.g. a 30th+ legendary) entering a collection ONLY via boss defeat,
never wild-catchable, so uniqueness + the 183 stay intact. Open for boss session:
multiplayer claim rules, stats, whether it counts vs the team cap (3→4→5, Part 12E).

**POOL SIZE — ~18 per region / ~180 regional (LOCKED direction; exact tiering
TBD).** Exclusive sharing means the region must supply ALL 5 kids' catches +
a CHOICE BUFFER. **Buffer rule:** the actively-contested tier in each region must
hold ≥ 5 (one per kid) + 3–4 spare, so even the last drafter gets a real choice.
**Late-region legendaries bumped to 8–10** (not 5) — 5 legendaries for 5
competing kids strands someone, violating "no kid walks away empty." The access
gate concentrates contests within a single tier (kids at similar levels), so the
buffer only needs to protect the contested tier, not the whole region.
Sourcing: ~180 needed; ~110 existing + ~79 sourceable commons = ~189 candidates,
so it's curate-not-invent. (Supersedes the 100-count / 10-per-region direction
that assumed a personal pool.)

-----

## PART 12 — ECONOMY (v3.3 — LOCKED)

> Settles the numbers deferred from Parts 3, 7, 10E, and 11 (P3/P7). Anchored to
> the LIVE earn-rate discovered in game.js this session, not the stale SPEC
> assumptions. Read with the progression spine below — the numbers exist to serve
> ONE loop: collect → grow → upgrade-tier → end with 3 Legendaries for the bosses.

### 12A — THE PROGRESSION SPINE (why the economy exists)

The crystal sink IS the upgrade ladder. A kid's intended arc:

- **R1–2:** Fill the (initially 3) slots with Basics/Holos — cheap balls, instant
  ownership. Grow them via gym ability-use (XP).
- **R3–6:** Level gate opens Rare → Super. Kid MAY trade in a grown lower-tier
  (boosted trade-in value) to help fund a higher catch — OR keep favorites and
  catch into a newly-unlocked slot (see cap growth, 12E). Both paths valid.
- **R7–10:** L5 reached, Legendaries appear in the regional pool. Kid works toward
  a 3-Legendary core. Needed for cool-factor AND because the R10 boss showdown is
  beatable only with high-XP/HP (Part 9) — Legendaries start in the top HP band,
  so the upgrade path IS the boss-prep path. Same decision, two payoffs.

The economy serves TWO masters: (1) the upgrade engine above, (2) real-world
payout (peso conversion at 100💎 = ₱1, plus the Prize Store — see backlog).

### 12B — EARNING (Path B — per-gym, accuracy-driven; LOCKED)

> **SUPERSEDES the live per-question award loop in game.js.** The live code awards
> `baseCrystals + speedBonus` on EVERY correct answer, which rewards volume/speed —
> against the north star. Path B awards ONCE per gym, accuracy-driven, so the badge
> multiplier (mastery) is the main lever.

- At gym end: `earned = round(baseCrystals × (correct/10)) + speedBonus`, then apply
  the badge multiplier if passed (8/10 ×1.0 · 9/10 ×1.5 · 10/10 ×2.0, from Part 1).
- Speed bonus stays capped at 20% of base (Part 2); correct answers only; TIME-ability
  cap preserved (originalTimeLimit).
- **Display-only "+💎" per question** is allowed for moment-to-moment feel-good
  feedback, but it is COSMETIC — the real crystals settle at gym-end on the formula
  above. (Best of both: delight without rewarding rushing.)
- Realistic per-region totals (per-gym model): R1 ~100–220/gym → R10 ~1,500–3,000/gym.

### 12C — POKEBALL LADDER (rarity-based; LOCKED — replaces region-based)

> **SUPERSEDES the live region-based `pokeball` field (R1 300 … R10 10000).** Cost
> now tracks RARITY (the thing you're buying), not region. The old region ladder is
> dead — remove it alongside the other dead economy code (12F).

| Rarity     | Ball cost | Catch rate | Expected cost-to-catch |
|------------|-----------|------------|------------------------|
| Basic      | 50        | ~85%       | ~59                    |
| Holo       | 150       | ~80%       | ~188                   |
| Rare       | 400       | ~70%       | ~571                   |
| Super Rare | 1,000     | ~60%       | ~1,667                 |
| Legendary  | 2,500     | ~50%       | ~5,000                 |

Confirms Part 11 Principle 3's recommended ladder. The ball is a "bet" whose stakes
scale with the prize. Higher tier = pricier ball + harder catch-question.

### 12D — REDEEM VALUE (peso payout; LOCKED)

`redeemValue = baseValue × (1 + xpRatio × 0.5)` where xpRatio ∈ [0,1] = how grown.
Fully grown = base × 1.5. Caps below ball cost (no buy→grow→redeem profit exploit).

| Rarity     | Base | Fully grown (×1.5) |
|------------|------|--------------------|
| Basic      | 20   | 40                 |
| Holo       | 80   | 120                |
| Rare       | 200  | 300                |
| Super Rare | 500  | 750                |
| Legendary  | 1,200| 1,800              |

- **Basic dropped to 20** (from a candidate 30) to keep clear daylight below the 50
  ball cost — kills any near-break-even catch-and-redeem loop on Basics.
- **Starter redeem = 0 (LOCKED, confirms Part 3D).** The free starter can never be
  cashed out — it's a companion, not currency.
- Legendary 1,800 grown is the deliberate finale payoff (Part 12 goal: redeem matters).

### 12E — TEAM CAP GROWS WITH PLAYER LEVEL (LOCKED — SUPERSEDES v3.2 cap=3)

> **SUPERSEDES Part 7 / Part 11 Principle 4 "cap = 3 LOCKED."** A fixed cap of 3
> forced a false choice: keep a beloved early Pokemon OR field Legendaries, never
> both. Growing the cap makes "grow-and-keep" and "chase Legendaries" BOTH true.

| Player Level | Reached ~ | Cap | Why the bump lands here          |
|--------------|-----------|-----|----------------------------------|
| L1           | R1 start  | 3   | Fill all 3 with Basics instantly |
| L2           | ~R2       | 3   | Hold; learn to grow what you have|
| L3           | ~R4       | 4   | First Rare unlocks — room to add |
| L4           | ~R6–7     | 4   | Hold; deepen investment          |
| L5           | ~R7+      | 5   | Legendaries + bosses — keep 2 favorites AND field a 3-Legendary core |

- Expansions land exactly where upgrade pressure spikes (L3 = Rare appears, L5 =
  Legendary + serious bosses). Flat at L2/L4 so each bump is earned, not a giveaway.
- **5 slots always shown**; future slots greyed "🔒 Reach Level N" (reuses the
  existing locked-goal pattern — visible goal, never denial).
- **Consequence (monitor):** with more room to KEEP, kids release less → spend fewer
  crystals re-buying → accumulate more → more flows to peso/prize payout. Fine (more
  payout = happier kids), but it makes CATCH COST the primary sink. Keep the Legendary
  ball genuinely expensive (2,500) so late-game still has a savings goal. Release is
  now a STRATEGY (consolidate / cash in), not a tax — which keeps releases rare and
  protects the shared pool (satisfies P7's starve-the-pool watch-item from a new angle).

### 12F — TRADE-IN ON RELEASE (numbers; LOCKED — confirms Part 11 P7)

Base 40% of ball cost (ungrown) → up to 80% (fully grown). Never exceeds ball cost.

| Released (fully grown 80%) | You get | Next-tier ball | Trade-in covers |
|----------------------------|---------|----------------|-----------------|
| Basic (50)                 | 40      | Holo 150       | ~27%            |
| Holo (150)                 | 120     | Rare 400       | ~30%            |
| Rare (400)                 | 320     | Super 1,000    | ~32%            |
| Super (1,000)              | 800     | Legendary 2,500| ~32%            |

Consistent ~30% head start per tier jump — a real boost, but the kid still earns the
remaining ~70% through gym play. Rewards the upgrade without trivializing it.

### 12G — PITY SOFTENER (LOCKED)

After **3 consecutive misses on the SAME Pokemon**, the next catch-question for it
draws from one tier easier. At Legendary's 50% rate, 3-in-a-row is ~12.5% — unlucky
but not rare; without the softener that's a ~5,000-crystal RNG sink. The softener
fires exactly when bad luck genuinely hurts. Protects the emotionally-sensitive kid
(north star) without making catches free.

### 12I — CRYSTAL PERSISTENCE POLICY (LOCKED — model A + C)

> Made EXPLICIT this session (was implicit in the build). Validated against UAT
> ledger PEPE12. NOTE: the "Papa bonus — From Game 1" lump (16,601) seen in that
> ledger was a ONE-TIME manual UAT credit for first-version testers — NOT a design
> feature. Ignore it; it does not represent carryover policy.

**Policy = A (lifetime wallet) + C (redeem-and-burn), NO cash-out:**

- **A — Lifetime wallet.** Crystals persist across games, tied to the permanent
  6-char Trainer ID (canonical balance = `player_saves.data.total_crystals`). Never
  auto-reset between games. This is what the live build already does — no change to
  the persistence mechanism itself.
- **C — Redeem-and-burn.** The ONLY way crystals leave the wallet is conversion into
  real prizes via the PRIZE STORE. Redemption SUBTRACTS from balance (reuses the
  existing `redeem_request` ledger flow). 
- **NO PESO CASH-OUT.** The old 100💎 = ₱1 straight peso conversion is RETIRED as the
  payout path. Crystals are arcade-style tickets — spendable ONLY on Prize Store
  items, never exchanged for cash. (Peso *equivalence* may still inform internal
  prize pricing, but kids don't redeem for money.)

**Budget control moves to the PRIZE STORE, not the earning economy.** Because the
wallet is lifetime + carries over, the spend side is where liability is bounded —
via (1) prize pricing (crystal cost per item = the real budget dial), (2) item /
crystal EXPIRY (prevents unbounded lifetime accumulation), (3) store settling /
leveling. All deferred to the prize-mechanics pass (user-authored).

**Why A+C over a per-game reset:** cleaner separation of concerns — the EARNING side
rewards learning honestly and lets kids own their lifetime total (no arbitrary
zeroing of hard-won crystals); the SPENDING side bounds budget. Expiry (not reset)
is what defuses the unbounded-accumulation risk humanely.

⚠️ **This makes the Prize Store load-bearing for budget**, not just a nice-to-have —
without it (and its expiry rules) there's no crystal sink and no payout path. Elevate
its priority accordingly when the prize pass is scheduled.

**PESO VISIBILITY — split (LOCKED):** kids must NEVER see a peso figure (crystals are
arcade tickets, no money framing). Papa keeps a private peso readout to price prizes
against real-world value.
- **REMOVE peso from all PLAYER UI:** player dashboard wallet (`pdc-peso`), player
  Crystal Wallet screen (`wallet-peso`). (Redeem form already shows crystals only.)
- **KEEP peso on all HOST UI:** account-list cards (`ac-peso`), pending-redeem
  display, host ledger modal (`lm-peso`), host redeem queue (`hrq-peso`).
- ⚠️ Stale framing to fix in the prize pass: the player redeem flow still says
  "peso credit / end-of-day payout" — reframe to "redeem at the Prize Store" once the
  store exists (no cash-out per this policy).

### 12H — STILL OPEN / DEFERRED FROM ECONOMY

- **Final 100-vs-103 roster count trim** (Part 10C) — cosmetic, do at library polish.
- **HP/XP exact growth curve** (Part 8 numbers) — the magnitude dial; its own pass.
- **Prize Store + crystal/item EXPIRY** — now budget-load-bearing (see 12I); the
  redemption path AND the accumulation-control lever. User-authored next. See backlog.

-----

## PART 13 — PRIZE STORE & BAYANIHAN MECHANICS (v3.4 — LOCKED)

> Solves the UAT social problem, NOT just payout. UAT pain: kids compared crystals/
> pesos instead of learning; lower performers complained the game was rigged toward
> older kids (who naturally score higher); "what card can I buy" crowded out the
> learning. This part realigns the REWARD layer around effort, team, and unlockable
> prizes — and completes 12I (crystals → prizes only, no money framing).

### 13A — THREE PRINCIPLES (the design contract)

1. **PRIZES TRACK EFFORT, NOT RAW SCORE** — age-fair by construction, so older kids
   don't keep "winning."
2. **THE TEAM UNLOCKS THE STORE** — individual comparison is redirected into a shared
   team goal; a strong kid LIFTS THE SHELF for everyone instead of beating peers.
3. **PRIZES ARE THE MOTIVATOR, NOT MONEY** — kids see unlockable prizes as goals;
   pesos never appear in the kid's mental model (completes 12I peso-visibility split).

### 13B — ARCHITECTURE: ONE CURRENCY (crystals), TWO GATES (LOCKED)

No second currency. Crystals (the economy we built in Part 12) remain the single
spend currency. The store separates two concerns:
- **EFFORT METRICS unlock ACCESS** (which shelf tiers are open) — team-driven, age-fair.
- **CRYSTALS buy the ITEM** within an unlocked shelf — individual, already earned.

So: *effort unlocks the shelf (team), crystals buy off it (individual).* This delivers
the 50/50 team/individual split (13D) without a confusing 2nd number, and it keeps the
Part 12 crystal economy meaningful (crystals now fund BOTH Pokemon AND prizes). Crystal
totals NO LONGER determine prize QUALITY — team effort does — which is what defuses the
comparison (the thing kids compared no longer decides who gets the better prize).

### 13C — EFFORT METRIC (age-fair blend, LOCKED)

Each kid earns **Effort Score** from a blend (NOT raw accuracy/speed — that was the
sole driver of the "older kids always win" complaint, so it's dropped to 0):

| Wt  | Ingredient            | Rewards                          | Age-fairness        |
|-----|-----------------------|----------------------------------|---------------------|
| 40% | Personal improvement  | Beating your OWN past gym scores | Fully age-fair      |
| 35% | Badges / passing      | Hitting 8/10 (the mastery bar)   | Age-fair (same bar) |
| 25% | Learning engagement   | Reading "Did You Know"; CLUE use | Fully age-fair      |
| 0%  | Raw accuracy / speed  | (DROPPED — drove the unfairness) | —                   |

A 9-yo who passes 8/10 and improves earns the SAME effort credit as a 13-yo who does
the same. Excellence is still rewarded (badges), but it's a bar anyone can clear, not
a race the oldest wins.

### 13D — 50/50 TEAM / INDIVIDUAL SPLIT (LOCKED)

Each kid's Effort Score splits:
- **50% → shared TEAM POOL.** Team total unlocks shelf TIERS (Bronze → Silver → Gold)
  that EVERYONE shops. A strong kid's effort lifts the shelf for the whole team.
- **50% → personal access** within unlocked shelves (their own pick eligibility).

When a younger kid complains "he scored higher," the true answer becomes: "half his
effort unlocked the Gold shelf FOR YOU — and your own improvement is yours to spend."
Comparison is redirected from kid-vs-kid to team-vs-goal. Dovetails with the battle
system's bayanihan guardrails (Part 9) — same social design, same direction.

### 13E — THE SPEND (FORK 1 — LOCKED v3.5: fixed-price shelves + earned picks)

> **REVISED in v3.5** (parity decision, was crystal-quantity spend). The individual
> lever is now EARNED PICKS, not crystal-pile size — so a strong kid's bigger crystal
> balance does NOT buy more/better prizes than a struggling teammate. See 14E for why.

- Team effort unlocks shelf tiers (Bronze/Silver/Gold) — shared by all. **The team
  tier is what gates prize QUALITY** (age-fair, per 13B/13C).
- **Items are FIXED-PRICE within a shelf** (every Bronze item = same cost, every Silver
  = same, every Gold = same; higher tiers modestly pricier mostly to require having
  progressed/saved a little). Crystals are the TRANSACTION, NOT a quality lever — raw
  crystal volume no longer translates into prize advantage. This is what makes 13B's
  "two gates" truly independent: effort = access, crystals = the purchase.
- **Each kid gets a LIMITED number of PICKS**, and picks are the real individual lever —
  EARNED via effort (more effort → more picks), NOT bought with a bigger crystal pile.
  (Exact picks-per-effort mapping: 13I / open.)
- Preserves AGENCY (kids still choose their OWN items off the shared shelves) while
  killing the checkout-comparison (same shelves, same prices, fair pick count).
- **Fair pick order (unchanged):** Guardrail A — gap-closing order on ALL shelves
  (lowest-effort kid picks first, snake-reverses); Guardrail B — one-pick-per-round on
  the GOLD shelf only (anti-sweep on the scarce tier). Bronze/Silver no per-round cap.
- Rejected alternatives (14E): per-kid crystal spend cap (makes earned crystals feel
  fake); flatten bosses further (treats a symptom — gap is mostly gym-driven); keep the
  raw-crystal gap (leaves comparison half-solved).

> **v3.6 — the SPEND is now implemented via TIER VOUCHERS (see 13R).** Crystals buy
> Bronze/Silver/Gold VOUCHERS (tier entitlements), not cards directly; vouchers are
> redeemed for a real card of that tier later at the store. "Picks" become "how many
> vouchers a kid can afford" — same individual lever, cleaner implementation. The
> two-gate rule still holds: team effort UNLOCKS a tier, crystals BUY its voucher.

### 13F — GUARANTEED FLOOR (FORK 2 — LOCKED: finish-floor prize for everyone)

Every kid who FINISHES the game gets a guaranteed small prize (sticker, common card,
participation pack), regardless of performance or team total. Everything above the
floor is team-unlocked + crystal-bought. The floor is DIGNITY (no kid leaves empty-
handed — the cry-moment the north star forbids); the shelves are the GAME (effort
still drives the meaningful rewards). A large guaranteed prize would make effort
meaningless — keep the floor SMALL.

### 13G — NO MONEY FRAMING (completes 12I)

- Kids see PRIZES as goals ("unlock the Gold shelf", "the holo booster") with effort/
  crystal requirements — never a peso figure (player peso UI already removed, 12I).
- Papa keeps the private peso readout (host UI, 12I) to price the store's real-world
  contents against budget. Internal pricing MAY use peso-equivalence; kids never see it.

### 13H — BUDGET CONTROL (the store is the liability lever — from 12I)

Because the wallet is lifetime/carryover (12I), the store bounds total prize cost via:
- **Shelf pricing** (crystal cost per item = the real budget dial).
- **Tier thresholds** (how much team effort unlocks Gold = how generous the day is).
- **Item / crystal EXPIRY** (prevents unbounded lifetime accumulation; user-authored).
- **Stock limits** per prize.
Reuse the existing `redeem_request` ledger + host-approval flow (already built) for
the actual prize claim. Reframe the stale player redeem copy ("peso credit / payout"
→ "redeem at Prize Store").

### 13I — PRIZE NUMBERS (v3.6 — LOCKED; placeholder prices pending real inventory)

> Closes the prize-numbers pass. Formulas + structure LOCKED; the absolute crystal
> PRICES are placeholders (tunable constants) until real card inventory + budget are
> known — swap the numbers, keep the logic. Anchored to the Part 14D balanced economy
> (~54k–94k spendable crystals/kid).

**Effort Score (0–100, age-fair blend A40/B35/C25/D0):** each component normalized to
0–100 by RATE (not total — so a kid who reached only R6 isn't penalized vs a finisher):
- **Improvement (40%):** % of measured gyms where the kid beat their own prior best
  (or beat the band baseline on first attempts). Measured vs SELF → age-fair.
- **Badges (35%):** badges earned ÷ badges attempted ×100. Same 8/10 bar for all ages.
- **Engagement (25%):** ("Did You Know" boxes read + CLUE uses) ÷ opportunities ×100.
- `EffortScore = 0.40×improvement + 0.35×badges + 0.25×engagement`.

**Picks-per-effort (individual lever; LOCKED tight 2–4 band):**
| Effort Score | Picks |
|--------------|-------|
| Finished (any)| 1 (the guaranteed floor, 13F) |
| ≥ 40         | 2     |
| ≥ 60         | 3     |
| ≥ 80         | 4     |
A struggling-but-improving kid clears 40 easily (improvement is vs self). Realistic
spread is 2–4 picks — the strong kid earns 1–2 more, NOT a landslide. Combined with
fixed pricing, this caps how much the performance gap can express at the store.

**Team-tier thresholds (shelf unlocks; team pool = Σ each kid's 50% team-half, 13D):**
For ≤5 kids, max team pool ≈ 250; realistic ~120–200.
| Shelf  | Team pool | Meaning                                   |
|--------|-----------|-------------------------------------------|
| Bronze | 0 (always)| floor always stocked                      |
| Silver | ~90       | most kids engaged/improving               |
| Gold   | ~160      | team genuinely pulling together (bayanihan)|

**Fixed shelf prices (PLACEHOLDER crystals — tune vs real inventory):**
| Shelf  | Price/item | Parity check                                          |
|--------|-----------|--------------------------------------------------------|
| Bronze | 8,000     | every kid affords several                              |
| Silver | 20,000    | every finisher affords 2–3                             |
| Gold   | 40,000    | even the STRUGGLING kid (~54k) affords 1 IF team unlocked it |
⚠️ **Parity guarantee:** quality is TEAM-gated, not wallet-gated — a weaker kid is
never priced out of a shelf the team unlocked. This is the 14E parity model in numbers.

**EXPIRY (LOCKED — crystals persist, PRIZES expire; fully consistent with 12I):**
Crystals NEVER expire — full lifetime wallet (12I unchanged). Instead the bound sits on
the PRIZE side: **the store's shelf STOCK refreshes per game-day** — each day offers
that day's inventory; unclaimed items are gone the next day; fresh stock appears. This
caps daily prize liability to ONE day's available stock no matter how large a kid's
hoarded balance is (a 200k-crystal kid still can't exceed the day's shelf). Arcade-
authentic (the prize counter restocks; you can't redeem yesterday's display). Optional
booth rule: a claimed prize has a physical pickup window (logistics, not economy).
⚠️ This is what carries the 14E accumulation-control load — the SHELF, not the wallet,
is the bounded thing.

### 13K — RECOGNITION HONORS (v3.6 — LOCKED; excellence seen, not paid)

> Resolves the worked-example finding: a strong kid can ace every badge yet land LAST
> on Effort Score (because improvement+engagement are 65% of it and a high performer has
> little room to improve). The prize mechanics SHOULD stay effort/team-driven (that's
> the whole point) — but "invisible excellence" risks demotivating the high performer.
> Honors let excellence be SEEN without letting it PAY.

- **End-of-game HONORS = cosmetic/social recognition ONLY.** Never grant crystals,
  picks, or any prize advantage — the moment they do, they re-import the comparison
  problem the store was built to kill.
- **MIX performance + character honors** so recognition spreads across the kinds of kids
  (not a rebuilt leaderboard). Examples (final set TBD): "Top Trainer" (most badges /
  cleanest runs — the high performer's moment), "Most Improved" (biggest improvement
  vs self — the struggling kid's moment), "Team Heart / Most Helpful" (most teammate
  revives/assists in battle — the bayanihan kid's moment).
- **Why this fits:** the strong kid's mastery already pays in the CRYSTAL economy (more
  crystals → better Pokemon → stronger battle team, Part 12/8) — honors add a moment of
  PRIDE on top, without more loot than the struggling kid. Turns "who got the best
  prize" (comparison) into "we each shone at something" (belonging) — bayanihan.
- Rejected: widen the pick band (dilutes the effort-not-mastery thesis); nudge mastery
  into Effort Score (re-imports the age-unfairness). Keep prize mechanics as-is; add
  honors alongside.

### 13L — WHAT KIDS GET: TIER→CATEGORY MAP + PICK-SPENDING (v3.6 — LOCKED)

> The reward STRUCTURE (a mechanic). The specific SKUs that fill each category = the
> parked DESIGN pass (needs real inventory). This locks the *kind* of reward per tier
> and *how a pick spends*.

**Tier → prize-CATEGORY ladder (kind of reward, not specific items):**
| Shelf  | Unlock          | Price  | Prize CATEGORY (class of reward)                    |
|--------|-----------------|--------|------------------------------------------------------|
| Floor  | finish the game | free (1 floor pick) | Participation: sticker / single common / token |
| Bronze | always open     | 8,000  | Common: common cards, basic packs, small toys        |
| Silver | team pool ~90   | 20,000 | Uncommon: better packs, foil/uncommon singles, mid toys |
| Gold   | team pool ~160  | 40,000 | Chase: booster box, holo/rare chase card, premium item |
Each tier is a meaningfully better CLASS, gated by team effort (quality) + bought with
crystals (transaction). Specific items per class = DESIGN pass.

**PICK-SPENDING (LOCKED — "1 pick = 1 item, any unlocked tier you can afford"):**
- A pick = grab ONE item off ANY shelf the team has unlocked AND the kid can afford.
  A kid with 3 picks + Silver unlocked might take 1 Silver + 2 Bronze, or 3 Bronze, or
  save crystals for 1 Silver — their CHOICE (agency preserved, the Fork-1 goal).
- Rejected: tier-specific picks (rigid, creates dead picks, confusing for 9-yos);
  save-picks-across-days (contradicts the daily shelf refresh / reopens the stockpile
  budget hole).
- **Picks don't bank** — use them on THIS day's shelves or they're gone (consistent with
  daily stock refresh, 13I). Closes the loop with the expiry decision.
- **Three fairness levers stay intact:** TIER = quality (team-gated) · PICKS = quantity
  (effort-gated, 2–4) · CRYSTALS = cost (must afford). Max freedom WITHIN those bounds.

**Worked conversion (what a kid walks away with):**
- Struggling (~54k, 3 picks, Silver unlocked): ~1 Silver + 2 Bronze — a real handful.
- Strong (~94k, 3 picks, same unlock): same QUALITY shelves; picks cap the haul → not a
  landslide despite more crystals.
- Team pushed to GOLD: even the ~54k struggler affords 1 Gold chase item — bayanihan
  payoff made concrete (team effort, not wallet size, put Gold in reach for everyone).

### 13M — SKU FRAMEWORK / TEMPLATE (v3.6 — LOCKED structure; items TBD in DESIGN pass)

> The TEMPLATE real inventory drops into — fields + composition rules, NOT specific
> items. Specific SKUs + real prices + budget math = the DESIGN pass (needs user's real
> card inventory + per-day budget). This locks the STRUCTURE so that pass is fill-in-
> the-blanks, not from-scratch.

**SCOPE — CARDS FIRST (v3.6 decision).** Launch the prize store with ONE category:
**Pokemon CARDS**. Cards are the native convention reward and scale naturally across
all tiers (common → pack → foil → holo/box), so they work standalone — de-risks the
build (one category to wire) and proves the loop before expanding. Books, toys,
privilege/experience prizes, and Pokemon merch are the DOCUMENTED EXPANSION PATH (add
later as new SKUs — same tiers, same rules, just more `category` values). When expanding,
favor MIX-WITHIN-TIER (every tier has ≥1 of each type, so no kid's preferred category is
locked behind an unreachable tier) and consider privilege prizes for the Floor (free,
unlimited stock, high status value). Snacks = venue-dependent, not core. Avoid a lone
grand-prize raffle item (re-creates the comparison problem) — if a marquee prize is
wanted, frame it as a SHARED TEAM prize (bayanihan).

**Card tier ladder (the cards-first starting shape):**
| Tier   | Card SKU type                                   |
|--------|--------------------------------------------------|
| Floor  | 1 single common card (guaranteed)                |
| Bronze | small pack / a few common–uncommon singles       |
| Silver | better booster pack / foil or uncommon single    |
| Gold   | holo/chase single / premium pack / booster box   |
(Nice resonance: card rarity common→holo mirrors in-game Basic→Legendary — a Gold chase
card can FEEL like catching a Legendary. Lean into this thematically at real-SKU time.)

**Per-SKU fields:**
- `name` — the item · `tier` (Floor/Bronze/Silver/Gold) · `crystalPrice` (fixed per
  tier; Floor free) · `realCost` (peso cost to host — HOST-ONLY, never shown to kids,
  ties to 12I peso visibility) · `stock` (qty per game-day; the daily-refresh count) ·
  `category` (= "card" for now; book/toy/merch/privilege later — display grouping).

**Tier composition rules:**
| Tier   | Distinct SKUs | Stock depth each | Why                                          |
|--------|---------------|------------------|----------------------------------------------|
| Floor  | 2–3           | high (≥ all kids)| everyone finishes & claims → never runs out  |
| Bronze | 4–6           | medium           | workhorse shelf; variety = real choice       |
| Silver | 3–4           | lower            | aspirational but reachable                   |
| Gold   | 2–3           | scarce (1–2 each)| chase items; scarcity is the point (13E Gold guard) |

**CRITICAL fairness constraint:** **Gold STOCK ≥ the number of kids likely to afford
it.** If 5 kids unlock Gold but only 2 Gold items exist total, 3 kids watch the prize
vanish — the cry-moment the whole design kills. Prefer FEWER distinct Gold SKUs with
MORE copies over many one-off Golds that strand kids. General principle: VARIETY lower
in the tiers (browse & choose), DEPTH where contention happens (no lock-out) — the
SKU-level expression of the bayanihan fairness used everywhere else.

**DESIGN-pass fills (13J):** the actual CARD list per tier, real `crystalPrice` (swap
8k/20k/40k placeholders), `realCost` per item, `stock` counts vs per-day budget + kid
count, and the Layer-2 budget math (how much peso value each tier holds; daily payout
sustainability). Then the books/toys/privilege expansion as a follow-on.

### 13N — REAL-PESO BUDGET MODEL (v3.6 — formula LOCKED; card costs to plug in)

> Grounds the prize budget in real Pokemon-card market economics (user's Collectr-aligned
> rarity/price data). The FORMULA + the spending levers are locked; the absolute peso
> figures are illustrative until real Collectr export costs are plugged in.

**Formula:** `daily_cost = Σ_tiers [ total_kids × claims_per_kid(tier) × your_cost(tier) ]`
where `total_kids = kids_per_day × games_per_day`.

**Tier → real card mapping (raw/ungraded; USD→PHP @ ~58, adjust):**
| Tier   | Card type                       | ~USD raw | ~PHP |
|--------|----------------------------------|----------|------|
| Floor  | Bulk/Common                      | $0.20    | ~12  |
| Bronze | Common–Uncommon                  | $0.75    | ~44  |
| Silver | Non-holo Rare / entry holo       | $3.50    | ~203 |
| Gold   | Holo Rare / LOW Ultra Rare       | $8–20    | ~460–1,160 |

**Illustrative 5-kid day:** ~₱2,820 at entry Gold ($14) → scales with Gold richness
(see curve). **Gold dominates spend** → Gold is THE budget lever.

**GOLD TIER DIRECTION (v3.6 — user chose RICHER GOLD, stocked for all):** Gold is a
RICHER tier (better cards across the board), STOCKED FOR ALL who reach it (honors the
13M no-stranding rule). User accepts the higher budget this implies. Budget curve (5-kid
day, raw cards, USD→PHP @58):
| Gold card | Total/day | /kid  |
|-----------|-----------|-------|
| $14       | ~₱2,820   | ~564  |
| $25       | ~₱4,100   | ~819  |
| $40       | ~₱5,840   | ~1,167|
| $60       | ~₱8,160   | ~1,631|
| $100 (SAR)| ~₱12,800  | ~2,559|

⚠️ **STOCK COST vs SPEND COST (key for capital planning):** "stocked for all" means you
must HOLD Gold inventory ≥ the kids who could reach it (e.g. 5), even though only ~2
typically CLAIM. At $40/card: ~₱4,640 SPENT but ~₱11,600 of inventory HELD upfront.
Unclaimed cards aren't lost (roll forward), but cash-on-hand > daily giveaway. This is
the real price of the no-stranding fairness guarantee.

**Refinement levers:** (1) Gold card cost (headline); (2) Gold claim rate via crystal
price + TEAM-THRESHOLD (raise Gold's team bar ~160→~180 → fewer unlocks → lower average
cost without cheapening the prize); (3) stock-for-all vs stock-for-likely (stock for ~3
realistic buyers instead of all 5 → less capital, small stranding risk on a rare full-
Gold-team day). Raw/ungraded still recommended (graded = 10–100× per user's data).

**The three spend levers:** (1) your per-card sourcing cost; (2) claims-per-kid (driven
by crystal price + pick count); (3) tier-unlock rate (driven by effort thresholds —
gentlest lever, tied to team performance not a visible price hike).

**TO FINALIZE (needs user):** real Collectr per-card costs at each tier; kids/games per
day; target daily budget ceiling. Then swap illustrative costs → real, confirm the day
fits budget, and tune Gold if over.

### 13O — POKÉMON TCG API INTEGRATION (v3.6 — BUILD SCOPE; Phase 3)

> Scopes how the store sources card data/prices. Build-scope (Phase 3), recorded here
> with the prize design. User confirmed: PH market price ≈ TCGplayer price converted to
> PHP, so the API's market price IS a valid cost basis (not just a reference).

**Source:** Pokémon TCG API (`api.pokemontcg.io/v2`). Free API key from
`dev.pokemontcg.io`, sent via `X-Api-Key` header. ⚠️ Key is a SECRET — env var / not in
client code or git (same posture as Supabase keys). Provides card identity (name, set,
rarity, image) + market price (TCGplayer USD → ×FX → PHP).

**The store is a CATALOG + REDEMPTION TRACKER, not a storefront.** It does NOT buy cards.
A kid picks an eligible card; the HOST then buys it from a local marketplace and hands it
over.

**Locked build decisions:**
- **Price freshness = HYBRID (cache + on-demand refresh).** Host pulls a price snapshot
  at setup; the day runs off the cache (no live calls during play — venue wifi can't be
  trusted; snapshot matches the per-day shelf model 13I). Host can REFRESH prices on
  demand (e.g. between days or if a price looks stale). Cache card IMAGES too (store must
  work offline mid-event).
- **Eligibility = AUTO-BY-PRICE-BAND + host FILTERS + fulfilment VETO** (open catalog,
  bounded). ANY card whose PHP price falls in a tier's band is eligible BY DEFAULT — kids
  browse a huge, exciting selection (the "open catalog" goal). Two guardrails protect the
  host from an unfulfillable pick, working at different stages:
  - **FILTERS (upfront prevention):** host sets bounds on what's eligible BEFORE kids see
    it — e.g. recent sets only (last N years), a local-availability threshold, a blocklist
    (exclude specific cards/sets), raw-only. Shapes the catalog so bad picks aren't offered.
  - **VETO (fulfilment recovery):** the rare card that's in-band + in-filter but turns out
    genuinely unsourceable that day → host can offer the kid an EQUIVALENT SWAP (same tier).
    Stays rare BECAUSE filters do the heavy lifting, so kids almost never experience it →
    choice still feels real.
  (Rejected pure auto-by-band: a kid could redeem a card the host can't source locally →
  broken promise, the thing the design avoids everywhere. Filters+veto keeps it open AND
  safe — same belt-and-suspenders as gap-closing order + Gold one-pick-per-round.)
- **Auto-tiering:** a card lands in Floor/Bronze/Silver/Gold by its PHP price vs the SKU
  bands (13M). Host reviews, can override.
- **Fulfilment = host-only PHP buy-price + CHECKLIST per redemption** (claimed → bought →
  handed over), with optional marketplace link/note. Reuses the existing `redeem_request`
  ledger row (add fulfilment-status fields). Solves the busy-convention "which cards do I
  still owe?" tracking problem.
- **Peso stays HOST-ONLY** (12I): kids see card image + name + crystal price; never PHP.

**Build caution:** third-party dependency + rate limits → pull ONCE at setup, cache,
never live-call at redemption. Cache the card IMAGES too (or the store breaks offline).

### 13P — 5th TIER: TEAM PRIZE BONUS (v3.6 — LOCKED) + SIMPLIFICATION

> **SIMPLIFICATION (v3.6):** step back from the card-only API rabbit hole. Tiers hold
> HOST-ASSIGNED GIFT PRIZES (host decides what's on each shelf — cards or anything else).
> The Pokémon TCG API auto-tiering (13O) becomes an OPTIONAL future build aid, NOT core.
> Core model: 4 crystal-bought tiers (Floor/Bronze/Silver/Gold) of assigned gifts + this
> 5th boss-gated team tier.

**The 5th tier — TEAM PRIZE BONUS (v3.6 — MYSTERY-PRIZE model, LOCKED):**
- **Trigger = BOSS-DEFEAT COUNT, HIGHEST-TIER-ONLY:** 3 bosses → small · 6 → medium · 10
  → grand. ONE prize at the HIGHEST tier reached (10 → grand REPLACES small/mid, not
  stacked). The tier tells the SPONSOR what scale of gift to provide; the in-game UI SHOWS
  the journey (passed 3 and 6) for motivation.
- **What = ONE shared MYSTERY prize the team receives TOGETHER.** **(v3.6 KEY DECISION:
  it's a MYSTERY gift — NO category choice, NO menu, NO kid/host selection.)** Rationale:
  offering kids a CHOICE on a SHARED prize creates a decision → winners & losers → the
  exact comparison/fight dynamic the whole design engineers OUT, on the one prize meant to
  be pure togetherness. A mystery prize removes the decision entirely — nothing to argue
  about, everyone receives it together, more magical AND simpler.
- **Cost = NONE to the host (crystals-free AND grandparent-SPONSORED).** Beating bosses is
  the only price for the kids. The physical gift is SPONSORED (e.g. grandparents sponsor a
  STEM set) — NO host budget line at all (v3.6 decision). Sponsor decides the gift + scale;
  the boss tier (3/6/10) just signals rough scale. Folds family into bayanihan. Gift
  guidance for the sponsor: SHAREABLE/collective + kid-appropriate + scaled to tier.
- **Quality scales with the collective-clean metrics** (flawless / full-team / round-
  efficiency, Part 14) feeding the 3/6/10 thresholds.

**RELEASE MODEL + UX (v3.6 — LOCKED; "progression + end surprise"):**
- **During play:** the trophy is VISIBLE but framed as PROGRESSION — "defeating bosses
  unlocks higher levels," the in-game POINT. Kids chase bosses to ADVANCE THE GAME
  (intrinsic), NOT to shop. The gift is NOT dangled as a mid-game carrot.
- **End of game → BIG SHARED-SCREEN REVEAL:** on a shared/projected screen the whole team
  watches together — confetti, the trophy, the 3→6→10 JOURNEY, the tier earned, then
  "🏆 Your team earned the MYSTERY TEAM PRIZE!" Pure surprise; the collective-gasp moment.
- **No screen interaction needed beyond the celebration** — because it's a mystery, there's
  nothing to pick/vote/tap. The physical gift (e.g. the sponsored STEM set) is then handed
  over. (This COLLAPSES the earlier category-menu + pick/tap/vote machinery — all removed.)
- **Why better:** keeps intrinsic motivation front and center; reward is a surprise bonus;
  no "can I have it now"; and critically NO kid-vs-kid decision on a shared prize. On-theme
  with the north star (reward learning/play, not loot-chasing).
- **Fulfilment:** host hands over the one shared gift after the run. Reuses the
  `redeem_request` ledger with a TEAM flag (just records WHICH tier was earned + handed
  over — no choice to log).
- ⚠️ **DEPENDENCY:** this tier requires the BOSS SYSTEM to be built (Part 14 / 14G battle
  session). Designable now; buildable only after bosses exist. Sequences after battle work.
- **Ties prize store ↔ battle system** — the only tier that does. Replaces the removed
  boss crystal bonus (Part 14B) as the boss reward, and relocates the bayanihan equalizer
  from crystals into a shared prize.

### 13Q — REAL CARD SKU PRICES + BUDGET (v3.6 — LOCKED: ₱800–1,200/kid; team = sponsored)

> **LOCKED real budget — supersedes placeholder shelf prices in 13I (those were CRYSTAL
> prices; these are real PESO costs) and the illustrative figures in 13N.**
> Target: **₱800–1,200/kid (cards). TEAM prize = grandparent-SPONSORED, NO host budget**
> (consistent with the mystery-gift model, 13P — sponsor decides scale; boss tier 3/6/10
> just signals rough scale). Singles-lean (kids pick the Pokémon they love). Real card
> prices May 2026, raw/ungraded, USD→PHP @ ~58.

**Tuned tier prices (PESO cost to host — HOST-ONLY per 12I):**
| Tier       | Card SKU (singles-lean)                    | ~PHP | Notes                  |
|------------|--------------------------------------------|------|------------------------|
| Floor      | current-set common single                  | ~15  | guaranteed, deep stock |
| Bronze     | uncommon / reverse-holo single             | ~50  | workhorse              |
| Silver     | popular holo single (~$3–5)                | ~250 | chosen, character-driven |
| Gold       | nicer holo / low-end ex (~$8–12)           | ~600 | real chosen ex; **MAX 1 Gold pick/kid** |
| Team Bonus | grandparent-SPONSORED mystery gift         | —    | NOT in host budget (13P) |

> The higher budget restores the SINGLES-LEAN vision: Gold can hold a real chosen ex
> (~₱600), not the ₱250 compromise the old ₱500 cap forced.

**Budget enforcement (LOCKED — ₱800–1,200 is a PLANNING CEILING, not a hard cap; overflow
allowed):** kids land where their EFFORT takes them — struggling/solid kids who only reach
Silver land UNDER the range (~₱315–550) and that's FINE (they got what their picks earned;
the range is an upper planning bound, not a floor). Kids who reach Gold land in-range
(~₱900–1,150). A maxed 4-pick kid may hit ~₱1,350 — allowed overflow (self-limiting:
bounded by earned picks + unlocked tiers + Gold-1-pick cap). Same philosophy as the prior
₱500 guide — no checkout wall; rewards high effort.

**Full 3-kid run ≈ ₱2,400 typical in CARDS** (~₱788/kid avg in a mixed team), budget
~₱3,000–3,600 to absorb overflow if multiple kids reach Gold. **Team prize is OFF the
host's books** (grandparent-sponsored), so total host cost ≈ the cards only.

**Cost concentration / levers (from 13N):** Floor+Bronze trivial (~₱300/run); GOLD is now
the dominant lever (~₱600/card). To go richer: raise Gold or add a 2nd Gold pick. To go
leaner: lower Gold or tighten tier-access (effort thresholds).

**Still TBD (DESIGN/sourcing):** the specific named cards filling each tier (the ~₱250
Silver "popular holo," the ~₱600 Gold "low-end ex") — anchored via the 13O API + local
sourcing. Team mystery gift = sponsor's choice. Structure + budget LOCKED; specific cards
= sourcing.

### 13R — TIER VOUCHER MODEL + REDEMPTION (v3.6 — LOCKED)

> How the SPEND actually works (refines 13E) and how a kid's prize is released. Crystals
> buy TIER VOUCHERS, not cards directly; vouchers redeem for a real card LATER at the
> store. Replaces "buy a specific card in-app" with a voucher layer — decouples earning
> from sourcing, makes the prize a tangible keepsake, and keeps every fairness gate.

**The voucher model:**
- **Vouchers = tier entitlements:** BRONZE / SILVER / GOLD, each with a different CRYSTAL
  cost (Bronze cheapest → Gold dearest). A voucher entitles the kid to "a [tier] card,"
  redeemed for the actual Pokémon they choose later at the real store within that tier.
- **Consolidate OR spread (the agency):** a kid can buy MULTIPLE low-tier vouchers (e.g. 2
  Bronze) OR save/consolidate crystals into ONE high-tier voucher (e.g. 1 Gold). Their
  call — "two cards now or one better card." This IS the individual lever (replaces the
  "2–4 picks" framing of 13E with purchasable vouchers; number of vouchers falls out of
  what they can afford).
- **Change PERSISTS (12I lifetime wallet):** leftover crystals after buying vouchers are
  KEPT and roll forward to future game rounds. (Corrects an earlier "no change/all burned"
  phrasing — change IS kept, consistent with the redeem-and-burn-per-voucher persistence.)
- **TWO-GATE preserved (13B):** a kid can buy a Gold voucher ONLY IF (a) the TEAM's effort
  unlocked the Gold tier AND (b) the kid has the crystals. Crystals never bypass the effort
  gate — effort = tier ACCESS, crystals = buying the voucher within it. (A crystal-rich kid
  on a low-effort team still can't buy Gold.)

**Voucher as physical keepsake (the fun layer):**
- Vouchers have DESIGNED artwork (Bronze/Silver/Gold PNGs — user-supplied) the kid can
  PRINT — a tangible trophy they hold even before redeeming. On-theme, collectible.
- **Anti-copy via unique code:** each voucher carries a UNIQUE game-issued code/ID. The
  IN-APP voucher (ledger-tracked) is the SOURCE OF TRUTH; Papa verifies the code at
  redemption. Printing extra PNG copies is harmless — redemption is against the unique
  in-app voucher, redeemed once. (Print = souvenir; code = validity.)

**Redemption flow (per kid):**
1. End of run: kid's screen shows CRYSTALS + UNLOCKED TIERS (crystal costs only, NO pesos
   — 12I).
2. Kid BUYS voucher(s) — spends crystals on Bronze/Silver/Gold tier vouchers (within
   unlocked tiers); change persists.
3. Kid gets the voucher(s) in-app (unique code) + can print the PNG keepsake.
4. WHEN READY (at the real store / sourcing moment), kid gives the voucher to Papa and
   picks the actual card of that tier they want (the Pokémon they love).
5. Papa VERIFIES the code, buys that card from the real market, hands it over, and marks
   the voucher REDEEMED/BURNED in-app (reuses the `redeem_request` ledger). One voucher =
   one redemption; burned after use.

**Why this is better:** no speculative upfront inventory (Papa buys only what's redeemed);
kid still gets "the Pokémon they love" (chosen at redemption); the spend becomes a tangible
keepsake; earning and sourcing are cleanly decoupled; all fairness gates intact.

- Real prize inventory + per-game-day budget → swap placeholder prices for real ones.
- Multiplayer: how the team pool syncs live on the host dashboard; whether kids see a
  team progress bar DURING play (motivational) or only at the store.
- Exact "measured gym" + "opportunity" definitions for the Effort Score normalizer
  (engine detail — pin at build).

-----

## PART 14 — BOSS MECHANICS & CRYSTALS (v3.5 — LOCKED)

> Closes the last open input to the crystal economy (boss-crystal payouts were
> placeholders in Part 12 / economy backlog). Builds ON Part 9 (battle system, already
> locked) — this part adds FREQUENCY, REWARD STRUCTURE, and CRYSTAL NUMBERS, not a
> re-design of combat. Part 9 still owns the duel structure, 8 battle abilities, and
> bayanihan guardrails.

### 14A — FREQUENCY (LOCKED)

- **10 winnable boss fights:** one minor villain at the end of each region R1–R9
  (9 fights) + the R10 Pilipinas FINAL SHOWDOWN (1 fight).
- **2 scripted-loss cameos:** the Big Boss appears at R3 and R7 as UNBEATABLE (Part 9
  villain arc) — these are scripted losses that build dread/hype. They award NO
  crystals and are layered ON TOP of those regions' normal minor villain.
- So: R3 and R7 each have a beatable minor villain (crystals) AND an unbeatable cameo
  (no crystals, story beat).

### 14B — REWARD STRUCTURE (v3.6 — REVISED: no boss crystals)

> **SUPERSEDES the v3.5 "crystals + trophy" reward.** Boss crystals are REMOVED. Beating
> bosses now unlocks the **TEAM PRIZE BONUS** (the prize store's 5th tier, see Part 13P)
> + the unique trophy Pokemon. Rationale: a shared boss-gated prize is more thematically
> coherent (beat bosses together → a shared trophy, not more spending money) and moves
> the bayanihan equalizer from crystals into the shared prize.

Beating a boss rewards:
- **TEAM PRIZE BONUS progress** — boss-defeat COUNT drives the prize store's 5th tier
  (3 bosses = small, 6 = medium, 10 = grand shared prize). Crystals-free; the ONLY path
  to this tier is collective combat victory. See Part 13P.
- **Unique catchable TROPHY Pokemon** — the Part 11 "catch a defeated boss's signature
  pokemon" mechanic: UNIQUE, never wild-catchable, bonus slot (14F), everyone-gets-a-copy.
- **NO crystals.** (Affordability check: the Pokemon catch/upgrade ladder remains
  affordable on gym-crystals alone — even a struggling kid (~19.6k gym-only) can build a
  team of 3 and chase a Legendary. Boss crystals were generous padding, not load-bearing.)
- **NO effort points** (would undo prize age-fairness — unchanged reasoning).

### 14C — BOSS-DEFEAT TRACKING (replaces crystal numbers)

No crystal payout. The build tracks **boss-defeat COUNT per team** (which feeds the Team
Prize Bonus tier, Part 13P) and the **collective-clean metrics** (flawless / full-team /
round-efficiency) — which now gate the QUALITY of the team prize (3/6/10 thresholds),
not a crystal bonus. Collective metrics still matter; they just reward the shared prize,
not crystals. (The old per-boss crystal table is REMOVED.)

### 14D — FULL-GAME ECONOMY (v3.6 — gym crystals only)

> **SUPERSEDES the v3.5 gym+boss table.** With boss crystals removed, the crystal
> economy is GYM-ONLY.

| Kid        | Full-game crystals (gym only) | Pokemon ladder affordable? |
|------------|-------------------------------|----------------------------|
| Struggling | ~19,644                       | ✅ team of 3 + a Legendary  |
| Solid      | ~26,775                       | ✅ comfortably              |
| Strong     | ~59,708                       | ✅ 3 Legendaries (~15k)     |

⚠️ **Gap consequence:** without the flat boss base equalizing things, the strong-vs-
struggling CRYSTAL gap re-widens toward ~3× (was compressed to ~2× by boss crystals).
This is FINE — the prize store's fairness comes from EFFORT (team unlocks tiers, picks
are effort-gated), NOT crystals (13B/14E), so a wider crystal gap does NOT re-open prize
unfairness. The bayanihan equalizer now lives in the boss-gated TEAM PRIZE (shared,
collective) instead of in boss crystals — arguably cleaner.

**SPENDING-POWER LEVER (v3.6 — DECIDED):** considered re-adding boss crystals for "more
crystals to spend." DECIDED AGAINST — bosses stay crystal-free (keeps the clean gyms→
crystals / bosses→shared-prize separation). NOTE the common misconception: boss crystals
would NOT help kids reach higher prize TIERS — tiers are EFFORT-gated, crystals only buy
WITHIN an unlocked tier (13B two-gates). So if more spending power is wanted, the clean
lever is **raising GYM earn-rates** (lifts EVERY kid, preserves the separation) — NOT
boss crystals. And if easier shelf ACCESS is wanted, the lever is **lowering effort
thresholds** (Silver ~90 / Gold ~160), not crystals at all. Hold all three steady until
playtest data says which (if any) needs adjusting — don't preemptively inflate.

### 14E — PRIZE-STORE PARITY (LOCKED v3.5)

The ~54k-vs-94k spendable-crystal gap means that IF shelf items were priced in raw
crystals, the strong kid would simply afford more/better — partially re-opening the
comparison problem at checkout (gap-closing pick order, 13E, stops sweeping but not the
affordability gap). **RESOLUTION (LOCKED): fixed-price-per-shelf + limited EARNED
picks** (see revised 13E). The TEAM TIER gates prize QUALITY (age-fair, per 13B);
crystals are just the transaction, not a quality lever; the individual lever is "how
many PICKS you earned (via effort)," NOT "how big your crystal pile is." This makes the
crystal gap economically irrelevant to prize fairness — a 94k kid and a 54k kid on the
same team shop the same shelves at the same prices with effort-earned pick counts.
Rejected: per-kid spend cap (makes earned crystals feel fake); flatten bosses more
(symptom, not cause); keep the gap (half-solved). 

⚠️ **Consequence for the crystal sink:** with prizes fixed-price + pick-limited,
crystals are LESS consumed by prizes than a raw-crystal store would consume. The
Pokemon economy (Part 12 catch/upgrade) becomes the PRIMARY crystal sink; the prize
store is a secondary, bounded sink. Lifetime accumulation (12I) is then controlled
mainly by EXPIRY (13I) — reconfirm expiry rules carry this load in the prize-numbers
session.

### 14F — TROPHY & RE-ATTEMPT (v3.6 — LOCKED)

**Trophy Pokemon (LOCKED):**
- **BONUS SLOT — does NOT count against the team cap (3–5).** Pure reward; a kid is
  never forced to release a favorite to hold a trophy. Self-limiting: trophies come
  only FROM boss wins, so a kid can't stack them before the fights that matter.
- **EVERYONE who fought gets their OWN copy** (bayanihan-consistent). Rejected: single
  shared trophy (forces "who deserves it" comparison — the thing the redesign kills);
  final-blow-only (rewards the strong carry, re-imports unfairness). The trophy is a
  SHARED TEAM MEMORY ("we all beat Bakunawa, we all carry his mark"). This is the ONE
  intentional exception to species-uniqueness — fine, because trophies are a separate
  non-wild-catchable class (Part 11 boss set ≠ the 183 roster) and "earned together"
  is a feature, not a violation.
- Trophy creatures need their OWN stat block (separate from wild roster) — boss build.

**Boss-loss re-attempt (LOCKED):**
- **Re-attempt + optional "train more" gym replay.** On a boss game-over: framed
  collectively ("the villain got away — train together and try again!"), immediately
  re-attemptable (extends Part 9), PLUS an optional quick gym replay to grow HP/XP
  before re-fighting — so a stuck team has a real lever to get stronger. Rejected: pure
  forward-only (can trap a team in a loss loop); auto-scale boss down (undercuts the
  achievement, feels patronizing). ⚠️ The train-more replay touches forward-only +
  anti-farm guard ONLY at boss game-over (not general gym replay) — scope the exception
  narrowly at build so the crystal re-farm loophole stays closed.

### 14G — BATTLE SESSION (v3.7 — FULLY LOCKED)

> All items formerly listed as "STILL OPEN" are now locked below. Part 9 still owns the
> duel structure and bayanihan guardrails; this section adds CASTING, BATTLE-ABILITY
> POPULATION, TURN STRUCTURE, HP/BOSS STATS, and GATING.

---

#### 14G-1 — BOSS/VILLAIN CASTING (LOCKED)

**Big Boss:** Darkrai — appears at R3 (unbeatable cameo), R7 (unbeatable cameo), R10
(beatable FINAL SHOWDOWN). Three-act villain arc: haunts → terrifies → is defeated.

**Minor villains + Boss Reward Pokémon (one offered per beatable fight):**

| Region | Minor Villain | Boss Reward Pokémon | Reward source |
|--------|-------------|-------------------|---------------|
| R1 | Pawniard | Cleffa | Bench |
| R2 | Cranidos | Spritzee | Bench |
| R3 | Klink | Jirachi | Bench — **+ Darkrai unbeatable cameo (no reward)** |
| R4 | Vullaby | Celebi | Bench |
| R5 | Pancham | Victini | Bench |
| R6 | Rufflet | Xerneas | Bench |
| R7 | Zygarde | Sarimanok | PH legendary — **+ Darkrai unbeatable cameo (no reward)** |
| R8 | Kyurem | Mariang-Makiling | PH legendary |
| R9 | Yveltal | Mayari | PH legendary |
| R10 | **Darkrai** (FINAL) | Bathala | PH legendary — apex reward |

**Bench accounting (18 total):**

| Creature | Role |
|----------|------|
| Darkrai | Big Boss villain (R3 cameo, R7 cameo, R10 final) |
| Pawniard | Villain R1 |
| Cranidos | Villain R2 |
| Klink | Villain R3 |
| Vullaby | Villain R4 |
| Pancham | Villain R5 |
| Rufflet | Villain R6 |
| Zygarde | Villain R7 |
| Kyurem | Villain R8 |
| Yveltal | Villain R9 |
| Cleffa | Reward R1 |
| Spritzee | Reward R2 |
| Jirachi | Reward R3 |
| Celebi | Reward R4 |
| Victini | Reward R5 |
| Xerneas | Reward R6 |
| Reshiram | Unused — future expansion |
| Zekrom | Unused — future expansion |

**PH legendary rewards (Sarimanok/Mariang-Makiling/Mayari/Bathala)** remain
wild-catchable in R10 — boss reward copies are the uniqueness exception (see below).

---

#### 14G-2 — BOSS REWARD POKÉMON (LOCKED)

Replaces the former "trophy Pokémon" / "bonus slot" mechanic entirely.

- **One boss reward Pokémon offered** to every kid after each beatable boss fight
- Kid chooses: **add to team** (must release one if at cap) or **pass**
- Enters the **normal team cap** — no bonus slot, no separate stat block
- If passed or released later → normal trade-in value applies (Part 12F)
- **Only exception to the uniqueness rule** — multiple kids in the same room may hold
  the same boss reward Pokémon. This is intentional: "earned together" is the framing.
  All other uniqueness rules (183 wild roster) are unaffected.
- Reward Pokémon are **not wild-catchable** (bench creatures); PH legendary rewards
  remain wild-catchable in R10 but are also offerable as boss rewards (exception
  already established above).

**Rejected alternatives (do not revisit):**
- Bonus slot: added build complexity, removed meaningful choice
- Level-appropriate generic reward: forgettable, vending-machine feel
- One shared trophy per team: forced "who deserves it" comparison — kills bayanihan
- Fixed rarity: re-introduces rarity power ladder at boss level

---

#### 14G-3 — BATTLE STRUCTURE (LOCKED)

**Format:** 3v1 — all kids attack one shared boss HP bar together.

**Win condition (TWO gates, both required):**
1. Boss HP reaches 0
2. Every kid has landed **at least 3 correct answers** (minimum contribution — prevents
   carrying; ensures every kid participates meaningfully)

**Turn structure (one round):**
1. Papa starts the round
2. Kids declare abilities (optional; one per Pokémon per battle, mirrors gym phase)
3. Questions served **simultaneously** to all kids (unique random question per kid,
   same timer — mirrors gym phase rhythm)
4. Timer ends → results resolve together:
   - Correct answer → that kid's Pokémon deals damage to boss HP bar
   - Wrong answer → no damage from that kid this round
5. Boss attacks **one randomly selected kid** → their Pokémon takes damage
6. Fainted Pokémon → teammates can use Guard/Second Wind on next round
7. Check win condition; repeat if not met

**Team Strike in battle:**
- Any kid (or Papa) declares "Team Strike" before questions are served
- All kids answer next question simultaneously
- All correct → 3× normal combined damage (tunable at build)
- Partial correct → normal damage per correct answerer, no combo bonus
- Nothing lost on failure — no punishment for attempting teamwork

**ALLY mechanic: BATTLE-ONLY (LOCKED)**
All teamwork mechanics (Guard, Second Wind/Revive, Combo/Team Strike) exist exclusively
in battle phase. Gym phase remains individual — personal mastery, personal XP, personal
effort. Two phases are intentionally distinct: gym = personal growth, battle = bayanihan.

---

#### 14G-4 — BATTLE ABILITIES (LOCKED)

8 battle abilities (from Part 9). Basic Attack is automatic (every correct answer).
7 are assignable per Pokémon. **Guardrail (Part 10A preserved):** rarity does NOT
determine battle power — assignment is THEMATIC, not power-based. HP/XP is the only
power dial.

**Thematic assignment rules:**
- **Critical Hit** → Electric, Dragon, Fighting, Flying (fast, sharp, precise)
- **Freeze/Stun** → Ghost, Psychic, Poison, Ice, Dark (disruptive, controlling)
- **Heal** → Water, Grass, Fairy, Normal/gentle (nurturing, restorative)
- **Protect** → Rock, Steel, Ground, Water/sturdy (defensive, armored)
- **Guard** → Fighting, Normal/loyal, Steel (steadfast, protective)
- **Second Wind/Revive** → Fire, Ghost, Psychic, Dragon (resilient, spiritual)
- **Combo/Team Strike** → Normal, Fairy, Grass, Bug/social (cheerful, cooperative)

**Full assignment (193 Pokémon — starters + R1–R10 regional):**

*Starters (10):*
Pikachu→Critical Hit · Charmander→Second Wind/Revive · Squirtle→Protect ·
Bulbasaur→Heal · Eevee→Combo/Team Strike · Gengar→Freeze/Stun · Snorlax→Guard ·
Alakazam→Freeze/Stun · Dratini→Critical Hit · Jigglypuff→Combo/Team Strike

*R1 — Bug (18):*
Caterpie→Heal · Weedle→Freeze/Stun · Wurmple→Heal · Kricketot→Combo/Team Strike ·
Sewaddle→Heal · Scatterbug→Combo/Team Strike · Grubbin→Protect · Blipbug→Freeze/Stun ·
Snom→Freeze/Stun · Spinarak→Freeze/Stun · Joltik→Critical Hit · Cutiefly→Combo/Team Strike ·
Dewpider→Protect · Nincada→Guard · Volbeat→Guard · Illumise→Heal · Surskit→Protect ·
Shelmet→Protect

*R2 — Normal/Flying/Early (16):*
Starly→Critical Hit · Skwovet→Combo/Team Strike · Rookidee→Critical Hit · Yungoos→Guard ·
Wooloo→Heal · Oddish→Heal · Bellsprout→Freeze/Stun · Seedot→Combo/Team Strike ·
Zubat→Freeze/Stun · Glameow→Combo/Team Strike · Mawile→Protect · Sableye→Freeze/Stun ·
Machop→Guard · Geodude→Protect · Litwick→Second Wind/Revive · Gothita→Freeze/Stun

*R3 — Grass/Fire/Water/Poison (18):*
Lotad→Heal · Cottonee→Combo/Team Strike · Hoppip→Combo/Team Strike · Sunkern→Heal ·
Petilil→Heal · Bounsweet→Combo/Team Strike · Growlithe→Second Wind/Revive ·
Vulpix→Second Wind/Revive · Ponyta→Critical Hit · Psyduck→Freeze/Stun · Krabby→Protect ·
Tentacool→Freeze/Stun · Litten→Critical Hit · Popplio→Heal · Rowlet→Second Wind/Revive ·
Cyndaquil→Critical Hit · Totodile→Guard · Chikorita→Heal

*R4 — Starters/Fighting/Ground (18):*
Koffing→Freeze/Stun · Ekans→Freeze/Stun · Cubone→Guard · Mudkip→Protect ·
Treecko→Critical Hit · Chimchar→Critical Hit · Piplup→Protect · Turtwig→Guard ·
Snivy→Freeze/Stun · Tepig→Critical Hit · Oshawott→Guard · Chespin→Guard ·
Fennekin→Second Wind/Revive · Froakie→Critical Hit · Rockruff→Protect · Shinx→Critical Hit ·
Buneary→Combo/Team Strike · Jangmo-o→Critical Hit

*R5 — Water/Electric/Dragon/Super (23):*
Tympole→Heal · Chewtle→Protect · Buizel→Critical Hit · Mareep→Critical Hit ·
Phanpy→Guard · Slugma→Second Wind/Revive · Numel→Protect · Larvitar→Critical Hit ·
Bagon→Critical Hit · Beldum→Protect · Gible→Critical Hit · Mienfoo→Guard ·
Karrablast→Combo/Team Strike · Ferroseed→Protect · Axew→Critical Hit · Aron→Protect ·
Trapinch→Guard · Feebas→Second Wind/Revive · Swinub→Freeze/Stun · Togepi→Heal ·
Budew→Heal · Sneasel→Freeze/Stun · Joltik(R6)→Critical Hit

*R6 — Psychic/Ghost (16):*
Munna→Freeze/Stun · Abra→Freeze/Stun · Meowth→Combo/Team Strike · Gastly→Freeze/Stun ·
Misdreavus→Second Wind/Revive · Shuppet→Freeze/Stun · Duskull→Guard ·
Phantump→Second Wind/Revive · Frillish→Heal · Yamask→Second Wind/Revive ·
Drifloon→Second Wind/Revive · Haunter→Freeze/Stun · Solosis→Freeze/Stun ·
Wynaut→Combo/Team Strike · Natu→Critical Hit · Elgyem→Freeze/Stun

*R7 — Electric/Steel/Fighting/Legendary (19):*
Skitty→Combo/Team Strike · Skiddo→Heal · Dedenne→Combo/Team Strike ·
Magikarp→Second Wind/Revive · Riolu→Guard · Zorua→Freeze/Stun · Honedge→Protect ·
Magnemite→Critical Hit · Elekid→Critical Hit · Magby→Second Wind/Revive ·
Gligar→Critical Hit · Rhyhorn→Protect · Tangela→Heal · Porygon→Freeze/Stun ·
Ralts→Second Wind/Revive · Mewtwo→Freeze/Stun · Lugia→Guard · Deoxys→Critical Hit ·
Xatu→Second Wind/Revive

*R8 — Ice/Rock/Fossil/Ghost (16):*
Snover→Heal · Cubchoo→Heal · Vanillite→Freeze/Stun · Cryogonal→Freeze/Stun ·
Spheal→Protect · Bergmite→Protect · Snorunt→Freeze/Stun · Spiritomb→Second Wind/Revive ·
Skorupi→Freeze/Stun · Croagunk→Guard · Lickitung→Combo/Team Strike · Tyrunt→Critical Hit ·
Amaura→Protect · Yanma→Critical Hit · Murkrow→Freeze/Stun · Heracross→Guard

*R9 — Dark/Dragon/Late Legendaries (19):*
Stunky→Freeze/Stun · Onix→Protect · Fletchling→Critical Hit · Giratina→Second Wind/Revive ·
Articuno→Freeze/Stun · Zapdos→Critical Hit · Moltres→Second Wind/Revive ·
Raikou→Critical Hit · Entei→Second Wind/Revive · Suicune→Heal · Latias→Second Wind/Revive ·
Latios→Critical Hit · Ho-Oh→Second Wind/Revive · Rayquaza→Critical Hit · Kyogre→Heal ·
Groudon→Guard · Arceus→Guard · Dialga→Protect · Palkia→Critical Hit

*R10 — Philippine (18):*
Philippine-Tarsier→Combo/Team Strike · Palawan-Peacock-Pheasant→Combo/Team Strike ·
Philippine-Eagle→Critical Hit · Tamaraw→Guard · Philippine-Crocodile→Protect ·
Carabao→Guard · Visayan-Warty-Pig→Combo/Team Strike · Cloud-Rat→Heal ·
Bakunawa→Critical Hit · Minokawa→Critical Hit · Sarimanok→Second Wind/Revive ·
Mariang-Makiling→Heal · Mariang-Sinukuan→Heal · Tikbalang→Guard · Sarangay→Guard ·
Diwata→Second Wind/Revive · Bathala→Second Wind/Revive · Mayari→Second Wind/Revive

⚠️ **BUILD NOTE:** exact count reconciliation against pokemon.json IDs is a Claude Code
task — the thematic assignments above are the locked design; Claude Code matches them to
the actual JSON entries. Any Pokémon not listed above inherits the thematic rule for its
primary type.

---

#### 14G-5 — HP, DAMAGE & BOSS STATS (LOCKED — tune at playtest)

**Player HP:** carried over directly from gym phase (Part 8 XP/HP model — same bar,
no reset). Full HP reset on boss re-attempt (loss wipes all damage, everyone starts fresh).

**Boss HP per region:**

| Region | Boss | HP |
|--------|------|----|
| R1 | Pawniard | 500 |
| R2 | Cranidos | 700 |
| R3 | Klink | 900 |
| R4 | Vullaby | 1,200 |
| R5 | Pancham | 1,500 |
| R6 | Rufflet | 2,000 |
| R7 | Zygarde | 2,500 |
| R8 | Kyurem | 3,500 |
| R9 | Yveltal | 4,500 |
| R10 | Darkrai | 8,000 |

**Damage tuning knob:** one boss hit ≈ 35 damage (from Part 8 — single lever to
lengthen/shorten all duels). Player damage ≈ 20% of current Pokémon HP per correct answer.
Team Strike = 3× normal damage on all-correct round.

---

#### 14G-6 — BOSS ENRAGE ABILITIES (LOCKED)

Every boss gains a signature ability when HP drops to **50%**. Lasts 2–3 rounds maximum.
Always survivable — never a hard wall.

| Region | Boss | Enrage Ability | Effect | Duration |
|--------|------|---------------|--------|----------|
| R1 | Pawniard | **Sharpen** | Damage +50% | 2 rounds |
| R2 | Cranidos | **Headbutt** | Attacks 2 random kids instead of 1 | 2 rounds |
| R3 | Klink | **Lockdown** | All kids' abilities blocked | 1 round |
| R4 | Vullaby | **Foul Play** | Targets lowest HP kid instead of random | 3 rounds |
| R5 | Pancham | **Swagger** | Damage doubles | 2 rounds |
| R6 | Rufflet | **Tailwind** | 2 attacks per round | 2 rounds |
| R7 | Zygarde | **Order's Wrath** | Team Strike blocked | 2 rounds |
| R8 | Kyurem | **Glaciate** | All Pokémon take 20 damage regardless of answer | 2 rounds |
| R9 | Yveltal | **Oblivion Wing** | Highest HP kid takes double damage | 2 rounds |
| R10 | Darkrai | **Nightmare** | Harder questions + damage +50% | 2 rounds |

**Darkrai exception:** Nightmare is the only ability that combines two effects (question
difficulty + damage boost). Final boss privilege. Papa override (Part 14F) exists if any
kid is short a Legendary — no kid sits out the finale.

---

#### 14G-7 — LEGENDARY GATING & REMINDERS (LOCKED)

**Boss entry gates:**
- R1–R9 minor villains: **no minimum requirement** — any team composition can fight
- R10 Darkrai FINAL: **every kid must field a Legendary Pokémon**
  - Papa override: if any kid is short, Papa can gift a Legendary (host tool, one-time
    emergency use, logged) — no kid sits out the finale
  - Papa override is a safety net, not a workaround — the Legendary requirement is the
    design intention

**In-game Legendary reminders (Papa dashboard + player notification):**

| Trigger | Message |
|---------|---------|
| End of R5 | "Legendary Pokémon start appearing from here — you'll need one for the final battle!" |
| End of R7 | "Darkrai is getting closer. Make sure you catch a Legendary before Region 10!" |
| End of R8 | "⚠️ Final warning — you need a Legendary Pokémon to face Darkrai in Region 10!" |

Papa sees all three reminders on the host dashboard to reinforce verbally.

---

#### 14G-8 — COLLECTIVE-CLEAN STAR RATING (LOCKED)

Replaces the formerly open "collective-clean thresholds" from Part 14C. The three
separate metrics (flawless/full-team/round-efficiency) collapse into one **Battle Star
rating** per boss fight — immediately understandable to kids.

| Stars | Condition |
|-------|-----------|
| ⭐⭐⭐ | Flawless — no faints + every kid hit N=3 + within round budget |
| ⭐⭐ | Solid — no faints + every kid hit N=3 |
| ⭐ | Clear — boss defeated, anything goes |

**Round budget:** target rounds × 1.5 (generous; tune at playtest).
Target rounds = boss HP ÷ expected team damage per round.
Expected damage = average kid damage × number of kids × ~70% accuracy.

**Star accumulation:** stars persist across all boss fights. Average star rating at each
team prize milestone (3/6/10 boss defeats) gates the quality of the shared team prize
(Part 13P). Papa sees live star rating on host dashboard during each fight.

-----

## CONTENT CREATION BACKLOG (deferred — Regions 1–2 pilot first)

**Shared pipeline:** “Did You Know” + CLUE are authored TOGETHER — one research
pass per question produces all fields. Never two separate projects. Review all
fields together for accuracy (esp. Filipino-specific content) to prevent
contradictions.

**Fields per question:** `clueVague` (CLUE L1–2) · `clueMedium` (L3–4) ·
`clueStrong` (L5) · `explanation` (Did You Know) · `funFact` (Did You Know).
**Clue→level:** L1→vague, L2→vague, L3→medium, L4→medium, L5→strong.
Clues WITHHOLD detail (vague→strong); Did You Know GIVES detail. Same source,
different reveal → consistent by construction.

**Template example (Junior, Science, R1):**
Q: Largest animal ever to live on Earth? → Blue Whale

- clueVague: “This animal lives in the ocean.”
- clueMedium: “It’s a mammal that breathes air, but it’s bigger than any dinosaur.”
- clueStrong: “It’s blue, swims in the sea, and its heart alone is the size of a small car.”
- explanation: “The blue whale is the largest animal known to have ever existed —
  even bigger than the biggest dinosaurs! Up to 30 m long, about three school buses.”
- funFact: “A blue whale’s heart can weigh ~180 kg, and its heartbeat is audible
  from over 3 km away. 🐋”

**Template example (Senior, Filipino history — why joint review matters):**
Q: Philippine national hero? → José Rizal

- clueVague: “He was a writer and doctor during the Spanish colonial period.”
- clueMedium: “He wrote two famous novels that inspired the revolution.”
- clueStrong: “His novels were *Noli Me Tángere* and *El Filibusterismo*.”
- explanation: “José Rizal is widely regarded as the Philippine national hero…”
- funFact: “Rizal could read and write at age 2 and spoke 10+ languages! 🇵🇭”
- Review flag: “national hero” is by tradition/consensus, not official law →
  phrase as “widely regarded as.” Single joint review catches this; separate
  authoring would risk clue/explanation contradiction.

-----

## DESIGN BACKLOG → MOVED TO BACKLOG.md (v3.6 — information-architecture cleanup)

> **The backlog now lives in its own file: `BACKLOG.md` — the single source of truth for
> ALL pending work (design + build + ops).** It was previously scattered between here and
> CLAUDE.md, which caused drift. Per the 4-home model (SPEC=design · CLAUDE=build state ·
> BACKLOG=todo · FILES=manifest), pending work is its own information type with its own
> home. Do NOT re-add backlog lists here — add them to BACKLOG.md.
>
> What was here (economy DONE, boss/prize status, evolution, TIME TRAVEL, battle-session
> items, watch-items, parked items, content pipeline, hygiene) is all migrated to
> BACKLOG.md under its NOW / Design / Build / Ops / Watch / Flags / Done sections.
>
> The **DROPPED** list and the **build-implementation notes** below stay here for now
> (KEY BUILD FLAGS / KEY CODE FACTS / SUGGESTED BUILD ORDER are arguably CLAUDE.md/build
> material — flagged as migration candidates for the consolidated cleanup, not moved this
> session to avoid scope creep).

## DROPPED (do not build)

- AMPLIFIER abilities: MULTIPLY, DOUBLE_OR_NOTHING (crystal betting → wrong value).
- STEAL (made a kid cry). FREEZE-others (negative PvP). Ask AI (CLUE covers it).
- Insurance (no real loss to insure; confusing for kids).

-----

## ⚠️ KEY BUILD FLAGS

- **TIME TRAVEL is structural, not just an ability.** Reopening a completed gym
  to convert 7/10→8/10 means: badges recalculable after the fact (cascades into
  rarity/level access since both read cumulative badges); crystal ledger must
  reopen a settled gym; read-only gym-review needs a write path; `startGym`
  anti-farm guard needs a scoped exception so the re-farm loophole stays closed;
  multiplayer sync must handle a kid’s PAST state changing. **Scope as its own
  dedicated session — likely the most complex single build in the redesign.**
- **Remove superseded code/data:** old 3/5 region-level trigger; old Part 4
  badge-threshold gating (0–6/7–16/17–29/30+); MULTIPLY/DOUBLE_OR_NOTHING; STEAL;
  FREEZE-others; consume-on-use in useAbility(); dead TIER_BASE/TIER_SPEED_MAX.
- **Remove (v3.3 economy):** the region-based `pokeball` cost field (R1 300…R10
  10000) → replaced by rarity-based ladder (Part 12C); `badgeMin` per region
  (superseded by 8/10 accuracy badge); `pokeballs: 3` start → 1 (Principle 8); the
  per-question crystal award in showQuestionResult() → per-gym settle (Part 12B).

## KEY CODE FACTS (verified — from v2, still relevant)

- Live crystals region-based (baseCrystals + speedMax). TIER_BASE/TIER_SPEED_MAX
  = DEAD CODE, remove.
- Pass logic currently crystal-based → CHANGE to 8/10 answer-based.
- useAbility() sets abilityUsedThisGym but does NOT consume → now CHANGE to
  XP-growth-on-correct (no consume at all).
- 110 Pokemon (10 starters + 100 regional). 729 questions/band. 0 explanations.
- pokemon.json rarity distribution unusable for new model — redeal (skew later,
  align with player-level access gate).

## SUGGESTED BUILD ORDER (v3)

1. Badge + speed + difficulty dial (P1+2). 2. Unified rarity/leveling — player
   level gate (P4). 3. Appreciating-asset + XP/HP model (P3+8). 4. MOVES core —
   ELIMINATE/CLOCK/SWAP/EXTRA SHOT (P5; CLUE & TIME TRAVEL separate). 5. “Did You
   Know” + CLUE content pipeline — R1–2 pilot (P6 + backlog). 6. Battle system —
   parallel duels + 8 abilities + guardrails (P9). 7. TIME TRAVEL (own session —
   structural). 8. Team cap/release rework (P7). 9. Prize screen. 10. Backlog:
   rarity table, teamwork, combination.