# Crystal Quiz Challenge

```
┌─────────────────────────────────────────────────────────────┐
│ BUILD VERSION: v0.6.6   ·   LAST UPDATED: 2026-05-26         │
│ SYNCED TO SPEC: v3.9 (economy 12-NEW now BUILT @ v0.6.3;     │
│   prize v3.4-6 + boss v3.5-7 are DESIGNED & ahead of build;  │
│   battle session v3.7 FULLY DESIGNED — not yet built;        │
│   ⚠️ v3.6 REMOVED boss crystals — v0.6.0 build may still    │
│   award them (verify/strip at battle engine build);          │
│   library DATA is at v3.2; battleAbility populated v2.2;    │
│   remaining redesign engine work = Track B + Track C)       │
│ TRACK A — DESIGN: ✅ COMPLETE (2026-05-25). All Parts        │
│   locked. Track B (architecture) + Track C (build) are live.│
│ DESIGN AUTHORITY: CRYSTAL_QUIZ_REDESIGN_SPEC.md (v3.7)       │
│   — all design decisions/principles/mechanics/region themes  │
│   live there. THIS file = build state only; it must not      │
│   restate design. If "Synced to SPEC" < the SPEC's version,  │
│   the redesign is ahead of this build (expected for now).    │
│ TODO/BACKLOG: BACKLOG.md (single source for pending work).   │
│ MANIFEST: FILES.md. (4-home model: SPEC=design · CLAUDE=     │
│   build state · BACKLOG=todo · FILES=manifest.)              │
└─────────────────────────────────────────────────────────────┘
```

> ⚠️ **DESIGN vs BUILD:** The sections below accurately describe the CURRENT,
> PRE-REDESIGN build (original 110-Pokemon library, race rule, old catch flow,
> 10 old ability mechanics). The post-UAT redesign — new catch mechanics, snake
> draft, 183-line evolution library, Philippine R10, cosmetic evolution, battle
> system — is fully DESIGNED in the SPEC (Parts 10–14) but NOT yet applied here.
> These sections get rewritten WHEN that redesign is built, not before.

### Implemented vs. Designed (status map; detail lives in the SPEC)
| Area | Status | Design ref |
|---|---|---|
| Multiplayer core, rooms, ledger, dashboards, rejoin | ✅ LIVE | (this file) |
| Pokemon library v2.0 (183 lines, evolution, PH R10) | ✅ LIVE | SPEC Part 10–11 |
| battleAbility populated (193 starters+regional, thematic) | ✅ DATA v2.2 | SPEC Part 14G-4 |
| Catch mechanics (snake draft, cap grows 3→4→5, pokeball bet) | ⬜ designed* | SPEC Part 11, 12E |
| Cosmetic evolution (A1) | ⬜ designed | SPEC Part 11 P10 |
| Unified player-level rarity gate (catch grid) | ✅ LIVE v1.22 | SPEC Part 4 |
| Appreciating-asset XP/HP model | ✅ LIVE v1.22 | SPEC Part 3, 8 |
| Catch between gyms (gym-complete CTA, rarity-gated) | ✅ LIVE v1.22 | SPEC Part 4, 11 |
| Instant abilities (no confirmation modal) | ✅ LIVE v1.22 | SPEC Part 1 UX |
| MOVES (ELIMINATE/CLOCK/SWAP/EXTRA SHOT/CLUE/TIME TRAVEL) | ⬜ designed | SPEC Part 5, 11 |
| Battle system / bosses (3v1, simultaneous, enrage, star rating) | ⬜ designed v3.7 | SPEC Part 9, 14G |
| Economy (earn model, ball/redeem/trade-in, cap growth, persistence) | ✅ LIVE v0.6.0 | SPEC Part 12 |
| Prize Store — 3-tier voucher spend (afford-gated) | ✅ LIVE v1.26 | SPEC Part 13 / 13R |
| TIER VOUCHER — unique code + printable keepsake + ledger audit + burn | ✅ LIVE v1.26 | SPEC 13R |
| Effort Score — full SPEC 13C blend (improvement + engagement) | ⬜ deferred | SPEC Part 13C |
| Effort→tier-unlock gating + 50/50 team pool (SPEC 13D) | ⬜ deferred | SPEC Part 13D |
| GAME_OVER Podium — champion + stats + crystal summary | ✅ LIVE v1.27 | SPEC 13K + 13P |
| TEAM PRIZE reveal (3-tier, mystery, boss-count gated) | ✅ LIVE v1.27 | SPEC Part 13P |
| RECOGNITION HONORS (Top Trainer / Champion / Star Master / Collector) | ✅ LIVE v1.27 | SPEC Part 13K |
| Multiplayer honors (Most Improved / Team Heart) — cross-player data | ⬜ deferred | SPEC Part 13K |
| Boss mechanics (freq/reward/casting/gating) — NO boss crystals | ⬜ designed v3.7 | SPEC Part 14 |
| Legendary gate R10 + Papa override + in-game reminders | ⬜ designed v3.7 | SPEC Part 14G-7 |
| Boss reward Pokémon offer (keep-or-release, normal team cap) | ⬜ designed v3.7 | SPEC Part 14G-2 |
| Player Game Management — model + migration (P1) | ✅ LIVE v1.24 | SPEC Part 15D/15E |
| Player Game Management — game-mgmt UI (P2) | ✅ LIVE v1.28 | SPEC Part 15B/15C |
| Game ↔ Room binding (room_code keyed; create-or-resume on join) | ✅ LIVE v1.28 | SPEC Part 15A/15D |
| Crystal checkpoint economy — provisional/banked + R3/R7/R10 (P3) | ✅ LIVE v1.25 | SPEC Part 12-NEW |

