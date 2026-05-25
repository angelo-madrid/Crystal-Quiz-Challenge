# Crystal Quiz Challenge — File Manifest
Manifest version: 1.36
Last updated: 2026-05-25

> **4-HOME INFORMATION ARCHITECTURE** (see BACKLOG.md header for the full rule):
> SPEC.md = DESIGN · CLAUDE.md = BUILD STATE · BACKLOG.md = TODO · FILES.md (this) = MANIFEST.
> This manifest tracks the CURRENT version of every file. Superseded files move to the
> ARCHIVED section below but stay documented (history is never deleted from the record).
> v1.36: battle engine Commit 4 — game.js v1.21 (kid-managed round flow,
> readyForNext + battleReadyUp; COMBO_TEAM_STRIKE armed between rounds via
> battleArmTeamStrike; host watch-only after Round 1 + hostBattleForceNextRound),
> index.html v1.8.6 (Next Round button removed — Ready button now rendered in
> summary), style.css v1.7.6 (between-round summary styles — enrage warning,
> Team Strike arm, ready states).
> v1.35: battle engine Commit 3 — game.js v1.20 (6 battle abilities + R10 Legendary
> gate + Papa override + R5/R7/R8 reminders + dead Commit-1 controls neutralised),
> index.html v1.8.5 (battle ability bar + dead Team Strike / Start Round buttons
> stripped), style.css v1.7.5 (ability bar + Legendary gate overlay + Papa override
> button styles).
> v1.32: SPEC bumped v3.6→v3.7 (Part 14G battle session fully locked); pokemon.json
> bumped v2.1→v2.2 (battleAbility populated for all 193 starters+regional); BACKLOG.md
> bumped v1.0→v1.1 (Track A marked complete; battle engine build items added; card
> sourcing removed — replaced by voucher model); CLAUDE.md bumped to reflect v3.7 sync.

