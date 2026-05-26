# Crystal Quiz Challenge — BACKLOG

```
┌─────────────────────────────────────────────────────────────┐
│ THE SINGLE SOURCE OF TRUTH FOR "WHAT'S LEFT TO DO."           │
│ Last updated: 2026-05-26                                      │
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
> build roadmap is RETIRED. Live items migrated below. The current workflow runs in
> three TRACKS:
> **Track A = Design** · **Track B = Architecture/file-mgmt** · **Track C = Sequenced build.**

> **TRACK A — DESIGN (locked, all areas in SPEC).** The core design is locked in SPEC:
> Economy (Part 12) + Prize Store/Bayanihan (Part 13) + Boss Mechanics (Part 14A–F) +
> Battle Session (Part 14G); card sourcing → voucher model (Part 13R).
> **Player Game Management + Crystal Economy — ADOPTED into SPEC v3.9 (Part 15 + Part 12
> rewrite + Part 13 amend).** Now in Track C build (P1 → P3 → Store → Voucher → P2 →
> Podium). The build checklist lives in BUILD BACKLOG below.

---

## 🔵 NOW (active next)

- **R1–R3 UAT with real kids** — battle engine built & playable (Commits 1–4) and gym
  MOVE abilities now fire (v1.23 dispatcher fix). Capture: boss difficulty, N=3 feel,
  Team Strike, reward reaction, pacing, ability feel (CLOCK/ELIMINATE/SWAP/CLUE),
  FREEZE_STUN (team-wide), enrage moments, reconnect paths. Use the dev-reset tool
  (`?dev=1`) to reset the test player between runs, and clear Supabase test rows first.
  ⚠️ Dev-reset tooling is REFERENCED but NOT YET BUILT (see OPS item 34) — currently
  rely on the full-wipe SQL path until the per-player `?dev=1` tool ships.
- **(Optional, if reward loop wanted for UAT)** crystal checkpoint economy P3 / R3
  banking — see the staged Player Game Management item below.

---

## 🎨 DESIGN BACKLOG (deferred cosmetic/minor items — not blocking build)

1. Final 100-vs-103 roster trim (SPEC Part 10C) — cosmetic, at library polish
2. Diwata loreNote tweak — cosmetic, non-blocking
3. Combination system (star tiers combine abilities) — full pass, deferred
4. Persistence/comeback bonus (forward-only bounce-back) — deferred
5. "Most Supportive Trainer" helping milestone — deferred (relates to honors 13K)
6. Teaching-moment crystal trickle / personal-best / collection milestones — deferred
7. CONTENT: "Did You Know" + CLUE authoring pipeline (~1,458 entries, after R1–2 pilot)

---

## 🛠️ BUILD BACKLOG (pending build work → CLAUDE.md updates when done)

**🏗️ TRACK B — ARCHITECTURE / FILE REORG:**
8. game.js monolith split (~7,660 lines as of v1.23 → core/ledger/player-ui/catch/
   wallet/host-ui/gameplay via multiple `<script>` tags, no bundler). Its own tested
   commit.
9. Create `/assets/` tree (needed before evolution art + voucher PNGs land).
10. Update FILES.md manifest after the reorg.

**⚔️ BATTLE ENGINE (Track C) — ✅ BUILT (Commits 1–4, 2026-05-26). See DONE archive.**
> Items 11–23 shipped: 3v1 loop, turn engine, boss HP/enrage (all 10 regions), Team
> Strike (kid-driven via COMBO_TEAM_STRIKE), N=3, 7 battle abilities, star rating,
> reward Pokémon, R10 Legendary gate + Papa override, R5/R7/R8 reminders, kid-managed
> round flow. Item 23 (boss-crystal strip) verified CLEAN. game.js v1.21+.
> ⚠️ Battle NUMBERS (boss HP, 35-dmg knob, N=3) remain tune-at-UAT — see WATCH-ITEMS.

**🎁 PRIZE STORE BUILD (design COMPLETE in SPEC Part 13):**
24. 5-tier store + effort/voucher mechanics
25. Tier VOUCHER system (crystal→voucher purchase, printable PNG + unique code,
    redeem-and-burn, host code-verify — SPEC 13R)
26. Team-pool live host-dashboard sync; kids progress bar during play
27. Effort-normalizer definitions ("measured gym" / "opportunity") — pin at build

**🏆 PRIZE SCREEN / GAME_OVER PODIUM:**
28. Final-results screen after R10 clear (crystal summary, unused-Pokémon level bonus,
    team-prize reveal SPEC 13P, recognition honors SPEC 13K)

**🟣 EVOLUTION BUILD-OUT (cosmetic A1 — SPEC Principle 10):**
29. Stage art per line (3-stage lines = 3 sprites each) — biggest asset cost
30. Catch-screen evolution preview ("Charmander → ✨Charizard")
31. game.js: render owned creature's stage by player level; per-kid re-render

**🔴 STRUCTURAL — own session:**
32. TIME TRAVEL — reopening completed gyms cascades into badge recalc, re-gating,
    ledger reopen, anti-farm guard, multiplayer sync. Most complex build.

**✨ POLISH:**
33. Animations, sound, leaderboard polish

**🎮 PLAYER GAME MANAGEMENT + CRYSTAL CHECKPOINT ECONOMY (Track C — ADOPTED into SPEC v3.9, building now):**

> **ADOPTED into SPEC v3.9 (2026-05-26).** The design is locked in SPEC Part 12/13/15;
> this block is the BUILD checklist (dependency order: P1 → P3 → Store → Voucher → P2
> → Podium). Open implementation questions tracked at SPEC 15H.

DESIGN REFERENCE: SPEC Part 15 (game/save model), Part 12-NEW-A…G (provisional→banked
economy), Part 13 v3.9 amendment (banked-only spend). Detail does not need to live in
BACKLOG anymore — it lives in SPEC.

BUILD PHASES (dependency order):
40. P1 — model + migration. Introduce `active_game_id` + `banked_crystals` at the
    player row; wrap existing flat save as `games[0]` (idempotent, non-destructive,
    `if (!row.data.games)` guard); LIFT legacy `total_crystals` → `banked_crystals`;
    repoint dbLoad/dbSave to the active game's `progress` via accessor. No visible
    gameplay change. Independently testable. (SPEC 15D + 15E.)
42. P3 — crystal checkpoint economy. Split `provisional_crystals` (per-game) from
    `banked_crystals` (per-player); add `REGION_CRYSTAL_CAP` + `banked_regions[]`;
    bank at R3/R7/R10 boss clears with `min(cap, best) − alreadyBanked` per region;
    write per-player ledger rows on banking; restart/abandon semantics per SPEC 15F.
    REWRITES Part 12 in code. (SPEC 12-NEW-A…G.)
    NOTE: P3 is independent of P1/P2 — the provisional/banked split works in the
    single-game model too. If the Prize-Store reward loop is wanted before P2 is
    built, ship P3 (at least the R3 checkpoint) first.
43. PRIZE STORE — banked-only spend. Make the store always open + browsable; spend
    flows debit `banked_crystals` only; "earning this game — bank at R3/R7/R10"
    indicator separates provisional from banked. Build items 24/26/27 (5-tier store +
    effort + team-pool sync) layered on top. (SPEC Part 13 v3.9 amendment.)
44. VOUCHER — TIER VOUCHER system per SPEC 13R (crystal→voucher purchase, printable
    PNG + unique code, redeem-and-burn, host code-verify). Existing build item 25.
45. P2 — game management UI. My Games list (active/abandoned/finished/archived),
    switch/restart/abandon/archive/restore confirms, banked-vs-provisional display.
    Reference the player-dashboard mockup from the 2026-05-26 design session.
    (SPEC 15B + 15C.)
46. PODIUM — final-results screen after R10 clear (crystal summary, unused-Pokémon
    level bonus, team-prize reveal SPEC 13P, recognition honors SPEC 13K).
    Equivalent to build item 28.

OPEN QUESTIONS (resolve before build):
- Switch-active side effect: previous active → abandoned (proposed) or stay resumable?
- Finished-game replay: read-only + restart-makes-new (proposed), or replayable in place?
- Max games cap per player (proposed soft cap ~10)?

---

## 🎪 OPS / CONVENTION PREP (before live event)

34. Delete all test rows from `player_saves`, `rooms`, `crystal_ledger` in Supabase
35. Optimize `gengar.png` (512×512, ~350 KB)
36. Full dress rehearsal with real kids
37. Tag `v1.0.0`
38. Supabase data backup before the convention
39. Consider test/live ENV separation

---

## 🟡 WATCH-ITEMS (locked, monitor in playtest)

- Post-gym rescue coverage gap: EXTRA SHOT/TIME TRAVEL on Rare+ only — low-level kids
  can't field a post-gym rescue. Watch for frustration.
- Draft pacing / host complexity: turn-order, whose-turn UI, pass handling, soft timer.
- R7 legendaries = 3 (intentional on-ramp; watch for frustration).
- Crystal gap: without boss crystals strong-vs-struggling gap ~3× — FINE for prizes
  (effort-gated); if Pokémon ladder feels tight, raise GYM earn-rates (NOT boss crystals).
- Battle tuning: boss HP + damage knob (35/hit) + N=3 threshold all need playtest
  validation. Lowest-level kid vs matched enemy is the critical test case.
- Foul Play (Vullaby R4 enrage): targets lowest HP kid — watch if this feels unfair
  in practice; can swap to random target if needed.
- RE-ENTRY / RECONNECT paths (found at pre-game catch, fixed v1.21.1): a kid
  refreshing or rejoining mid-game could land back on a phase screen they'd
  already completed (pre-game catch trapped them with team + 0 balls). Fixed for
  pre-game; AUDIT the other phase screens (gym, regional catch, boss fight) for
  the same re-entry pattern during UAT — confirm reconnect always routes to the
  correct CURRENT state, never a completed one.
- ABILITY ECONOMY (v1.22): code now matches SPEC v3 appreciating-asset model
  (was still running dead v2 consume-on-use). Watch at UAT: does HP growth feel
  rewarding? Is +band/10 per use noticeable? Is one-use-per-gym too slow vs the
  Part 8 curve (which assumed ~3/gym)? Removing the per-gym limit is the lever.
- CATCH-BETWEEN-GYMS (v1.22): more catches/region than the region-end economy
  assumed (up to 5 catch screens/region vs 1). Watch ball economy + team-fill
  speed + strong/struggling gap at UAT.
- Pre-game catch + regional catch both build `newPokemon` — confirm BOTH stamp
  `hp` via `computeHp` (v1.22 Change 3G) so no Pokémon has undefined HP in battle.
- EXTRA_SHOT / TIME_TRAVEL are gated as post-gym rescue (v1.23). EXTRA_SHOT has no
  post-gym entry point built yet; TIME_TRAVEL = BACKLOG item 32, not built. 57 Pokémon
  (23 EXTRA_SHOT + 34 TIME_TRAVEL) currently no-op their MOVE with a "post-gym rescue"
  toast. Wire the post-gym rescue flow so these Pokémon's moves become usable; until
  then they stay gated.
- QUESTION POOL DEPTH (blocks fresh-questions-on-replay, build items 40–46 / SPEC 12-NEW-D): the crystal
  economy assumes replays serve NEW questions. Verify per-category-per-tier depth in
  gym_bank[category][tier] is deep enough that a few replays don't exhaust the bucket and
  force repeats (pickQuestion falls back to least-recently-seen on exhaustion). SPEC's
  ~1,458-question goal supports this — confirm actual depth before building P3.

---

## ⚠️ OPEN FLAGS (resolve, don't lose)

- ~~**Boss-crystal mismatch:**~~ ✅ RESOLVED (2026-05-26, battle build Commit 1): the
  v0.6.0 code never had boss-crystal-award logic — grep confirmed zero
  `boss…crystal` / `crystal…boss` matches in game.js. Nothing to strip. Item 23 closed.
- **SPEC Part 13 subsection lettering** out of order (13I,K,L,M,N,O,P,Q,R, then J
  last) — renumber at consolidated SPEC cleanup, not piecemeal.
- ~~**MOVE ABILITY DISPATCHER / DATA SCHEMA MISMATCH**~~ ✅ RESOLVED v1.23
  (2026-05-26): dispatcher rewired to read `pokemon.move.type` with the canonical
  SPEC Part 5 names; legacy `abilityEffect.mechanic` aliases preserved for old
  saves. Bridge approach chosen (option a — code now matches canonical SPEC,
  data unchanged).
- ~~**TIME ability values:**~~ ✅ RESOLVED v1.23 (2026-05-26): default values
  supplied at the dispatcher (CLOCK=5s, ELIMINATE=1, FREEZE=5s) since the
  pokemon.json schema carries none. If per-Pokémon variation is wanted later,
  add `move.value` to the data and the dispatcher already prefers it.

---

## ⏳ VERIFY WITH CLAUDE CODE (status unconfirmed)

- Library v2.0 push — confirm landed + validation report (counts, dups, legality)
- v0.6.0 economy build — confirm catch-flow shipped vs old flow; confirm ~7×
  earn-reduction validation (strong kid ~₱166 by R6, not UAT ₱1,184)

---

## ✅ DONE (rolling archive)

**Track C — BATTLE ENGINE R1–R3 BUILT (2026-05-26, Commits 1–4 + hotfixes):**
- Commit 1 (v1.18): BOSS_FIGHT phase scaffold; BOSS_DATA + BOSS_REWARD_POKEMON (all 10
  regions); screen-battle shell; boss-crystal mismatch confirmed clean (item 23 closed).
- Commit 2 (v1.19): full battle loop — round engine, auto-resolve, boss attack + enrage
  (all 10 regions), N=3 win gate, win/loss/retry, star rating, reward Pokémon offer,
  Darkrai cameo R3/R7, host battle panel.
- Commit 3 (v1.20): 6 battle abilities (CRITICAL_HIT/FREEZE_STUN/HEAL/PROTECT/GUARD/
  SECOND_WIND) declared pre-answer; Lockdown blocks bar; R10 Legendary gate + Papa
  override (logged); R5/R7/R8 reminders.
- Commit 4 (v1.21): kid-managed round flow (Papa starts R1 only, rounds auto-chain on
  last-kid Ready); COMBO_TEAM_STRIKE armed between rounds; enrage warnings on summary;
  host watch-only + force-next fallback.
- Hotfix v1.21.1: pre-game catch re-entry trap + "undefined" ability labels (7 sites).
- v1.22: instant abilities (no popup); catch-between-gyms (rarity-by-level, Part 4);
  abilities NON-CONSUMING + XP-growth (appreciating-asset model, Part 3B/8) — removed
  dead consume splice; HP grows per band formula.
- v1.22.1: TIME ("Clock") ability visible-effect fix (was bumping both timeLeft+totalTime).
- v1.23: MOVE ability dispatcher schema fix — dispatcher rewired to read
  `pokemon.move.type` (canonical SPEC Part 5 names: CLOCK/ELIMINATE/SWAP/CLUE
  in-question; EXTRA_SHOT/TIME_TRAVEL post-gym gated) instead of the nonexistent
  `abilityEffect.mechanic`. Default values supplied (CLOCK +5s) since data carries
  none. Was UAT-blocking — every gym ability tap fell through to "Unknown mechanic".

**Track A — DESIGN COMPLETE (2026-05-25):**
- Battle Session FULLY DESIGNED (SPEC Part 14G v3.7): boss/villain casting (Darkrai
  Big Boss R3/R7/R10; 9 minor villains from bench); boss reward Pokémon (one per fight,
  keep-or-release, normal team cap, uniqueness exception); battle structure (3v1 shared
  HP bar, simultaneous, N=3 min contribution, Team Strike 3×); turn structure
  (simultaneous + random villain attack); boss HP (R1 500→R10 8,000; tune at playtest);
  boss enrage abilities (50% HP trigger, unique per boss, Darkrai Nightmare); BATTLE-
  ability population (193 Pokémon, thematic assignment, 7 abilities); ALLY = battle-only;
  star rating (⭐⭐⭐/⭐⭐/⭐); R10 Legendary gate + Papa override; reminders R5/R7/R8.
- Real card sourcing → REPLACED by voucher model (SPEC 13R) — no sourcing needed.

**Information architecture cleanup (2026-05-25):**
- 4-home model live on GitHub (BACKLOG.md created; SPEC/CLAUDE/FILES reconciled)
- Stale files archived to /archive/ (questions.json, POKEMON_LIBRARY_v2.md,
  3× CLAUDE_CODE_PROMPT_*.md); FILES.md→v1.31
- Repo path confirmed: `~/dev/Crystal-Quiz-Challenge` (not Desktop)

**v3.6 prize/economy arc (2026-05-25):**
- Prize Store FULLY DESIGNED (SPEC Part 13): effort metric, 50/50 split, fixed-price
  tiers, finish-floor, honors, tier→category map, SKU framework, real-peso budget,
  API build-scope, TEAM PRIZE (sponsored mystery gift + shared-screen reveal),
  ₱800–1,200/kid budget (Floor 15/Bronze 50/Silver 250/Gold 600), TIER VOUCHER
  (printable PNG + unique code).
- Boss crystals REMOVED (SPEC Part 14) — bosses reward team prize + trophy, not
  crystals; gym-only economy verified affordable.

**v3.3 economy (2026-05-25):**
- Path B per-gym earning, rarity pokeball ladder, redeem/trade-in values, cap growth
  3→4→5, pity softener, lifetime-wallet persistence, peso hidden from players. BUILT @ v0.6.0.

**Historical (old Phase Zero–2, retired):**
- Docs + question library + full Pokémon library + validation.
- Engine vertical slice; all 10 regions playable; R10 clear → GAME_OVER + auto-archive.
- Multiplayer core, rooms, ledger, dashboards, rejoin — LIVE.
