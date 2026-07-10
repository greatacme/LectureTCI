package com.greatacme.lecturetci.repository;

import com.greatacme.lecturetci.domain.LectureSession;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LectureSessionRepository extends JpaRepository<LectureSession, UUID> {
    boolean existsBySessionCode(String sessionCode);

    Optional<LectureSession> findBySessionCode(String sessionCode);
}
