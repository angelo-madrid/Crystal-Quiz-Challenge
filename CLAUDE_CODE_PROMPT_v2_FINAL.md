# Claude Code — Commit & Push Crystal Quiz v3.2 / Library v2.0

## ATTACHED FILES (4) — use these PREPARED files as-is
1. **CRYSTAL_QUIZ_REDESIGN_SPEC.md** — design bible, DESIGN VERSION v3.2. Has a
   version header + "Document Hygiene" section. Drop in as the repo's spec.
2. **CLAUDE.md** — the REAL repo CLAUDE.md with a version/sync header already
   grafted on (BUILD v0.5.0 · SYNCED TO SPEC: pre-v3) + an implemented-vs-designed
   table. REPLACE the repo's CLAUDE.md with this file as-is. Do NOT hand-edit or
   regenerate it — the header work is intentional.
3. **pokemon_v2_final.json** — STAGING data (version 2.0, last_updated set). Its
   183 lines get transformed INTO the repo's existing `pokemon.json` (keep that
   canonical name — do NOT add a new file).
4. **This prompt.**

## CRITICAL — FILENAME RULE
Repo files keep CANONICAL names: `CLAUDE.md`, `CRYSTAL_QUIZ_REDESIGN_SPEC.md`,
`pokemon.json`. NEVER rename with versions/dates — version/date lives INSIDE each
file (headers) + git history. (pokemon_v2_final.json is a staging package; its
DATA goes into `pokemon.json`; the staging file is not committed under that name.)

## GOAL — TWO commits, then push on my confirmation
Start: `git pull`. Show diffs + validation report; wait for my OK before pushing.
DATA/DOCS ONLY — do NOT modify game.js this pass.

---

## COMMIT 1 — DOCS (do first; low risk)
- Replace repo `CRYSTAL_QUIZ_REDESIGN_SPEC.md` with the attached (v3.2). Preserve
  its version header + Document Hygiene section verbatim.
- Replace repo `CLAUDE.md` with the attached (grafted header version). Preserve
  the header block + status table. The body intentionally still describes the
  CURRENT pre-redesign build — that's correct; do NOT rewrite those body sections
  to the redesign (the redesign isn't built yet).
- Add `POKEMON_LIBRARY_v2.md` (roster reference) + this prompt to the repo (design
  trace). Match existing folder convention.

Commit 1 message:
`docs: spec v3.2 (catch mechanics, evolution, hygiene+versioning) + CLAUDE.md sync header + library reference`

---

## COMMIT 2 — APPLY LIBRARY v2.0 -> pokemon.json
Read SPEC Part 10-11 first. Transform the repo's `pokemon.json`:

- `version`: "1.1" -> "2.0"; add `last_updated: "2026-05-24"`.
- **rarity rename**: old `common` -> `basic`; ADD `holo`; rare/super/legendary
  unchanged.
- **REMOVE `abilityEffect`** everywhere (STEAL/MULTIPLY/DOUBLE_OR_NOTHING/FREEZE
  are CUT). NO crystal references in any text.
- **REPLACE `regional`** with the 183 lines from pokemon_v2_final.json.
- **NEW per-line fields** (already present): `lineName`, `catchForm`,
  `evolutionChain[]`, `stages`, `move`{type,phase,description}, `battleAbility`
  (null), `redeemValue` (null), `loreNote` (R10 only).
- **starters**: KEEP the existing 10; drop `abilityEffect`; add `move` per mapping
  below; keep emoji/type; `battleAbility:null`, `redeemValue:0`.
- **bench**: add `bench_displaced` (18) as a SEPARATE top-level `bench` section —
  NOT catchable, NOT in `regional`. (Future boss-pool candidates.)

### Emoji/type fill (only generative step)
New lines have `emoji:null`,`type:null`. If the species existed in OLD
pokemon.json -> reuse its emoji/type. Else (most commons, pseudo-legendary bases,
ALL Region 10 PH creatures) -> assign fitting emoji + type. REPORT all assignments.

### Region 10 = PILIPINAS (Philippine) — preserve, don't substitute
10 Filipino-mythology legendaries (Bakunawa, Minokawa, Sarimanok, Maria Makiling,
Maria Sinukuan, Tikbalang, Sarangay, Diwata, Bathala, Mayari) + 8 real PH endemic
fauna (Philippine Eagle, Tamaraw, Philippine Crocodile, Carabao, Visayan Warty
Pig, Cloud Rat, Philippine Tarsier, Palawan Peacock-Pheasant). Keep `loreNote`.

### Starter MOVE mapping
Pikachu->ELIMINATE (L3+ dormant til player L3 — flag or fallback CLOCK),
Charmander->CLOCK, Squirtle->SWAP, Bulbasaur->CLUE, Eevee->SWAP, Gengar->CLUE,
Snorlax->CLOCK, Alakazam->CLUE, Dratini->CLOCK, Jigglypuff->CLOCK.

### Move legality (re-verify)
Basic: CLUE/CLOCK · Holo: CLOCK/SWAP · Rare: SWAP/EXTRA_SHOT/ELIMINATE ·
Super: EXTRA_SHOT/TIME_TRAVEL/ELIMINATE · Legendary: TIME_TRAVEL/ELIMINATE.
ELIMINATE never Basic/Holo; TIME_TRAVEL never below Super.

### After applying, flip CLAUDE.md status
In CLAUDE.md's status table, change the "Pokemon library v2.0" row from in-progress
to LIVE, and bump the header `SYNCED TO SPEC: pre-v3` -> `v3.2` (library now
matches the spec). Update FILES.md. Leave other rows as designed/not-built.

### Validate & REPORT (don't skip)
1. Regional = 183; per-region (R3=19, R5=20, others 18); tiers 45/30/37/42/29.
2. Every species in exactly ONE evolutionChain (no cross-line dups).
3. No `abilityEffect`; zero crystal references.
4. Move legality holds.
5. battleAbility:null + redeemValue:null everywhere (starters redeemValue:0).
6. Legendaries R7(3) R8(7) R9(9) R10(10), all single-stage.
7. `bench` = 18, separate from regional.
8. List every emoji/type assigned (esp. R10 PH creatures).

Commit 2 message:
`feat(library): apply v2.0 — 183 evolution-line roster, shared-exclusive pool, PH-themed R10, tier rename, cut-mechanic sweep, MOVE pairing, bench + deferred fields (SPEC Part 10-11)`

---

## PUSH
After BOTH commits + the report: show diff summaries, push on my confirmation.
No force-push. If anything fails validation, STOP and report — don't push partial.