Legend: ✅ live · 🔄 in progress · ⬜ designed, not built

> *⚠️ **VERIFY at next build start:** the v0.6.0 economy push (Part 12) shipped the
> crystal NUMBERS (earn/ball/redeem/trade-in/cap-growth/pity/persistence). Confirm with
> Claude Code exactly how much of the surrounding CATCH FLOW (snake draft UI, draft
> order, cap-slot rendering) actually shipped vs. is still the old flow — the table
> rows for catch mechanics / rarity gate / XP model may need flipping to ✅ or 🔄 once
> confirmed. Also confirm the economy build hit its ~7× earn-reduction validation
> target (strong kid ~₱166 by R6, not the UAT ₱1,184).
>
> *⚠️ **BOSS-CRYSTAL MISMATCH (v3.6 design change):** the SPEC removed boss crystal
> payouts entirely (Part 14B — bosses now reward the boss-gated TEAM PRIZE + boss reward
> Pokémon, not crystals). IF any boss-crystal award logic shipped or exists in the build,
> it must be STRIPPED at the battle engine build. The economy is now GYM-ONLY (verified
> still affords the Pokemon ladder). Confirm no boss `bonus` crystal rows are written on
> boss defeat.

> **Phase 1 + Phase 2 complete** — engine wired to age-split question
> banks, random per-kid draw, full Pokemon library with all 10 ability
> mechanics, **all 10 regions playable** (test-build lid removed),
> Region 10 clear triggers GAME_OVER and auto-archives the room.
>
> **Multiplayer-only game** — there is no solo / offline play. Players
> enter via screen-home (Create Account / Log In), land on the
> three-column player dashboard, then Join a Room. `?host=true` lands
> the host on the three-column dashboard. `?room=CODE` auto-rejoin
> for returning players still works exactly as before.
>
> **Sessions 2026-05-22 (evening): Host Dashboard
> redesigned as 3-column layout (rooms, crystals, controls, room
> detail overlay, start game, broadcast presets, danger zone);
> Player Dashboard redesigned as 3-column layout (game rooms with
> abandon flow, crystal wallet with ledger, my journey with personal
> bests + Pokemon team + broadcast); entry flows corrected for both
> host and player; ledger sync for ability + purchase paths; pause
> timer freeze fix; TIME ability speed bonus cap; Regions 3-10
> unlocked; cosmetic fixes. All committed and pushed.**

## What This Is
Multiplayer Pokemon-themed educational quiz game for a Pokemon card
convention. Kids journey through 10 regions, answer age-appropriate trivia
to earn crystals, catch Pokemon with unique abilities, convert crystals to
peso credits for real Pokemon cards.

## Players
- Up to 5 kids per game
- Age bands: Junior (9-11), Senior (12-13)
- Parent ("Papa") hosts/referees via host dashboard

## Tech Stack
- Plain HTML/CSS/JS, no framework
- GitHub Pages hosting
- Supabase for multiplayer sync + save progress
  URL: https://ccveburbryrigaeeiheo.supabase.co
  Key: sb_publishable_9jauwIGlTUqff9b3bMFbsQ_q_VGuvIy

## Live URLs
- Players: https://angelo-madrid.github.io/Crystal-Quiz-Challenge
- Host: same URL + ?host=true

## Game Structure
- 10 regions x 5 gyms x 10 questions = 500 gym slots per playthrough
- Categories: filipino, geography, science, books, pokemon, music, sports,
  food, languages, math
- Tiers: basic, holo, rare, super, ultra (harder tier = MORE time)
- Formats: mc, tf, closest, unscramble, chain
- Pre-game: catch 1 starter (1 free pokeball, 1 attempt; SPEC Part 11 P8)
  - HOTFIX v1.21.1: pre-game catch is now strictly one-time —
    `startPreGameCatch()` self-guards on `team.length > 0` (routes to map),
    and the waiting-lobby poll guards before invoking it. Closes the
    "re-enter catch with a team + 0 balls + no exit" trap.
