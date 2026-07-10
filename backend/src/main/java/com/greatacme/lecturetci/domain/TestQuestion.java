package com.greatacme.lecturetci.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "test_question")
public class TestQuestion {

    @Id
    private UUID id;

    @Column(name = "question_no", nullable = false)
    private Integer questionNo;

    @Column(name = "measure_id", nullable = false)
    private String measureId;

    @Column(name = "question_text", nullable = false)
    private String questionText;

    @Column(name = "scale_min", nullable = false)
    private Integer scaleMin;

    @Column(name = "scale_max", nullable = false)
    private Integer scaleMax;

    @Column(name = "reverse_score", nullable = false)
    private Boolean reverseScore;

    @Column(nullable = false)
    private BigDecimal weight;

    @Column(name = "is_active", nullable = false)
    private Boolean active;

    protected TestQuestion() {
    }

    public UUID getId() {
        return id;
    }

    public Integer getQuestionNo() {
        return questionNo;
    }

    public String getMeasureId() {
        return measureId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public Integer getScaleMin() {
        return scaleMin;
    }

    public Integer getScaleMax() {
        return scaleMax;
    }
}
