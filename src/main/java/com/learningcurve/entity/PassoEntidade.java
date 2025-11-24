package com.learningcurve.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

/**
 * Entidade JPA para rastreamento de referências.
 * Mapeada para a tabela 'paths_passos'.
 * Permite identificar dependências entre Trilhas e outros elementos.
 */
@Entity
@Table(name = "paths_passos", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"trilha_pai_id", "passo_referenciado_id", "tipo_passo"})
})
public class PassoEntidade {

    // Enum mapeando os tipos de nós do modelo conceitual
    public enum TipoPassoReferencia {
        CONTEUDO,
        TRILHA,
        ASSUNTO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference("trilha-passo")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trilha_pai_id", nullable = false)
    private TrilhaEntidade trilhaPai;

    // ID externo do recurso referenciado
    @Column(name = "passo_referenciado_id", nullable = false)
    private String idDoPassoReferenciado;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_passo", nullable = false)
    private TipoPassoReferencia tipoPasso;

    // Construtores
    public PassoEntidade() {
    }

    public PassoEntidade(TrilhaEntidade trilhaPai, String idDoPassoReferenciado, TipoPassoReferencia tipoPasso) {
        this.trilhaPai = trilhaPai;
        this.idDoPassoReferenciado = idDoPassoReferenciado;
        this.tipoPasso = tipoPasso;
    }

    // Métodos acessores (Getters e Setters)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TrilhaEntidade getTrilhaPai() { return trilhaPai; }
    public void setTrilhaPai(TrilhaEntidade trilhaPai) { this.trilhaPai = trilhaPai; }
    public String getIdDoPassoReferenciado() { return idDoPassoReferenciado; }
    public void setIdDoPassoReferenciado(String idDoPassoReferenciado) { this.idDoPassoReferenciado = idDoPassoReferenciado; }
    public TipoPassoReferencia getTipoPasso() { return tipoPasso; }
    public void setTipoPasso(TipoPassoReferencia tipoPasso) { this.tipoPasso = tipoPasso; }
}