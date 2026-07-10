package com.greatacme.lecturetci.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class ResponseDtos {
    private ResponseDtos() {
    }

    public record SaveResponsesRequest(
            @NotEmpty List<@Valid AnswerRequest> answers
    ) {
    }

    public record AnswerRequest(
            @NotNull UUID questionId,
            @NotNull BigDecimal answerValue
    ) {
    }

    public record SaveResponsesResponse(
            UUID participantId,
            int progressPercent
    ) {
    }
}
