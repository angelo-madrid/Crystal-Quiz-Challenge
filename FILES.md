# Crystal Quiz Challenge — File Manifest
Manifest version: 1.31
Last updated: 2026-05-25

> **4-HOME INFORMATION ARCHITECTURE** (see BACKLOG.md header for the full rule):
> SPEC.md = DESIGN · CLAUDE.md = BUILD STATE · BACKLOG.md = TODO · FILES.md (this) = MANIFEST.
> This manifest tracks the CURRENT version of every file. Superseded files move to the
> ARCHIVED section below but stay documented (history is never deleted from the record).
> v1.31: archived stale files physically moved to /archive/ (questions.json,
> POKEMON_LIBRARY_v2.md, and the three CLAUDE_CODE_PROMPT_*.md apply-prompts).
> v1.30: added BACKLOG.md (new single-source todo); synced SPEC row v3.3→v3.6 and CLAUDE.md
> note to SPEC v3.6; grouped Active/Archived; marked scaffolding + apply-prompts Archived.

## ACTIVE

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| index.html | 1.8.2 | 2026-05-25 | All game screens. v1.8.2: peso removed from player UI (player dashboard `pdc-peso` + Crystal Wallet `wallet-peso` spans deleted per SPEC Part 12I — host UI keeps peso); pre-game pokeball copy "3 Pokeball(s)" → "1 Pokeball" per SPEC Part 11 P8. v1.8.1: mascot alt text + Region 10 Game Complete screen. v1.8: player dashboard three-column rewrite. v1.7.2: Room Detail Overlay Start Game + drop Copy Code. v1.7.1: lobby cap label 0/8 → 0/5. v1.7: host dashboard three-column. v1.6: persistent identity. v1.5: wallet + host crystal panels. v1.4: removed "Continue Journey". v1.3: host-landing. v1.2: gym-review. v1.1: test-build lid. | Active |
| style.css | 1.7.2 | 2026-05-25 | Styling. v1.7.2: team-cap UI for Part 12E — `.pdc-team-header`, `.pdc-team-cap-hint`, `.pdc-pokemon-row.empty`, `.pdc-pokemon-row.locked` (greyed "🔒 Reach Level N"), `.pdc-poke-release`, `.pdc-poke-starter-tag`. v1.7.1: dead `.region-card.coming-soon` removed. v1.7: player three-column dashboard classes. v1.6.1: `.wl-slots-grid` repeat(5,1fr). v1.6: three-column host dashboard. v1.5: persistent-identity surfaces. v1.4: wallet + host crystal panels. v1.3: host-landing + presence. v1.2: gym-review. v1.1: `.region-card.coming-soon`. | Active |
| game.js | 1.17 | 2026-05-25 | Game logic. v1.17: **economy engine v3.3 LIVE (SPEC Part 12)** — Path B per-gym earning (settles in endGym: `baseCrystals × correct/10 + speedBonus`, then 8/9/10 badge multiplier ×1.0/1.5/2.0; ~6.7× UAT reduction confirmed). Constants: `BALL_COST` (50/150/400/1000/2500), `CATCH_RATE`, `REDEEM_BASE` (20/80/200/500/1200), `TEAM_CAP_BY_LEVEL {1:3,2:3,3:4,4:4,5:5}`, `MAX_TEAM_CAP=5`, `PITY_MISS_THRESHOLD=3`, `RELEASE_MIN/MAX_PCT`. Helpers: `playerLevelFromBadges`, `currentPlayerLevel`, `currentTeamCap`, `ballCostForRarity`, `redeemBaseForRarity`, `redeemValueFor`, `tradeInValueFor`, `xpRatioOf`, pity get/bump/reset. `buyRegionalPokeball` reads target rarity; team-cap soft-block. `pdcRenderPokemonTeam` renders all 5 slots (filled/empty/locked + release button; starters can't release). `pdcConfirmRelease` writes positive `adjustment` scaled 40→80% by xpRatio. `attemptRegionalCatch` pity-draws from R-1 catch_bank after ≥3 misses. New Pokemon born at `currentPlayerLevel()` with xp fields. Pre-game pokeballs 3→1. MULTIPLY/DOUBLE_OR_NOTHING/STEAL stripped to no-op stubs. REGIONS table: removed `pokeball`/`badgeMin`, recalibrated `speedMax`. (Earlier: v1.16.x ledger diagnostics + hardening + pause-freeze + TIME cap + Phase-2 region unlock + GAME_OVER routing; v1.15 player dashboard; v1.10 crystal-banking; v1.9 solo removed; etc.) | Active |
| questions-junior.json | 3.3 | 2026-05-23 | Junior bank (9-11), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch ≥15, pokeball=30, every R1-3 bucket ≥6. All 10 regions fully populated. | Active |
| questions-senior.json | 3.3 | 2026-05-23 | Senior bank (12-13), 729 questions: 590 source + 49 R1-3 gym topups + 90 catch topups; every region catch ≥15, pokeball=30, every R1-3 bucket ≥6. | Active |
| pokemon.json | 2.1 | 2026-05-25 | Pokemon library — v2.0 data + Part 12D economy fields (every regional entry carries `baseValue` per rarity: Basic 20 / Holo 80 / Rare 200 / Super 500 / Legendary 1200; starters `baseValue: 0`). 10 starters + 183 evolution-line regional + 18-entry `bench`. Tiers basic/holo/rare/super/legendary. `move{type,phase,description}` (6 MOVE types, rarity-pool legality). Per-entry `lineName`, `catchForm`, `evolutionChain[]`, `stages`, `battleAbility:null` (deferred), `redeemValue` (starters=0). R10 = 🇵🇭 Pilipinas (10 Filipino-mythology legendaries + 8 PH endemic fauna, `loreNote`). Tier totals 45/30/37/42/29 = 183. 18/18 validation pass. | Active |
| gengar.png | 1.1 | 2026-05-22 | Home mascot — Pikachu vs Gengar battle scene, 1024×1024 PNG. (Track-C ops: optimize to 512×512 before dress rehearsal — see BACKLOG.md.) | Active |
| MIGRATIONS.md | 1.2 | 2026-05-23 | Supabase SQL migrations. v1.2: `crystal_ledger` RLS policy block (anon insert/select/update, pre-launch posture). v1.1: persistent-identity block. v1.0: `crystal_ledger` create-table + indexes. Run blocks in order in Supabase Studio. | Active |
| CRYSTAL_QUIZ_REDESIGN_SPEC.md | v3.6 | 2026-05-25 | Design bible (DESIGN authority). v3.6: Prize Store FULLY DESIGNED (Part 13 — effort metric, 50/50 split, fixed-price tiers + spend, finish-floor, recognition honors, tier→category map, SKU framework cards-first, real-peso budget model, Pokémon TCG API build-scope, 5th TEAM PRIZE = sponsored mystery gift + shared-screen reveal, real ₱800–1,200/kid budget, TIER VOUCHER redemption w/ printable PNG+code); BOSS CRYSTALS REMOVED (Part 14 — bosses reward team prize + trophy, not crystals; leveling unaffected; gym-only economy). v3.3: Part 12 economy. v3.2: Parts 10/11 catch + rarity + R10 PH theme + cosmetic evolution. | Active |
| CLAUDE.md | 0.6.0 | 2026-05-25 | Master project doc / BUILD STATE authority. BUILD v0.6.0 (economy LIVE). Synced to SPEC v3.6. Status table tracks implemented-vs-designed. ARCHITECTURE & FILE MANAGEMENT (Track B) section added (7-category model, game.js split plan, /archive + /assets). ⚠️ flags: boss-crystal build mismatch (verify/strip); repo-path discrepancy. Backlog migrated out → BACKLOG.md. Body still describes pre-redesign build sections (later doc pass). | Active |
| BACKLOG.md | 1.0 | 2026-05-25 | **Single source of truth for pending work** (design + build + ops). The only TODO list — replaces backlog formerly scattered across SPEC + CLAUDE.md. Sections: NOW / Design / Build / Ops-Convention-prep / Watch-items / Open-flags / Verify-with-Claude-Code / Done (rolling archive). Workflow vocabulary = Tracks A/B/C (old "Phase Zero–4" retired). | Active |
| FILES.md | 1.31 | 2026-05-25 | This manifest. v1.31: archived stale files physically moved to /archive/. v1.30: added BACKLOG.md; synced SPEC v3.3→v3.6 + CLAUDE.md note; grouped Active/Archived; marked scaffolding + apply-prompts Archived. | Active |

## ARCHIVED (superseded — kept for the record; physically moved to /archive/ in v1.31)

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| archive/questions.json | 3.0 | 2026-05-22 | Archived source library (590, blueprint+bank format) — not loaded at runtime; superseded by the split junior/senior banks. **In /archive/.** | Archived |
| archive/POKEMON_LIBRARY_v2.md | 1.0 | 2026-05-24 | Roster reference for Library v2.0 (per-region tables, bench, R10 cultural notes). Scaffolding companion to SPEC Part 11 — content now lives in pokemon.json + SPEC. Retired. **In /archive/.** | Archived |
| archive/CLAUDE_CODE_PROMPT_v2_FINAL.md | 1.0 | 2026-05-24 | Apply prompt for Library v2.0 — kept for trace / future re-runs. **In /archive/.** | Archived |
| archive/CLAUDE_CODE_PROMPT_economy_engine.md | 1.0 | 2026-05-25 | Apply prompt for SPEC Part 12 economy engine — kept for trace. **In /archive/.** | Archived |
| archive/CLAUDE_CODE_PROMPT_peso_visibility.md | 1.0 | 2026-05-25 | Apply prompt for SPEC Part 12I peso-visibility split — kept for trace. **In /archive/.** | Archived |

Maintain this manifest on every file change — it's the single source of truth for what's
deployed. Tracks CURRENT versions; superseded files move to ARCHIVED but stay listed.
