package com.greatacme.lecturetci.web;

import com.greatacme.lecturetci.domain.Participant;
import com.greatacme.lecturetci.service.ParticipantService;
import com.greatacme.lecturetci.service.ResponseService;
import com.greatacme.lecturetci.web.dto.ParticipantDtos.JoinParticipantRequest;
import com.greatacme.lecturetci.web.dto.ParticipantDtos.ParticipantResponse;
import com.greatacme.lecturetci.web.dto.ResponseDtos.SaveResponsesRequest;
import com.greatacme.lecturetci.web.dto.ResponseDtos.SaveResponsesResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/participants")
public class ParticipantController {
    private final ParticipantService participantService;
    private final ResponseService responseService;

    public ParticipantController(ParticipantService participantService, ResponseService responseService) {
        this.participantService = participantService;
        this.responseService = responseService;
    }

    @PostMapping("/join")
    @ResponseStatus(HttpStatus.CREATED)
    public ParticipantResponse join(@Valid @RequestBody JoinParticipantRequest request) {
        Participant participant = participantService.join(request.sessionCode(), request.nickname());
        return ParticipantResponse.from(participant);
    }

    @PutMapping("/{participantId}/responses")
    public SaveResponsesResponse saveResponses(
            @PathVariable UUID participantId,
            @Valid @RequestBody SaveResponsesRequest request
    ) {
        int progress = responseService.saveResponses(
                participantId,
                request.answers().stream()
                        .map(answer -> new ResponseService.AnswerCommand(answer.questionId(), answer.answerValue()))
                        .toList()
        );
        return new SaveResponsesResponse(participantId, progress);
    }

    @PostMapping("/{participantId}/submit")
    public ParticipantResponse submit(@PathVariable UUID participantId) {
        Participant participant = participantService.submit(participantId);
        return ParticipantResponse.from(participant);
    }
}
