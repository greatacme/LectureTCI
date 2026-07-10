package com.greatacme.lecturetci.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "lecture_session")
public class LectureSession {

    @Id
    private UUID id;

    @Column(name = "session_code", nullable = false, unique = true)
    private String sessionCode;

    private String title;

    @Column(nullable = false)
    private String status;

    @Column(name = "expected_participant_count")
    private Integer expectedParticipantCount;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    protected LectureSession() {
    }

    public LectureSession(String sessionCode, String title, Integer expectedParticipantCount) {
        this.id = UUID.randomUUID();
        this.sessionCode = sessionCode;
        this.title = title;
        this.status = "active";
        this.expectedParticipantCount = expectedParticipantCount;
        this.startedAt = OffsetDateTime.now();
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getSessionCode() {
        return sessionCode;
    }

    public String getTitle() {
        return title;
    }

    public String getStatus() {
        return status;
    }

    public Integer getExpectedParticipantCount() {
        return expectedParticipantCount;
    }

    public OffsetDateTime getStartedAt() {
        return startedAt;
    }

    public void close() {
        this.status = "closed";
        this.closedAt = OffsetDateTime.now();
        this.updatedAt = this.closedAt;
    }

    public void publish() {
        this.status = "published";
        this.publishedAt = OffsetDateTime.now();
        this.updatedAt = this.publishedAt;
    }

    public void complete() {
        this.status = "completed";
        this.completedAt = OffsetDateTime.now();
        this.updatedAt = this.completedAt;
    }
}
