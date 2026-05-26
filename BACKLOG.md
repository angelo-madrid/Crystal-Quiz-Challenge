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

- **FULL UAT — Phase 3+4 build chain COMPLETE** (P1 → P3 → Store → Voucher →
  P2 → Podium all shipped, v1.24–v1.28). Live: battle engine, instant abilities
  + XP growth, MOVE dispatcher, catch between gyms, player-row + per-room games,
  game ↔ room binding, provisional→banked checkpoint economy, Prize Store + Tier
  Vouchers, My Games UI, GAME_OVER Podium + team prize + honors. Capture across a
  full R1–R10 run: difficulty curve, banking moments (R3/R7/R10), Prize-Store
  affordability + voucher print flow, podium emotional payoff, team-prize tier
  hit, honors variety, multi-game switch UX.
- **Cap + price tuning** (BACKLOG WATCH-ITEMS): `REGION_CRYSTAL_CAP` values and
  `VOUCHER_TIERS` prices are placeholders — UAT data confirms or retunes.
- **Dev-reset tooling** (OPS item 34) still REFERENCED but NOT BUILT — currently
  rely on full-wipe SQL between UAT runs.
- ⚠️ **Clear Supabase test data before real UAT.** v1.29 surfaced a player with
  gyms 1/2/4/5 complete but NOT 3 — the sequential-lock at line 3853
  (`isLocked = i > 1 && !gymsCompleted.includes(i-1)`) was confirmed intact, so
  this was stale test data from an earlier build that wrote `gymsCompleted` out
  of order. Wipe before real UAT to avoid confusion.

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
40. ✅ P1 — model + migration. **DONE v1.24 (2026-05-26).** Player-row shape live:
    `active_game_id` + `banked_crystals` + `games[]` at the row; legacy flat saves
    auto-wrap as `games[0]` (lazy, idempotent, non-destructive) and lift
    `total_crystals` → `banked_crystals`. New helpers: `newGame`, `newPlayerRow`,
    `activeGame`, `activeProgress`, `migrateToPlayerRow`, `dbLoadRow`, `dbSaveRow`,
    `hydratePlayerData`. STATE.save now points at the active game's progress via
    accessor — the 119 read sites are unchanged. NO behavior change. (SPEC 15D + 15E.)
42. ✅ P3 — crystal checkpoint economy. **DONE v1.25 (2026-05-26).** Split LIVE:
    `progress.total_crystals` (visible provisional, per-game) + `row.banked_crystals`
    (per-player wallet, spendable). `REGION_CRYSTAL_CAP` (placeholder values, tune at
    UAT) + `progress.region_crystals[rid]` accrual at gym earn + trade-in.
    `bankCrystalsForCheckpoint(regionId)` banks `min(cap, earned) − alreadyBanked` per
    region, idempotent via `progress.banked_regions`, writes per-player ledger row,
    hooked into `_battleRecordDefeat` so R3/R7/R10 boss clears trigger banking +
    `showCheckpointBankToast`. `resetGameProgress(game)` zeroes provisional/region/
    banked_regions (wallet untouched) — ready for P2 restart UI. Map HUD + Wallet
    header show banked vs provisional. (SPEC 12-NEW-A…G.)
    ⚠️ DEFERRED to item 43: flipping the Prize Store buy to banked-only — there's no
    Prize Store buy code yet. Pokeball + broadcast spends stay on provisional for
    early-game playability; see WATCH-ITEM.
43. ✅ PRIZE STORE — banked-only spend. **DONE v1.26 (2026-05-26).** `screen-prize-store`
    live with 3 tier cards (Bronze 8k / Silver 20k / Gold 40k — placeholder prices);
    spend debits `row.banked_crystals`; banked vs provisional clearly separated; entry
    button on player-dashboard col-2 wallet. Tiers affordability-gated only (effort/team
    gate deferred — see WATCH-ITEM). (SPEC Part 13 v3.9 amendment.)
