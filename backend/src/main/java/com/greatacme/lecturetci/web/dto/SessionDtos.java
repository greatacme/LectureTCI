package com.greatacme.lecturetci.web.dto;

import com.greatacme.lecturetci.domain.LectureSession;
import jakarta.validation.constraints.Min;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class SessionDtos {
    private SessionDtos() {
    }

    public record CreateSessionRequest(
            String title,
            @Min(0) Integer expectedParticipantCount
    ) {
    }

    public record SessionResponse(
            UUID id,
            String sessionCode,
            String title,
            String status,
            Integer expectedParticipantCount,
            OffsetDateTime startedAt
    ) {
        public static SessionResponse from(LectureSession session) {
            return new SessionResponse(
                    session.getId(),
                    session.getSessionCode(),
                    session.getTitle(),
                    session.getStatus(),
                    session.getExpectedParticipantCount(),
                    session.getStartedAt()
            );
        }
    }

    public record OpenSessionResponse(
            UUID id,
            String sessionCode,
            String title,
            String status,
            Integer participantCount,
            Integer submittedCount,
            OffsetDateTime startedAt
    ) {
    }

    public record SessionMeasureResultResponse(
            String categoryId,
            String categoryName,
            String measureId,
            String measureName,
            Integer participantCount,
            Double scoreSum,
            Double scoreAvg,
            Double score100,
            String levelCode,
            String levelLabel
    ) {
    }
}
