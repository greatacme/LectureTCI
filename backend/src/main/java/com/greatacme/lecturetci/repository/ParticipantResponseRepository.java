package com.greatacme.lecturetci.repository;

import com.greatacme.lecturetci.domain.ParticipantResponse;
import com.greatacme.lecturetci.domain.ParticipantResponseId;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipantResponseRepository extends JpaRepository<ParticipantResponse, ParticipantResponseId> {
    long countByIdParticipantId(UUID participantId);
}
