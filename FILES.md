# Crystal Quiz Challenge — File Manifest
Manifest version: 1.15
Last updated: 2026-05-22

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| index.html | 1.4 | 2026-05-22 | All game screens. v1.4: removed solo "Continue Journey" button from `screen-home` (multiplayer-only entry now). v1.3: `screen-host-landing` + `host-persistent-banner`. v1.2: `screen-gym-review`. v1.1 (1.6): `screen-test-build-complete`. | Active |
| style.css | 1.3 | 2026-05-22 | Styling. v1.3: host-landing screen, `.game-card`, `.room-code-box`, `.copy-btn`, `.status-pill` variants, `.host-persistent-banner`, `.host-toast`, `.presence-*` indicator classes. v1.2: gym-review styles. v1.1 (1.6): `.region-card.coming-soon`. | Active |
| game.js | 1.9 | 2026-05-22 | Game logic. v1.9: solo / offline play paths removed — `continueJourney()` and `createPlayer()` now stub-redirect to `screen-join`; no save is ever created or restored outside a Supabase room. `?host=true` and `?room=CODE` auto-rejoin untouched. v1.8: rejoin + presence heartbeat + host game manager. v1.7: Review Mode. v1.6.1: seen-question-set + unscramble shuffle. | Active |
| questions.json | 3.0 | 2026-05-22 | Archived source library (590, blueprint+bank format) — not loaded at runtime | Archived |
| questions-junior.json | 3.3 | 2026-05-22 | Junior bank (9-11), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| questions-senior.json | 3.3 | 2026-05-22 | Senior bank (12-13), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| pokemon.json | 1.1 | 2026-05-22 | Pokemon library: 10 starters + 100 regional. Every Pokemon has a unique ability NAME and unique effect across 10 mechanics; rarity scales power; baseValue inflates per region. v1.1: Groudon corrected to legendary; 5 ability names renamed for uniqueness | Active |
| gengar.png | 1.1 | 2026-05-22 | Home mascot — new mascot image (Pikachu vs Gengar battle scene), 1024×1024 PNG | Active |
| CLAUDE.md | 0.3.3 | 2026-05-22 | Master project doc — Phase 1 complete + multiplayer-only flag + post-Phase-1 UAT additions (Review Mode, rejoin fix, Host Dashboard manager, new mascot, solo paths removed) + Phase 3 Backlog | Active |
| FILES.md | 1.15 | 2026-05-22 | This manifest | Active |

Maintain this manifest on every future file change — it's the single
source of truth for what's deployed.
