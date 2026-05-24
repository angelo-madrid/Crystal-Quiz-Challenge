# Crystal Quiz Challenge — Economy, Learning & Story Redesign Spec

```
┌─────────────────────────────────────────────────────────────┐
│ DESIGN VERSION: v3.2   ·   LAST UPDATED: 2026-05-24          │
│ STATUS: active design bible (source of truth for DESIGN)     │
│ This file's version advances each design session that locks  │
│ decisions. CLAUDE.md carries a "Synced to SPEC: v3.X" line   │
│ — if it lags this number, CLAUDE.md is behind.               │
└─────────────────────────────────────────────────────────────┘
```

**v3.2 (2026-05-24):** catch mechanics (9 principles), snake-draft shared-exclusive
pool, team cap 3, cosmetic evolution (A1), 183-line library v2.0, Philippine R10,
document hygiene + versioning. Supersedes v3.1 (rarity-only, same day).
**Prior:** v3.1 — rarity/MOVE pairing/distribution · v3 — abilities, leveling,
appreciating-asset, battle system.
**Purpose:** Complete design decisions from the post-UAT redesign. Carry into
fresh Claude Code sessions, one feature at a time.

> **📐 SOURCE OF TRUTH (read this first):** THIS SPEC owns all DESIGN (decisions,
> principles, mechanics, region themes, backlog). CLAUDE.md owns BUILD STATE
> (tech stack, conventions, git workflow, what's implemented) and POINTS here for
> design — it must NOT duplicate design content. When they could conflict, the
> SPEC wins on design, CLAUDE.md wins on "what's actually live." See the Document
> Hygiene section below.

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
  grid, catch system, region themes (incl. R10 = Philippine), evolution rules,
  the backlog. If a design decision isn't here, it doesn't exist. Cross-session
  brain.
- **CLAUDE.md = BUILD STATE.** Tech stack, file structure, git workflow,
  conventions, and a short STATUS section (version + implemented-vs-designed). It
  REFERENCES the SPEC for design ("themes per SPEC Part 10C") and never restates
  design details. Prevents drift by not duplicating.
- **pokemon.json / game.js = LIVE TRUTH** for data/code — only updated when a
  decision is actually BUILT (via Claude Code).
- **Prompt files, POKEMON_LIBRARY_v2.md, etc. = DISPOSABLE SCAFFOLDING.** Snapshots
  that go stale on the next decision. Regenerate freely; never a source of truth.

### Refresh checklist — on every major design change
1. **SPEC** — ALWAYS. Record the decision + reasoning; update CHANGE LOG + backlog.
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

- **Cap = 3 *(LOCKED, supersedes the earlier "4")*.** Set by the catch-mechanics
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

### 10E — STILL OPEN (next session = ECONOMY, now unblocked)

- Redeem value per rarity/level under XP-growth (old baseValue = catchCost ×
  rarityPremium needs rework).
- Catch cost per rarity/region (does old pokeball ladder R1 300…R10 10000 hold?).
- Part 7 release/refund rework (hold-vs-release is now a real choice).
- Final 100-vs-103 count trim; starter redeem-value confirm (Part 3D).

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

**PRINCIPLE 4 — Team cap = 3 (LOCKED; SUPERSEDES the earlier "4" in Part 7).**
A kid holds up to 3 pokemon at any time. The trade-in model (Principle 7) is what
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
(crystals are the gate); (c) always bounded by cap of 3 — exceed only by
releasing.

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
multiplayer claim rules, stats, whether it counts vs the cap of 3.

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

## DESIGN BACKLOG (future passes — NOT this build)

**⏳ IN PROGRESS (Claude Code applying now):**
- **Library v2.0 push** — `CLAUDE_CODE_PROMPT_v2_FINAL.md` running in Claude Code:
  183 evolution-line roster, two-commit (docs + data), PH-themed R10, bench.
  ON RETURN: (a) review the emoji/type Claude Code assigned to new base forms +
  all R10 PH creatures; (b) confirm validation report (counts, no dups, move
  legality); (c) confirm the push.

**🟢 NEXT SESSION — Economy (unblocked, large):**
- Redeem value per rarity/level under XP-growth (rework baseValue formula).
- Pokeball cost ladder — finalize numbers (Part 11 P3 ratios: Basic 50 →
  Legendary 2500; confirm vs real crystal earn-rates).
- Trade-in value on release — finalize numbers (Part 11 P7: base 40% → 80% grown).
- Starter redeem-value confirm (0).
- Catch-phase pity-softener (easier Q bank after N misses) — decide / playtest.
- TUNE so releases stay RARE (else "gone forever" starves the pool — Part 11 P7).

**🟣 EVOLUTION build-out (cosmetic A1 — Principle 10):**
- Stage art per line (3-stage lines need 3 sprites each; reserved evolved forms
  need art too). Biggest asset cost.
- Catch-screen evolution PREVIEW ("Charmander → ✨Charizard") — required for
  price legibility; build it.
- game.js: render owned creature's stage by PLAYER level; per-kid re-render.

**🔴 STRUCTURAL — own session:**
- **TIME TRAVEL** — reopening completed gyms cascades into badge recalc, re-gating,
  ledger reopen, anti-farm guard, multiplayer sync. Most complex build.

**⚔️ BATTLE-dependent (waiting on boss mechanics):**
- **Boss/villain pokemon set** — design from the BENCH (18 displaced incl.
  Reshiram/Zekrom/Kyurem/Darkrai etc.); separate from the 183 (Part 11). Decide
  the "catch a defeated boss's signature pokemon" trophy mechanic.
- Populate deferred **BATTLE ability** per Pokemon (rich-get-richer guardrail:
  battle power = HP/XP only, never rarity-gated).
- Battle frequency / boss mechanics design.
- **Teamwork / ALLY:** survives in MOVES as a targeting option, or BATTLE-only?
- **Region 1 re-attempt path** for boss game-over vs forward-only.

**🟡 WATCH-ITEMS (locked but monitor in playtest):**
- **Post-gym rescue coverage gap:** EXTRA SHOT/TIME TRAVEL live only on Rare+, so
  low-level/struggling kids can't field a post-gym rescue. May need a baseline
  retry for all (Part 11 MOVE TIMING note).
- **Draft pacing / host complexity:** turn-order, whose-turn UI, pass handling,
  soft timer — all new to Papa's dashboard; verify it doesn't drag (Part 11 P9).
- **R7 legendaries = 3** (below the ≥5 buffer) — intentional on-ramp; watch that
  it doesn't frustrate early-L5 kids.

**🅿️ PARKED (smaller passes):**
- **Diwata → specific named being?** R10 "Diwata" is a general term; consider a
  named entity (e.g. Tala, star goddess — completes a celestial trio w/ Mayari +
  Bakunawa). Minor cultural-polish item.
- Additional HP parameters (user has more — HP growth model).
- Combination system (old 5e — star tiers combine abilities) — full pass.
- Persistence/comeback bonus (forward-only bounce-back).
- "Most Supportive Trainer" helping milestone.
- Teaching-moment crystal trickle / personal-best / collection milestones.

**📝 CONTENT (deferred until R1–2 pilot):**
- "Did You Know" + CLUE authoring pipeline → scale to ~1,458 entries.

**🔧 HYGIENE:**
- **CLAUDE.md was STALE this session** — it lacked R10's Philippine theme (caught
  late). Before next session, sync the latest repo CLAUDE.md so design decisions
  aren't built on outdated state. Check for other missing region themes/decisions.

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