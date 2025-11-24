package com.learningcurve.domain.layout;

import java.util.List;

/**
 * Agrupa todas as informações de layout (visual) de uma trilha.
 */
public record TrilhaLayout(
        List<PassoLayout> layoutPassos,
        List<FluxoLayout> layoutFluxos
) {
}