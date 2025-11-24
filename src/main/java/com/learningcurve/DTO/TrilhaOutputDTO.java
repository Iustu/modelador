package com.learningcurve.DTO;

import com.learningcurve.domain.TrilhaCompleta;

/**
 * DTO que representa a estrutura de uma Trilha a ser enviada como resposta para o cliente.
 */
public record TrilhaOutputDTO(
        Long id,
        TrilhaCompleta dados
) {
    // Construtor auxiliar
    public TrilhaOutputDTO(Long id, TrilhaCompleta dados) {
        this.id = id;
        this.dados = dados;
    }
}