package com.example.be.bootstrap;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Đổi role cũ ADMIN → DESIGN để khớp phân quyền mới (JWT vẫn map ADMIN → ROLE_DESIGN nếu còn sót).
 */
@Component
@Order(Integer.MIN_VALUE)
public class RoleMigrationRunner implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    public RoleMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.update("UPDATE user_accounts SET role = 'DESIGN' WHERE role = 'ADMIN'");
    }
}
