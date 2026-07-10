package com.greatacme.lecturetci.web.dto;

import com.greatacme.lecturetci.domain.Participant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class ParticipantDtos {
    private ParticipantDtos() {
    }

    public record JoinParticipantRequest(
            @NotBlank String sessionCode,
            @NotBlank
            @Pattern(regexp = "[가-힣A-Za-z0-9_-]{2,12}", message = "닉네임은 한글, 영문, 숫자, -, _ 조합 2~12자로 입력해 주세요.")
            String nickname
    ) {
    }

    public record ParticipantResponse(
            UUID id,
            UUID lectureSessionId,
            String nickname,
            String status,
            Integer progressPercent,
            OffsetDateTime joinedAt,
            OffsetDateTime submittedAt
    ) {
        public static ParticipantResponse from(Participant participant) {
            return new ParticipantResponse(
                    participant.getId(),
                    participant.getLectureSession().getId(),
                    participant.getNickname(),
                    participant.getStatus(),
                    participant.getProgressPercent(),
                    participant.getJoinedAt(),
                    participant.getSubmittedAt()
            );
        }
    }
}
