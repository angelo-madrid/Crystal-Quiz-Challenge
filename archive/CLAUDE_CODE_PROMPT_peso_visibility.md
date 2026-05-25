# Claude Code Prompt — Hide Peso from Player UI (keep on Host UI)

**Scope:** small, self-contained UI change. Safe to ship independently of the
larger economy rewrite. Touches `index.html` + `game.js` only. No data/schema change.

**Design source:** SPEC v3.3, Part 12I ("PESO VISIBILITY — split, LOCKED").

---

## START-OF-SESSION RITUAL
1. `git pull` first (multi-machine repo — never skip).
2. Confirm repo is on local disk (NOT iCloud/Dropbox/Drive).
3. Open `CRYSTAL_QUIZ_REDESIGN_SPEC.md` → read Part 12I to confirm the rule before editing.

---

## THE RULE
Kids must NEVER see a peso figure (crystals are arcade tickets — no money framing).
Papa (host) keeps a private peso readout to price prizes against real-world value.

## DO — remove peso from PLAYER UI

**`game.js`:**
- In `pdcRenderCol2Wallet()` (~line 1185): delete the line that sets
  `document.getElementById('pdc-peso').textContent = (balance / 100).toFixed(2);`
- In the player Crystal Wallet renderer (~lines 2501 & 2505): delete the
  `const peso = (balance / 100).toFixed(2);` calc AND the line that sets
  `document.getElementById('wallet-peso').textContent = peso;`

**`index.html`:**
- Remove the `id="pdc-peso"` element and its surrounding `≈ ₱` label/wrapper
  (player dashboard Column 2 wallet block) so no empty "≈ ₱" label lingers.
- Remove the `id="wallet-peso"` element and its `≈ ₱` label (player Crystal
  Wallet screen).

## DO NOT TOUCH — host UI keeps peso
Leave all of these exactly as-is (they're Papa's prize-pricing readout):
- `col2AccountCard()` `ac-peso` (~line 4535) — host account-list cards
- host pending-redeem peso display (~line 4569)
- `lm-peso` host ledger modal (~line 5101)
- `hrq-peso` host redeem queue (~line 5469)

## VERIFY before commit
- Load the player dashboard + player Crystal Wallet → NO peso shown anywhere, and
  no stray "≈ ₱" label with a blank value.
- Load the host dashboard → peso STILL shows on account cards, ledger modal, and
  redeem queue.
- No console errors (the removed `getElementById` calls must have their elements
  removed too, or guarded).

## END-OF-SESSION RITUAL
- Stage intentionally, commit, push.
- Suggested commit message:
  `feat(ui): hide peso from player UI, keep host-side (SPEC v3.3 Part 12I)`
- This change does NOT advance BUILD VERSION (cosmetic UI). Leave CLAUDE.md's
  "Synced to SPEC: v3.3" as set this design session.
