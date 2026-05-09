package com.example.be.config;

import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatUploadConfiguration {

    private static final int MAX_POST_BYTES = 50 * 1024 * 1024;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatLargeFormPosts() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            connector.setMaxPostSize(MAX_POST_BYTES);
        });
    }
}
