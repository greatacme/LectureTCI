package com.greatacme.lecturetci.web;

import com.greatacme.lecturetci.domain.LectureSession;
import com.greatacme.lecturetci.service.LectureSessionService;
import com.greatacme.lecturetci.service.ParticipantService;
import com.greatacme.lecturetci.web.dto.ParticipantDtos.ParticipantResponse;
import com.greatacme.lecturetci.web.dto.SessionDtos.CreateSessionRequest;
import com.greatacme.lecturetci.web.dto.SessionDtos.OpenSessionResponse;
import com.greatacme.lecturetci.web.dto.SessionDtos.SessionMeasureResultResponse;
import com.greatacme.lecturetci.web.dto.SessionDtos.SessionResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class LectureSessionController {
    private final LectureSessionService lectureSessionService;
    private final ParticipantService participantService;

    public LectureSessionController(LectureSessionService lectureSessionService, ParticipantService participantService) {
        this.lectureSessionService = lectureSessionService;
        this.participantService = participantService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse createSession(@Valid @RequestBody CreateSessionRequest request) {
        LectureSession session = lectureSessionService.createSession(request.title(), request.expectedParticipantCount());
        return SessionResponse.from(session);
    }

    @GetMapping("/open")
    public List<OpenSessionResponse> openSessions() {
        return lectureSessionService.openSessions();
    }

    @GetMapping("/{sessionCode}")
    public SessionResponse session(@PathVariable String sessionCode) {
        return SessionResponse.from(lectureSessionService.getSession(sessionCode));
    }

    @GetMapping("/{sessionCode}/participants")
    public List<ParticipantResponse> participants(@PathVariable String sessionCode) {
        return participantService.participantsBySessionCode(sessionCode).stream()
                .map(ParticipantResponse::from)
                .toList();
    }

    @GetMapping("/{sessionCode}/measure-results")
    public List<SessionMeasureResultResponse> measureResults(@PathVariable String sessionCode) {
        return lectureSessionService.sessionMeasureResults(sessionCode);
    }

    @PostMapping("/{sessionCode}/close")
    public SessionResponse close(@PathVariable String sessionCode) {
        return SessionResponse.from(lectureSessionService.closeSession(sessionCode));
    }

    @PostMapping("/{sessionCode}/publish")
    public SessionResponse publish(@PathVariable String sessionCode) {
        return SessionResponse.from(lectureSessionService.publishSession(sessionCode));
    }

    @PostMapping("/{sessionCode}/end")
    public SessionResponse end(@PathVariable String sessionCode) {
        return SessionResponse.from(lectureSessionService.endSession(sessionCode));
    }
}