## ACTIVE

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| index.html | 1.8.6 | 2026-05-25 | All game screens. v1.8.6: removed dead Next Round button — the Ready button now renders inside `#battle-round-result-text` (built by `_battleShowRoundSummary`). v1.8.5: `#battle-ability-bar` div added before question area; dead Team Strike / Start Round buttons stripped from `#battle-controls` (kid Team Strike moves to between-round screen in Commit 4). v1.8.4: col3-battle-panel div added to host Column 3. v1.8.3: screen-battle shell added (Commit 1 scaffold). v1.8.2: peso removed from player UI; pre-game pokeball copy "3 Pokeball(s)" → "1 Pokeball". v1.8.1: mascot alt text + Region 10 Game Complete screen. v1.8: player dashboard three-column rewrite. v1.7.2: Room Detail Overlay Start Game + drop Copy Code. v1.7.1: lobby cap label 0/8 → 0/5. v1.7: host dashboard three-column. v1.6: persistent identity. v1.5: wallet + host crystal panels. v1.4: removed "Continue Journey". v1.3: host-landing. v1.2: gym-review. v1.1: test-build lid. | Active |
| style.css | 1.7.6 | 2026-05-25 | Styling. v1.7.6: between-round summary styles — `.battle-enrage-warn`, `.battle-ts-armed`, `.battle-ts-arm-btn`, `.battle-ts-hint`, `.battle-ready-waiting`; host battle live/ready states (`.host-battle-live`, `.host-battle-ready-status`). v1.7.5: `.battle-ability-bar` + `.battle-ability-btn` (declared-state, locked-out, lockdown notice); `.battle-legendary-gate-overlay` + `.battle-legendary-gate-card`; `.host-battle-override-btn` + `.host-battle-override-granted`. v1.7.4: host battle panel styles — `.host-battle-hp-row`, `.host-battle-player` (`.not-ready`, `.fainted` variants). v1.7.3: battle screen CSS scaffold (Commit 1). v1.7.2: team-cap UI for Part 12E. v1.7.1: dead `.region-card.coming-soon` removed. v1.7: player three-column dashboard classes. v1.6.1: `.wl-slots-grid` repeat(5,1fr). v1.6: three-column host dashboard. v1.5: persistent-identity surfaces. v1.4: wallet + host crystal panels. v1.3: host-landing + presence. v1.2: gym-review. v1.1: `.region-card.coming-soon`. | Active |
| game.js | 1.21 | 2026-05-25 | Game logic. v1.21: Kid-managed round flow (SPEC 14G-3) — Papa starts Round 1 only; rounds auto-chain when last active kid taps Ready (`battleReadyUp` + `bs.readyForNext`); between-round summary reworked with enrage warning + Ready count. COMBO_TEAM_STRIKE armed on summary (`battleArmTeamStrike` → `bs.teamStrikeDeclared` for next round); Order's Wrath (R7) blocks it. Host panel watch-only after Round 1 + `hostBattleForceNextRound` disconnect fallback. v1.20: Battle Commit 3 — 6 battle abilities declared pre-answer (CRITICAL_HIT / FREEZE_STUN / HEAL / PROTECT / GUARD / SECOND_WIND) via `_battleRenderAbilityBar` + `battleDeclareAbility`; per-player `abilitiesUsed[]` + `pendingAbility` + `pendingAbilityPoke`; ability effects applied in `_battleResolveRound` (CRIT 2× hit, HEAL 40% maxHp, SECOND_WIND revive at 50%, FREEZE_STUN cancels boss attack, PROTECT self-immune, GUARD ally redirect); R10 Legendary gate (`_playerHasLegendary`, `_battleLegendaryOverrideGranted`, `_battleShowLegendaryGate`) + Papa override (`hostGrantLegendary` stamps `room.battleState.legendaryOverride[pid]=10`, surfaced via override button in host battle panel); R5/R7/R8 reminder nudges in `finishRegionalCatch` (`_maybeShowLegendaryReminder` idempotent via `save.legendaryRemindersSeen`); `showToast` accepts optional duration; dead Commit-1 controls neutralised. v1.19: Full battle loop. v1.18: Battle engine scaffold. v1.17: economy engine v3.3 LIVE (SPEC Part 12). | Active |
| questions-junior.json | 3.3 | 2026-05-23 | Junior bank (9-11), 729 questions. | Active |
| questions-senior.json | 3.3 | 2026-05-23 | Senior bank (12-13), 729 questions. | Active |
| pokemon.json | 2.2 | 2026-05-25 | Pokémon library. v2.2: battleAbility populated for all 193 starters+regional (Part 14G thematic assignment — CRITICAL_HIT/FREEZE_STUN/HEAL/PROTECT/GUARD/SECOND_WIND/COMBO_TEAM_STRIKE). v2.1: Part 12D economy fields (baseValue per rarity). v2.0: 183 evolution-line regional + 10 starters + 18 bench. R10 = 🇵🇭 Pilipinas. Bench battleAbility stays null (boss creatures — separate stat block at battle engine build). | Active |
| gengar.png | 1.1 | 2026-05-22 | Home mascot — Pikachu vs Gengar battle scene, 1024×1024 PNG. (Track-C ops: optimize to 512×512 before dress rehearsal.) | Active |
| MIGRATIONS.md | 1.2 | 2026-05-23 | Supabase SQL migrations. v1.2: `crystal_ledger` RLS policy. v1.1: persistent-identity. v1.0: create-table + indexes. | Active |
| CRYSTAL_QUIZ_REDESIGN_SPEC.md | v3.7 | 2026-05-25 | Design bible (DESIGN authority). v3.7: Part 14G BATTLE SESSION fully locked — boss/villain casting (Darkrai Big Boss R3/R7/R10; 9 minor villains from bench); boss reward Pokémon (one per fight, keep-or-release, normal team cap, uniqueness exception); battle structure (3v1 shared HP bar, simultaneous, N=3 min contribution, Team Strike 3×); turn structure (simultaneous + random villain attack); boss HP (R1 500→R10 8,000); boss enrage abilities (50% HP trigger, unique per boss, Darkrai Nightmare); BATTLE-ability population (193 Pokémon, thematic); ALLY = battle-only; star rating (⭐⭐⭐/⭐⭐/⭐); R10 Legendary gate + Papa override; reminders R5/R7/R8. v3.6: Prize Store + boss crystals removed. v3.3: economy. v3.2: catch mechanics + PH R10. | Active |
| CLAUDE.md | 0.6.0 | 2026-05-25 | Master project doc / BUILD STATE authority. Synced to SPEC v3.7. Track A design COMPLETE. Battle engine (Part 14G) designed, not yet built. ⚠️ Boss-crystal build mismatch (verify/strip). Architecture & file management (Track B) plan in place. | Active |
| BACKLOG.md | 1.1 | 2026-05-25 | Single source of truth for pending work. v1.1: Track A marked COMPLETE; battle engine build items added (13 tasks); card sourcing removed (replaced by voucher model); repo path flag resolved; watch-items updated with battle tuning notes. | Active |
| FILES.md | 1.36 | 2026-05-25 | This manifest. v1.36: battle engine Commit 4 — game.js v1.21 (kid-managed round flow + Team Strike between rounds), index.html v1.8.6 (Next Round button removed), style.css v1.7.6 (summary screen styles). v1.35: battle engine Commit 3 — game.js v1.20 (6 battle abilities + Legendary gate + reminders), index.html v1.8.5 (ability bar + dead controls removed), style.css v1.7.5 (ability bar + gate styles). v1.34: battle engine Commit 2 — game.js v1.19 (full battle loop + host panel), index.html v1.8.4 (col3-battle-panel div), style.css v1.7.4 (host battle styles). v1.33: battle engine Commit 1 scaffold. v1.32: SPEC v3.7, pokemon.json v2.2, BACKLOG.md v1.1, CLAUDE.md sync note. | Active |

## ARCHIVED (superseded — physical location: /archive/)

| File | Version | Last Updated | Purpose | Status |
|------|---------|--------------|---------|--------|
| questions.json | 3.0 | 2026-05-22 | Archived source library (590, blueprint+bank format) — superseded by split junior/senior banks. | Archived |
| POKEMON_LIBRARY_v2.md | 1.0 | 2026-05-24 | Roster reference for Library v2.0 — content now lives in pokemon.json + SPEC. Retired. | Archived |
| CLAUDE_CODE_PROMPT_v2_FINAL.md | 1.0 | 2026-05-24 | Apply prompt for Library v2.0 — kept for trace. | Archived |
| CLAUDE_CODE_PROMPT_economy_engine.md | 1.0 | 2026-05-25 | Apply prompt for SPEC Part 12 economy engine — kept for trace. | Archived |
| CLAUDE_CODE_PROMPT_peso_visibility.md | 1.0 | 2026-05-25 | Apply prompt for SPEC Part 12I peso-visibility split — kept for trace. | Archived |

Maintain this manifest on every file change — it's the single source of truth for what's
deployed. Tracks CURRENT versions; superseded files move to ARCHIVED but stay listed.
