package com.learningcurve.repository;

import com.learningcurve.entity.TrilhaEntidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório Spring Data JPA para a entidade principal 'TrilhaEntidade'.
 * Fornece os métodos CRUD básicos para interagir com a tabela 'trilha_model'.
 */
@Repository
public interface TrilhaRepository extends JpaRepository<TrilhaEntidade, Long> {
}