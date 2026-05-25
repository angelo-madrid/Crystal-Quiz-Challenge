# Crystal Quiz Challenge — BACKLOG

```
┌─────────────────────────────────────────────────────────────┐
│ THE SINGLE SOURCE OF TRUTH FOR "WHAT'S LEFT TO DO."           │
│ Last updated: 2026-05-25                                      │
│                                                              │
│ 4-HOME INFORMATION ARCHITECTURE:                             │
│  • SPEC.md   = DESIGN (what the game IS — locked mechanics)  │
│  • CLAUDE.md = BUILD STATE (what EXISTS in the code)         │
│  • BACKLOG.md (THIS) = TODO (what's LEFT — design+build+ops) │
│  • FILES.md  = MANIFEST (what files exist + versions)        │
│                                                              │
│ LIFECYCLE: a task is added HERE → as it's designed it lands  │
│ in SPEC → as it's built CLAUDE.md updates → item moves to    │
│ DONE here. One direction, no scatter. Backlog is NOT design  │
│ or build state — it's its own thing, so it has its own file. │
└─────────────────────────────────────────────────────────────┘
```

> **Workflow vocabulary — TRACKS (not "Phases").** The old CLAUDE.md "Phase Zero–4"
> build roadmap is RETIRED (stale — regions/library/economy already shipped). Live items
> from it migrated below. The current workflow runs in three TRACKS:
> **Track A = Design** · **Track B = Architecture/file-mgmt** · **Track C = Sequenced build.**
> "Track" = this planning workflow; the word "Phase" is no longer used.

---

## 🔵 NOW (the active next pass)

- **Track A — BATTLE SESSION (SPEC Part 14G).** The last big DESIGN pass. Unblocks
  building the boss-gated Team Prize Bonus. Details under DESIGN BACKLOG below.
- **Track B — this information-architecture cleanup** (in progress: creating BACKLOG.md,
  retiring old phases, adding doc pointers). Then the code/file reorg (game.js split etc).

---

## 🎨 DESIGN BACKLOG (pending design passes → land in SPEC when done)

**⚔️ BATTLE SESSION (14G) — boss FREQUENCY/reward already locked in SPEC Part 14:**
- Boss/villain Pokémon set from the 18-creature BENCH (Reshiram/Zekrom/Kyurem/Darkrai
  etc.); separate from the 183 roster. Trophy mechanic designed (14B/14F) — populate the set.
- Populate deferred BATTLE ability per Pokémon (guardrail: power = HP/XP only, never
  rarity-gated).
- ALLY/teamwork mechanic — MOVES targeting option or BATTLE-only?
- Exact collective-clean thresholds (flawless/full-team/round-efficiency) that gate the
  team-prize tiers (3/6/10) — structure locked in 14C, numbers open.
- Region 1 re-attempt path for boss game-over vs forward-only (14F).
- HP/XP growth curve (SPEC Part 8) folds in here — the battle-magnitude dial.

**🅿️ SMALLER DESIGN ITEMS:**
- Final 100-vs-103 roster trim (SPEC Part 10C) — cosmetic; at library polish.
- Diwata loreNote — DECIDED keep "Diwata"; minor Arayat overlap w/ Sinukuan, tweak at
  library polish (cosmetic, non-blocking).
- Additional HP parameters (user has more — HP growth model) — folds into HP/XP pass.
- Combination system (old 5e — star tiers combine abilities) — full pass, deferred.
- Persistence/comeback bonus (forward-only bounce-back) — deferred.
- "Most Supportive Trainer" helping milestone — deferred (relates to honors 13K).
- Teaching-moment crystal trickle / personal-best / collection milestones — deferred.
- CONTENT: "Did You Know" + CLUE authoring pipeline → scale to ~1,458 entries (after
  R1–2 pilot).

---

## 🛠️ BUILD BACKLOG (pending build work → CLAUDE.md updates when done)

**🏗️ TRACK B — ARCHITECTURE / FILE REORG (detail in CLAUDE.md "Architecture" section):**
- game.js MONOLITH SPLIT (5,938 lines → core/ledger/player-ui/catch/wallet/host-ui/
  gameplay via multiple `<script>` tags, no bundler). Its own tested commit.
- File hygiene FIRST (zero-risk): create `/archive/` (move POKEMON_LIBRARY_v2.md, the
  CLAUDE_CODE_PROMPT_*.md files, questions.json); create `/assets/` tree.
- Update FILES.md manifest after the reorg.

**🎁 PRIZE STORE BUILD (design COMPLETE in SPEC Part 13 — these are build tasks):**
- Build the 5-tier store + effort/voucher mechanics (Track C).
- Tier VOUCHER system: crystal→voucher purchase, printable PNG w/ unique code, redeem-
  and-burn, host code-verify (SPEC 13R). User supplies Bronze/Silver/Gold PNG designs.
- Team-pool live host-dashboard sync; kids see a progress bar during play? (build-time)
- Effort-normalizer definitions ("measured gym" / "opportunity") — pin at build.
- Real card SOURCING (not code): specific named cards per tier (~₱250 Silver holo,
  ~₱600 Gold ex) against local market. Shopping task.

