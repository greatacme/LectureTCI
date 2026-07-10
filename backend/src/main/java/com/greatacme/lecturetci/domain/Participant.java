package com.greatacme.lecturetci.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "participant")
public class Participant {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lecture_session_id", nullable = false)
    private LectureSession lectureSession;

    @Column(nullable = false)
    private String nickname;

    @Column(nullable = false)
    private String status;

    @Column(name = "progress_percent", nullable = false)
    private Integer progressPercent;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "joined_at")
    private OffsetDateTime joinedAt;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    protected Participant() {
    }

    public Participant(LectureSession lectureSession, String nickname) {
        this.id = UUID.randomUUID();
        this.lectureSession = lectureSession;
        this.nickname = nickname;
        this.status = "joined";
        this.progressPercent = 0;
        this.createdAt = OffsetDateTime.now();
        this.joinedAt = this.createdAt;
    }

    public UUID getId() {
        return id;
    }

    public LectureSession getLectureSession() {
        return lectureSession;
    }

    public String getNickname() {
        return nickname;
    }

    public String getStatus() {
        return status;
    }

    public Integer getProgressPercent() {
        return progressPercent;
    }

    public OffsetDateTime getJoinedAt() {
        return joinedAt;
    }

    public OffsetDateTime getSubmittedAt() {
        return submittedAt;
    }

    public boolean isSubmitted() {
        return "submitted".equals(status);
    }

    public void updateProgress(int progressPercent) {
        if (!isSubmitted()) {
            this.status = "in_progress";
            this.progressPercent = progressPercent;
        }
    }

    public void submit() {
        this.status = "submitted";
        this.progressPercent = 100;
        this.submittedAt = OffsetDateTime.now();
    }
}
