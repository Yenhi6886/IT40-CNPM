package com.example.be.content;

import java.nio.file.Path;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticUploadsConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploads = Path.of("uploads").toAbsolutePath().normalize();
        String location = uploads.toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }
}

