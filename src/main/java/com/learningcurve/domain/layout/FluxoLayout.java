package com.learningcurve.domain.layout;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Record que armazena as propriedades visuais de um nó de fluxo (início/fim).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FluxoLayout(
        String idFluxo,
        double left,
        double top,
        double angle,
        double scaleX,
        double scaleY
) {}