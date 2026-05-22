# Crystal Quiz Challenge — File Manifest
Manifest version: 1.10
Last updated: 2026-05-22

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| index.html | 1.1 | 2026-05-22 | All game screens. v1.1 (Phase 1 step 1.6): added `screen-test-build-complete` to lid the engine slice gracefully after Region 2 | Active |
| style.css | 1.1 | 2026-05-22 | Styling. v1.1 (Phase 1 step 1.6): added `.region-card.coming-soon` (dashed gold border, still clickable) for Regions 3-10 on the map | Active |
| game.js | 1.6.1 | 2026-05-22 | Game logic. Phase 1 (steps 1.1-1.6) + UAT patches: save-wide seen-question-set (`STATE.save.seen_question_ids`) drives draw-without-replacement across gyms, pre-game catches, and regional catches with LRU fallback on bucket exhaustion; unscramble prompts are shuffled at draw time so the dashed letters no longer spell the answer | Active |
| questions.json | 3.0 | 2026-05-22 | Archived source library (590, blueprint+bank format) — not loaded at runtime | Archived |
| questions-junior.json | 3.3 | 2026-05-22 | Junior bank (9-11), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| questions-senior.json | 3.3 | 2026-05-22 | Senior bank (12-13), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| pokemon.json | 1.1 | 2026-05-22 | Pokemon library: 10 starters + 100 regional. Every Pokemon has a unique ability NAME and unique effect across 10 mechanics; rarity scales power; baseValue inflates per region. v1.1: Groudon corrected to legendary; 5 ability names renamed for uniqueness | Active |
| gengar.png | 1.0 | 2026-05-22 | Home mascot | Active |
| CLAUDE.md | 0.3.0 | 2026-05-22 | Master project doc — Phase 1 complete + Phase 3 Backlog | Active |
| FILES.md | 1.10 | 2026-05-22 | This manifest | Active |

Maintain this manifest on every future file change — it's the single
source of truth for what's deployed.