- HOTFIX v1.28.2 (UAT batch): (1) ability cadence changed from one-per-gym to
  ONE-PER-QUESTION (`abilityUsedThisGym` → `abilityUsedThisQuestion`, reset in
  `loadQuestion`). Pace is now up to ~10 XP events/gym (~50/region). Per-gym
  lever pulled at UAT; the per-question one still exists if a softer cadence
  is wanted. SPEC Part 8 v3.8 implementation note revised. (2) `pokemonDisplayName`
  resolver added (field → STATE.pokemon id-lookup → prettified id) to fix
  "undefined" team names — pokemon.json carries `name` on only 10/193 entries
  (starters only), so 183 regional entries are nameless. `name` stamped at all
  3 catch sites (pregame/regional/boss) going forward; resolver handles existing
  saves.
- HOTFIX v1.28.1: host view (`?host=true`) was leaking the player voucher
  screen's "🖨️ Print Keepsake" + "← Back to Store" buttons. Root cause: CSS
  ID-specificity — `#screen-voucher { display:flex }` (specificity 1,0,0) won
  over `.screen { display:none }` (0,1,0), so the voucher screen was always
  visible regardless of `.active`. Fixed by scoping to `#screen-voucher.active`
  (same pattern as `.pdc-3col-screen.screen.active`). Defense-in-depth:
  `showScreen` now hides `.voucher-actions` + `.podium-actions` when
  `HOST.isHost` after each screen transition.
- v1.28 (SPEC Part 15 P2): GAME ↔ ROOM BINDING + My Games UI LIVE. A GAME is now a
  per-room campaign (`room_code` is the key). `bindGameToRoom(row, code, player)`
  create-or-resume on join/rejoin; joining a new room creates a fresh self-contained
  game (own regions/badges/team/provisional/seen-questions), rejoining resumes its
  game. Previous active → `abandoned` on switch (SPEC 15C); FINISHED games stay
  finished — rejoining their room routes to the podium (not silent resurrection).
  First-ever join reuses the null-room placeholder from registration (no orphan
  games). My Games UI in player-dashboard col-1 (`renderMyGames`) with status pills
  + continue/switch/restart/archive/restore + archived sublist. `resetGameProgress`
  upgraded to full reset via `newSave` (wallet+vouchers safe). Migration binds
  legacy game to its last `roomCode` (or null placeholder). Per-player across
  all games: `banked_crystals`, `vouchers`, ledger. **Completes the Phase 3+4
  build chain (P1→P3→Store→Voucher→P2→Podium).**
- v1.27 (SPEC 13K + 13P): GAME_OVER Podium / Champion Screen LIVE. R10 Darkrai
  victory → champion hero + stats (badges, bosses 10/10, stars, team, banked +
  provisional crystals) + TEAM PRIZE reveal (`TEAM_PRIZE_TIERS` — 3=small, 6=medium,
  10=grand, highest-tier-only, mystery shared gift, journey breadcrumb) + RECOGNITION
  HONORS (`computeHonors` — Top Trainer / Champion / Star Master / Collector + fallback;
  **cosmetic only — never grants crystals/picks** per SPEC 13K). `showFinalCompleteScreen`
  rewired async — flips active game `status:'finished'` (SPEC 15B), `dbSaveRow`,
  `renderPodium` + `showScreen('screen-podium')`; legacy `screen-test-build-complete`
  kept as defensive fallback. Routes to Prize Store / Dashboard. Completes the Phase
  3+4 build chain (P1→P3→Store→Voucher→Podium). ⚠️ P2 (game-mgmt UI, item 45) still
  pending. DEFERRED: multiplayer comparison honors (Most Improved vs peers, Team Heart/
  revives) need cross-player + assist tracking.
- v1.26 (SPEC Part 13 / 13R): Prize Store + Tier Vouchers LIVE. 3 tiers
  (Bronze 8k / Silver 20k / Gold 40k — placeholder prices, tune at UAT). Buy
  with `row.banked_crystals` (change persists), unique code, printable
  keepsake (`screen-voucher`), ledger `redeem_request` audit row,
  `redeemVoucher(code)` flips status `active→redeemed`. Vouchers persist on
  `row.vouchers[]`. Effort Score (`computeEffortScore`) computed from
  badges + total_correct and shown in the store — **DISPLAY-ONLY**, does NOT
  gate tiers. `isTierUnlocked()` stubbed `true`. ⚠️ DEFERRED: SPEC 13C full
  effort blend (needs per-gym improvement history + Did-You-Know/CLUE
  engagement tracking), SPEC 13D 50/50 team pool + effort→tier gating
  (needs dashboard sync). All tiers affordability-gated for now. Tracked in
  BACKLOG.
- v1.25 (SPEC 12-NEW P3): crystals now PROVISIONAL→BANKED. Gym earn accrues
  `progress.total_crystals` (visible provisional) + `progress.region_crystals[rid]`.
  Banking at R3/R7/R10 via `bankCrystalsForCheckpoint()` hooked in
  `_battleRecordDefeat` — moves capped provisional into `row.banked_crystals`
  (per-region cap `REGION_CRYSTAL_CAP`, tracked in `progress.banked_regions`,
  idempotent). Per-player ledger row written on each bank. Map HUD + Wallet
  header show banked vs provisional. Caps are placeholder — tune at UAT.
  ⚠️ POKEBALL + BROADCAST SPENDS still go through provisional (`total_crystals`);
  no Prize Store buy code exists yet (BACKLOG item 43). When the Prize Store
  is built, it spends banked only per SPEC 13 v3.9 amendment.
