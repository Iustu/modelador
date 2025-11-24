package com.learningcurve.repository;

import com.learningcurve.entity.CaminhoEntidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório Spring Data JPA para a entidade 'CaminhoEntidade'.
 * Gere a tabela 'trilha_arrow'.
 */
@Repository
public interface CaminhoRepository extends JpaRepository<CaminhoEntidade, Long> {
}