package com.learningcurve;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RestController;

/**
 * Classe principal que inicia a aplicação Spring Boot.
 * Configura o ponto de entrada do servidor backend.
 */
@SpringBootApplication
@RestController
public class ModeladorTrilhaBackApplication {

    // Método principal de inicialização
    public static void main(String[] args) {
        SpringApplication.run(ModeladorTrilhaBackApplication.class, args);
    }
}