package com.example.be.bootstrap;

import com.example.be.auth.Role;
import com.example.be.auth.UserAccount;
import com.example.be.auth.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements CommandLineRunner {
    private final UserAccountRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final Environment env;

    public AdminBootstrap(UserAccountRepository repo, PasswordEncoder passwordEncoder, Environment env) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
        this.env = env;
    }

    @Override
    public void run(String... args) {
        String username = env.getProperty("app.bootstrap.admin.username", "admin");
        String password = env.getProperty("app.bootstrap.admin.password", "admin123");

        if (repo.existsByUsername(username)) {
            return;
        }

        UserAccount admin = new UserAccount();
        admin.setUsername(username);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(Role.ADMIN);
        repo.save(admin);
    }
}