**🏆 PRIZE SCREEN / GAME_OVER PODIUM (migrated from old Phase 3):**
- Final-results screen after Region 10 clear (today: generic "Game Complete" screen).
  Crystal summary, unused-Pokémon level bonus, the team-prize reveal (SPEC 13P), honors.

**🟣 EVOLUTION BUILD-OUT (cosmetic A1 — SPEC Principle 10):**
- Stage art per line (3-stage lines = 3 sprites each) — biggest asset cost.
- Catch-screen evolution preview ("Charmander → ✨Charizard").
- game.js: render owned creature's stage by player level; per-kid re-render.

**🔴 STRUCTURAL — own session:**
- TIME TRAVEL — reopening completed gyms cascades into badge recalc, re-gating, ledger
  reopen, anti-farm guard, multiplayer sync. Most complex build.

**✨ POLISH (migrated from old Phase 3):**
- Animations, sound, leaderboard polish.

---

## 🎪 OPS / CONVENTION PREP (migrated from old Phase 4 — before live event)

- Morning-of: delete all test rows from `player_saves`, `rooms`, `crystal_ledger` in
  Supabase (use `player_identity_clean_slate` migration as template).
- Optimize `gengar.png`: export 512×512 (1.42 MB → ~350 KB; no visible diff at 130px).
- Full dress rehearsal with real kids.
- Tag `v1.0.0`.
- (NEW) Supabase data BACKUP before the convention — no backup process exists yet.
- (NEW) Consider test/live ENV separation — currently one environment.

---

## 🟡 WATCH-ITEMS (locked, but monitor in playtest — not action items yet)

- Post-gym rescue coverage gap: EXTRA SHOT/TIME TRAVEL live only on Rare+, so low-level/
  struggling kids can't field a post-gym rescue (SPEC Part 11 MOVE TIMING).
- Draft pacing / host complexity: turn-order, whose-turn UI, pass handling, soft timer —
  new to Papa's dashboard; verify it doesn't drag (SPEC Part 11 P9).
- R7 legendaries = 3 (below the ≥5 buffer) — intentional on-ramp; watch for frustration.
- Crystal gap: without boss crystals the strong-vs-struggling gap re-widens ~3× — FINE
  for prizes (effort-gated), but if the Pokémon ladder feels tight, raise GYM earn-rates
  (NOT boss crystals; SPEC 14D).

---

## ⚠️ OPEN FLAGS / MISMATCHES (resolve, don't lose)

- **Boss-crystal mismatch:** v0.6.0 economy build may still award boss crystals that v3.6
  design REMOVED. Verify with Claude Code & strip if present (also in CLAUDE.md).
- **Repo path discrepancy:** CLAUDE.md Git Workflow says `~/Desktop/CrystalQuiz/...` but
  working notes say `~/dev/Crystal-Quiz-Challenge` (a Desktop copy vanished once — Desktop
  may be cloud-synced, which corrupts git). Confirm true non-cloud-synced path.
- **Part 13 subsection lettering** out of order (13I,K,L,M,N,O,P,Q,R, then J last) from
  inserts — renumber at the consolidated SPEC cleanup, not piecemeal.

---

## ⏳ VERIFY-WITH-CLAUDE-CODE (status unconfirmed)

- Library v2.0 push (183 roster, PH R10, bench) — confirm it landed + validation report.
- v0.6.0 economy build — confirm catch-flow shipped vs. old flow; confirm the ~7×
  earn-reduction validation (strong kid ~₱166 by R6, not the UAT ₱1,184).

---

## ✅ DONE (rolling archive — so history isn't lost)

**v3.6 prize/economy arc (2026-05-25):**
- Prize Store FULLY DESIGNED (SPEC Part 13, all subsections): effort metric, 50/50 split,
  fixed-price tiers + spend, finish-floor, recognition honors, tier→category map, SKU
  framework (cards-first), real-peso budget model, API build-scope, 5th TEAM PRIZE
  (sponsored mystery gift + shared-screen reveal), real ₱800–1,200/kid budget (tiers
  Floor15/Bronze50/Silver250/Gold600), TIER VOUCHER redemption (printable PNG + code).
- Boss crystals REMOVED (SPEC Part 14) — bosses reward team prize + trophy, not crystals;
  leveling unaffected; gym-only economy verified affordable.

**v3.3 economy (2026-05-25, validated vs UAT ledger PEPE12):**
- Path B per-gym earning (~7× runaway cut), rarity-based pokeball ladder, redeem/trade-in
  values, cap growth 3→4→5, pity softener, lifetime-wallet persistence, peso hidden from
  players. BUILT @ v0.6.0.

**Historical (old Phase Zero–2, now retired):**
- Docs + question library restructure/age-tune + full Pokémon library + validation.
- Engine vertical slice; all 10 regions playable (test-build lid removed); R10 clear →
  GAME_OVER + auto-archive. Multiplayer core, rooms, ledger, dashboards, rejoin — LIVE.
