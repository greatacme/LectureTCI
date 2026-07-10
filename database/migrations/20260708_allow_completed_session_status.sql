alter table lecture_session
    drop constraint if exists lecture_session_status_chk;

alter table lecture_session
    add constraint lecture_session_status_chk
        check (status in ('ready', 'active', 'closed', 'published', 'completed'));
