# Crystal Quiz Challenge — File Manifest
Manifest version: 1.16
Last updated: 2026-05-22

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| index.html | 1.5 | 2026-05-22 | All game screens. v1.5: added `screen-crystal-dashboard` (player wallet) + Crystal Requests panel + Add Crystals form on `screen-host`; map's crystals stat is now a clickable wallet entry. v1.4: removed "Continue Journey". v1.3: `screen-host-landing` + persistent banner. v1.2: `screen-gym-review`. v1.1 (1.6): `screen-test-build-complete`. | Active |
| style.css | 1.4 | 2026-05-22 | Styling. v1.4: wallet (`.wallet-*`, `.ledger-row`, `.amt-credit/-debit`, `.stats-btn`) and host crystal panels (`.host-request-card`, `.hrq-*`, `.host-add-crystals-card`, `.host-request-badge`). v1.3: host-landing + status pills + presence. v1.2: gym-review styles. v1.1 (1.6): `.region-card.coming-soon`. | Active |
| game.js | 1.10 | 2026-05-22 | Game logic. v1.10: crystal-banking layer — `crystal_ledger` helpers (insert/update/list/pending/lookup), `recordLedgerAndBump`, `dbBumpCrystals`; player wallet (`openWallet`/`renderWallet`/redeem flow); host panels (pending requests with approve/modify/decline, add-crystals bonus with live player lookup); game wiring (`endGym` → earn row, STEAL → paired adjustment rows, `buyRegionalPokeball` → adjustment row). Canonical balance = sum of approved+modified ledger entries per player. v1.9: solo paths removed. v1.8: rejoin + heartbeat + host manager. v1.7: Review Mode. v1.6.1: seen-question-set + unscramble. | Active |
| questions.json | 3.0 | 2026-05-22 | Archived source library (590, blueprint+bank format) — not loaded at runtime | Archived |
| questions-junior.json | 3.3 | 2026-05-22 | Junior bank (9-11), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| questions-senior.json | 3.3 | 2026-05-22 | Senior bank (12-13), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| pokemon.json | 1.1 | 2026-05-22 | Pokemon library: 10 starters + 100 regional. Every Pokemon has a unique ability NAME and unique effect across 10 mechanics; rarity scales power; baseValue inflates per region. v1.1: Groudon corrected to legendary; 5 ability names renamed for uniqueness | Active |
| gengar.png | 1.1 | 2026-05-22 | Home mascot — new mascot image (Pikachu vs Gengar battle scene), 1024×1024 PNG | Active |
| MIGRATIONS.md | 1.0 | 2026-05-22 | Supabase SQL migrations. Currently lists the `crystal_ledger` create-table + indexes for the crystal-banking layer. Run in Supabase Studio SQL Editor. | Active |
| CLAUDE.md | 0.4.0 | 2026-05-22 | Master project doc — adds Crystal Banking section (ledger + redemption + host panels + game wiring) on top of multiplayer-only + post-Phase-1 UAT additions + Phase 3 Backlog | Active |
| FILES.md | 1.16 | 2026-05-22 | This manifest | Active |

Maintain this manifest on every future file change — it's the single
source of truth for what's deployed.
