package com.learningcurve.domain;

import com.learningcurve.domain.layout.TrilhaLayout;
import com.learningcurve.domain.model.TrilhaModel;

/**
 * Objeto de domínio que encapsula tanto o modelo de negócio quanto o layout de apresentação.
 */
public record TrilhaCompleta(
        TrilhaModel modelo,
        TrilhaLayout layout
) {}