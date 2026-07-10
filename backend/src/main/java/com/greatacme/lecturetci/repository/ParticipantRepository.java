package com.greatacme.lecturetci.repository;

import com.greatacme.lecturetci.domain.Participant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParticipantRepository extends JpaRepository<Participant, UUID> {

    @Query("""
            select count(p) > 0
            from Participant p
            where p.lectureSession.id = :sessionId
              and lower(p.nickname) = lower(:nickname)
            """)
    boolean existsNicknameInSession(@Param("sessionId") UUID sessionId, @Param("nickname") String nickname);

    Optional<Participant> findById(UUID id);

    List<Participant> findByLectureSessionSessionCodeOrderByJoinedAtAsc(String sessionCode);
}