44. ✅ VOUCHER — TIER VOUCHER system. **DONE v1.26 (2026-05-26).** `buyVoucher(tier)`
    deducts banked, generates unique code (`TIER-PLAYER-TIME-rand`), pushes to
    `row.vouchers[]`, writes ledger `redeem_request` audit row (status `approved`,
    note `VOUCHER <Tier> [code]`). `screen-voucher` shows themed printable keepsake;
    `redeemVoucher(code)` flips voucher status `active→redeemed` (host verify-and-burn).
    Print CSS hides everything except the keepsake on `window.print()`. PNG artwork
    user-supplied later — themed CSS placeholder lives in `.voucher-keepsake`. (SPEC 13R.)
45. ✅ P2 — game management UI. **DONE v1.28 (2026-05-26).** Also locks in the
    game↔room binding engine (Phase A of this build): a GAME = a per-room
    campaign keyed on `room_code`. `bindGameToRoom` create-or-resume on join/
    rejoin; FINISHED games stay finished (rejoin routes to podium, not silent
    resurrection); previous active → abandoned on switch (SPEC 15C); first-join
    reuses the null-room placeholder. My Games UI in player-dashboard col-1
    (`#pdc-mygames-section` with active+paused+finished list and collapsible
    archived sublist) — `renderMyGames` + per-status cards with stats
    (🏅badges · 🗺️region · 🐾team · ✨provisional). Ops: switchToGame
    (rejoins room via `playerJoin`), continueActiveGame, confirmRestartGame/
    restartGame, archiveGame (picks next non-archived or none), restoreGame.
    `resetGameProgress` upgraded to full-progress reset via `newSave` (wallet
    + vouchers safe). (SPEC 15A + 15B + 15C + 15D.)
46. ✅ PODIUM — final-results screen after R10 clear. **DONE v1.27 (2026-05-26).**
    `screen-podium` live: champion hero + stats grid (badges, bosses X/10, stars,
    team, banked + provisional crystals); TEAM PRIZE reveal (SPEC 13P) via
    `TEAM_PRIZE_TIERS` + `teamPrizeTier(bossCount)` (3=small, 6=medium, 10=grand,
    highest-only, mystery shared gift, journey breadcrumb); HONORS (SPEC 13K) via
    `computeHonors` — Top Trainer / Champion / Star Master / Collector + fallback,
    cosmetic only (never grants crystals/picks). `showFinalCompleteScreen` rewired
    async — marks active game `status:'finished'` (SPEC 15B), `dbSaveRow`, then
    podium. Routes to Prize Store / Dashboard. Legacy `screen-test-build-complete`
    kept as defensive fallback. (SPEC 13K + 13P.) Equivalent to build item 28.
    ⚠️ Multiplayer comparison honors (Most Improved / Team Heart) deferred.

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
- ABILITY ECONOMY — UPDATED v1.28.2 (UAT pulled the lever): one-per-gym was too
  restrictive, cadence is now **one ability per QUESTION** (up to ~10 XP events
  per gym, ~50 per region). Multiple abilities on a SINGLE question still NOT
  allowed. Watch at UAT: does HP growth now feel rewarding without overshooting?
  Tune `STATE.abilityUsedThisQuestion` if a softer cadence is wanted (it's the
  lever). v1.22: code now matches SPEC v3 appreciating-asset model.
- ~~POKEMON.JSON DATA GAP (surfaced by v1.28.2 hotfix)~~ ✅ RESOLVED v1.28.3 —
  MISDIAGNOSIS. The names exist on all 183 regional entries; they live in the
  `catchForm` field, not `name`. v1.28.3 resolver reads `catchForm` as the
  primary fallback before the id-prettify path, picking up the correct
  hyphenated names (Jangmo-o, Ho-Oh, Philippine-Eagle, Mariang-Makiling). Not
  a data gap. The evolution-data model (`catchForm` + `evolutionChain` +
  `stages`) is already in pokemon.json, ready for the future evolution build
  (BACKLOG items 29–31).
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
- MULTIPLAYER COMPARISON HONORS (deferred from v1.27 Podium, SPEC 13K): "Most
  Improved" (vs own past) + "Team Heart" (most revives/most supportive) need
  per-gym improvement history + battle-assist tracking (revive/protect counts)
  not yet collected. v1.27 ships the self-referential honors (Top Trainer,
  Champion, Star Master, Collector + fallback). Wire the cross-player honors
  when the data sources exist.
