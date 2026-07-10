-- Add internal participant UUID and separate user-facing nickname.
-- Existing participant.participant_id values are preserved as nickname.

alter table participant
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists nickname text;

update participant
set nickname = participant_id
where nickname is null;

update participant
set id = gen_random_uuid()
where id is null;

alter table participant
    alter column id set not null,
    alter column nickname set not null;

-- Drop foreign keys that still depend on the old participant composite primary key.
do $$
declare
    fk_name text;
begin
    for fk_name in
        select c.conname
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_class r on r.oid = c.confrelid
        where c.contype = 'f'
          and t.relname in ('response', 'participant_measure_result')
          and r.relname = 'participant'
    loop
        execute format('alter table %I drop constraint %I', (
            select t.relname
            from pg_constraint c2
            join pg_class t on t.oid = c2.conrelid
            where c2.conname = fk_name
            limit 1
        ), fk_name);
    end loop;
end $$;

alter table participant
    drop constraint if exists participant_pkey,
    drop constraint if exists participant_id_chk;

alter table participant
    add constraint participant_pkey primary key (id),
    add constraint participant_id_session_uk unique (id, lecture_session_id),
    add constraint participant_nickname_chk
        check (length(trim(nickname)) between 2 and 12);

create unique index if not exists idx_participant_session_nickname_uk
    on participant (lecture_session_id, lower(nickname));

-- Convert response participant reference from nickname text to participant UUID.
alter table response
    drop constraint if exists response_pkey;

alter table response
    add column if not exists participant_uuid uuid;

update response r
set participant_uuid = p.id
from participant p
where p.lecture_session_id = r.lecture_session_id
  and p.participant_id = r.participant_id
  and r.participant_uuid is null;

alter table response
    alter column participant_uuid set not null;

alter table response
    drop column participant_id;

alter table response
    rename column participant_uuid to participant_id;

alter table response
    add constraint response_pkey primary key (participant_id, question_id),
    add constraint response_participant_session_fkey
        foreign key (participant_id, lecture_session_id)
        references participant(id, lecture_session_id)
        on delete cascade;

create index if not exists idx_response_session_participant
    on response (lecture_session_id, participant_id);

-- Convert participant_measure_result participant reference to UUID.
alter table participant_measure_result
    drop constraint if exists participant_measure_result_pkey;

alter table participant_measure_result
    add column if not exists participant_uuid uuid;

update participant_measure_result r
set participant_uuid = p.id
from participant p
where p.lecture_session_id = r.lecture_session_id
  and p.participant_id = r.participant_id
  and r.participant_uuid is null;

alter table participant_measure_result
    alter column participant_uuid set not null;

alter table participant_measure_result
    drop column participant_id;

alter table participant_measure_result
    rename column participant_uuid to participant_id;

alter table participant_measure_result
    add constraint participant_measure_result_pkey primary key (participant_id, measure_id),
    add constraint participant_measure_result_participant_session_fkey
        foreign key (participant_id, lecture_session_id)
        references participant(id, lecture_session_id)
        on delete cascade;

-- Remove old user-facing identifier after dependent tables have migrated.
alter table participant
    drop column if exists participant_id;

comment on table participant is 'Participants entered by nickname per lecture session.';