- v1.24 (SPEC Part 15 P1): saves migrated from flat → player-row `{ games[],
  active_game_id, banked_crystals }`. `STATE.save` now points at the active game's
  progress via `activeProgress()`; `STATE.playerRow` holds the row. Lazy idempotent
  migration in `migrateToPlayerRow`. Crystal behavior UNCHANGED in P1
  (`banked_crystals` mirrored, not yet read by gameplay — that's P3).
  `dbLoadRow`/`dbSaveRow` are the player's load/save path; legacy
  `dbLoad`/`dbSave` retained for host/all-players reads (wrapped by
  `hydratePlayerData` so the host dashboard keeps reading top-level fields).
- v1.23 FIX: gym MOVE abilities now actually fire. The dispatcher read a nonexistent
  `abilityEffect` field; rewired to `pokemon.move.type` (SPEC Part 5 canonical names)
  with default values. CLOCK / ELIMINATE / SWAP / CLUE work in-question;
  EXTRA_SHOT / TIME_TRAVEL are gated as post-gym rescue (TIME_TRAVEL = BACKLOG 32, not
  built). A `fired` guard ensures gated/unknown moves don't burn the gym's one-use or
  set the XP marker. Closes the v1.22.1 schema-mismatch OPEN FLAG.
- HOTFIX v1.22.1: TIME ability now gives visible feedback — `applyAbilityTime`
  adds to `timeLeft`, grows `totalTime` only as needed, and repaints the
  bar/countdown instantly. ⚠️ Data check during this hotfix surfaced a deeper
  dispatcher/schema mismatch — pokemon.json v2.2 uses `move.type` ("CLOCK",
  "ELIMINATE", etc.) but `useAbility` switches on `abilityEffect.mechanic`
  ("TIME", etc.) — so NO MOVE ability routes today; every tap falls through
  to "Unknown ability mechanic". TIME visual fix is in place for when the
  dispatcher is bridged (logged as BACKLOG ⚠️ OPEN FLAG, awaiting decision).
- v1.22 — ABILITY ECONOMY ALIGNED TO SPEC v3: abilities NO LONGER consume the
  Pokémon (removed dead `pokemon_team.splice` in `useAbility`). Appreciating-
  asset loop now LIVE: use MOVE ability + answer correctly →
  `awardXpEvent(+0.1 xpRatio)` → `computeHp` grows HP per Part 8 band formula.
  One ability use per gym retained (non-consuming, resets in `startGym`).
  Abilities fire instantly (no confirmation modal). CATCH: now available on
  the gym-complete screen between every gym (not just region end), pool gated
  by Part 4 rarity-by-level ladder (`canCatchRarity`). HP shown on team cards
  + XP bar. Caught Pokémon stamped with `computeHp` at catch (both pre-game
  and regional paths).
- Regional catch: buy up to 3 pokeballs; 1 ball = 1 question = 1 attempt;
  wrong answer consumes the ball; 10 Pokemon available per region
- Crystals scale per region; 100 crystals = 1 peso credit

## Multiplayer Rules
- Shared timer controlled by host
- Each kid sees a UNIQUE random question (no copying)
- Questions age-appropriate per band
- Pokemon race rule: once caught, greyed out for others

## Completed-Gym Review Mode
Once a kid passes a gym, that gym becomes read-only — they cannot re-play
it for crystals. Tapping a completed gym (🏅 on the gym-select card) opens
`screen-gym-review`, which renders, per question: the question text, the
correct answer, the kid's actual pick (✅ correct / ❌ wrong / ⏱ timeout),
plus a stats banner (passed?, crystals earned, X / 10 correct). No timer,
no abilities, no submit — purely a recap.

Persistence: `STATE.save.regions[r].gymResults[g]` is written at the end
of every gym attempt, holding the 10 questions, the kid's chosen answer
per question, and the correctness flag. The data is additive — old saves
without this field render a graceful fallback panel and are still blocked
from replay by the `startGym` guard.

Defensive guard: `startGym` short-circuits to `openGymReview` BEFORE
resetting any STATE counters or creating a timer if the gym is already
in `gymsCompleted`. Closes the crystal re-farming loophole.

## Room-Code Rejoin
Players' saves (crystals, Pokemon team, gymsCompleted, gymResults,
seen-question set) persist durably in Supabase via `player_saves`. If a
kid's tab crashes mid-game and they reopen `?room=CODE`, the game
restores them silently:

- **Auto-rejoin via URL**: `tryAutoRejoinFromURL(code)` fires on window
  load. If `localStorage.cqc_player_id` is on the room's roster, the
  kid skips the join form and lands in the right screen for the
  current phase.
- **Manual rejoin via form**: `playerJoin` checks the same localStorage
  match and routes to `reconnectExistingPlayer` instead of overwriting
  with a fresh save.
