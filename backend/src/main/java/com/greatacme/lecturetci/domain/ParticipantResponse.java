package com.greatacme.lecturetci.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "response")
public class ParticipantResponse {

    @EmbeddedId
    private ParticipantResponseId id;

    @MapsId("participantId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_id", nullable = false)
    private Participant participant;

    @MapsId("questionId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private TestQuestion question;

    @Column(name = "lecture_session_id", nullable = false)
    private java.util.UUID lectureSessionId;

    @Column(name = "answer_value", nullable = false)
    private BigDecimal answerValue;

    @Column(name = "answered_at", nullable = false)
    private OffsetDateTime answeredAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected ParticipantResponse() {
    }

    public ParticipantResponse(Participant participant, TestQuestion question, BigDecimal answerValue) {
        this.id = new ParticipantResponseId(participant.getId(), question.getId());
        this.participant = participant;
        this.question = question;
        this.lectureSessionId = participant.getLectureSession().getId();
        this.answerValue = answerValue;
        this.answeredAt = OffsetDateTime.now();
        this.updatedAt = this.answeredAt;
    }

    public void updateAnswer(BigDecimal answerValue) {
        this.answerValue = answerValue;
        this.updatedAt = OffsetDateTime.now();
    }
}
