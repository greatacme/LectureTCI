package com.greatacme.lecturetci.service;

import com.greatacme.lecturetci.domain.LectureSession;
import com.greatacme.lecturetci.repository.LectureSessionRepository;
import com.greatacme.lecturetci.web.dto.SessionDtos.OpenSessionResponse;
import com.greatacme.lecturetci.web.dto.SessionDtos.SessionMeasureResultResponse;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LectureSessionService {
    private final LectureSessionRepository lectureSessionRepository;
    private final JdbcTemplate jdbcTemplate;
    private final SecureRandom random = new SecureRandom();

    public LectureSessionService(LectureSessionRepository lectureSessionRepository, JdbcTemplate jdbcTemplate) {
        this.lectureSessionRepository = lectureSessionRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public LectureSession createSession(String title, Integer expectedParticipantCount) {
        String sessionCode = generateUniqueSessionCode();
        LectureSession session = new LectureSession(sessionCode, title, expectedParticipantCount);
        return lectureSessionRepository.save(session);
    }

    public LectureSession getSession(String sessionCode) {
        return lectureSessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "강의 코드를 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public List<OpenSessionResponse> openSessions() {
        String sql = """
                select
                    s.id,
                    s.session_code,
                    s.title,
                    s.status,
                    s.started_at,
                    count(p.id) as participant_count,
                    count(case when p.status = 'submitted' then 1 end) as submitted_count
                from lecture_session s
                left join participant p on p.lecture_session_id = s.id
                where s.status <> 'completed'
                group by s.id, s.session_code, s.title, s.status, s.started_at, s.created_at
                order by s.started_at desc nulls last, s.created_at desc
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new OpenSessionResponse(
                rs.getObject("id", UUID.class),
                rs.getString("session_code"),
                rs.getString("title"),
                rs.getString("status"),
                rs.getInt("participant_count"),
                rs.getInt("submitted_count"),
                rs.getObject("started_at", OffsetDateTime.class)
        ));
    }

    @Transactional(readOnly = true)
    public List<SessionMeasureResultResponse> sessionMeasureResults(String sessionCode) {
        LectureSession session = getSession(sessionCode);
        String sql = """
                select
                    mc.id as category_id,
                    mc.name as category_name,
                    m.id as measure_id,
                    m.name as measure_name,
                    smr.participant_count,
                    smr.score_sum,
                    smr.score_avg,
                    smr.score_100,
                    smr.level_code,
                    mi.level_label
                from session_measure_result smr
                join measure m on m.id = smr.measure_id
                join measure_category mc on mc.id = m.category_id
                left join measure_interpretation mi
                    on mi.measure_id = smr.measure_id
                    and mi.level_code = smr.level_code
                where smr.lecture_session_id = ?
                order by mc.sort_order, m.sort_order
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new SessionMeasureResultResponse(
                rs.getString("category_id"),
                rs.getString("category_name"),
                rs.getString("measure_id"),
                rs.getString("measure_name"),
                rs.getInt("participant_count"),
                rs.getDouble("score_sum"),
                rs.getDouble("score_avg"),
                rs.getDouble("score_100"),
                rs.getString("level_code"),
                rs.getString("level_label")
        ), session.getId());
    }

    @Transactional
    public LectureSession closeSession(String sessionCode) {
        LectureSession session = getSession(sessionCode);
        calculateSubmittedResults(session.getId());
        session.close();
        return session;
    }

    @Transactional
    public LectureSession publishSession(String sessionCode) {
        LectureSession session = getSession(sessionCode);
        session.publish();
        return session;
    }

    @Transactional
    public LectureSession endSession(String sessionCode) {
        LectureSession session = getSession(sessionCode);
        UUID sessionId = session.getId();
        jdbcTemplate.update("delete from session_measure_result where lecture_session_id = ?", sessionId);
        jdbcTemplate.update("delete from participant where lecture_session_id = ?", sessionId);
        session.complete();
        return session;
    }

    private String generateUniqueSessionCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String candidate = String.format("%06d", random.nextInt(1_000_000));
            if (!lectureSessionRepository.existsBySessionCode(candidate)) {
                return candidate;
            }
        }
        throw new ApiException(HttpStatus.CONFLICT, "강의 코드를 생성하지 못했습니다.");
    }

    private void calculateSubmittedResults(UUID sessionId) {
        jdbcTemplate.update("delete from participant_measure_result where lecture_session_id = ?", sessionId);
        jdbcTemplate.update("delete from session_measure_result where lecture_session_id = ?", sessionId);

        String sessionResultSql = """
                with submitted_participant as (
                    select id
                    from participant
                    where lecture_session_id = ?
                      and status = 'submitted'
                ),
                measure_score as (
                    select
                        r.lecture_session_id,
                        q.measure_id,
                        count(distinct r.participant_id)::integer as participant_count,
                        count(distinct r.question_id)::integer as question_count,
                        sum(r.answer_value) as score_sum,
                        sum(r.answer_value) / count(distinct r.participant_id) as score_avg
                    from response r
                    join submitted_participant sp on sp.id = r.participant_id
                    join test_question q on q.id = r.question_id
                    where r.lecture_session_id = ?
                    group by r.lecture_session_id, q.measure_id
                ),
                question_capacity as (
                    select
                        measure_id,
                        sum(scale_max) as max_score_per_participant
                    from test_question
                    where is_active = true
                    group by measure_id
                ),
                scored_measure as (
                    select
                        ms.lecture_session_id,
                        ms.measure_id,
                        ms.participant_count,
                        ms.question_count,
                        ms.score_sum,
                        ms.score_avg,
                        least(
                            100,
                            greatest(
                                0,
                                (ms.score_avg / nullif(qc.max_score_per_participant, 0)) * 100
                            )
                        ) as score_100,
                        coalesce(mi.level_code, fallback.level_code) as level_code
                    from measure_score ms
                    join question_capacity qc on qc.measure_id = ms.measure_id
                    left join lateral (
                        select level_code
                        from measure_interpretation
                        where measure_id = ms.measure_id
                          and least(
                              100,
                              greatest(
                                  0,
                                  (ms.score_avg / nullif(qc.max_score_per_participant, 0)) * 100
                              )
                          ) between min_score and max_score
                        order by sort_order
                        limit 1
                    ) mi on true
                    left join lateral (
                        select level_code
                        from measure_interpretation
                        where measure_id = ms.measure_id
                        order by sort_order
                        limit 1
                    ) fallback on true
                )
                insert into session_measure_result (
                    lecture_session_id,
                    measure_id,
                    participant_count,
                    score_sum,
                    score_avg,
                    score_100,
                    level_code
                )
                select
                    lecture_session_id,
                    measure_id,
                    participant_count,
                    score_sum,
                    score_avg,
                    score_100,
                    level_code
                from scored_measure
                """;

        jdbcTemplate.update(sessionResultSql, sessionId, sessionId);

        String participantResultSql = """
                insert into participant_measure_result (
                    lecture_session_id,
                    participant_id,
                    measure_id,
                    question_count,
                    score_sum,
                    score_avg,
                    score_100,
                    level_code
                )
                select
                    p.lecture_session_id,
                    p.id,
                    smr.measure_id,
                    coalesce(q.question_count, 0),
                    smr.score_sum,
                    smr.score_avg,
                    smr.score_100,
                    smr.level_code
                from participant p
                join session_measure_result smr on smr.lecture_session_id = p.lecture_session_id
                left join (
                    select measure_id, count(*)::integer as question_count
                    from test_question
                    where is_active = true
                    group by measure_id
                ) q on q.measure_id = smr.measure_id
                where p.lecture_session_id = ?
                  and p.status = 'submitted'
                  and smr.level_code is not null
                """;

        jdbcTemplate.update(participantResultSql, sessionId);
    }
}
