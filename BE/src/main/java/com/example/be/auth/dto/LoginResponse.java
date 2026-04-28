package com.example.be.auth.dto;

public record LoginResponse(
    String token,
    String role,
    String username
) {}

