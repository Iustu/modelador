package com.learningcurve.repository;

import com.learningcurve.entity.PassoEntidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositório Spring Data JPA para a entidade 'PassoEntidade'.
 * Gere a tabela 'trilha_item_relacionamento', que rastreia referências.
 */
@Repository
public interface PassoRepository extends JpaRepository<PassoEntidade, Long> {

    // Encontra entidades de referência por ID e tipo do passo
    List<PassoEntidade> findByIdDoPassoReferenciadoAndTipoPasso(String idDoPassoReferenciado, PassoEntidade.TipoPassoReferencia tipoPasso);
}