- **Mid-game strangers are rejected**: a brand-new name with no
  localStorage and no roster entry gets "Game already started — only
  returning players can rejoin". The roster is locked after start.
- **Lobby joining is unchanged**: fresh kids can still join a room in
  `phase: 'lobby'` and create a new save.
- **Presence heartbeat**: every 15 seconds while `STATE.roomCode` is
  set, each player upserts a `last_seen` ISO timestamp into their save.
  The host dashboard reads this to render 🟢 Connected (<20s), ⏳
  Reconnecting (<60s), or ⚪ Not yet rejoined.

## Persistent Player Identity
Every player has a permanent **6-character A-Z0-9 Trainer ID** they pick at
registration and keep across all games. The `player_saves` table now stores
identity at the row level (columns: `name`, `age`, `gender`, `created_at`)
in addition to the JSONB `data` blob with the game state. A `CHECK
(player_id ~ '^[A-Z0-9]{6}$')` constraint enforces the format.

**Screens** (in flow order):
- `screen-account-gate` — shown when "Join a Room" is tapped without
  `localStorage.cqc_player_id`. Two choices: register or log in.
- `screen-register` — 4-step wizard (Name → Age 9-13 → Gender →
  6-char ID with Check Availability + Confirm). Ends on a welcome
  screen displaying the ID prominently.
- `screen-login` — single 6-char ID input.
- `screen-player-dashboard` — landing screen for logged-in players:
  profile (name + ID + age-band pill + 💎 balance), Join a Room and
  Crystal Wallet actions, and three game sections (**Active** = in
  progress, **Pending** = lobby, **Archived** = finished/archived).
  Auto-rejoin from `?room=CODE` lands here with the URL room
  highlighted. Log Out clears localStorage and returns to home.

**Identity in playerJoin**: the join form is now code-only. Identity
(name, emoji, age, gender) comes from `STATE.player` loaded from
localStorage / the persistent row. No name input on join. A small
"logged in as" card sits above the code field. Auto-rejoin and
roster-match rejoin behaviour are preserved.

**Host Add Crystals lookup** queries the new `name` column directly
(via the updated `dbLookupPlayer`).

**Identity helpers** (in game.js): `PLAYER_ID_RE`, `isValidPlayerId`,
`normalizePlayerId`, `ageGroupFromAge`, `emojiFromGender`,
`dbIsIdTaken`, `dbRegisterPlayer`, `dbLoginPlayer`. `dbLookupPlayer`
returns a unified shape including identity columns and balance.

## Crystal Banking (ledger + redemption)
**Storage** — `crystal_ledger` table in Supabase (see `MIGRATIONS.md`).
Every crystal movement records one row: `type ∈ {earn, bonus, redeem_request,
adjustment}`, `amount` (signed: + credit, − debit), `status ∈ {approved,
pending, declined, modified}`, optional `room_code` and `note`. The
canonical balance lives on `player_saves.data.total_crystals` and is
mutated **only** when an entry reaches `approved` or `modified`. Pending
and declined entries never move the balance, so the ledger reconstructs
the balance:
```
balance(player) = SUM(amount WHERE player_id=… AND status IN ('approved','modified'))
```

**Player wallet** — `screen-crystal-dashboard`, opened by tapping the
🔮 stat on the map. Shows current balance + peso conversion (100 🔮 = ₱1),
a Redeem Crystals form, and a newest-first ledger of every row. One open
redemption request at a time (the button is replaced by a pending banner
until the host resolves it).

**Host panels** (added to `screen-host`):
- **Crystal Requests** — every pending redemption across all players,
  with **Approve** / **Modify** (revise amount) / **Decline** buttons.
  Approve and Modify flip the ledger row's status and bump the canonical
  balance; Decline only flips the status. Refreshed on every host poll
  (~2.5 s) with a badge count.
- **Add Crystals (Host bonus)** — manual credit form: Player ID with live
  name lookup, positive amount, required note. Writes a `bonus` row at
  `status='approved'` and credits the balance immediately.

**Game wiring** — every in-game balance change writes a matching ledger
row so the audit is complete:
- `endGym` → one `earn` row per gym (total `gymCrystals`, room-scoped).
- STEAL ability → paired `adjustment` rows (leader −X, stealer +X).
- `buyRegionalPokeball` → `adjustment` row (−cost).

## Host Dashboard — three-column landscape layout
The in-game host dashboard (`screen-host`) is a **three-column laptop
landscape view** — no mobile responsiveness, designed for Papa's laptop
beside the play table. The persistent room-code banner sits across the
top; below it the viewport splits into three equal columns:

