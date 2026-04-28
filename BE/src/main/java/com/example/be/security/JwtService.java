package com.example.be.security;

import com.example.be.auth.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final JwtProperties props;

    public JwtService(JwtProperties props) {
        this.props = props;
    }

    public String issueToken(String username, Role role) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getTtlSeconds());

        return Jwts.builder()
            .issuer(props.getIssuer())
            .subject(username)
            .claim("role", role.name())
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .signWith(secretKey())
            .compact();
    }

    public Optional<JwtPrincipal> parse(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(secretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

            String username = claims.getSubject();
            String roleRaw = claims.get("role", String.class);
            if (username == null || username.isBlank() || roleRaw == null || roleRaw.isBlank()) {
                return Optional.empty();
            }
            Role role = Role.valueOf(roleRaw);
            return Optional.of(new JwtPrincipal(username, role));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private SecretKey secretKey() {
        return Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
    }
}

