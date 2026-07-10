package com.greatacme.lecturetci.service;

import com.greatacme.lecturetci.domain.LectureSession;
import com.greatacme.lecturetci.domain.Participant;
import com.greatacme.lecturetci.repository.LectureSessionRepository;
import com.greatacme.lecturetci.repository.ParticipantRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ParticipantService {
    private final LectureSessionRepository lectureSessionRepository;
    private final ParticipantRepository participantRepository;

    public ParticipantService(
            LectureSessionRepository lectureSessionRepository,
            ParticipantRepository participantRepository
    ) {
        this.lectureSessionRepository = lectureSessionRepository;
        this.participantRepository = participantRepository;
    }

    @Transactional
    public Participant join(String sessionCode, String nickname) {
        String normalizedNickname = normalizeNickname(nickname);
        LectureSession session = lectureSessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "강의 코드를 찾을 수 없습니다."));

        if (!"active".equals(session.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "현재 입장 가능한 세션이 아닙니다.");
        }

        if (participantRepository.existsNicknameInSession(session.getId(), normalizedNickname)) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다.");
        }

        return participantRepository.save(new Participant(session, normalizedNickname));
    }

    @Transactional
    public Participant submit(UUID participantId) {
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "참여자를 찾을 수 없습니다."));
        participant.submit();
        return participant;
    }

    public Participant getParticipant(UUID participantId) {
        return participantRepository.findById(participantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "참여자를 찾을 수 없습니다."));
    }

    public List<Participant> participantsBySessionCode(String sessionCode) {
        lectureSessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "강의 코드를 찾을 수 없습니다."));
        return participantRepository.findByLectureSessionSessionCodeOrderByJoinedAtAsc(sessionCode);
    }

    private String normalizeNickname(String nickname) {
        String normalized = nickname == null ? "" : nickname.trim();
        if (!normalized.matches("[가-힣A-Za-z0-9_-]{2,12}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "닉네임은 한글, 영문, 숫자, -, _ 조합 2~12자로 입력해 주세요.");
        }
        return normalized;
    }
}
