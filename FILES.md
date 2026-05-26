# Crystal Quiz Challenge — File Manifest
Manifest version: 1.55
Last updated: 2026-05-26

> **4-HOME INFORMATION ARCHITECTURE** (see BACKLOG.md header for the full rule):
> SPEC.md = DESIGN · CLAUDE.md = BUILD STATE · BACKLOG.md = TODO · FILES.md (this) = MANIFEST.
> This manifest tracks the CURRENT version of every file. Superseded files move to the
> ARCHIVED section below but stay documented (history is never deleted from the record).
> v1.55: FIX v1.29.6 — ability cadence reworked from "once per question
> (any Pokémon)" to "once per gym PER POKÉMON". Single boolean
> `abilityUsedThisQuestion` replaced with `abilitiesUsedThisGym[]` (array
> of pokemon ids). Multiple DIFFERENT Pokémon may fire on the same question
> (combo allowed); the SAME Pokémon is locked for the rest of the gym.
> Reset moved from `loadQuestion` to `startGym`. `renderPokemonTeam`
> greys + disables used slots and appends ✓ to the label. (Fix was
> originally written for v1.29.3 but never applied; ships retroactively
> as v1.29.6.)
> v1.54: COPY v1.29.5 — boss loss screen reworded. "The villain escaped!"
> replaced with a villain taunt (`{villain}: "Haha, nice try!"`) + an
> encouraging sub-message ("You guys need more practice — come back stronger!"
> with N=3 contribution hint appended when relevant). North star: teach
> without punishing. HTML title gained `id="battle-loss-title"` so JS can
> stamp the per-region villain name.
> v1.53: FIX v1.29.3 (RETRY, applied retroactively) — boss round summary
> never appeared after a player answered. Root cause: `_battlePollTick`'s
> `roundJustResolved` checked `bs.round === _battleLastRoundSeen`, but
> `_battleResolveRound` increments `bs.round` BEFORE writing to Supabase,
> so after resolve `bs.round` is N+1 while `_battleLastRoundSeen` is still
> N → condition always false → summary never shown → player stuck on
> answered question. Fixed: new `_battleLastResolvedRound` tracker, reset
> in `_battleStartPoll`; condition now `bs.round > _battleLastResolvedRound`
> and stamps the tracker when summary fires. NOTE on version: this is the
> v1.29.3 fix that was never applied; it ships after v1.29.4 chronologically
> but carries the v1.29.3 label per the prompt's framing.
> v1.52: FIX v1.29.4 — Bug #9: `rdStartGame` (Start Game button in the
> Room Detail Overlay) was silently failing — no try/catch, so Supabase
> read/write errors produced no feedback and the room stayed in lobby.
> Wrapped in try/catch + added toasts on all failure paths (null code,
> null room read, already-started guard, empty-players guard, write error).
> Same try/catch pattern applied to sibling overlay actions: `rdTogglePause`,
> `rdArchive`, `rdEndGame`. (Skipped v1.29.3 per user's framing.)
> v1.51: FIX v1.29.2 — Gym 5 → boss fight reachable on pass AND fail.
> (A) Removed the `regionComplete` gate in `showGymComplete` that was hiding
> the ⚔️ Fight the Villain! button on a failed gym 5 (failed gym 5 never
> writes to `gymsCompleted`, so the gate failed, leaving the kid stranded
> with only Back to Map). Design: fail gym 5 = no badge / reduced crystals,
> but the boss fight is ALWAYS the forward path. (B) Removed the hardcoded
> `onclick="goNextGym()"` from `#btn-next-gym` in index.html — JS always
> overwrites the handler at render time, but the HTML attribute was a
> footgun that could fire `goNextGym()` instead of `startBossFight()`.
> v1.50: HOTFIX v1.29.1 — regional-catch SELECTION grid + click-update +
> result toasts now route through `pokemonDisplayName()`. v1.28.2's name fix
> wired the resolver into team/battle/dashboard renders but missed the catch
> selection grid (`renderRegionalCatch`), the throw-button refresh on tap
> (`selectRegionalPokemon`), and the result toasts (`showRegionalCatchResult`).
> All 183 regional Pokémon were rendering "undefined" when picking one to
> catch. Six sites swapped to the resolver. (Prompt framed as v1.28.3 →
> v1.28.4 but live was v1.29 from the boss-reachability fix; actual bump
> is v1.29 → v1.29.1.)
> v1.49: BOSS FIGHT reachability fix (v1.29, SPEC 14G). #1 UAT blocker —
> players couldn't reach the boss because `startBossFight` never set
> `room.phase = 'BOSS_FIGHT'`; the host boss panel gates on that phase, so
> the "Start the Battle!" button never appeared and the kid sat on "Waiting
> for Papa" forever → R3/R7/R10 banking never fired → the whole reward loop
> was gated. Fixes: (a) `startBossFight` now sets phase + currentRegion;
> (b) the boss panel (`_hostRenderBattlePanel`) now also renders inside the
> room-detail overlay the host drives games from (not just the dashboard
> col3); (c) `rdStartBossFight` manual fallback shown in the overlay when
> `room.phase === 'REGION_COMPLETE'`. Existing 2.5s host poll already
> updates the overlay — no new polling. Sequential gym lock confirmed
> intact; gym-3 anomaly was stale test data.
> v1.48: HOTFIX v1.28.3 — `pokemonDisplayName` now reads `catchForm` as the
> primary fallback before the id-prettify path. v1.28.2 was a MISdiagnosis:
> data wasn't missing, it lives in `catchForm` on all 183 regional entries
> (e.g. `catchForm: 'Jangmo-o'`). Prettify-id was mangling hyphenated names
> (Jangmo-o → "Jangmo O", Ho-Oh → "Ho Oh", Philippine-Eagle → "Philippine
> Eagle"). Resolver now picks the right field; prettify-id demoted to last
> resort for stub objects. BACKLOG `POKEMON.JSON DATA GAP` watch-item closed.
> v1.47: UAT HOTFIX batch (v1.28.2). (1) Ability cadence changed from one-per-gym
> to one-per-QUESTION: `abilityUsedThisGym` → `abilityUsedThisQuestion`, reset in
> `loadQuestion`; SPEC Part 8 v3.8 note revised (up to ~10 XP events/gym now).
> (2) Pokémon name resolver `pokemonDisplayName(p)` fixes "undefined" team
> names from the 183 nameless regional entries in pokemon.json (field →
> id-lookup → prettified id); `name` stamped at all 3 catch sites (pregame /
> regional / boss reward) so new saves never carry undefined names. Two team
> render sites updated (`renderPokemonTeam`, `pdc-poke-name`).
> v1.46: HOTFIX (v1.28.1) — host view (`?host=true`) was showing stray player
> voucher "Print Keepsake" / "Back to Store" buttons. Root cause was a CSS
> ID-specificity bug: `#screen-voucher { display:flex }` won over
> `.screen { display:none }`, so the voucher screen was ALWAYS visible
> regardless of `.active`. Scoped to `#screen-voucher.active` (style.css
> v1.7.11). Defense-in-depth: `showScreen` now hides
> `.voucher-actions`/`.podium-actions` when `HOST.isHost` is set
> (game.js v1.28.1). Diagnosis confirmed host entry paths
> (`showHostDashboardUnscoped`, `initHostDashboard`) correctly call
> `showScreen('screen-host')` — JS routing was fine; pure CSS bug.
> v1.45: P2 game↔room binding + My Games UI (SPEC Part 15). A GAME is now a
> per-room campaign. `bindGameToRoom(row, code, player)` create-or-resume on
> join/rejoin (reuses the null-room placeholder from registration on first
> join); previous active → abandoned on switch; FINISHED games stay finished
> (rejoin routes to podium, doesn't silently resurrect). `bindActiveGame`,
> `gameForRoom`. `resetGameProgress` upgraded to full-progress reset
> (regions/badges/team/pokeballs/seen-questions) via `newSave`, wallet +
> vouchers untouched. `renderMyGames` lists per-room campaigns with status +
> stats; ops: `switchToGame` (rejoin room), `continueActiveGame`,
> `confirmRestartGame`/`restartGame`, `archiveGame`, `restoreGame` +
> archived sublist. Player-dashboard col-1 gets a new "🎯 MY GAMES" section
> above the live-rooms list. Completes the Phase 3+4 build chain (P1 → P3 →
> Store → Voucher → P2 → Podium).
> v1.44: GAME_OVER Podium (SPEC 13K + 13P). R10 victory routes through
> `showFinalCompleteScreen` → `renderPodium` + `screen-podium` (champion hero,
> stats, TEAM PRIZE tier reveal, cosmetic HONORS). Marks the active game
> `finished` (SPEC 15B). Replaces the legacy `screen-test-build-complete`
> end screen (kept as defensive fallback). Completes the Phase 3+4 build
> chain (P1 → P3 → Store → Voucher → Podium). P2 game-management UI still
> pending (item 45). NOTE: prompt anchored "v1.27→v1.28" but P2 wasn't
> built between v1.26 and this commit, so version bumps v1.26→v1.27.
> v1.43: Prize Store + Tier Vouchers (SPEC 13/13R). 3 tier vouchers (Bronze 8k /
> Silver 20k / Gold 40k — placeholder prices) bought with BANKED crystals;
> unique code + printable keepsake (`screen-voucher`); ledger
> `redeem_request` audit row per buy; `redeemVoucher(code)` burns the
> voucher (host verify-and-burn). Effort Score (`computeEffortScore` from
> badges + total_correct) DISPLAY-ONLY. `isTierUnlocked` stub returns true
> — effort/team-pool gating (SPEC 13D) deferred. Vouchers persist on
> `row.vouchers[]`. Prize Store entry button added to player dashboard col-2;
> col-2 wallet now shows banked vs provisional.
> v1.42: P3 crystal checkpoint economy — gym crystals are PROVISIONAL
> (per-game); they BANK into the per-player wallet (`row.banked_crystals`)
> at R3/R7/R10 boss wins, capped per region via `REGION_CRYSTAL_CAP`.
> New helpers: `bankCrystalsForCheckpoint`, `showCheckpointBankToast`,
> `resetGameProgress`. Hooked into `_battleRecordDefeat`. Map HUD + Wallet
> show banked vs provisional. Pokeball + broadcast spends stay on provisional
> (no Prize Store buy code exists yet — BACKLOG item 43). SPEC 12-NEW-A…G.
> v1.41: P1 game-management model — player-row shape (games[] + active_game_id +
> banked_crystals), accessors (activeGame/activeProgress), lazy migration
> (migrateToPlayerRow), dbLoadRow/dbSaveRow; repointed STATE.save to active
> progress. hydratePlayerData shim lets host dashboard keep reading legacy
> top-level fields. No gameplay change (SPEC Part 15 P1).
> v1.40: MOVE ability dispatcher fix (v1.23) — read `pokemon.move.type` (canonical
> SPEC Part 5 names) instead of nonexistent `abilityEffect.mechanic`; map
> CLOCK→time, ELIMINATE, SWAP→skip, CLUE→reveal; gate EXTRA_SHOT/TIME_TRAVEL
> (post-gym, not usable mid-question); default values supplied (CLOCK +5s,
> ELIMINATE 1) since data carries none. `activateAbility` also guards
> post-gym moves so they don't burn the gym's one-use. Was: every gym
> ability tap fell through to "Unknown mechanic" — UAT-blocking. Closes
> BACKLOG OPEN FLAGS (MOVE dispatcher + TIME values).
> v1.39: hotfix — TIME ("Clock") ability had no visible effect (bumped
> timeLeft AND totalTime, so bar ratio barely moved). Now adds to timeLeft,
> raises totalTime only to keep bar ≤100%, and refreshes bar+text
> immediately. ⚠️ Data check surfaced deeper schema mismatch: pokemon.json
> v2.2 uses `move.type = "CLOCK"` but `useAbility` switches on
> `abilityEffect.mechanic = "TIME"` — dispatcher never routes any MOVE
> ability today. Logged as BACKLOG open flag for follow-up commit.
> v1.38: instant abilities (popup removed); catch-between-gyms (rarity-gated,
> Part 4 ladder); abilities non-consuming + XP-growth (Part 3B/8) — dead
> consume splice removed, `awardXpEvent`/`computeHp` added, HP shown on team
> cards; SPEC bumped to v3.8 with catch-availability note + Part 8
> implementation note.
> v1.37: hotfix — pre-game catch re-entry trap (kid stuck with team + 0 balls)
> closed via `startPreGameCatch` self-guard + waiting-poll guard + choose-step
> escape; "⚡ undefined" catch labels fixed (`getAbilityLabel` fallback covering
> 7 render sites — catch grids, selected display, catch result, gym ability
> button, ability modal, feedback bar).
> v1.36: battle engine Commit 4 — game.js v1.21 (kid-managed round flow,
> readyForNext + battleReadyUp; COMBO_TEAM_STRIKE armed between rounds via
> battleArmTeamStrike; host watch-only after Round 1 + hostBattleForceNextRound),
> index.html v1.8.6 (Next Round button removed — Ready button now rendered in
> summary), style.css v1.7.6 (between-round summary styles — enrage warning,
> Team Strike arm, ready states).
> v1.35: battle engine Commit 3 — game.js v1.20 (6 battle abilities + R10 Legendary
> gate + Papa override + R5/R7/R8 reminders + dead Commit-1 controls neutralised),
> index.html v1.8.5 (battle ability bar + dead Team Strike / Start Round buttons
> stripped), style.css v1.7.5 (ability bar + Legendary gate overlay + Papa override
> button styles).
> v1.32: SPEC bumped v3.6→v3.7 (Part 14G battle session fully locked); pokemon.json
> bumped v2.1→v2.2 (battleAbility populated for all 193 starters+regional); BACKLOG.md
> bumped v1.0→v1.1 (Track A marked complete; battle engine build items added; card
> sourcing removed — replaced by voucher model); CLAUDE.md bumped to reflect v3.7 sync.

## ACTIVE

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| index.html | 1.8.12 | 2026-05-26 | All game screens. v1.8.12: boss loss screen h2 gained `id="battle-loss-title"` (default text "Haha, nice try!") so `_battleShowLoss` can stamp the per-region villain name as a taunt; copy reworded from punishing to encouraging (v1.29.5). v1.8.11: removed hardcoded `onclick="goNextGym()"` from `#btn-next-gym` — `showGymComplete` always sets `nextBtn.onclick` to either `goNextGym` (gyms 1–4) or `() => startBossFight(...)` (gym 5) at render time; the HTML attribute was a footgun that could fire `goNextGym()` on gym 5 instead of the boss fight. v1.8.10: room-detail overlay (`#room-detail-overlay`) gains `#rd-battle-section` + `#rd-battle-panel` for v1.29 boss controls (`_hostRenderBattlePanel` renders here when `room.phase === 'BOSS_FIGHT'`) + `#rd-start-boss-btn` manual fallback for REGION_COMPLETE. v1.8.9: player-dashboard col-1 gets a new "🎯 MY GAMES" section above the live-rooms list — `#pdc-mygames-section` with `#pdc-mygames-list`, `#pdc-mygames-archived-toggle` + `#pdc-mygames-archived-list` (collapsed by default). v1.8.8: added `screen-podium` (champion hero with crown, title, subtitle, stats grid, team-prize card, honors, action buttons routing to Prize Store / Dashboard). v1.8.7: added `screen-prize-store` (store header, wallet/effort display, tiers grid, owned vouchers, back button) + `screen-voucher` (printable keepsake with `voucher-art` + print/back actions). v1.8.6: removed dead Next Round button — the Ready button now renders inside `#battle-round-result-text` (built by `_battleShowRoundSummary`). v1.8.5: `#battle-ability-bar` div added before question area; dead Team Strike / Start Round buttons stripped from `#battle-controls` (kid Team Strike moves to between-round screen in Commit 4). v1.8.4: col3-battle-panel div added to host Column 3. v1.8.3: screen-battle shell added (Commit 1 scaffold). v1.8.2: peso removed from player UI; pre-game pokeball copy "3 Pokeball(s)" → "1 Pokeball". v1.8.1: mascot alt text + Region 10 Game Complete screen. v1.8: player dashboard three-column rewrite. v1.7.2: Room Detail Overlay Start Game + drop Copy Code. v1.7.1: lobby cap label 0/8 → 0/5. v1.7: host dashboard three-column. v1.6: persistent identity. v1.5: wallet + host crystal panels. v1.4: removed "Continue Journey". v1.3: host-landing. v1.2: gym-review. v1.1: test-build lid. | Active |
| style.css | 1.7.12 | 2026-05-26 | Styling. v1.7.12: `.poke-ability-btn.used` + `:disabled` state (grey gradient + 0.55 opacity + not-allowed cursor + no hover lift) so used-this-gym abilities are visually obvious (v1.29.6). v1.7.11 HOTFIX: scoped `#screen-voucher { display:flex }` → `#screen-voucher.active { display:flex }` so the ID-specificity rule only applies when the screen is active. Without this scope, `#screen-voucher` always won over `.screen { display:none }` and the voucher's Print/Back buttons leaked into the host viewport. v1.7.10: My Games card styles (v1.28) — `.pdc-games-list`, `.game-card` (left-border per status: active=green, finished=gold, abandoned=grey, archived=dashed dim), `.gc-top/.gc-name/.gc-status` (per-status pill colors), `.gc-stats` (monospace), `.gc-room`, `.gc-actions` with `.game-act-primary` (gold→purple gradient) + `.game-act-ghost`. v1.7.9: GAME_OVER podium styles (v1.27) — `.podium-hero` (gradient hero, animated `.podium-crown` bob, gold→purple gradient title), `.podium-stats` (grid with `.pstat` cells + crystal-emphasis cell), `.teamprize-card` (per-tier color: small=bronze / medium=silver / grand=gold + journey trail), `.honor-chip` (3-column with emoji/name/why), `.podium-actions` (Prize Store + Dashboard). v1.7.8: Prize Store + Voucher styles (v1.26) — `.store-header`, `.store-wallet`, `.store-effort`, `.store-tiers` grid, `.tier-card` (bronze/silver/gold borders), `.btn-buy`, `.voucher-chip` (per-tier left border + burned state), `.voucher-keepsake` (gold-bordered printable card with `.vk-emoji/.vk-tier/.vk-name/.vk-blurb/.vk-code/.vk-status`), `.pdc-store-btn`, `@media print` rules (hide everything except `#screen-voucher`). v1.7.7: Pokémon growth visuals — `.poke-hp` (❤️ HP line on team cards), `.poke-xp-bar` + `.poke-xp-fill` (purple→gold XP progress), `.btn-catch-between` + `.catch-between-hint` (gym-complete catch CTA). v1.7.6: between-round summary styles — `.battle-enrage-warn`, `.battle-ts-armed`, `.battle-ts-arm-btn`, `.battle-ts-hint`, `.battle-ready-waiting`; host battle live/ready states (`.host-battle-live`, `.host-battle-ready-status`). v1.7.5: `.battle-ability-bar` + `.battle-ability-btn` (declared-state, locked-out, lockdown notice); `.battle-legendary-gate-overlay` + `.battle-legendary-gate-card`; `.host-battle-override-btn` + `.host-battle-override-granted`. v1.7.4: host battle panel styles — `.host-battle-hp-row`, `.host-battle-player` (`.not-ready`, `.fainted` variants). v1.7.3: battle screen CSS scaffold (Commit 1). v1.7.2: team-cap UI for Part 12E. v1.7.1: dead `.region-card.coming-soon` removed. v1.7: player three-column dashboard classes. v1.6.1: `.wl-slots-grid` repeat(5,1fr). v1.6: three-column host dashboard. v1.5: persistent-identity surfaces. v1.4: wallet + host crystal panels. v1.3: host-landing + presence. v1.2: gym-review. v1.1: `.region-card.coming-soon`. | Active |
| game.js | 1.29.6 | 2026-05-26 | Game logic. v1.29.6 FIX: ability cadence reworked — single `abilityUsedThisQuestion` boolean replaced with `abilitiesUsedThisGym[]` (array of pokemon ids). 6 sites patched: STATE init, `startGym` reset (NEW location — was per-question), `loadQuestion` (per-question reset REMOVED), `activateAbility` gate (per-Pokémon check with `pokemon.id || String(idx)` key; toast names the actual Pokémon), `useAbility` mark (uses local `pokemon` not `pendingXpPokemon` — fixed a latent typo in the source prompt that referenced the still-null `pendingXpPokemon`), `renderPokemonTeam` (greys + disables used buttons + ✓ suffix). Multiple DIFFERENT Pokémon may fire on the same question; the SAME Pokémon is locked for the rest of the gym. v1.29.5 COPY: boss loss screen reworded. `_battleShowLoss` (~line 5725) now stamps a villain taunt into a new `#battle-loss-title` (`{villain}: "Haha, nice try!"`) and writes an encouraging sub-message into `#battle-loss-msg` ("You guys need more practice — come back stronger!" + `(X/3 hits — aim for 3 next time!)` when contribution < N=3). Was: "{villain} got away!" + punishing "You got X/3 — try to hit 3 next time." North star: teach without punishing. v1.29.3 RETRY FIX (applied retroactively after v1.29.4 — original v1.29.3 prompt was missed): boss round summary never appeared. `_battlePollTick`'s `roundJustResolved` checked `bs.round === _battleLastRoundSeen`, but `_battleResolveRound` increments `bs.round` BEFORE writing to Supabase, so after resolve `bs.round` is N+1 while `_battleLastRoundSeen` is still N → condition always false → summary never shown → player stuck on the answered question screen forever. Fixed at 3 sites: (1) new `_battleLastResolvedRound = 0` declaration alongside `_battleRoundAnswered`; (2) reset in `_battleStartPoll`; (3) condition rewritten to `bs.round > _battleLastResolvedRound` and stamps the tracker when summary fires. UAT-confirmed: host panel showed Round 2 / HP 400/500 while player screen still showed Round 1 answered — resolve was running correctly, only the summary trigger was broken. v1.29.4 FIX (Bug #9): `rdStartGame` (Start Game button in Room Detail Overlay) silently failed — no try/catch around the `dbReadRoom` / `dbWriteRoom` calls, so Supabase errors left the room in `lobby` with no feedback. Wrapped in try/catch + toasts on all silent paths: `!code` ("No room selected"), `!room` ("Could not read room — try again"), `phase !== 'lobby'` ("Game already started"), `realPlayers.length === 0` ("At least 1 player must join"), and catch-all write-error ("Start failed: …"). Same try/catch + toast pattern applied to sibling overlay actions: `rdTogglePause`, `rdArchive`, `rdEndGame` (the latter wraps the inner `confirmDialog` callback so writes inside that promise also get caught). v1.29.2 FIX: Gym 5 → boss fight reachable on PASS and FAIL. (A) `showGymComplete` (~line 4588) gym-5 branch collapsed: removed the `regionComplete` (`gymsCompleted.length >= 5`) gate — failed gym 5 doesn't push to `gymsCompleted`, so the gate was hiding the ⚔️ Fight the Villain! button and stranding the kid with only Back to Map. Design: fail = no badge / reduced crystals, but the boss fight is always the forward path. (B) Removed the hardcoded `onclick="goNextGym()"` from `#btn-next-gym` in index.html — JS always overwrites the handler at render time, but the HTML attribute could fire `goNextGym()` on gym 5 instead of `startBossFight()`. v1.29.1 HOTFIX: regional-catch SELECTION render path now uses `pokemonDisplayName()` (which reads `catchForm` per v1.28.3) — was reading raw `.name` at 6 sites, so all 183 regional Pokémon showed "undefined" on the catch grid. Sites swapped: `renderRegionalCatch` (sc-name card, caughtNames list, Throw button initial render), `selectRegionalPokemon` (Throw button tap-update), `showRegionalCatchResult` (catch toast, broke-free toast). Pre-game catch sites unchanged — starters carry `name` natively. v1.29 (SPEC 14G boss reachability — #1 UAT blocker fix): `startBossFight` (~4617) now sets `room.phase = 'BOSS_FIGHT'` + `room.currentRegion = regionId` alongside the existing `battleState` skeleton write — the host boss panel gates on `phase === 'BOSS_FIGHT'` (line 7485) and never appeared before. `_hostRenderBattlePanel` is now also called from `renderRoomDetail` (~7791) into a new `#rd-battle-panel` container in the room-detail overlay — the overlay the host actually drives games from. New `rdStartBossFight()` manual fallback writes the phase from the overlay when `room.phase === 'REGION_COMPLETE'`; shown as `#rd-start-boss-btn` only in that phase. Existing `hostDoPoll` (2.5s) already re-renders the overlay while open. Sequential gym lock at line 3853 confirmed intact (gym-3 anomaly = stale test data). v1.28.3 HOTFIX: `pokemonDisplayName` now reads `p.catchForm` as the primary fallback (after `p.name`) before the id-lookup / prettify-id chain. All 183 regional entries in pokemon.json carry their real name in `catchForm` (e.g. "Jangmo-o", "Ho-Oh", "Philippine-Eagle"); v1.28.2's prettify-id fallback was mangling them ("Jangmo O", "Ho Oh"). Id-lookup tightened to also accept `match.catchForm`. Prettify-id is now a defensive last resort for malformed stub objects only. v1.28.2 UAT HOTFIX (batch). (1) Ability cadence: `abilityUsedThisGym` → `abilityUsedThisQuestion` (rename across 6 sites); reset in `loadQuestion` alongside `STATE.answered = false` + `STATE.pendingXpPokemon = null`; guard message updated to "One Pokémon ability per question". One ability per QUESTION, multiple on a single question still NOT allowed. SPEC Part 8 v3.8 note revised. (2) Name resolver: new `pokemonDisplayName(p)` — `p.name → STATE.pokemon{starters,regional,bench}` id-lookup → prettified id → 'Pokémon' fallback. Used in `renderPokemonTeam` (team-card name) + `pdc-poke-name` (dashboard team slot). `name` stamped at 3 catch sites (`...poke || target || reward, name: src.name || pokemonDisplayName(src)`). v1.28.1 HOTFIX: `showScreen` adds a host-view safety net — when `HOST.isHost`, `.voucher-actions` + `.podium-actions` are hidden after every screen transition (defense-in-depth against future ID-specificity leaks). The real fix shipped in `style.css` v1.7.11 (scoped `#screen-voucher.active`). v1.28 (SPEC Part 15 P2): a GAME = a per-room campaign. New: `gameForRoom(row, roomCode)`, `bindActiveGame(row, gameId)` (downgrades prev active→abandoned but never finished/archived), `bindGameToRoom(row, roomCode, player)` (create-or-resume keyed on room_code; reuses null-room placeholder from registration on first join). `playerJoin` and `reconnectExistingPlayer` wired through `bindGameToRoom` — joining a new room creates a fresh self-contained game; rejoin resumes. FINISHED-game rejoin routes to the podium (`renderPodium` + `screen-podium`) rather than silently resurrecting a completed campaign as active. `resetGameProgress(game, player)` upgraded to a full-progress reset via `newSave` (regions/badges/team/pokeballs/provisional/seen-questions all fresh); wallet + vouchers untouched. My Games UI in player-dashboard col-1: `renderMyGames`, `_gameCardHTML`, `_gameArchivedCardHTML`, `pdcToggleArchivedGames`. Ops: `switchToGame` (rejoins room via `playerJoin`), `continueActiveGame`, `confirmRestartGame`/`restartGame`, `archiveGame` (picks next non-archived as active or none), `restoreGame`. v1.27 (SPEC 13K + 13P): GAME_OVER Podium live. `TEAM_PRIZE_TIERS` (3 bosses=small, 6=medium, 10=grand) + `teamPrizeTier(bossCount)`. `computePodiumData()` aggregates badges + bossDefeats count + total stars + team size + banked + provisional + teamPrize tier + totalCorrect. `computeHonors(data, save)` returns cosmetic honors (Top Trainer / Champion / Star Master / Collector + fallback "Pokémon Champion") — **never grants crystals/picks** (SPEC 13K). `renderPodium()` paints champion hero, stat grid, team-prize card (per-tier color, mystery framing, journey breadcrumb), honor chips. `showFinalCompleteScreen()` made async — marks active game `status:'finished'` (SPEC 15B), `dbSaveRow`, then `renderPodium()`+`showScreen('screen-podium')`; legacy `screen-test-build-complete` kept as defensive fallback. Routes from podium to Prize Store / Dashboard. Multiplayer comparison honors (Most Improved, Team Heart) deferred. v1.26 (SPEC Part 13 / 13R): Prize Store + Tier Vouchers live. `VOUCHER_TIERS` (bronze 8k / silver 20k / gold 40k — placeholder prices), `VOUCHER_TIER_ORDER`. `computeEffortScore(save)` from badges + total_correct (DISPLAY-ONLY — SPEC 13C full blend deferred). `isTierUnlocked(tier, save)` stubbed `true` (effort/team gate deferred). `buyVoucher(tier)`: gate on banked, deduct, unique code (`TIER-PLAYER-TIME-rand`), push to `row.vouchers[]`, write ledger audit row (`type:'redeem_request'`, `status:'approved'`, note `VOUCHER <Tier> [code]`), `dbSaveRow`. `redeemVoucher(code)`: flip status `active→redeemed` + `dbSaveRow`. `renderPrizeStore()` shows banked/provisional + Effort + 3 tier cards (afford-gated) + owned vouchers chip-list. `onBuyVoucher`/`showVoucher` keepsake. `showScreen('screen-prize-store')` auto-renders. `pdcRenderCol2Wallet` now shows banked vs provisional + Prize Store entry button. v1.25 P3 (SPEC 12-NEW-A…G): crystal checkpoint economy live. New constants `REGION_CRYSTAL_CAP` + `BANK_CHECKPOINTS`. Gym earn + trade-in accrue both `progress.total_crystals` (visible provisional) and `progress.region_crystals[rid]` (per-region bucket for capped banking). `bankCrystalsForCheckpoint(regionId)` credits `min(cap, earned) − alreadyBanked` per region into `row.banked_crystals`; idempotent via `progress.banked_regions`; writes per-player ledger row. Hooked into `_battleRecordDefeat` — boss wins at R3/R7/R10 trigger banking + a `showCheckpointBankToast`. Map HUD + Wallet header show BANKED (spendable) vs PROVISIONAL (earning this game). `resetGameProgress(game)` helper zeroes provisional + region_crystals + banked_regions (wallet untouched) — ready for P2 restart UI. ⚠️ Pokeball + broadcast spend sites NOT flipped to banked (no Prize Store buy code exists yet — BACKLOG item 43; flipping early would brick R1/R2 catch loop before any banking can occur). v1.24 P1 (SPEC Part 15D/15E): save is now a PLAYER ROW with `games[] + active_game_id + banked_crystals`. New helpers: `newGame`, `newPlayerRow`, `activeGame`, `activeProgress`, `migrateToPlayerRow` (lazy/idempotent), `dbLoadRow`, `dbSaveRow`. `STATE.save` now points at the active game's `progress` (same shape as old flat save) — 119 read sites unchanged. `STATE.playerRow` holds the row. `dbRegisterPlayer` and `dbLoginPlayer` emit `{ player, row, save }`. `dbBumpCrystals` is migration-aware (bumps active progress on row-shaped data). `hydratePlayerData` shim spreads active progress over the row for host dashboard reads (dbLoadAllPlayers / Full / dbLookupPlayer). 11 player-side `dbSave(..., STATE.save)` calls swapped to `dbSaveRow(...)`. `col2ApproveAbandon` migration-aware. NO gameplay/economy change — provisional/banked split lands in P3. v1.23 FIX: MOVE ability dispatcher now reads `pokemon.move.type` (canonical SPEC Part 5 names: CLOCK/ELIMINATE/SWAP/CLUE in-question; EXTRA_SHOT/TIME_TRAVEL post-gym gated) instead of the nonexistent `abilityEffect.mechanic`. Defaults supplied (CLOCK 5s, ELIMINATE 1) since data carries no values. `fired` guard ensures gated/unknown moves don't burn the gym's one-use or set the XP marker. `activateAbility` pre-empts EXTRA_SHOT/TIME_TRAVEL during a live question. Legacy `abilityEffect.mechanic` aliases still honored for old saves. Was: every gym ability tap fell through to "Unknown mechanic" across 211 Pokémon (UAT-blocking). v1.22.1 HOTFIX: `applyAbilityTime` rewritten — adds to `timeLeft`, raises `totalTime` only if exceeded (lets the bar reach 100% on big adds), repaints bar + countdown text instantly + applies warning/danger color classes. ⚠️ Data check during this hotfix surfaced a deeper dispatcher/schema mismatch (see BACKLOG open flag): pokemon.json v2.2 uses `move.type` (CLOCK/ELIMINATE/SWAP/EXTRA_SHOT/CLUE/TIME_TRAVEL) but `useAbility` switch reads `abilityEffect.mechanic` (TIME/ELIMINATE/SKIP/FREEZE/REVEAL/RETRY/SHIELD) — none of the 42 CLOCK Pokémon (or any other MOVE) currently route. v1.22: instant abilities (`activateAbility` fires directly, modal popup removed); abilities NON-CONSUMING — removed dead `pokemon_team.splice` in `useAbility`; appreciating-asset loop LIVE — `awardXpEvent` (+0.1 xpRatio) + `computeHp` (Part 8 band formula) + `HP_BANDS` + `RARITY_START_RATIO`; `pendingXpPokemon` tracks ability-used Pokémon, grows HP on correct answer (Part 3B), neutral on wrong (Part 3C); catch between gyms — `endGym` adds catch button after gyms 1–4, `finishRegionalCatch` routes back to `screen-gym-complete` when region not done; catch pool gated by `canCatchRarity` (Part 4 access ladder). HP + XP bar rendered on team cards. v1.21.1 HOTFIX: pre-game catch re-entry trap closed (`startPreGameCatch` self-guards when `pokemon_team.length > 0` → `finishPreGame` → map; waiting-lobby poll guards before invoking; defensive `_pregameRenderEscapeIfNeeded` adds a "Start My Journey" exit if 0 balls); catch-card "⚡ undefined" labels fixed via new `getAbilityLabel(p)` (legacy `ability` → `move.type` prettified → `battleAbility` prettified) — swapped into 7 render sites (`renderStarterGrid`, regional grid, pre-game selected display, catch result, gym ability button, ability modal, ability feedback bar). v1.21: Kid-managed round flow (SPEC 14G-3) — Papa starts Round 1 only; rounds auto-chain when last active kid taps Ready (`battleReadyUp` + `bs.readyForNext`); between-round summary reworked with enrage warning + Ready count. COMBO_TEAM_STRIKE armed on summary (`battleArmTeamStrike` → `bs.teamStrikeDeclared` for next round); Order's Wrath (R7) blocks it. Host panel watch-only after Round 1 + `hostBattleForceNextRound` disconnect fallback. v1.20: Battle Commit 3 — 6 battle abilities declared pre-answer (CRITICAL_HIT / FREEZE_STUN / HEAL / PROTECT / GUARD / SECOND_WIND) via `_battleRenderAbilityBar` + `battleDeclareAbility`; per-player `abilitiesUsed[]` + `pendingAbility` + `pendingAbilityPoke`; ability effects applied in `_battleResolveRound` (CRIT 2× hit, HEAL 40% maxHp, SECOND_WIND revive at 50%, FREEZE_STUN cancels boss attack, PROTECT self-immune, GUARD ally redirect); R10 Legendary gate (`_playerHasLegendary`, `_battleLegendaryOverrideGranted`, `_battleShowLegendaryGate`) + Papa override (`hostGrantLegendary` stamps `room.battleState.legendaryOverride[pid]=10`, surfaced via override button in host battle panel); R5/R7/R8 reminder nudges in `finishRegionalCatch` (`_maybeShowLegendaryReminder` idempotent via `save.legendaryRemindersSeen`); `showToast` accepts optional duration; dead Commit-1 controls neutralised. v1.19: Full battle loop. v1.18: Battle engine scaffold. v1.17: economy engine v3.3 LIVE (SPEC Part 12). | Active |
| questions-junior.json | 3.3 | 2026-05-23 | Junior bank (9-11), 729 questions. | Active |
| questions-senior.json | 3.3 | 2026-05-23 | Senior bank (12-13), 729 questions. | Active |
| pokemon.json | 2.2 | 2026-05-25 | Pokémon library. v2.2: battleAbility populated for all 193 starters+regional (Part 14G thematic assignment — CRITICAL_HIT/FREEZE_STUN/HEAL/PROTECT/GUARD/SECOND_WIND/COMBO_TEAM_STRIKE). v2.1: Part 12D economy fields (baseValue per rarity). v2.0: 183 evolution-line regional + 10 starters + 18 bench. R10 = 🇵🇭 Pilipinas. Bench battleAbility stays null (boss creatures — separate stat block at battle engine build). | Active |
| gengar.png | 1.1 | 2026-05-22 | Home mascot — Pikachu vs Gengar battle scene, 1024×1024 PNG. (Track-C ops: optimize to 512×512 before dress rehearsal.) | Active |
| MIGRATIONS.md | 1.2 | 2026-05-23 | Supabase SQL migrations. v1.2: `crystal_ledger` RLS policy. v1.1: persistent-identity. v1.0: create-table + indexes. | Active |
| CRYSTAL_QUIZ_REDESIGN_SPEC.md | v3.8 | 2026-05-26 | Design bible (DESIGN authority). Part 14G-3 build-flow clarifying note added by v1.29 (host boss panel gated on `room.phase === 'BOSS_FIGHT'`, set when first player reaches boss; manual REGION_COMPLETE fallback). Part 8 implementation note updated by v1.28.2 hotfix (ability cadence one-per-question, ~10 XP events/gym — per-gym lever pulled). v3.8: Part 11 — catch availability now per-gym (rarity-gated by Part 4 access ladder); Part 8 — implementation note that one-per-gym retention slows the original ~3-events/gym curve to ~5 events/region (~2 regions/band). v3.7: Part 14G BATTLE SESSION fully locked — boss/villain casting (Darkrai Big Boss R3/R7/R10; 9 minor villains from bench); boss reward Pokémon (one per fight, keep-or-release, normal team cap, uniqueness exception); battle structure (3v1 shared HP bar, simultaneous, N=3 min contribution, Team Strike 3×); turn structure (simultaneous + random villain attack); boss HP (R1 500→R10 8,000); boss enrage abilities (50% HP trigger, unique per boss, Darkrai Nightmare); BATTLE-ability population (193 Pokémon, thematic); ALLY = battle-only; star rating (⭐⭐⭐/⭐⭐/⭐); R10 Legendary gate + Papa override; reminders R5/R7/R8. v3.6: Prize Store + boss crystals removed. v3.3: economy. v3.2: catch mechanics + PH R10. | Active |
| CLAUDE.md | 0.6.0 | 2026-05-26 | Master project doc / BUILD STATE authority. Synced to SPEC v3.9 (v1.29.6: ability cadence is now once per Pokémon per gym; combo allowed). Track A design COMPLETE. Battle engine (Part 14G) designed, not yet built. ⚠️ Boss-crystal build mismatch (verify/strip). Architecture & file management (Track B) plan in place. | Active |
| BACKLOG.md | 1.18 | 2026-05-26 | Single source of truth for pending work. v1.18: v1.29.6 ability-cadence fix logged. v1.17: v1.29.5 boss-loss copy rework logged. v1.16: v1.29.3 RETRY boss-summary fix logged (applied retroactively after v1.29.4). v1.15: v1.29.4 Start Game silent-failure fix logged (Bug #9). v1.14: v1.29.2 gym-5 boss-reachability fix logged (bug #5: pass+fail). v1.13: v1.29.1 catch-grid name hotfix logged (6 missed render sites). v1.12: v1.29 boss-reachability fix logged in DONE archive + NOW: clear-Supabase-before-UAT note (gym-3 anomaly = stale test data). v1.11: POKEMON.JSON DATA GAP watch-item closed as MISDIAGNOSIS — names live in `catchForm` (v1.28.3 resolver fix). v1.10: v1.28.2 UAT hotfix logged — ABILITY ECONOMY watch-item updated (one-per-question cadence); new POKEMON.JSON DATA GAP watch-item (183 regional entries missing `name`, resolver covers it but data should be populated). v1.9: item 45 (P2 game-mgmt UI) marked DONE v1.28 — completes Phase 3+4 build chain. v1.8: item 46 (Podium) marked DONE v1.27; NOW section flipped to "ready for full UAT — Phase 3+4 build chain complete except P2 item 45"; multiplayer-comparison-honors watch-item added. v1.7: items 43 (Prize Store) + 44 (Voucher) marked DONE v1.26; effort/team-gating deferred watch-item added. v1.6: item 42 (P3) marked DONE v1.25; spend-site policy watch-item added; cap-tuning watch-item added. v1.5: item 40 (P1) marked DONE v1.24. v1.4: v1.23 closes MOVE-dispatcher + TIME-value open flags; new post-gym-rescue watch-item (EXTRA_SHOT + TIME_TRAVEL gated until rescue flow built). v1.3: MOVE-ability dispatcher/data schema mismatch logged as open flag (v1.22.1 data check finding). v1.2: v1.22 ability-economy + catch-pacing watch-items appended. v1.1: Track A marked COMPLETE; battle engine build items added (13 tasks); card sourcing removed (replaced by voucher model); repo path flag resolved; watch-items updated with battle tuning notes. | Active |
| FILES.md | 1.55 | 2026-05-26 | This manifest. v1.55: v1.29.6 ability-cadence fix (once per Pokémon per gym; combo allowed). v1.54: v1.29.5 boss-loss copy rework (taunt + encouraging sub-message). v1.53: v1.29.3 RETRY boss-round-summary fix (applied retroactively after v1.29.4). v1.52: v1.29.4 Start Game silent-failure fix (Bug #9; rdStartGame + 3 siblings wrapped in try/catch). v1.51: v1.29.2 gym-5 boss-reachability fix (regionComplete gate removed + HTML onclick footgun removed). v1.50: v1.29.1 hotfix — catch-grid names via pokemonDisplayName (6 missed sites). v1.49: v1.29 boss-reachability fix (UAT #1 blocker — boss + R3/R7/R10 banking now reachable). v1.48: v1.28.3 catchForm follow-up (Pokémon names read catchForm, not prettify-id; closes misdiagnosed POKEMON.JSON DATA GAP). v1.47: v1.28.2 UAT hotfix batch — ability cadence per-question + "undefined" Pokémon names. v1.46: v1.28.1 host-view voucher-leak hotfix (CSS ID-specificity bug). v1.45: v1.28 P2 game↔room binding + My Games UI — completes the full Phase 3+4 build chain (P1 → P3 → Store → Voucher → P2 → Podium). v1.44: v1.27 GAME_OVER Podium / Champion Screen (completes Phase 3+4 build chain except P2). v1.43: v1.26 Prize Store + Tier Vouchers. v1.42: v1.25 P3 crystal checkpoint economy (provisional→banked). v1.41: v1.24 P1 player-game-management model + migration (no gameplay change). v1.40: v1.23 MOVE-dispatcher fix (bridge to move.type schema, gates post-gym rescue moves). v1.39: v1.22.1 TIME visual hotfix + dispatcher schema-mismatch flag. v1.38: v1.22 ability-economy alignment — instant abilities, non-consuming + XP-growth, catch between gyms; SPEC v3.8. v1.37: hotfix v1.21.1 — pre-game catch re-entry trap + undefined ability labels. v1.36: battle engine Commit 4 — game.js v1.21 (kid-managed round flow + Team Strike between rounds), index.html v1.8.6 (Next Round button removed), style.css v1.7.6 (summary screen styles). v1.35: battle engine Commit 3 — game.js v1.20 (6 battle abilities + Legendary gate + reminders), index.html v1.8.5 (ability bar + dead controls removed), style.css v1.7.5 (ability bar + gate styles). v1.34: battle engine Commit 2 — game.js v1.19 (full battle loop + host panel), index.html v1.8.4 (col3-battle-panel div), style.css v1.7.4 (host battle styles). v1.33: battle engine Commit 1 scaffold. v1.32: SPEC v3.7, pokemon.json v2.2, BACKLOG.md v1.1, CLAUDE.md sync note. | Active |

## ARCHIVED (superseded — physical location: /archive/)

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| questions.json | 3.0 | 2026-05-22 | Archived source library (590, blueprint+bank format) — superseded by split junior/senior banks. | Archived |
| POKEMON_LIBRARY_v2.md | 1.0 | 2026-05-24 | Roster reference for Library v2.0 — content now lives in pokemon.json + SPEC. Retired. | Archived |
| CLAUDE_CODE_PROMPT_v2_FINAL.md | 1.0 | 2026-05-24 | Apply prompt for Library v2.0 — kept for trace. | Archived |
| CLAUDE_CODE_PROMPT_economy_engine.md | 1.0 | 2026-05-25 | Apply prompt for SPEC Part 12 economy engine — kept for trace. | Archived |
| CLAUDE_CODE_PROMPT_peso_visibility.md | 1.0 | 2026-05-25 | Apply prompt for SPEC Part 12I peso-visibility split — kept for trace. | Archived |

Maintain this manifest on every file change — it's the single source of truth for what's
deployed. Tracks CURRENT versions; superseded files move to ARCHIVED but stay listed.
