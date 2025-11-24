package com.learningcurve.domain.model;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Representa o modelo lógico de uma seta (conexão) no diagrama.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CaminhoModel(
        String de,
        String para,
        String tipoCaminho,
        boolean eHierarquia
) {
}