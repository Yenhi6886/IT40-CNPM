package com.example.be.security;

import com.example.be.auth.Role;

public record JwtPrincipal(String username, Role role) {}

