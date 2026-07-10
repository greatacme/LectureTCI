package com.greatacme.lecturetci.repository;

import com.greatacme.lecturetci.domain.TestQuestion;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestQuestionRepository extends JpaRepository<TestQuestion, UUID> {
    List<TestQuestion> findByActiveTrueOrderByQuestionNoAsc();

    long countByActiveTrue();
}
