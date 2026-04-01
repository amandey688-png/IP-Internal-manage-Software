-- =============================================================================
-- DB Client > Client ONB reference number setup + migration
-- Target format: EX-ONB-IMP-0001
-- One continuous sequence for active and inactive rows.
-- =============================================================================

begin;

-- 1) Create a dedicated sequence once.
create sequence if not exists public.db_client_client_onb_ref_seq start 1;

-- 2) Move sequence forward based on current max numeric suffix
--    from either new format (EX-ONB-IMP-####) or legacy format (ONB-####).
with parsed as (
  select
    case
      when reference_no ~* '^EX-ONB-IMP-[0-9]+$' then substring(reference_no from '([0-9]+)$')::bigint
      when reference_no ~* '^ONB-[0-9]+$' then substring(reference_no from '([0-9]+)$')::bigint
      else null
    end as n
  from public.db_client_client_onb
)
select setval(
  'public.db_client_client_onb_ref_seq',
  greatest(coalesce((select max(n) from parsed), 0), 1),
  true
);

-- 3) Helper function used as default for new inserts.
create or replace function public.db_client_client_onb_next_reference()
returns text
language sql
volatile
as $$
  select 'EX-ONB-IMP-' || lpad(nextval('public.db_client_client_onb_ref_seq')::text, 4, '0');
$$;

-- 4) Default reference for future inserts.
alter table public.db_client_client_onb
  alter column reference_no set default public.db_client_client_onb_next_reference();

-- 5) Optional format check (safe for current mixed historical formats).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'db_client_client_onb_reference_format_check'
  ) then
    alter table public.db_client_client_onb
      add constraint db_client_client_onb_reference_format_check
      check (
        reference_no ~* '^EX-ONB-IMP-[0-9]+$'
        or reference_no ~* '^ONB-[0-9]+$'
        or reference_no ~* '^ONB-IMP-[A-Z0-9-]+$'
      );
  end if;
end $$;

commit;

-- -----------------------------------------------------------------------------
-- OPTIONAL: One-time renumber for rows imported with ONB-IMP-* style refs.
-- This applies numbering ACTIVE first, then INACTIVE, and continues from
-- current max EX-ONB-IMP/ONB sequence. Run this block only when needed.
-- -----------------------------------------------------------------------------
/*
begin;

with existing_max as (
  select coalesce(
    max(
      case
        when reference_no ~* '^EX-ONB-IMP-[0-9]+$' then substring(reference_no from '([0-9]+)$')::bigint
        when reference_no ~* '^ONB-[0-9]+$' then substring(reference_no from '([0-9]+)$')::bigint
        else null
      end
    ),
    0
  ) as base_n
  from public.db_client_client_onb
  where reference_no !~* '^ONB-IMP-'
),
to_reseq as (
  select
    t.id,
    row_number() over (
      order by
        case when lower(coalesce(t.status, 'active')) = 'active' then 0 else 1 end,
        t.timestamp asc nulls last,
        t.id
    ) as rn
  from public.db_client_client_onb t
  where t.reference_no ~* '^ONB-IMP-'
),
upd as (
  update public.db_client_client_onb t
  set reference_no = 'EX-ONB-IMP-' || lpad((m.base_n + r.rn)::text, 4, '0')
  from to_reseq r
  cross join existing_max m
  where t.id = r.id
  returning t.id
)
select count(*) as resequenced_rows from upd;

-- sync sequence after resequence
with parsed as (
  select
    case
      when reference_no ~* '^EX-ONB-IMP-[0-9]+$' then substring(reference_no from '([0-9]+)$')::bigint
      when reference_no ~* '^ONB-[0-9]+$' then substring(reference_no from '([0-9]+)$')::bigint
      else null
    end as n
  from public.db_client_client_onb
)
select setval(
  'public.db_client_client_onb_ref_seq',
  greatest(coalesce((select max(n) from parsed), 0), 1),
  true
);

commit;
*/