- EFFORT/TEAM GATING (deferred from v1.26 Prize Store, SPEC 13C/13D): tier unlock is
  affordability-only for now (`isTierUnlocked` stubbed `true`; Effort Score
  display-only). To wire the real two-gate (team effort unlocks tiers): build
  (a) per-gym improvement history (40% weight, SPEC 13C), (b) Did-You-Know/CLUE
  engagement tracking (25%), (c) 50/50 team pool sync on the host dashboard.
  Tune unlock thresholds + voucher prices at UAT. Replace the `isTierUnlocked`
  body with the real check — no other restructuring needed.
- v1.25 SPEND-SITE POLICY (deliberate): only the Prize Store should spend BANKED
  crystals (SPEC Part 13 v3.9 amendment). Today the only in-game spends are
  Pokeball buy (regional catch) + broadcast message (10 💎) — both kept on
  PROVISIONAL (`total_crystals`). Rationale: no Prize Store buy code exists yet
  (item 43), and forcing Pokeball buys through banked would brick R1/R2 catch
  (kids can't bank anything until R3). Re-evaluate at UAT: should regional
  Pokeball ALSO require banked? If so, the gate moves when item 43 ships.
- v1.25 REGION_CRYSTAL_CAP VALUES are placeholders (R1=400 … R10=1200). Tune at
  UAT — caps should let a strong kid hit ceiling without grinding, and let a
  struggling kid recover via replay without ever exceeding. Confirm vs the
  observed per-region earn rates.
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

**Track C — BOSS REACHABILITY FIX (2026-05-26, v1.29 — #1 UAT blocker):**
- `startBossFight` now sets `room.phase = 'BOSS_FIGHT'` + `room.currentRegion` so
  the host boss control panel reveals — was writing `battleState` only, but the
  panel gates on `phase === 'BOSS_FIGHT'`, so the "Start the Battle!" button
  never appeared
- Boss controls (`_hostRenderBattlePanel`) now render in `renderRoomDetail`
  (the room-detail overlay the host drives games from), not just dashboard col3
- New `rdStartBossFight` manual fallback shown in the overlay when
  `room.phase === 'REGION_COMPLETE'`
- Sequential gym-completion lock confirmed intact (line 3853); gym-3
  out-of-order anomaly traced to stale Supabase test data
- Existing `hostDoPoll` (2.5s) already re-renders the overlay while open
- Restores the boss → R3/R7/R10 banking → Prize Store reward loop end-to-end

**Track C — P2 GAME↔ROOM BINDING + MY GAMES UI (2026-05-26, v1.28):**
- A GAME is now a per-room campaign — `room_code` is the key
- `gameForRoom`, `bindActiveGame`, `bindGameToRoom` (create-or-resume keyed on
  room_code; reuses null-room placeholder on first join; FINISHED stays finished;
  previous active → abandoned on switch per SPEC 15C)
- `playerJoin` + `reconnectExistingPlayer` wired through `bindGameToRoom` — joining
  a new room creates a fresh self-contained game; rejoining resumes
- FINISHED-game rejoin routes to podium (`renderPodium` + `screen-podium`) rather
  than silently resurrecting a completed campaign
- `resetGameProgress(game, player)` upgraded to full reset via `newSave` — regions/
  badges/team/pokeballs/provisional/seen-questions all fresh; per-player wallet,
  vouchers, ledger stay safe at the row
- `renderMyGames` + `pdcToggleArchivedGames` in player-dashboard col-1; ops:
  `switchToGame`, `continueActiveGame`, `confirmRestartGame`/`restartGame`,
  `archiveGame`, `restoreGame`; archived sublist
- Per-player across all games: `banked_crystals`, `vouchers`, ledger (SPEC 12-NEW)
- **Completes the Phase 3+4 build chain: P1 → P3 → Store → Voucher → P2 → Podium.**

**Track C — GAME_OVER PODIUM / CHAMPION SCREEN (2026-05-26, v1.27):**
- R10 Darkrai victory → champion podium (replaces legacy `screen-test-build-complete`)
- `TEAM_PRIZE_TIERS` + `teamPrizeTier(bossCount)` (3=small / 6=medium / 10=grand,
  highest-tier-only, mystery shared gift) — SPEC 13P
- `computePodiumData()` aggregates badges + bossDefeats count + total stars +
  team size + banked + provisional + teamPrize tier
- `computeHonors(data, save)` returns cosmetic honors only (Top Trainer / Champion /
  Star Master / Collector + fallback) — **never grants crystals or picks** (SPEC 13K)
- `renderPodium()` paints hero (animated crown + gradient title), stat grid
  (with crystal-emphasis cell), team-prize card (per-tier color + journey breadcrumb),
  honor chips, action buttons
- `showFinalCompleteScreen` rewired async: flips active game `status:'finished'`
  (SPEC 15B) + `dbSaveRow` + `renderPodium` + `showScreen('screen-podium')`
- Routes to Prize Store / Dashboard from the podium
- Completes the Phase 3+4 build chain (P1→P3→Store→Voucher→Podium; P2 still pending)
- ⚠️ Multiplayer comparison honors (Most Improved, Team Heart) deferred — flagged

**Track C — PRIZE STORE + TIER VOUCHERS (2026-05-26, v1.26):**
- Prize Store live: `screen-prize-store` with 3 tier cards (Bronze 8k / Silver 20k /
  Gold 40k — placeholder prices), banked-only spend, tier cards affordability-gated
- `buyVoucher(tier)` debits `row.banked_crystals`, generates unique code, pushes
  voucher to `row.vouchers[]`, writes ledger `redeem_request` audit row
- `screen-voucher` printable keepsake (themed CSS placeholder; PNG art later)
- `redeemVoucher(code)` flips status active→redeemed (host verify-and-burn)
- Effort Score (`computeEffortScore` from badges + total_correct) DISPLAY-ONLY —
  SPEC 13C full blend deferred (needs improvement history + engagement tracking)
- `isTierUnlocked(tier, save)` stubbed `true` — SPEC 13D effort/team gating
  deferred (needs dashboard sync + team pool); slots in here later
- Player Dashboard col-2 wallet now shows banked vs provisional + 🎁 Prize Store
  entry button
- Print CSS hides everything except the keepsake on `window.print()`

**Track C — CRYSTAL CHECKPOINT ECONOMY P3 (2026-05-26, v1.25):**
- Crystals now PROVISIONAL→BANKED (SPEC 12-NEW-A…G)
- Gym earn + trade-in accrue `progress.total_crystals` + `progress.region_crystals[rid]`
- `bankCrystalsForCheckpoint(regionId)` at R3/R7/R10 banks
  `min(REGION_CRYSTAL_CAP[rid], earned) − alreadyBanked` per region; idempotent;
  writes per-player ledger row
- Hooked into `_battleRecordDefeat` (boss-win) + `showCheckpointBankToast`
- Map HUD + Wallet header show banked (spendable) vs provisional (this game)
- `resetGameProgress(game)` helper ready for P2's restart UI
- Pokeball + broadcast spends INTENTIONALLY left on provisional (no Prize Store
  buy code yet — flipping early would brick R1/R2 catch); flagged as WATCH-ITEM

**Track C — PLAYER GAME MANAGEMENT P1 (2026-05-26, v1.24):**
- Save migrated from flat → player row { games[], active_game_id, banked_crystals }
- Lazy idempotent migration of legacy flat saves (`migrateToPlayerRow`)
- New helpers: `newGame`, `newPlayerRow`, `activeGame`/`activeProgress`,
  `dbLoadRow`/`dbSaveRow`, `hydratePlayerData` (host-side legacy-field compat)
- `dbRegisterPlayer`/`dbLoginPlayer` now emit `{ player, row, save }`
- `dbBumpCrystals` migration-aware (bumps active progress on row-shaped data)
- `col2ApproveAbandon` writes `abandoned_rooms` into active progress (where
  gameplay reads it from `STATE.save`)
- 11 player-side `dbSave(..., STATE.save)` calls swapped → `dbSaveRow(...)`
- `STATE.playerRow` field added; the 119 STATE.save.* read sites unchanged
- NO gameplay/economy change in P1 — banked_crystals mirrored but not yet
  spent by gameplay (P3 introduces the provisional/banked split)

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
