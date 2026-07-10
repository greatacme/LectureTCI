package com.greatacme.lecturetci.service;

import com.greatacme.lecturetci.domain.TestQuestion;
import com.greatacme.lecturetci.repository.TestQuestionRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestionService {
    private final TestQuestionRepository testQuestionRepository;

    public QuestionService(TestQuestionRepository testQuestionRepository) {
        this.testQuestionRepository = testQuestionRepository;
    }

    @Transactional(readOnly = true)
    public List<TestQuestion> activeQuestions() {
        return testQuestionRepository.findByActiveTrueOrderByQuestionNoAsc();
    }
}
