package com.greatacme.lecturetci.web;

import com.greatacme.lecturetci.service.QuestionService;
import com.greatacme.lecturetci.web.dto.QuestionDtos.QuestionResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {
    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public List<QuestionResponse> activeQuestions() {
        return questionService.activeQuestions().stream()
                .map(QuestionResponse::from)
                .toList();
    }
}
