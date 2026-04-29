package com.example.be.content.dto;

public record JobPostingDto(
    Long id,
    String title,
    String applyStartDate,
    String applyEndDate,
    String address,
    String jobType,
    String salary,
    String imageUrl,
    String description,
    boolean published,
    int sortOrder
) {}

