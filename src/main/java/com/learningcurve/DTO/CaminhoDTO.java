package com.learningcurve.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO para desserializar os dados de uma seta (Caminho) vindos do frontend.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CaminhoDTO(
        @JsonProperty("de") String de,
        @JsonProperty("para") String para,
        @JsonProperty("tipoCaminho") String tipoCaminho,
        @JsonProperty("eHierarquia") boolean eHierarquia,
        @JsonProperty("subtipoSeta") String subtipoSeta
) {
}