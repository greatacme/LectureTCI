alter table lecture_session
    add column if not exists completed_at timestamptz;

update lecture_session
set completed_at = updated_at
where status = 'completed'
  and completed_at is null;
