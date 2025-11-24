package com.learningcurve.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * DTO responsável por transportar os dados de um nó do diagrama.
 * Combina dados de negócio e dados visuais.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ObjetoDiagramaDTO(
        // Dados do Modelo Conceitual
        @JsonProperty("id") String id,
        @JsonProperty("tipoCustomizado") String tipoCustomizado,
        @JsonProperty("textoBase") String textoBase,
        @JsonProperty("idDoPai") String idDoPai,
        @JsonProperty("idsDosFilhos") List<String> idsDosFilhos,
        @JsonProperty("idConteudo") String idConteudo,
        @JsonProperty("idTrilha") String idTrilha,
        @JsonProperty("tipoSelecao") String tipoSelecao,

        // Dados de Apresentação (Visual)
        @JsonProperty("type") String type,
        @JsonProperty("left") double left,
        @JsonProperty("top") double top,
        @JsonProperty("scaleX") double scaleX,
        @JsonProperty("scaleY") double scaleY,
        @JsonProperty("angle") double angle,
        @JsonProperty("fill") String fill,
        @JsonProperty("stroke") String stroke,
        @JsonProperty("strokeWidth") double strokeWidth,
        @JsonProperty("strokeDashArray") List<Number> strokeDashArray
) {}