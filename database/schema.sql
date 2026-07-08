-- LectureTCI Supabase PostgreSQL schema
-- Prototype target: single test, measure-based results.

create extension if not exists pgcrypto;

create table if not exists lecture_session (
    id uuid primary key default gen_random_uuid(),
    session_code text not null unique,
    title text,
    status text not null default 'ready',
    expected_participant_count integer,
    started_at timestamptz,
    closed_at timestamptz,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lecture_session_status_chk
        check (status in ('ready', 'active', 'closed', 'published')),
    constraint lecture_session_code_chk
        check (session_code ~ '^[0-9]{6}$'),
    constraint lecture_session_expected_count_chk
        check (expected_participant_count is null or expected_participant_count >= 0)
);

create table if not exists participant (
    lecture_session_id uuid not null references lecture_session(id) on delete cascade,
    participant_id text not null,
    status text not null default 'ready',
    progress_percent integer not null default 0,
    created_at timestamptz not null default now(),
    joined_at timestamptz,
    submitted_at timestamptz,
    primary key (lecture_session_id, participant_id),
    constraint participant_status_chk
        check (status in ('ready', 'joined', 'in_progress', 'submitted')),
    constraint participant_progress_chk
        check (progress_percent between 0 and 100),
    constraint participant_id_chk
        check (length(trim(participant_id)) > 0)
);

create table if not exists measure_category (
    id text primary key,
    name text not null,
    description text,
    sort_order integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint measure_category_id_chk
        check (length(trim(id)) > 0),
    constraint measure_category_sort_order_chk
        check (sort_order > 0)
);

create table if not exists measure (
    id text primary key,
    category_id text not null references measure_category(id),
    name text not null,
    short_name text,
    definition_text text,
    score_direction text not null default 'high_risk',
    sort_order integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint measure_id_chk
        check (id ~ '^[a-z]{4}$'),
    constraint measure_score_direction_chk
        check (score_direction in ('high_positive', 'high_risk')),
    constraint measure_sort_order_chk
        check (sort_order > 0)
);

create table if not exists measure_interpretation (
    measure_id text not null references measure(id) on delete cascade,
    level_code text not null,
    level_label text not null,
    min_score numeric(6, 2) not null,
    max_score numeric(6, 2) not null,
    color_hex text not null,
    icon_name text,
    description text not null,
    sort_order integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (measure_id, level_code),
    constraint measure_interpretation_level_chk
        check (level_code in ('green', 'yellow', 'red')),
    constraint measure_interpretation_score_range_chk
        check (min_score >= 0 and max_score <= 100 and min_score <= max_score),
    constraint measure_interpretation_color_chk
        check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    constraint measure_interpretation_sort_order_chk
        check (sort_order > 0)
);

create table if not exists test_question (
    id uuid primary key default gen_random_uuid(),
    question_no integer not null unique,
    measure_id text not null references measure(id),
    question_text text not null,
    scale_min integer not null default 1,
    scale_max integer not null default 5,
    reverse_score boolean not null default false,
    weight numeric(8, 4) not null default 1,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint test_question_no_chk
        check (question_no > 0),
    constraint test_question_scale_chk
        check (scale_min < scale_max),
    constraint test_question_weight_chk
        check (weight > 0),
    constraint test_question_text_chk
        check (length(trim(question_text)) > 0)
);

create table if not exists response (
    lecture_session_id uuid not null,
    participant_id text not null,
    question_id uuid not null references test_question(id),
    answer_value numeric(8, 4) not null,
    answered_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (lecture_session_id, participant_id, question_id),
    foreign key (lecture_session_id, participant_id)
        references participant(lecture_session_id, participant_id)
        on delete cascade
);

create table if not exists session_measure_result (
    lecture_session_id uuid not null references lecture_session(id) on delete cascade,
    measure_id text not null references measure(id),
    participant_count integer not null,
    score_sum numeric(12, 4) not null,
    score_avg numeric(8, 4) not null,
    score_100 numeric(6, 2) not null,
    level_code text,
    calculated_at timestamptz not null default now(),
    primary key (lecture_session_id, measure_id),
    foreign key (measure_id, level_code)
        references measure_interpretation(measure_id, level_code),
    constraint session_measure_result_count_chk
        check (participant_count >= 0),
    constraint session_measure_result_score_100_chk
        check (score_100 between 0 and 100)
);

create table if not exists participant_measure_result (
    lecture_session_id uuid not null,
    participant_id text not null,
    measure_id text not null references measure(id),
    question_count integer not null,
    score_sum numeric(12, 4) not null,
    score_avg numeric(8, 4) not null,
    score_100 numeric(6, 2) not null,
    level_code text not null,
    calculated_at timestamptz not null default now(),
    primary key (lecture_session_id, participant_id, measure_id),
    foreign key (lecture_session_id, participant_id)
        references participant(lecture_session_id, participant_id)
        on delete cascade,
    foreign key (measure_id, level_code)
        references measure_interpretation(measure_id, level_code),
    constraint participant_measure_result_question_count_chk
        check (question_count >= 0),
    constraint participant_measure_result_score_100_chk
        check (score_100 between 0 and 100)
);

create index if not exists idx_participant_session_status
    on participant (lecture_session_id, status);

create index if not exists idx_measure_category_sort
    on measure (category_id, sort_order);

create index if not exists idx_test_question_measure
    on test_question (measure_id, question_no);

create index if not exists idx_response_question
    on response (question_id);

create index if not exists idx_response_session_participant
    on response (lecture_session_id, participant_id);

create index if not exists idx_participant_measure_result_measure
    on participant_measure_result (measure_id, level_code);

create index if not exists idx_session_measure_result_measure
    on session_measure_result (measure_id, level_code);

comment on table lecture_session is 'LectureTCI lecture/session instance.';
comment on table participant is 'Pre-created participant IDs per lecture session.';
comment on table measure_category is 'Result category master.';
comment on table measure is 'Measure master. Each question maps to one measure.';
comment on table measure_interpretation is 'Measure score range, level, color, and interpretation text.';
comment on table test_question is 'Single test question list.';
comment on table response is 'Raw participant answers by question.';
comment on table session_measure_result is 'Session-level measure scores.';
comment on table participant_measure_result is 'Participant-level measure scores.';
