# Crystal Quiz Challenge — File Manifest
Manifest version: 1.11
Last updated: 2026-05-22

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| index.html | 1.2 | 2026-05-22 | All game screens. v1.2: added `screen-gym-review` (read-only review of completed gyms). v1.1 (1.6): added `screen-test-build-complete` | Active |
| style.css | 1.2 | 2026-05-22 | Styling. v1.2: added review screen styles (`.review-stats`, `.review-question`, `.review-option.is-correct/-correct-chosen/-wrong-chosen`, `.review-fallback`). v1.1 (1.6): `.region-card.coming-soon` | Active |
| game.js | 1.7 | 2026-05-22 | Game logic. v1.7: completed gyms are read-only — startGym short-circuits to a new `openGymReview` flow that renders per-question results (kid's pick + correct answer) from a new `save.regions[r].gymResults[g]` record written at endGym. Backward-compatible: old saves missing gymResults render a graceful fallback. v1.6.1: seen-question-set draw-without-replacement + runtime unscramble shuffle | Active |
| questions.json | 3.0 | 2026-05-22 | Archived source library (590, blueprint+bank format) — not loaded at runtime | Archived |
| questions-junior.json | 3.3 | 2026-05-22 | Junior bank (9-11), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| questions-senior.json | 3.3 | 2026-05-22 | Senior bank (12-13), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| pokemon.json | 1.1 | 2026-05-22 | Pokemon library: 10 starters + 100 regional. Every Pokemon has a unique ability NAME and unique effect across 10 mechanics; rarity scales power; baseValue inflates per region. v1.1: Groudon corrected to legendary; 5 ability names renamed for uniqueness | Active |
| gengar.png | 1.0 | 2026-05-22 | Home mascot | Active |
| CLAUDE.md | 0.3.0 | 2026-05-22 | Master project doc — Phase 1 complete + Phase 3 Backlog | Active |
| FILES.md | 1.11 | 2026-05-22 | This manifest | Active |

Maintain this manifest on every future file change — it's the single
source of truth for what's deployed.
