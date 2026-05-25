# Crystal Quiz Challenge — BACKLOG

```
┌─────────────────────────────────────────────────────────────┐
│ THE SINGLE SOURCE OF TRUTH FOR "WHAT'S LEFT TO DO."           │
│ Last updated: 2026-05-25                                      │
│                                                              │
│ 4-HOME INFORMATION ARCHITECTURE:                             │
│  • SPEC.md   = DESIGN (what the game IS — locked mechanics)  │
│  • CLAUDE.md = BUILD STATE (what EXISTS in the code)         │
│  • BACKLOG.md (THIS) = TODO (what's LEFT — design+build+ops) │
│  • FILES.md  = MANIFEST (what files exist + versions)        │
│                                                              │
│ LIFECYCLE: a task is added HERE → as it's designed it lands  │
│ in SPEC → as it's built CLAUDE.md updates → item moves to    │
│ DONE here. One direction, no scatter. Backlog is NOT design  │
│ or build state — it's its own thing, so it has its own file. │
└─────────────────────────────────────────────────────────────┘
```

> **Workflow vocabulary — TRACKS (not "Phases").** The old CLAUDE.md "Phase Zero–4"
> build roadmap is RETIRED. Live items migrated below. The current workflow runs in
> three TRACKS:
> **Track A = Design** · **Track B = Architecture/file-mgmt** · **Track C = Sequenced build.**

> **⚠️ TRACK A — DESIGN IS COMPLETE (2026-05-25).** All design backlog items are locked
> in the SPEC. Economy (Part 12) + Prize Store/Bayanihan (Part 13) + Boss Mechanics
> (Part 14A–F) + Battle Session (Part 14G) all done. Real card sourcing replaced by
> voucher model (Part 13R — no upfront sourcing needed). The project now runs on
> **Track B (architecture)** and **Track C (build)** only.

---

## 🔵 NOW (active next)

- **Apply Claude Code prompts from today's battle session:**
  1. `CLAUDE_CODE_PROMPT_battle_session.md` — Commit 1: SPEC v3.6→v3.7 (Part 14G);
     Commit 2: pokemon.json battleAbility population (193 Pokémon). Then bump FILES.md→v1.32.
- **Track B — game.js monolith split** (5,938 lines → 7 modules via multiple `<script>`
  tags, no bundler). Its own tested commit.

---

## 🎨 DESIGN BACKLOG (deferred cosmetic/minor items — not blocking build)

1. Final 100-vs-103 roster trim (SPEC Part 10C) — cosmetic, at library polish
2. Diwata loreNote tweak — cosmetic, non-blocking
3. Combination system (star tiers combine abilities) — full pass, deferred
4. Persistence/comeback bonus (forward-only bounce-back) — deferred
5. "Most Supportive Trainer" helping milestone — deferred (relates to honors 13K)
6. Teaching-moment crystal trickle / personal-best / collection milestones — deferred
7. CONTENT: "Did You Know" + CLUE authoring pipeline (~1,458 entries, after R1–2 pilot)

---

## 🛠️ BUILD BACKLOG (pending build work → CLAUDE.md updates when done)

**🏗️ TRACK B — ARCHITECTURE / FILE REORG:**
8. game.js monolith split (5,938 lines → core/ledger/player-ui/catch/wallet/host-ui/
   gameplay via multiple `<script>` tags, no bundler). Its own tested commit.
9. Create `/assets/` tree (needed before evolution art + voucher PNGs land).
10. Update FILES.md manifest after the reorg.

**⚔️ BATTLE ENGINE (Track C — own session, builds on Part 9 + Part 14G design):**
11. 3v1 battle loop (shared boss HP bar, simultaneous questions, round structure)
12. Turn engine (parallel question streams, timer, results resolve, random villain attack)
13. Boss HP per region (R1 500 → R10 8,000; tunable constants)
14. Boss enrage abilities (trigger at 50% HP, unique per boss — 10 ability definitions)
15. Team Strike mechanic (all-correct → 3× damage; partial → normal)
16. Minimum contribution tracking (N=3 correct answers per kid per fight)
17. Battle ability firing (CRITICAL_HIT / FREEZE_STUN / HEAL / PROTECT / GUARD /
    SECOND_WIND / COMBO_TEAM_STRIKE — declared pre-answer, one per Pokémon per battle)
