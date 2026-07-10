package com.greatacme.lecturetci.service;

import com.greatacme.lecturetci.domain.Participant;
import com.greatacme.lecturetci.domain.ParticipantResponse;
import com.greatacme.lecturetci.domain.ParticipantResponseId;
import com.greatacme.lecturetci.domain.TestQuestion;
import com.greatacme.lecturetci.repository.ParticipantRepository;
import com.greatacme.lecturetci.repository.ParticipantResponseRepository;
import com.greatacme.lecturetci.repository.TestQuestionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResponseService {
    private final ParticipantRepository participantRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final ParticipantResponseRepository participantResponseRepository;

    public ResponseService(
            ParticipantRepository participantRepository,
            TestQuestionRepository testQuestionRepository,
            ParticipantResponseRepository participantResponseRepository
    ) {
        this.participantRepository = participantRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.participantResponseRepository = participantResponseRepository;
    }

    @Transactional
    public int saveResponses(UUID participantId, List<AnswerCommand> answers) {
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "참여자를 찾을 수 없습니다."));
        if (participant.isSubmitted()) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 제출된 응답은 수정할 수 없습니다.");
        }
        if (answers == null || answers.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "저장할 응답이 없습니다.");
        }

        for (AnswerCommand answer : answers) {
            TestQuestion question = testQuestionRepository.findById(answer.questionId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "존재하지 않는 문항입니다."));
            validateAnswerValue(question, answer.answerValue());

            ParticipantResponseId responseId = new ParticipantResponseId(participant.getId(), question.getId());
            ParticipantResponse response = participantResponseRepository.findById(responseId)
                    .orElseGet(() -> new ParticipantResponse(participant, question, answer.answerValue()));
            response.updateAnswer(answer.answerValue());
            participantResponseRepository.save(response);
        }

        long totalQuestions = testQuestionRepository.countByActiveTrue();
        long answeredQuestions = participantResponseRepository.countByIdParticipantId(participantId);
        int progress = totalQuestions == 0 ? 0 : (int) Math.min(100, Math.round(answeredQuestions * 100.0 / totalQuestions));
        participant.updateProgress(progress);
        return progress;
    }

    private void validateAnswerValue(TestQuestion question, BigDecimal answerValue) {
        if (answerValue == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "응답값이 비어 있습니다.");
        }
        BigDecimal min = BigDecimal.valueOf(question.getScaleMin());
        BigDecimal max = BigDecimal.valueOf(question.getScaleMax());
        if (answerValue.compareTo(min) < 0 || answerValue.compareTo(max) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "응답값이 허용 범위를 벗어났습니다.");
        }
    }

    public record AnswerCommand(UUID questionId, BigDecimal answerValue) {
    }
}