- **🎮 ROOMS** — `+ Create New Game` button at the top opens an inline
  code-entry form and writes a fresh `lobby` room. Rooms are bucketed
  into LIVE (non-archived, non-lobby, non-GAME_OVER), WAITING (lobby),
  and ARCHIVED (archived flag OR GAME_OVER). Each room card shows the
  code, status pill, player count, region/gym, and relative time. The
  `View →` button opens the **Room Detail Overlay** modal — a centered
  ~70vw card with player list (sorted by presence → crystals desc),
  game progress (R1..R10 pills), Pokemon Available (catch phases
  only), and **phase-driven actions**: when `room.phase === 'lobby'`
  the action row is `[🚀 Start Game] [🗄️ Archive] [🏁 End Game]`;
  otherwise it's `[⏸️ Pause / ▶️ Resume] [🗄️ Archive] [🏁 End Game]`.
  Start Game writes `phase = 'PREGAME_CATCH'` for that specific room
  (mirrors `hostStartGame` but does NOT switch the host's view —
  Papa stays on the three-column dashboard). Copy Code is intentionally
  absent here because the persistent banner already exposes a copy
  button.

- **💎 CRYSTALS** — search bar (filters by name or ID, real-time);
  Active Accounts (pending redemptions float top, then sorted by
  total_crystals desc); per account: balance, peso conversion, pending
  block with Approve/Modify/Decline, View Ledger button (opens
  per-player ledger modal with all rows), Archive button. Archived
  Accounts section collapses by default. Award Bonus Crystals form
  (player ID lookup → live name preview, positive amount, required
  note) writes an `approved` `bonus` row.

- **⚙️ CONTROLS** — scoped to the active room (most-recently-updated
  non-archived). Sections: Game Flow (Advance Phase with next-phase
  hint, Pause/Resume All, End Game with confirmation); Room Access
  (Lock Room toggle — blocks fresh joiners but lets returning players
  reconnect; Force Save All bumps `room.updated_at`); Broadcast
  (input + 4 presets, writes `room.announcement = { text, ts }`
  picked up by every player's poll); Danger Zone (Reset Current Room
  with confirmation, kicks players + clears Pokemon, balances stay).

**Player side hooks**:
- `playerJoin` rejects with "🔒 Room is locked" when `room.locked` is
  true (only for fresh joiners — returning players bypass this).
- `checkPauseState` reads `room.announcement` on every poll and
  shows a fixed-position dismissible **broadcast banner** at the top.
  Dismissal is keyed by the announcement timestamp so new messages
  re-pop. When the host clears `room.announcement`, the banner clears
  too.

**Polling**: the host dashboard polls every 2.5 s (`hostDoPoll`). On
every tick it reads `rooms` (col 1), `player_saves` + `crystal_ledger`
(col 2), and refreshes col 3 against `HOST_UI.activeRoomCode`. If a
Room Detail Overlay is open, its body refreshes live too.

## Player Dashboard — three-column landscape layout
The player surface (`screen-player-dashboard`) is now a **three-column
laptop landscape view**. `screen-home` is a login-only landing with
two buttons (🆕 Create Account / 🔑 Log In) — Join, Rules, Board, and
Settings have moved into the dashboard or are gone. On page load, if
`localStorage.cqc_player_id` is set, the dashboard opens directly and
`screen-home` is skipped.

The dashboard's persistent header (above all three columns) shows
`👤 [id] · [name] · [Junior 🌱 / Senior ⚡]` on the left and
`💎 [balance] crystals · 🚪 Log Out` on the right. Log Out clears
`cqc_player_id` + `cqc_player` + `cqc_player_name` + `cqc_room_code`
from localStorage and returns to `screen-home`.

The three columns refresh together every 15 s (`pdcStartPoll`):

- **🎮 GAME ROOMS** — `+ Join a Room` inline form at the top routes
  through the existing `playerJoin`. Three sections with count badges:
  **🟢 ACTIVE** (rooms this player is on with phase=playing/paused,
  not archived, not in `save.abandoned_rooms`), **⏳ PENDING** (same
  but phase=lobby), **📦 ARCHIVED** (collapsed; archived rooms +
  GAME_OVER + abandoned rooms, tagged 🏁 Finished or 🗄️ Abandoned).
  Active/Pending cards show badges progress bar, Pokemon caught (up
  to 3 names), crystals earned, and a `▶️ Resume` / `▶️ Open Lobby`
  button plus a `··· More` menu (📋 View Room Details / 🚪 Abandon
  Room). The Abandon flow writes a `crystal_ledger` row
  (`type:'adjustment'`, `amount:0`, `status:'pending'`,
  `note:'Abandon request — awaiting host approval'`). While pending,
  Resume is disabled and the card shows "⏳ Abandon request sent to
  Papa." Host approves via the existing Crystal Requests panel; on
  approve, the room code is appended to `save.abandoned_rooms` and
  the player's card moves to Archived with the 🗄️ Abandoned pill.
  On decline, the ledger row flips to declined and the card returns
  to normal Active state.

- **💎 CRYSTAL WALLET** — large balance card (💎 N crystals · ≈ ₱N.NN
  at 100💎 = ₱1); 🎁 Redeem Crystals inline form (writes a
  `redeem_request` ledger row; button is replaced by a pending banner
  while a request is open); 📋 LEDGER with filter tabs (All / Earned
  / Redeemed) and Show-more pagination (10 rows at a time).

