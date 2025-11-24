package com.learningcurve.domain.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * Classe genérica que representa qualquer tipo de passo na Trilha (Assunto, Conteúdo ou Sub-trilha).
 *
 * NOTA: Seguindo a orientação de simplificação, esta classe unifica os atributos de todos os tipos.
 * Campos não utilizados por um tipo específico ficarão nulos.
 * A serialização ignora campos nulos (@JsonInclude(NON_NULL)) para manter o JSON limpo.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PassoModel {

    // Identificador único do passo
    private String id;

    // Tipo do passo: "subject", "content" ou "trilha"
    private String tipoPasso;

    // ID do pai para reconstrução da hierarquia visual
    private String idDoPai;

    // --- Atributos específicos de ASSUNTO ("subject") ---

    // Lista de IDs dos passos filhos (apenas para Assuntos)
    private List<String> idsDosFilhos;

    // Regra de navegação (MULTIPLA, EXCLUSIVA, OBRIGATORIA)
    private String tipoSelecao;

    // --- Atributos específicos de CONTEÚDO ("content") e TRILHA ("trilha") ---

    // Referência externa (UUID do conteúdo ou ID da trilha)
    private String idReferencia;


    // Construtores
    public PassoModel() {}

    // Métodos acessores (Getters e Setters)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTipoPasso() { return tipoPasso; }
    public void setTipoPasso(String tipoPasso) { this.tipoPasso = tipoPasso; }

    public String getIdDoPai() { return idDoPai; }
    public void setIdDoPai(String idDoPai) { this.idDoPai = idDoPai; }

    public List<String> getIdsDosFilhos() { return idsDosFilhos; }
    public void setIdsDosFilhos(List<String> idsDosFilhos) { this.idsDosFilhos = idsDosFilhos; }

    public String getTipoSelecao() { return tipoSelecao; }
    public void setTipoSelecao(String tipoSelecao) { this.tipoSelecao = tipoSelecao; }

    public String getIdReferencia() { return idReferencia; }
    public void setIdReferencia(String idReferencia) { this.idReferencia = idReferencia; }
}