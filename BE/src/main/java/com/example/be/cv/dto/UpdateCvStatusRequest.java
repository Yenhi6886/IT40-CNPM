package com.example.be.cv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateCvStatusRequest(
    @NotBlank(message = "status is required")
    @Pattern(
        regexp = "^(XEM_XET|PHONG_VAN|LOAI)$",
        message = "status must be one of XEM_XET, PHONG_VAN, LOAI"
    )
    String status
) {}
