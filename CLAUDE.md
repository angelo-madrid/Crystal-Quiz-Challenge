# Crystal Quiz Challenge
Version: 0.2.0
Last updated: 2026-05-22

> **Phase Zero complete** — library restructured, age-split, tuned, expanded
> to 729 questions per age file; 110-Pokemon library built; all content
> validated (PHASE ZERO VALID). Added multi-machine git workflow.

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
