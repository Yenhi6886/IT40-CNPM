package com.example.be.content;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findAllByPublishedTrueOrderBySortOrderAscIdDesc();
    List<JobPosting> findAllByOrderBySortOrderAscIdDesc();
}

