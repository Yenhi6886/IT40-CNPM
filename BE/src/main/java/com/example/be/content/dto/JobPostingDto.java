package com.example.be.content.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record JobPostingDto(
    Long id,
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    String title,
    @Pattern(
        regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$",
        message = "applyStartDate must be in yyyy-MM-dd format"
    )
    String applyStartDate,
    @Pattern(
        regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$",
        message = "applyEndDate must be in yyyy-MM-dd format"
    )
    String applyEndDate,
    @Size(max = 300, message = "Address must be at most 300 characters")
    String address,
    @Pattern(regexp = "^$|^(IT|NON_IT)$", message = "jobType must be IT or NON_IT")
    String jobType,
    @Size(max = 200, message = "Salary must be at most 200 characters")
    String salary,
    @Size(max = 500, message = "Image URL must be at most 500 characters")
    String imageUrl,
    @Size(max = 30000, message = "Description is too long")
    String description,
    boolean published,
    @Min(value = 0, message = "sortOrder must be >= 0")
    @Max(value = 100000, message = "sortOrder is too large")
    int sortOrder
) {}

