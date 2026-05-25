# Claude Code Prompt — Economy Engine (SPEC v3.3, Part 12)

**Scope:** LARGE engine pass. Implements the locked economy in `game.js` (+ minor
`pokemon.json` fields). This is the build that catches the engine up to design v3.3.
Do it as ONE focused pass; do NOT also attempt evolution/battle/time-travel here.

**Design source:** `CRYSTAL_QUIZ_REDESIGN_SPEC.md` v3.3 — PART 12 (all subsections),
with Part 1 (badge bonus), Part 2 (speed), Part 4 (player-level gate), Part 11
(catch principles). The SPEC is authoritative — if this prompt and the SPEC ever
disagree, TRUST THE SPEC and flag the discrepancy.

---

## START-OF-SESSION RITUAL
1. `git pull` first. 2. Confirm repo is on local disk (not a cloud-sync folder).
3. Re-read SPEC Part 12 end-to-end before writing code. 4. Note: this is the engine
   wiring the v3.3 header in CLAUDE.md says is "the next build pass."

---

## A. EARNING — Path B (per-gym, accuracy-driven) — Part 12B
Replace the per-question crystal award with a per-gym settlement.
- **Remove** the per-correct-answer award in `showQuestionResult()` / `checkAnswer`
  (currently `STATE.save.total_crystals += earned` on every correct answer ~line 2953).
- At GYM END compute once:
  `earned = round(baseCrystals × (correct/10)) + speedBonus`, then apply badge
  multiplier if passed: 8/10 ×1.0 · 9/10 ×1.5 · 10/10 ×2.0 (Part 1).
- `speedBonus` capped at 20% of baseCrystals (Part 2); correct answers only; keep the
  existing TIME-ability cap (originalTimeLimit). Write ONE `earn` ledger row per gym.
- OPTIONAL: keep a DISPLAY-ONLY "+💎" per correct answer for feel-good feedback, but it
  must NOT mutate the balance — real crystals settle only at gym end.
- **Validation target:** a strong kid (mostly 9–10/10) should reach ~₱166 (≈16,575💎)
  by end of R6, NOT the ~₱1,184 seen in the UAT ledger. ~7× reduction = success.

## B. POKEBALL LADDER — rarity-based — Part 12C
- Replace the region-based `pokeball` cost (REGIONS table, R1 300 … R10 10000) with
  a rarity-based ladder: Basic 50 · Holo 150 · Rare 400 · Super 1000 · Legendary 2500.
- Catch-question difficulty/rate by tier (target rates, for catch-Q bank selection):
  Basic ~85% · Holo ~80% · Rare ~70% · Super ~60% · Legendary ~50%.
- Cost is read from the TARGET pokemon's rarity, not the region.

## C. REDEEM VALUE — Part 12D
- `redeemValue = baseValue × (1 + xpRatio × 0.5)` (fully grown = base × 1.5),
  xpRatio ∈ [0,1] from accumulated XP.
- baseValue per rarity: Basic 20 · Holo 80 · Rare 200 · Super 500 · Legendary 1200.
- Starter redeemValue = 0 (hard rule). Store `baseValue` on each pokemon in
  `pokemon.json` per its rarity (currently unused field — populate it).

## D. TRADE-IN ON RELEASE — Part 12F
- Release returns 40% of ball cost (ungrown) → up to 80% (fully grown), scaled by
  xpRatio. NEVER exceeds the ball cost (no farm exploit). Write the trade-in as a
  positive ledger row; confirm-on-release guard already exists — keep it.
- RELEASED = GONE FOREVER from the room's shared pool (Part 11 P7) — keep/honor.

## E. TEAM CAP GROWS 3→4→5 — Part 12E
- Cap by player level: L1–L2 = 3, L3–L4 = 4, L5 = 5.
- Always render 5 slots; lock future ones greyed "🔒 Reach Level 3" / "🔒 Reach
  Level 5" (reuse the existing locked-goal UI pattern).
- Catch is bounded by the current cap; exceeding requires a release.

## F. PITY SOFTENER — Part 12G
- Track consecutive misses per (player, target pokemon). After 3 in a row, the NEXT
  catch-question for that pokemon draws one tier easier. Reset the counter on catch
  or on switching target.

## G. PERSISTENCE / PAYOUT — Part 12I
- Keep the lifetime wallet (canonical `player_saves.data.total_crystals`, per Trainer
  ID) — NO per-game reset.
- Crystals are redeem-and-burn via the (future) Prize Store only. NO peso cash-out.
  Do NOT build the Prize Store here (separate pass) — but do NOT add any new cash-out
  path either. Leave the existing `redeem_request` ledger flow intact for the store to
  reuse later.
- (Peso player/host visibility is handled by the separate peso-visibility prompt — if
  not yet merged, coordinate so you don't conflict.)

## H. REMOVE SUPERSEDED CODE/DATA — Part 12C note + KEY BUILD FLAGS
- Dead `TIER_BASE` / `TIER_SPEED_MAX` constants (~lines 327–328).
- `MULTIPLY` and `DOUBLE_OR_NOTHING` crystal logic (the ×2 / ×value blocks in the
  answer handler, ~line 2946+) and their ability hooks — CUT per SPEC.
- `STEAL` mechanic (ledger showed "Stole N" / "Stolen by" rows) — CUT.
- region-based `pokeball` field (replaced in B); `badgeMin` per region (superseded by
  the 8/10 accuracy badge — Part 1); starting `pokeballs: 3` → 1 free (Part 11 P8).
- Old 3/5 region-level trigger + old Part 4 badge-threshold gating, IF present.

## VERIFY before commit
- Earning validation target (A) hits ~7× reduction vs UAT.
- A full mock playthrough: catch costs read by rarity; cap unlocks at L3 and L5 with
  greyed future slots before that; release returns scaled trade-in; pity softener
  fires after 3 misses; no MULTIPLY/DoN/STEAL anywhere; no peso cash-out path.
- No console errors; ledger rows still write (earn per gym, trade-in on release).
- Old saves degrade gracefully (additive fields; guard missing `baseValue`/xp).

## END-OF-SESSION RITUAL
- Stage intentionally, commit, push.
- Suggested commit: `feat(economy): implement v3.3 economy engine (Part 12) — per-gym
  earning, rarity ball/redeem/trade-in, cap growth, pity softener; remove MULTIPLY/
  DoN/STEAL + dead tier consts`
- Advance CLAUDE.md BUILD VERSION (e.g. v0.5.0 → v0.6.0) and flip the Part 12 status
  rows from "⬜ designed v3.3" to "✅ LIVE". Keep "Synced to SPEC: v3.3".
- If `git pull` surfaced conflicts at start: STOP and ask the user — never auto-merge.
