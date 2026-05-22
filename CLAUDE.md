# Crystal Quiz Challenge
Version: 0.3.2
Last updated: 2026-05-22

> **Phase 1 complete** — engine wired to age-split question banks, random
> per-kid draw, pokemon.json with all 10 ability mechanics, Regions 1-2
> playable slice, graceful end after Region 2.
>
> **Post-Phase-1 UAT additions (still v0.3.x, before Phase 2 begins):**
> completed-gym Review Mode (read-only, blocks crystal re-farming);
> room-code rejoin fix (returning players restore their save via
> localStorage match, mid-game strangers rejected); Host Dashboard game
> manager (active games list, archive system, persistent room-code
> banner, presence column); new mascot image (Pikachu vs Gengar battle
> scene).
>
> **Session 2026-05-22 shipped:** UAT bug-fixes (no-repeat question
> draws + runtime unscramble shuffle), completed-gym Review Mode,
> room-code rejoin + presence heartbeat, Host Dashboard game manager
> with archive, mascot image refresh. All committed and pushed.

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

## Host Dashboard (`?host=true`)
Opening `?host=true` with no `?room=` lands on `screen-host-landing`, a
game manager that lists every room (active and archived). Opening with
`?host=true&room=CODE` jumps straight to the room (lobby or dashboard).

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
Items deferred out of Phase 1 — pick up in Phase 3 (or earlier if they
block UAT).

- **Pause must freeze each player's local timer.** PRE-EXISTING issue,
  medium severity. No host-broadcast shared timer exists; each player
  runs a local `STATE.timerInt`. When the host pauses, the overlay shows
  but the local timer keeps ticking underneath and can hit 0, firing
  `timeUp()` and costing the kid the question. Fix: on pause, suspend
  each player's local timer; on resume, continue with remaining time —
  ideally driven by the host's pause state via room sync.

- **TIME ability inflates speed bonus.** Introduced in 1.5, low severity.
  Using a TIME Pokemon adds seconds, which makes the speed-bonus math
  pay ~20-50% more crystals than intended. Decide in Phase 3: cap the
  bonus or keep as an intentional reward for spending a Pokemon.

- **Prize screen — PRIORITY.** Build the end-game prize screen: podium,
  crystal-to-peso conversion (100 crystals = 1 peso), and unused-Pokemon
  level bonus (`baseValue × level_multiplier`). Needed to pay out real
  prizes.

- **Animations, sound, leaderboard polish.**

- **Known minor inconsistencies (cosmetic / a11y).** Discovered during
  the 2026-05-22 verification pass; none block gameplay:
  - In-file `"version"` strings drift behind the manifest:
    `questions-junior.json` and `questions-senior.json` say "3.0"
    internally but the manifest tracks them at 3.3 (4 edits past
    initial). `pokemon.json` says "1.0" internally but the manifest
    has it at 1.1 (Groudon → legendary + 5 ability renames). FILES.md
    is authoritative; the JSON header strings just need a sync.
  - The two `<img src="gengar.png">` tags still carry `alt="Gengar"`
    even though the new mascot is a Pikachu vs Gengar battle scene.
    Small a11y fix.
  - New mascot PNG is 1.42 MB (1024×1024). A 512×512 export would
    cut the home-screen payload roughly in half with no visible
    difference at the 130 px display size.

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