18. Star rating tracking (⭐⭐⭐/⭐⭐/⭐ per fight, accumulates across bosses)
19. Boss reward Pokémon offer (post-win offer UI — keep or pass, enters normal team cap)
20. Legendary gate at R10 (pre-fight check: every kid must field a Legendary)
21. Papa override tool (host dashboard — gift Legendary if kid is short at R10)
22. In-game Legendary reminders (end of R5/R7/R8 — player notification + host dashboard)
23. Boss-crystal strip (verify/remove any boss crystal award logic from v0.6.0 build)

**🎁 PRIZE STORE BUILD (design COMPLETE in SPEC Part 13):**
24. 5-tier store + effort/voucher mechanics
25. Tier VOUCHER system (crystal→voucher purchase, printable PNG + unique code,
    redeem-and-burn, host code-verify — SPEC 13R)
26. Team-pool live host-dashboard sync; kids progress bar during play
27. Effort-normalizer definitions ("measured gym" / "opportunity") — pin at build

**🏆 PRIZE SCREEN / GAME_OVER PODIUM:**
28. Final-results screen after R10 clear (crystal summary, unused-Pokémon level bonus,
    team-prize reveal SPEC 13P, recognition honors SPEC 13K)

**🟣 EVOLUTION BUILD-OUT (cosmetic A1 — SPEC Principle 10):**
29. Stage art per line (3-stage lines = 3 sprites each) — biggest asset cost
30. Catch-screen evolution preview ("Charmander → ✨Charizard")
31. game.js: render owned creature's stage by player level; per-kid re-render

**🔴 STRUCTURAL — own session:**
32. TIME TRAVEL — reopening completed gyms cascades into badge recalc, re-gating,
    ledger reopen, anti-farm guard, multiplayer sync. Most complex build.

**✨ POLISH:**
33. Animations, sound, leaderboard polish

---

## 🎪 OPS / CONVENTION PREP (before live event)

34. Delete all test rows from `player_saves`, `rooms`, `crystal_ledger` in Supabase
35. Optimize `gengar.png` (512×512, ~350 KB)
36. Full dress rehearsal with real kids
37. Tag `v1.0.0`
38. Supabase data backup before the convention
39. Consider test/live ENV separation

---

## 🟡 WATCH-ITEMS (locked, monitor in playtest)

- Post-gym rescue coverage gap: EXTRA SHOT/TIME TRAVEL on Rare+ only — low-level kids
  can't field a post-gym rescue. Watch for frustration.
- Draft pacing / host complexity: turn-order, whose-turn UI, pass handling, soft timer.
- R7 legendaries = 3 (intentional on-ramp; watch for frustration).
- Crystal gap: without boss crystals strong-vs-struggling gap ~3× — FINE for prizes
  (effort-gated); if Pokémon ladder feels tight, raise GYM earn-rates (NOT boss crystals).
- Battle tuning: boss HP + damage knob (35/hit) + N=3 threshold all need playtest
  validation. Lowest-level kid vs matched enemy is the critical test case.
- Foul Play (Vullaby R4 enrage): targets lowest HP kid — watch if this feels unfair
  in practice; can swap to random target if needed.
- RE-ENTRY / RECONNECT paths (found at pre-game catch, fixed v1.21.1): a kid
  refreshing or rejoining mid-game could land back on a phase screen they'd
  already completed (pre-game catch trapped them with team + 0 balls). Fixed for
  pre-game; AUDIT the other phase screens (gym, regional catch, boss fight) for
  the same re-entry pattern during UAT — confirm reconnect always routes to the
  correct CURRENT state, never a completed one.