- **🏆 MY JOURNEY** — 🏅 My Personal Bests (every gymResults entry
  across every region in the save, sorted by crystals desc, top 3 with
  🥇🥈🥉 medals; "Show all N scores" expander); 🐾 My Pokemon (the
  save's `pokemon_team` grouped Legendary → Super → Rare → Common,
  showing each Pokemon's emoji, name, rarity pill, and the room code
  it was caught in); 📢 Broadcast Message (textarea, max 100 chars,
  10 💎 cost, balance-after preview; button enabled only when text
  non-empty AND balance ≥ 10 AND player has at least one active room;
  on send, `dbBumpCrystals(-10)`, audit `adjustment` ledger row, then
  `room.announcement = { text: '[name]: [msg]', ts, source }` which
  the existing `renderPlayerBroadcast` pipeline shows on every
  player's screen).

**Audit additions in the engine** (so the dashboard can attribute
scores and Pokemon to specific rooms):
- `endGym` now writes an `earn` ledger row for every attempt — `amount`
  may be 0 for a complete fail — and stamps `roomCode` on the
  `gymResults` entry.
- `attemptCatch` / `showRegionalCatchResult` tag each Pokemon with
  `roomCode: STATE.roomCode || null` so the team list can show the
  room they were caught in.

## Host Entry Flow (`?host=true`)
Opening `?host=true` (with or without `?room=`) lands Papa **directly
on the three-column dashboard**. There is no separate landing /
"pick a game" screen — every room is already visible in Column 1.

- **`?host=true`** (no room param) → `showHostDashboardUnscoped()`:
  Column 1 lists every room (Live / Waiting / Archived) across all
  of Supabase; Column 2 lists every player account; Column 3
  auto-scopes to the most-recently-updated non-archived room (found
  by Column 1's renderer and written to `HOST_UI.activeRoomCode`).
  The persistent banner shows that room's code, or hides entirely if
  no rooms exist yet.
- **`?host=true&room=CODE`** → `initHostDashboard()`: same layout,
  but Column 3 is bound to that specific room (HOST.* is hydrated
  from `dbReadRoom(roomCode)`).
- **`screen-host-landing`** still exists in the markup but is no
  longer reachable from the URL — kept as dead code until we decide
  to remove it.

- **+ Create New Game** at the top — opens an inline code-entry form,
  writes a fresh `lobby` room with `archived=false`.
- **Active Games** (non-archived, recency-sorted, capped at 15). Each
  card shows the room code in a large gold-bordered box (the visual
  anchor for a kid to read off), a Copy button, a status pill
  (⏳ Waiting / 🟢 In progress / ⏸️ Paused), player count, relative
  time, plus `[Resume]` and `[Archive]` actions.
- **Archive system** — every room carries a boolean `archived` flag
  (default false). Archive flips it true; Unarchive flips it false. No
  row is ever deleted. Toast "Archived ✓" fades for 2.2s; no confirm
  dialog. Finished games (`phase == 'GAME_OVER'`) are auto-archived
  via `hostNextPhase` and render with `[View Results]` instead of
  Resume — no prominent code reuse. Manually archived non-finished
  games keep their room code prominent + `[Resume]` + `[Unarchive]`.
- **Persistent room-code banner** inside `screen-host`, pinned above
  the header: `📢 Room: <CODE> — Players rejoin with this code` with a
  Copy button. Non-dismissible so Papa can read it aloud while kids
  trickle back over a minute or two.
- **Presence column** on each player card derived from the heartbeat
  field above.

## Question System
- Source content: a 590-question v2.0 library (pokeball 30, catch 60, gym
  500 across all 10 regions) in OLD format (single shared pool, fixed per
  gym).
- Target format: blueprint + bank. Blueprints define each gym's 10 slots
  (category + tier). Banks hold pools per category+tier; each kid draws a
  random question per slot.
- Two files: questions-junior.json, questions-senior.json (same structure,
  age-tuned content).
- Lean depth: 6 per gym bucket, 15 per regional catch, 30 pokeball pool.

## Pokemon Library (pokemon.json)
- 183 regional evolution lines + 10 starters + 18 bench (boss pool)
- v2.2: battleAbility populated for all 193 starters+regional (thematic
  assignment per SPEC Part 14G-4). Bench battleAbility = null (boss
  creatures — separate stat block at battle engine build, Track C).
- Every Pokemon has a MOVE ability (gym phase) + battleAbility (battle phase)
- MOVE pool: ELIMINATE/CLOCK/SWAP/EXTRA_SHOT/TIME_TRAVEL/CLUE (rarity-gated)
- BATTLE pool: CRITICAL_HIT/FREEZE_STUN/HEAL/PROTECT/GUARD/SECOND_WIND/
  COMBO_TEAM_STRIKE (thematic, not rarity-gated — Part 10A guardrail)
- Rarity tiers: basic/holo/rare/super/legendary
- R10 = 🇵🇭 Pilipinas (Filipino mythology legendaries + PH endemic fauna)

## Build Phases — HISTORICAL (retired; superseded by Tracks A/B/C in BACKLOG.md)

> The old "Phase Zero–4" build roadmap is RETIRED as of 2026-05-25. The current
> workflow uses **TRACKS** (A: Design · B: Architecture · C: Build), tracked in
> **BACKLOG.md**. Track A is COMPLETE. Recorded here only for historical context:
> - Phase Zero: docs + question library + full Pokemon library + validation ✅
> - Phase 1: engine vertical slice (R1-2) + UAT ✅
> - Phase 2: unlock Regions 3-10 + UAT ✅ (all regions playable)
> - Phase 3: polish (prize screen, animations, sound) — *live items in BACKLOG.md*
> - Phase 4: live dress rehearsal — *in BACKLOG.md → Ops/Convention prep*

## Backlog → see BACKLOG.md

> **All pending work lives in `BACKLOG.md`** (single TODO source — design + build + ops).
> Add pending work to BACKLOG.md, not here. CLAUDE.md keeps only BUILD STATE + the
> Track-B architecture plan below.

## Versioning Rule
Increment a file's version + date in FILES.md on every change. Bump
CLAUDE.md version when a phase completes. Semantic versioning: 0.x.x in
development, 1.0.0 at launch.

## ARCHITECTURE & FILE MANAGEMENT — TRACK B PLAN (planned, NOT yet executed)

> Recorded 2026-05-25. Track A design is COMPLETE. Track B is the architecture/file
> reorg that must happen before Track C build work scales up.

**7-CATEGORY FILE MODEL (target organization):**
1. **Source-of-truth** — `CRYSTAL_QUIZ_REDESIGN_SPEC.md` (design), `CLAUDE.md` (build).
2. **Library/data** — `pokemon.json`, `questions-junior.json`, `questions-senior.json`.
3. **UX/presentation** — `index.html`, `style.css`.
4. **Logic/engine** — `game.js` (CURRENTLY a 5,938-line MONOLITH — biggest scaling risk).
5. **Ledger/economy** — the crystal/redeem/voucher logic (currently inside game.js).
6. **Infrastructure/schema** — `MIGRATIONS.md` + Supabase schema.
7. **Creative-collaterals** — art/assets (incl. evolution sprites, voucher PNGs).

**game.js MODULE SPLIT (the big one — Track B, its own tested commit):**
- Split the monolith via multiple `<script>` tags (NO bundler needed — preserves global
  scope; index.html currently loads one `<script src="game.js">`). Proposed modules:
  `core.js` / `ledger.js` / `player-ui.js` / `catch.js` / `wallet.js` / `host-ui.js` /
  `gameplay.js`. Section banners in game.js already map roughly to these (identity/ledger
  ~136, player dashboard ~898, regional catch ~2125, crystal wallet ~2681, host dashboard
  ~3960–5570). CSS already separated (style.css). Split = its own commit, tested.

**FILE-HYGIENE actions (DONE — Commit 2, 2026-05-25):**
- ✅ `/archive/` created; stale files moved (POKEMON_LIBRARY_v2.md, 3×
  CLAUDE_CODE_PROMPT_*.md, questions.json).
- ⬜ `/assets/` tree still needed (before evolution art + voucher PNGs land).

**PROCESS GAPS to address:**
- **No Supabase data backup** — export before the convention.
- **No test/live env separation** — currently one environment.

**REPO PATH (CONFIRMED 2026-05-25):** `~/dev/Crystal-Quiz-Challenge`
Do NOT use `~/Desktop/CrystalQuiz/...` — Desktop may be cloud-synced,
which corrupts git.

## Git Workflow

This project is developed across more than one machine. To keep everything in
sync, treat git as the source of truth and follow these rules strictly:

- **Clone once per machine.** Run `git clone https://github.com/angelo-madrid/Crystal-Quiz-Challenge`
  into a folder on the local disk. Do **not** place the repo inside iCloud
  Drive, Dropbox, Google Drive, OneDrive, or any other cloud-sync folder —
  those tools rewrite files behind git's back and corrupt the working tree.
  **Confirmed local path: `~/dev/Crystal-Quiz-Challenge`.**

- **Start of session = `git pull`.** Whenever the user (or Claude) starts
  working on this repo, the very first action is `git pull` to fetch the
  latest commits from GitHub. This is how changes made on another machine
  arrive. Treat the phrase "start session" as a ritual command that means
  *pull first, then do anything else*.

- **End of session = commit + push.** When you stop working — even mid-task
  — commit the current state locally and push to GitHub. The next machine
  to start a session will pull and pick up exactly where this one left off.
  Treat "end session" as a ritual command that means *stage everything
  intentional, commit with a clear message, then push*.

- **One machine in flight at a time.** Don't edit on a second machine
  before pushing from the first. Skipping the push means the next pull
  conflicts, and resolving the conflict by hand is much slower than just
  pushing in the first place.

- **If a pull surfaces conflicts**, stop and ask the user before resolving.
  Never auto-merge by guessing.
