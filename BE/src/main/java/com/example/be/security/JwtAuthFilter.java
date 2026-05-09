package com.example.be.security;

import com.example.be.auth.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring("Bearer ".length()).trim();
            jwtService.parse(token).ifPresent(principal -> {
                String authority = authorityFor(principal.role());
                var auth = new UsernamePasswordAuthenticationToken(
                    principal.username(),
                    null,
                    java.util.List.of(new SimpleGrantedAuthority(authority))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }

        filterChain.doFilter(request, response);
    }

    /** ADMIN (legacy) được coi như DESIGN để khớp phân quyền mới. */
    private static String authorityFor(Role role) {
        if (role == Role.ADMIN || role == Role.DESIGN) {
            return "ROLE_DESIGN";
        }
        if (role == Role.HR) {
            return "ROLE_HR";
        }
        return "ROLE_" + role.name();
    }
}

