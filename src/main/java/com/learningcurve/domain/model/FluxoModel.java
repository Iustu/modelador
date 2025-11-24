package com.learningcurve.domain.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Representa os nós de controle de fluxo (Início e Fim).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FluxoModel {

    @JsonProperty("id")
    private String id;

    // Define se é 'start' ou 'end'
    @JsonProperty("tipoCustomizado")
    private String tipoCustomizado;

    // Construtores
    public FluxoModel() {}

    public FluxoModel(String id, String tipoCustomizado) {
        this.id = id;
        this.tipoCustomizado = tipoCustomizado;
    }

    // Métodos acessores (Getters e Setters)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTipoCustomizado() { return tipoCustomizado; }
    public void setTipoCustomizado(String tipoCustomizado) { this.tipoCustomizado = tipoCustomizado; }
}