package com.learningcurve.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * DTO raiz para receber a estrutura completa de uma trilha vinda do frontend.
 */
public record TrilhaInputDTO(
        @NotBlank(message = "O título do diagrama não pode ser vazio.")
        @Size(max = 255, message = "O título do diagrama deve ter no máximo 255 caracteres.")
        @JsonProperty("tituloDiagrama")
        String tituloDiagrama,

        @NotEmpty
        @Valid
        @JsonProperty("objetosDiagrama")
        List<ObjetoDiagramaDTO> objetosDoDiagrama,

        @Valid
        @JsonProperty("caminhos")
        List<CaminhoDTO> caminhos
) {}