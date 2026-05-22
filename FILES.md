# Crystal Quiz Challenge — File Manifest
Manifest version: 1.18
Last updated: 2026-05-22

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| index.html | 1.6 | 2026-05-22 | All game screens. v1.6: persistent identity — added `screen-account-gate`, `screen-register` (4-step wizard + welcome), replaced `screen-login` with single-ID-input flow, added `screen-player-dashboard` (profile + balance + Active/Pending/Archived sections + Join/Wallet/Logout); simplified `screen-join` to code-only (identity shown via "logged in as" card). v1.5: wallet + host crystal panels. v1.4: removed "Continue Journey". v1.3: host-landing. v1.2: gym-review. v1.1 (1.6): test-build lid. | Active |
| style.css | 1.5 | 2026-05-22 | Styling. v1.5: persistent-identity surfaces — `.gate-card`, `.register-*`, `.reg-id-*` status pills, `.welcome-*`, `.player-dashboard-hero`, `.pdh-*` pills, `.pd-section`, `.pd-empty`, `.game-card.highlight`, `.pd-logout-link`, `.join-identity-*`. v1.4: wallet + host crystal panels. v1.3: host-landing + presence. v1.2: gym-review. v1.1 (1.6): `.region-card.coming-soon`. | Active |
| game.js | 1.11 | 2026-05-22 | Game logic. v1.11: persistent player identity — `PLAYER_ID_RE` + helpers (`isValidPlayerId`, `normalizePlayerId`, `ageGroupFromAge`, `emojiFromGender`), `dbIsIdTaken`, `dbRegisterPlayer`, `dbLoginPlayer`; new screen handlers (register wizard, login submit, player dashboard render + game-bucket query); `playerJoin` rewritten to use `STATE.player` (no form name); `tryAutoRejoinFromURL` lands on dashboard with `_dashboardHighlightRoom` set; `dbLookupPlayer` returns unified shape using `name` column. v1.10: crystal-banking. v1.9: solo paths removed. v1.8: rejoin + heartbeat + host manager. v1.7: Review Mode. v1.6.1: seen-question-set + unscramble. | Active |
| questions.json | 3.0 | 2026-05-22 | Archived source library (590, blueprint+bank format) — not loaded at runtime | Archived |
| questions-junior.json | 3.3 | 2026-05-22 | Junior bank (9-11), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| questions-senior.json | 3.3 | 2026-05-22 | Senior bank (12-13), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch >=15, pokeball=30, every R1-3 bucket >=6 | Active |
| pokemon.json | 1.1 | 2026-05-22 | Pokemon library: 10 starters + 100 regional. Every Pokemon has a unique ability NAME and unique effect across 10 mechanics; rarity scales power; baseValue inflates per region. v1.1: Groudon corrected to legendary; 5 ability names renamed for uniqueness | Active |
| gengar.png | 1.1 | 2026-05-22 | Home mascot — new mascot image (Pikachu vs Gengar battle scene), 1024×1024 PNG | Active |
| MIGRATIONS.md | 1.1 | 2026-05-22 | Supabase SQL migrations. v1.1 adds the persistent-identity block (clean-slate DELETEs + new columns + CHECK constraint on `player_id`). v1.0: `crystal_ledger` create-table + indexes. Run blocks in order in Supabase Studio. | Active |
| CLAUDE.md | 0.4.0 | 2026-05-22 | Master project doc — evening 2026-05-22 session summary added; Phase 3 Backlog replaced with Next-Session-High-Priority list + Phase 4 Checklist. Covers Persistent Player Identity + Crystal Banking + multiplayer-only + post-Phase-1 UAT additions. | Active |
| FILES.md | 1.18 | 2026-05-22 | This manifest | Active |

Maintain this manifest on every future file change — it's the single
source of truth for what's deployed.
