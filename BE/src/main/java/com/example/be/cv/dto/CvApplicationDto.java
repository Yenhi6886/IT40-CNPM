package com.example.be.cv.dto;

import java.time.Instant;

public record CvApplicationDto(
    Long id,
    Long jobId,
    String jobTitle,
    String fullName,
    String email,
    String phone,
    String source,
    String cvOriginalName,
    String cvStoredPath,
    String status,
    Instant createdAt
) {}

