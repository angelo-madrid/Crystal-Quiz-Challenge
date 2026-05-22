# Crystal Quiz Challenge
Version: 0.5.0
Last updated: 2026-05-23

> **Phase 1 complete** — engine wired to age-split question banks, random
> per-kid draw, pokemon.json with all 10 ability mechanics, Regions 1-2
> playable slice, graceful end after Region 2.
>
> **Multiplayer-only game** — there is no solo / offline play. The only
> player entry point is "Join a Room" with a host-created room code.
> `?host=true` lands the host on the dashboard. `?room=CODE` auto-rejoin
> for returning players still works exactly as before.
>
> **Post-Phase-1 UAT additions (still v0.3.x, before Phase 2 begins):**
> completed-gym Review Mode (read-only, blocks crystal re-farming);
> room-code rejoin fix (returning players restore their save via
> localStorage match, mid-game strangers rejected); Host Dashboard game
> manager (active games list, archive system, persistent room-code
> banner, presence column); new mascot image (Pikachu vs Gengar battle
> scene); solo / offline play paths removed (home screen → only "Join
> a Room"; `continueJourney` and `createPlayer` stubbed to redirect to
> the join screen so no save can be created or restored outside a
> Supabase room).
>
> **Session 2026-05-22 (evening) shipped:** player identity system
> (screen-register, screen-login, screen-player-dashboard,
> screen-account-gate), crystal banking layer (crystal_ledger, wallet
> screen, redeem flow), host Add Crystals panel, ledger wiring for
> game earnings. Supabase migrations run. All committed and pushed.
>
> **Session 2026-05-22 (late evening) shipped:** Host Dashboard
> rewritten as a three-column landscape layout for laptop use.
> Column 1 (ROOMS): Create New Game + LIVE/WAITING/ARCHIVED room
> lists with View → opening a Room Detail Overlay (player list
> sorted presence-then-crystals, game progress, Pokemon Available
> in catch phases, Pause/Archive/EndGame actions). Column 2
> (CRYSTALS): search bar, Active Accounts (pending redemptions
> float top, then sorted by balance desc) with Approve/Modify/
> Decline + View Ledger modal + Archive, Archived Accounts,
> Award Bonus Crystals form. Column 3 (CONTROLS): Game Flow
> (Advance/Pause/EndGame), Room Access (Lock toggle + Force
> Save All), Broadcast input + 4 presets, Danger Zone (Reset
> Room). Player side: `room.locked` blocks fresh joiners (returning
> players still reconnect), `room.announcement` shows a dismissible
> broadcast banner on every player screen.

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
- Pre-game: catch 1 starter (3 pokeballs, 1 catch only, rest waived)
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
- 110 total: 10 starters + 100 regional (10 per region)
- Every Pokemon has a UNIQUE ability
- Mechanics: TIME, ELIMINATE, SKIP, MULTIPLY, STEAL, FREEZE, REVEAL,
  RETRY, SHIELD, DOUBLE_OR_NOTHING
- Rarity tiers scale ability power: common, rare, super, legendary
- Age-neutral

## Build Phases
- Phase Zero: docs + restructure/split/age-tune question library + full
  Pokemon library + validation
- Phase 1: engine vertical slice (Regions 1-2 playable) + UAT
- Phase 2: unlock Regions 3-10 + UAT
- Phase 3: polish (prize screen, animations, sound) + UAT
- Phase 4: live dress rehearsal

## Phase 3 Backlog

### NEXT SESSION — HIGH PRIORITY (run as one combined prompt)

- **Host Crystal Requests panel** — show all pending `redeem_request`
  entries across all players; Approve / Modify / Decline actions;
  auto-refresh every 15 s.

- **Ledger sync fix** — audit all crystal mutation paths (gym clear,
  gym fail, STEAL, MULTIPLY, DOUBLE_OR_NOTHING, Pokeball purchase) and
  ensure every one writes a `crystal_ledger` entry. Add a
  `balanceFromLedger()` invariant helper.

- **Per-player ledger on Host Dashboard** — tap player card → modal
  showing full ledger history with amounts, types, rooms, notes, dates.

- **Player sort order on Host Dashboard** — Connected → Reconnecting →
  Offline, sorted by crystals descending within each group.

- **Pause must freeze player's local timer (pre-existing bug)** — on
  pause broadcast, record `STATE.pausedTimeRemaining`, clear interval,
  freeze display. On resume, restart from frozen value. Guard
  `timeUp()` against firing while paused.

- **TIME ability speed bonus cap** — use `STATE.originalTimeLimit`
  (set at question load, never updated by TIME ability) as the
  speed-bonus denominator.

- **Phase 2 — Unlock Regions 3-10** — remove lock + graceful-end-at-2
  logic; verify question banks for all 10 regions; `GAME_OVER` after
  Region 10.

- **Cosmetic fixes** — `alt` text on `gengar.png` → "Pikachu vs Gengar
  battle scene"; sync JSON version strings (questions files → 3.3,
  pokemon.json → 1.1); optimize `gengar.png` to 512×512.

### PHASE 4 CHECKLIST (before live event)
- Morning of convention: delete all test rows from `player_saves`,
  `rooms`, `crystal_ledger` in Supabase.
- Full dress rehearsal with real kids.
- Tag `v1.0.0`.

## Versioning Rule
Increment a file's version + date in FILES.md on every change. Bump
CLAUDE.md version when a phase completes. Semantic versioning: 0.x.x in
development, 1.0.0 at launch.

## Git Workflow — Multi-Machine
This project is developed across more than one machine. To keep everything in
sync, treat git as the source of truth and follow these rules strictly:

- **Clone once per machine.** Run `git clone https://github.com/angelo-madrid/Crystal-Quiz-Challenge`
  into a folder on the local disk. Do **not** place the repo inside iCloud
  Drive, Dropbox, Google Drive, OneDrive, or any other cloud-sync folder —
  those tools rewrite files behind git's back and corrupt the working tree.
  The repo lives in `~/Desktop/CrystalQuiz/Crystal-Quiz-Challenge` on this
  machine; pick the equivalent local-disk path on each other machine.

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
