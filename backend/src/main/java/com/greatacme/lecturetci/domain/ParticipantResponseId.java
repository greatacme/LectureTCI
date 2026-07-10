package com.greatacme.lecturetci.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class ParticipantResponseId implements Serializable {

    @Column(name = "participant_id")
    private UUID participantId;

    @Column(name = "question_id")
    private UUID questionId;

    protected ParticipantResponseId() {
    }

    public ParticipantResponseId(UUID participantId, UUID questionId) {
        this.participantId = participantId;
        this.questionId = questionId;
    }

    public UUID getParticipantId() {
        return participantId;
    }

    public UUID getQuestionId() {
        return questionId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof ParticipantResponseId that)) {
            return false;
        }
        return Objects.equals(participantId, that.participantId)
                && Objects.equals(questionId, that.questionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(participantId, questionId);
    }
}
