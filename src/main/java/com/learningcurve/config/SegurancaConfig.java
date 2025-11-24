package com.learningcurve.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configurações de segurança da aplicação.
 * Define as políticas de acesso, proteção CSRF e cabeçalhos HTTP.
 */
@Configuration
@EnableWebSecurity
public class SegurancaConfig {

    // Configura a cadeia de filtros de segurança do Spring Security
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        http.headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                        .policyDirectives("script-src 'self' https://cdnjs.cloudflare.com; object-src 'none';")
                )
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny
                )
        );

        http.csrf(csrf -> csrf.disable());

        return http.build();
    }
}