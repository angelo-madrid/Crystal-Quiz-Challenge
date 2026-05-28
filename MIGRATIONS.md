# Supabase Migrations

Run these in **Supabase Studio → SQL Editor** before deploying the matching
feature. They're additive and idempotent (`IF NOT EXISTS`).

---

## 2026-05-22 — player identity system — clean slate + schema additions

Drops all pre-launch test data and re-shapes `player_saves` to enforce
the new persistent-identity model (6-char alphanumeric IDs chosen by
the player on registration, with name/age/gender row columns).

```sql
-- Clean slate (pre-launch test data only)
delete from crystal_ledger;
delete from rooms;
delete from player_saves;

-- New identity columns on player_saves
alter table player_saves
  add column if not exists name       text       not null default '',
  add column if not exists age        integer    not null default 0,
  add column if not exists gender     text       not null default '',
  add column if not exists created_at timestamptz default now();

-- Enforce: player_id must be exactly 6 uppercase alphanumerics
alter table player_saves
  add constraint player_id_format
  check (player_id ~ '^[A-Z0-9]{6}$');
```

> Run the DELETEs first; the CHECK constraint would otherwise reject the
> existing rows (which use the legacy `XX-NNNN` format).

---

## 2026-05-22 — `crystal_ledger` (crystal banking layer)

```sql
-- ─── Crystal ledger ──────────────────────────────────────────────
create table if not exists crystal_ledger (
  id          uuid        primary key default gen_random_uuid(),
  player_id   text        not null,             -- references player_saves.player_id
  room_code   text,                              -- null for host manual awards
  type        text        not null
              check (type in ('earn','bonus','redeem_request','adjustment')),
  amount      integer     not null,              -- positive = credit, negative = debit
  status      text        not null default 'approved'
              check (status in ('approved','pending','declined','modified')),
  note        text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- Hot indexes
create index if not exists idx_crystal_ledger_player_recent
  on crystal_ledger (player_id, created_at desc);

create index if not exists idx_crystal_ledger_pending
  on crystal_ledger (created_at desc)
  where status = 'pending';
```

### Canonical balance rule

`player_saves.data.total_crystals` is the authoritative balance.
The runtime updates it **only** when a ledger entry reaches
`status='approved'` or `status='modified'`. Pending and declined entries
never mutate the balance. The ledger therefore reconstructs the balance:

```
balance(player) = sum(entry.amount
                       for entry in crystal_ledger
                       where entry.player_id = player.id
                         and entry.status in ('approved','modified'))
```

### Identity note

The `player_id` column in `crystal_ledger` is a plain text FK by
convention — there's no separate `player_accounts` table in this
project. The canonical row for a player lives in `player_saves`
(`player_id` text primary key). If a dedicated accounts table is ever
introduced, retarget the FK with an `ALTER TABLE`.

---

## 2026-05-23 — `crystal_ledger` RLS policies (if writes are silently empty)

**Symptom**: every insert in the browser console logs `[LEDGER WRITE
FAILED]` with `permission denied for table crystal_ledger`, and the
Table Editor shows zero rows even after the game has been played.

**Cause**: Supabase enables Row-Level Security by default on every
new table but creates **no policies** — the `anon` key the browser
uses then can't INSERT or SELECT anything.

**Fix** (run once in SQL Editor — open to anon for this pre-launch
project, same posture as `player_saves` and `rooms`):

```sql
-- Enable RLS if it isn't already (idempotent).
alter table crystal_ledger enable row level security;

-- Open INSERT to anon (the game writes ledger rows from the browser).
drop policy if exists "anon can insert ledger rows" on crystal_ledger;
create policy "anon can insert ledger rows"
  on crystal_ledger for insert
  to anon
  with check (true);

-- Open SELECT to anon (host dashboard + player wallet both read).
drop policy if exists "anon can read ledger rows" on crystal_ledger;
create policy "anon can read ledger rows"
  on crystal_ledger for select
  to anon
  using (true);

-- Open UPDATE to anon (host approves / declines / modifies pending rows).
drop policy if exists "anon can update ledger rows" on crystal_ledger;
create policy "anon can update ledger rows"
  on crystal_ledger for update
  to anon
  using (true)
  with check (true);
```

Pre-launch convention is "anon can do anything" since the only client
is the kid's browser and there's no auth tier. Tighten this before
public release if the threat model changes.

