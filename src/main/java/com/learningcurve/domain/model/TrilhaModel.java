package com.learningcurve.domain.model;

import java.util.List;

/**
 * Modelo de Domínio que representa a estrutura lógica completa de uma Trilha.
 * Agrega as listas de Passos, Caminhos e Fluxos.
 */
public record TrilhaModel(
        String tituloDiagrama,
        List<PassoModel> passos,
        List<CaminhoModel> caminhos,
        List<FluxoModel> fluxos
) {
}