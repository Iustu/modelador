package com.learningcurve.controller;

import com.learningcurve.DTO.TrilhaOutputDTO;
import com.learningcurve.DTO.TrilhaInputDTO;
import com.learningcurve.service.TrilhaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para gerenciar os endpoints da API /api/trilhas.
 * Responsável por receber requisições HTTP, validar o DTO de entrada
 * e delegar o processamento para a camada de Serviço.
 */
@RestController
@RequestMapping("/api/trilhas")
@CrossOrigin(origins = "*")
public class TrilhaController {

    @Autowired
    private TrilhaService servicoTrilha;

    // Endpoint para salvar uma nova trilha
    @PostMapping
    public ResponseEntity<TrilhaOutputDTO> salvarTrilha(@RequestBody TrilhaInputDTO dtoEntrada) {
        TrilhaOutputDTO dtoSaida = servicoTrilha.salvarTrilha(dtoEntrada);
        return ResponseEntity.ok(dtoSaida);
    }

    // Endpoint para buscar uma trilha pelo ID
    @GetMapping("/{id}")
    public ResponseEntity<TrilhaOutputDTO> buscarTrilhaPorId(@PathVariable Long id) {
        TrilhaOutputDTO dtoSaida = servicoTrilha.buscarPorId(id);
        return ResponseEntity.ok(dtoSaida);
    }

    // Endpoint para buscar todas as trilhas
    @GetMapping
    public ResponseEntity<List<TrilhaOutputDTO>> buscarTodasAsTrilhas() {
        List<TrilhaOutputDTO> listaSaida = servicoTrilha.buscarTodas();
        return ResponseEntity.ok(listaSaida);
    }

    // Endpoint para atualizar uma trilha existente
    @PutMapping("/{id}")
    public ResponseEntity<TrilhaOutputDTO> atualizarTrilha(@PathVariable Long id, @RequestBody TrilhaInputDTO dtoEntrada) {
        TrilhaOutputDTO dtoSaida = servicoTrilha.atualizarTrilha(id, dtoEntrada);
        return ResponseEntity.ok(dtoSaida);
    }

    // Endpoint para deletar uma trilha pelo ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarTrilha(@PathVariable Long id) {
        servicoTrilha.deletarPorId(id);
        return ResponseEntity.noContent().build();
    }

    // Manipulador de exceção para conflitos (ex: tentar deletar trilha referenciada)
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> tratarEstadoIlegal(IllegalStateException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ex.getMessage());
    }
}