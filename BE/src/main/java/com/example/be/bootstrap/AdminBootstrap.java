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
        String designUser = env.getProperty("app.bootstrap.admin.username", "admin");
        String designPass = env.getProperty("app.bootstrap.admin.password", "admin123");
        String hrUser = env.getProperty("app.bootstrap.hr.username", "hr");
        String hrPass = env.getProperty("app.bootstrap.hr.password", "hr123");

        if (!repo.existsByUsername(designUser)) {
            UserAccount design = new UserAccount();
            design.setUsername(designUser);
            design.setPasswordHash(passwordEncoder.encode(designPass));
            design.setRole(Role.DESIGN);
            repo.save(design);
        }

        if (!hrUser.isBlank() && !repo.existsByUsername(hrUser)) {
            UserAccount hr = new UserAccount();
            hr.setUsername(hrUser);
            hr.setPasswordHash(passwordEncoder.encode(hrPass));
            hr.setRole(Role.HR);
            repo.save(hr);
        }
    }
}