---

## 2026-05-26 — atomic battle answer write (v1.31.4, Bug #10 REAL fix)

**Why this exists.** Bug #10 (the multiplayer boss-fight hang) was caused
by concurrent kids writing to `rooms.data.battleState.playerStates` from
their browsers. Last-write-wins on the JSONB blob meant a near-simultaneous
answer from a teammate clobbered the first kid's `answeredThisRound`
flag → `allAnswered` never became true → the round never resolved → hang
every round. v1.31.1 tried to close the window client-side
(read-merge-write), but PEPE11's second read could still happen *before*
PAPA19's write committed, so the merge had nothing to merge.

The only correct fix is **atomic on the server.** This RPC reads,
modifies, and writes inside one Postgres transaction with a `FOR UPDATE`
row lock — two concurrent calls are serialized, no flag is ever lost.
The function intentionally does NOT do round resolution (damage / boss
attack / win-loss logic stays in JS for now); it only guarantees the
answered flags converge. Resolution then runs client-side on the
guaranteed-correct merged state.

The JS client (game.js `_battleWriteAnswer`) calls this RPC. If the RPC
is missing or errors, the client falls back to the old best-effort
merge — so shipping JS before SQL degrades gracefully instead of breaking.

**Run in Supabase Studio → SQL Editor → New query → Run:**

```sql
-- v1.31.4: atomic per-player answer merge into rooms.data.battleState.
-- Serializes concurrent answers so no kid's answeredThisRound flag is clobbered.
create or replace function battle_submit_answer(
  p_room_id   text,
  p_player_id text,
  p_correct   boolean
)
returns jsonb
language plpgsql
as $$
declare
  v_data jsonb;
  v_ps   jsonb;
  v_already boolean;
  v_contrib int;
begin
  -- Lock the room row for the duration of this transaction.
  select data into v_data from rooms where id = p_room_id for update;
  if v_data is null then
    return null;
  end if;

  -- Bail if no battle, round inactive, or fight over.
  if (v_data->'battleState') is null
     or (v_data->'battleState'->>'roundActive')::boolean is distinct from true
     or (v_data->'battleState'->>'outcome') is not null then
    return v_data;
  end if;

  v_ps := v_data->'battleState'->'playerStates'->p_player_id;
  if v_ps is null then
    -- Player not initialised in battle — nothing to do here; client init covers it.
    return v_data;
  end if;

  -- Only apply once (monotonic within a round).
  v_already := coalesce((v_ps->>'answeredThisRound')::boolean, false);
  if not v_already then
    v_contrib := coalesce((v_ps->>'correctThisBattle')::int, 0);
    if p_correct then
      v_contrib := v_contrib + 1;
    end if;
    v_ps := jsonb_set(v_ps, '{answeredThisRound}', 'true'::jsonb, true);
    v_ps := jsonb_set(v_ps, '{answerCorrect}', to_jsonb(p_correct), true);
    v_ps := jsonb_set(v_ps, '{correctThisBattle}', to_jsonb(v_contrib), true);
    v_data := jsonb_set(v_data,
      array['battleState','playerStates',p_player_id], v_ps, true);
    update rooms set data = v_data, updated_at = now() where id = p_room_id;
  end if;

  return v_data;
end;
$$;
```

**Verify (smoke test in SQL Editor):**

```sql
-- Should return the room's data jsonb (or null if room absent).
select battle_submit_answer('TEST20', 'PAPA19', true);
```

If it errors with permission-denied on the `update rooms` step, the
function needs `security definer` (so it runs as the function owner,
who has table privileges, instead of the calling anon role):

```sql
-- Re-run with security definer:
alter function battle_submit_answer(text, text, boolean) security definer;
```

**Deployment order.** Run the SQL **first**, verify, then ship game.js
v1.31.4. If JS ships first, the fallback keeps the game working
(imperfectly under concurrency); once SQL is live, the RPC path
activates automatically with no further deploy.

**Followups (BACKLOG WATCH-ITEM).** The room-blob last-write-wins root
also affects `bs.readyForNext` and `room.phase`. v1.31.0 patched both
defensively (client merge + host backstop). If they stall under load,
give them the same RPC treatment: e.g. `battle_ready_up(p_room_id,
p_player_id)` and `battle_heal_phase(p_room_id)`.
