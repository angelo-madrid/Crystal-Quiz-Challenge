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
