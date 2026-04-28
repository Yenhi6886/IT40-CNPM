package com.example.be.content.dto;

public record JobPostingDto(
    Long id,
    String title,
    String location,
    String employmentType,
    String salary,
    String imageUrl,
    String description,
    boolean published,
    int sortOrder
) {}

