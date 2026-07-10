package com.greatacme.lecturetci.web.dto;

import com.greatacme.lecturetci.domain.TestQuestion;
import java.util.UUID;

public final class QuestionDtos {
    private QuestionDtos() {
    }

    public record QuestionResponse(
            UUID id,
            Integer questionNo,
            String measureId,
            String questionText,
            Integer scaleMin,
            Integer scaleMax
    ) {
        public static QuestionResponse from(TestQuestion question) {
            return new QuestionResponse(
                    question.getId(),
                    question.getQuestionNo(),
                    question.getMeasureId(),
                    question.getQuestionText(),
                    question.getScaleMin(),
                    question.getScaleMax()
            );
        }
    }
}
