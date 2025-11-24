package com.learningcurve.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.ArrayList;
import java.util.List;

/*
 * Entidade JPA principal que representa uma 'Trilha de Aprendizagem'.
 * Mapeada para a tabela 'paths_trilhas'.
 *
 * ESTRATÉGIA DE PERSISTÊNCIA (Híbrida):
 * 1. Estrutura Visual e Lógica (JSON): Passos, Fluxo, Caminhos e Layout são armazenados
 * como documentos JSON (jsonb no PostgreSQL). Isso permite flexibilidade para o
 * modelo gráfico do canvas e performance na leitura (reconstrução rápida).
 *
 * 2. Relacionamentos Estruturais (SQL): Caminhos e Passos Referenciados são também
 * mapeados em tabelas relacionais (@OneToMany) para permitir consultas de integridade
 * e relatórios (ex: "Quais trilhas usam este conteúdo?").
 */
@Entity
@Table(name = "paths_trilhas")
public class TrilhaEntidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "titulo_diagrama")
    private String tituloDiagrama;

    // Armazena a lista polimórfica de PassoModel (Assunto, Conteúdo, Trilha)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "passos_json")
    private String passosJson;

    // Armazena os nós de controle de fluxo (Início, Fim)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fluxo_json")
    private String fluxoJson;

    // Armazena a lista de CaminhoModel (Setas e suas propriedades como 'tipoCaminho')
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "caminhos_json")
    private String caminhosJson;

    // Armazena o objeto TrilhaLayout (Coordenadas X/Y, cores, tamanhos)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "layout_json")
    private String layoutJson;

    // Relação SQL para integridade referencial (impede apagar trilhas/conteúdos em uso)
    @JsonManagedReference("trilha-passo")
    @OneToMany(mappedBy = "trilhaPai", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PassoEntidade> passosReferenciados = new ArrayList<>();

    // Relação SQL para consultas sobre conexões
    @JsonManagedReference("trilha-caminho")
    @OneToMany(mappedBy = "trilhaPai", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CaminhoEntidade> caminhos = new ArrayList<>();

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTituloDiagrama() { return tituloDiagrama; }
    public void setTituloDiagrama(String tituloDiagrama) { this.tituloDiagrama = tituloDiagrama; }
    public String getPassosJson() { return passosJson; }
    public void setPassosJson(String passosJson) { this.passosJson = passosJson; }
    public String getFluxoJson() { return fluxoJson; }
    public void setFluxoJson(String fluxoJson) { this.fluxoJson = fluxoJson; }
    public String getCaminhosJson() { return caminhosJson; }
    public void setCaminhosJson(String caminhosJson) { this.caminhosJson = caminhosJson; }
    public String getLayoutJson() { return layoutJson; }
    public void setLayoutJson(String layoutJson) { this.layoutJson = layoutJson; }
    public List<PassoEntidade> getPassosReferenciados() { return passosReferenciados; }
    public void setPassosReferenciados(List<PassoEntidade> passosReferenciados) { this.passosReferenciados = passosReferenciados; }
    public List<CaminhoEntidade> getCaminhos() { return caminhos; }
    public void setCaminhos(List<CaminhoEntidade> caminhos) { this.caminhos = caminhos; }
}