- ABILITY ECONOMY (v1.22): code now matches SPEC v3 appreciating-asset model
  (was still running dead v2 consume-on-use). Watch at UAT: does HP growth feel
  rewarding? Is +band/10 per use noticeable? Is one-use-per-gym too slow vs the
  Part 8 curve (which assumed ~3/gym)? Removing the per-gym limit is the lever.
- CATCH-BETWEEN-GYMS (v1.22): more catches/region than the region-end economy
  assumed (up to 5 catch screens/region vs 1). Watch ball economy + team-fill
  speed + strong/struggling gap at UAT.
- Pre-game catch + regional catch both build `newPokemon` — confirm BOTH stamp
  `hp` via `computeHp` (v1.22 Change 3G) so no Pokémon has undefined HP in battle.

---

## ⚠️ OPEN FLAGS (resolve, don't lose)

- **Boss-crystal mismatch:** v0.6.0 may still award boss crystals that v3.6 design
  REMOVED. Verify + strip at battle engine build (item 23 above).
- **SPEC Part 13 subsection lettering** out of order (13I,K,L,M,N,O,P,Q,R, then J
  last) — renumber at consolidated SPEC cleanup, not piecemeal.

---

## ⏳ VERIFY WITH CLAUDE CODE (status unconfirmed)

- Library v2.0 push — confirm landed + validation report (counts, dups, legality)
- v0.6.0 economy build — confirm catch-flow shipped vs old flow; confirm ~7×
  earn-reduction validation (strong kid ~₱166 by R6, not UAT ₱1,184)

---

## ✅ DONE (rolling archive)

**Track A — DESIGN COMPLETE (2026-05-25):**
- Battle Session FULLY DESIGNED (SPEC Part 14G v3.7): boss/villain casting (Darkrai
  Big Boss R3/R7/R10; 9 minor villains from bench); boss reward Pokémon (one per fight,
  keep-or-release, normal team cap, uniqueness exception); battle structure (3v1 shared
  HP bar, simultaneous, N=3 min contribution, Team Strike 3×); turn structure
  (simultaneous + random villain attack); boss HP (R1 500→R10 8,000; tune at playtest);
  boss enrage abilities (50% HP trigger, unique per boss, Darkrai Nightmare); BATTLE-
  ability population (193 Pokémon, thematic assignment, 7 abilities); ALLY = battle-only;
  star rating (⭐⭐⭐/⭐⭐/⭐); R10 Legendary gate + Papa override; reminders R5/R7/R8.
- Real card sourcing → REPLACED by voucher model (SPEC 13R) — no sourcing needed.

**Information architecture cleanup (2026-05-25):**
- 4-home model live on GitHub (BACKLOG.md created; SPEC/CLAUDE/FILES reconciled)
- Stale files archived to /archive/ (questions.json, POKEMON_LIBRARY_v2.md,
  3× CLAUDE_CODE_PROMPT_*.md); FILES.md→v1.31
- Repo path confirmed: `~/dev/Crystal-Quiz-Challenge` (not Desktop)

**v3.6 prize/economy arc (2026-05-25):**
- Prize Store FULLY DESIGNED (SPEC Part 13): effort metric, 50/50 split, fixed-price
  tiers, finish-floor, honors, tier→category map, SKU framework, real-peso budget,
  API build-scope, TEAM PRIZE (sponsored mystery gift + shared-screen reveal),
  ₱800–1,200/kid budget (Floor 15/Bronze 50/Silver 250/Gold 600), TIER VOUCHER
  (printable PNG + unique code).
- Boss crystals REMOVED (SPEC Part 14) — bosses reward team prize + trophy, not
  crystals; gym-only economy verified affordable.

**v3.3 economy (2026-05-25):**
- Path B per-gym earning, rarity pokeball ladder, redeem/trade-in values, cap growth
  3→4→5, pity softener, lifetime-wallet persistence, peso hidden from players. BUILT @ v0.6.0.

**Historical (old Phase Zero–2, retired):**
- Docs + question library + full Pokémon library + validation.
- Engine vertical slice; all 10 regions playable; R10 clear → GAME_OVER + auto-archive.
- Multiplayer core, rooms, ledger, dashboards, rejoin — LIVE.
