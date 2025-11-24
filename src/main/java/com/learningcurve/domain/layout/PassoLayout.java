package com.learningcurve.domain.layout;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * Record que armazena as propriedades visuais de um passo no diagrama.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PassoLayout(
        String idDoPasso,
        double left,
        double top,
        double angle,
        double scaleX,
        double scaleY,
        String fill,
        String stroke,
        double strokeWidth,
        List<Number> strokeDashArray,
        String textoBase
) {}