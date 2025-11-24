package com.learningcurve.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

/**
 * Entidade JPA para os Caminhos (setas).
 * Mapeada para a tabela 'paths_caminhos'.
 */
@Entity
@Table(name = "paths_caminhos")
public class CaminhoEntidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference("trilha-caminho")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trilha_pai_id", nullable = false)
    private TrilhaEntidade trilhaPai;

    // ID do passo de origem
    @Column(name = "de_id", nullable = false)
    private String de;

    // ID do passo de destino
    @Column(name = "para_id", nullable = false)
    private String para;

    // Tipo de caminho (ex: "OBRIGATORIO", "PREFERENCIAL")
    @Column(name = "tipo_caminho")
    private String tipoCaminho;

    // Indica se é um caminho hierárquico (tracejado)
    @Column(name = "e_hierarquia")
    private boolean eHierarquia;

    // Construtores
    public CaminhoEntidade() {
    }

    public CaminhoEntidade(TrilhaEntidade trilhaPai, String de, String para, String tipoCaminho, boolean eHierarquia) {
        this.trilhaPai = trilhaPai;
        this.de = de;
        this.para = para;
        this.tipoCaminho = tipoCaminho;
        this.eHierarquia = eHierarquia;
    }

    // Métodos acessores (Getters e Setters)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TrilhaEntidade getTrilhaPai() { return trilhaPai; }
    public void setTrilhaPai(TrilhaEntidade trilhaPai) { this.trilhaPai = trilhaPai; }
    public String getDe() { return de; }
    public void setDe(String de) { this.de = de; }
    public String getPara() { return para; }
    public void setPara(String para) { this.para = para; }
    public String getTipoCaminho() { return tipoCaminho; }
    public void setTipoCaminho(String tipoCaminho) { this.tipoCaminho = tipoCaminho; }
    public boolean iseHierarquia() { return eHierarquia; }
    public void seteHierarquia(boolean eHierarquia) { this.eHierarquia = eHierarquia; }
}