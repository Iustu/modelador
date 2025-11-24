package com.learningcurve.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningcurve.DTO.TrilhaInputDTO;
import com.learningcurve.DTO.TrilhaOutputDTO;
import com.learningcurve.domain.TrilhaCompleta;
import com.learningcurve.domain.layout.TrilhaLayout;
import com.learningcurve.domain.model.PassoModel;
import com.learningcurve.domain.model.TrilhaModel;
import com.learningcurve.entity.CaminhoEntidade;
import com.learningcurve.entity.PassoEntidade;
import com.learningcurve.entity.TrilhaEntidade;
import com.learningcurve.mapper.TrilhaMapper;
import com.learningcurve.repository.CaminhoRepository;
import com.learningcurve.repository.PassoRepository;
import com.learningcurve.repository.TrilhaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Camada de Serviço: Orquestra a lógica de negócio e a persistência das trilhas.
 * Refatorada para utilizar o modelo genérico PassoModel.
 */
@Service
public class TrilhaService {

    private static final Logger registrador = LoggerFactory.getLogger(TrilhaService.class);

    @Autowired
    private TrilhaRepository repositorioTrilha;
    @Autowired
    private PassoRepository repositorioPasso;
    @Autowired
    private CaminhoRepository repositorioCaminho;
    @Autowired
    private ObjectMapper mapeadorJson;
    @Autowired
    private LayoutJsonService servicoLayoutJson;

    // Salva uma nova trilha no banco de dados
    @Transactional
    public TrilhaOutputDTO salvarTrilha(TrilhaInputDTO dtoEntrada) {
        TrilhaCompleta trilhaCompleta = TrilhaMapper.converterDeInputDTO(dtoEntrada);
        TrilhaEntidade novaEntidade = new TrilhaEntidade();

        mapearDominioParaEntidadeJson(trilhaCompleta, novaEntidade);
        adicionarPassosReferenciados(trilhaCompleta, novaEntidade);
        adicionarCaminhos(trilhaCompleta, novaEntidade);

        TrilhaEntidade entidadeSalva = repositorioTrilha.save(novaEntidade);
        registrador.info("Trilha salva com sucesso com o ID: {}", entidadeSalva.getId());
        return TrilhaMapper.converterParaOutputDTO(entidadeSalva, mapeadorJson);
    }

    // Busca uma trilha pelo ID
    @Transactional(readOnly = true)
    public TrilhaOutputDTO buscarPorId(Long id) {
        registrador.info("Buscando trilha com ID: {}", id);
        TrilhaEntidade entidadeEncontrada = repositorioTrilha.findById(id)
                .orElseThrow(() -> {
                    registrador.warn("Trilha não encontrada com o ID: {}", id);
                    return new EntityNotFoundException("Trilha não encontrada com o id: " + id);
                });
        return TrilhaMapper.converterParaOutputDTO(entidadeEncontrada, mapeadorJson);
    }

    // Busca todas as trilhas cadastradas
    @Transactional(readOnly = true)
    public List<TrilhaOutputDTO> buscarTodas() {
        registrador.info("Buscando todas as trilhas.");
        List<TrilhaEntidade> todasEntidades = repositorioTrilha.findAll();
        registrador.info("{} trilhas encontradas no banco de dados.", todasEntidades.size());
        return todasEntidades.stream()
                .map(entidade -> TrilhaMapper.converterParaOutputDTO(entidade, mapeadorJson))
                .collect(Collectors.toList());
    }

    // Atualiza uma trilha existente
    @Transactional
    public TrilhaOutputDTO atualizarTrilha(Long id, TrilhaInputDTO dtoEntrada) {
        TrilhaCompleta trilhaAtualizada = TrilhaMapper.converterDeInputDTO(dtoEntrada);
        TrilhaEntidade entidadeExistente = repositorioTrilha.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada para atualização com o id: " + id));

        final String nomeAntigo = entidadeExistente.getTituloDiagrama();
        final String nomeNovo = trilhaAtualizada.modelo().tituloDiagrama();

        // Verifica se houve mudança de nome para propagar a alteração
        if (nomeAntigo != null && !nomeAntigo.equals(nomeNovo)) {
            registrador.info("Título da trilha {} mudou de '{}' para '{}'. Propagando alteração.", id, nomeAntigo, nomeNovo);
            propagarMudancaDeNome(String.valueOf(id), nomeNovo);
        }

        mapearDominioParaEntidadeJson(trilhaAtualizada, entidadeExistente);
        atualizarColecaoPassosReferenciados(trilhaAtualizada, entidadeExistente);
        atualizarColecaoCaminhos(trilhaAtualizada, entidadeExistente);

        TrilhaEntidade entidadeSalva = repositorioTrilha.save(entidadeExistente);
        registrador.info("Trilha com ID: {} atualizada com sucesso.", entidadeSalva.getId());
        return TrilhaMapper.converterParaOutputDTO(entidadeSalva, mapeadorJson);
    }

    // Deleta uma trilha pelo ID
    @Transactional
    public void deletarPorId(Long id) {
        registrador.info("Tentando deletar a trilha com ID: {}", id);

        if (!repositorioTrilha.existsById(id)) {
            registrador.warn("Trilha não encontrada para deleção com o ID: {}", id);
            throw new EntityNotFoundException("Trilha não encontrada para deleção com o id: " + id);
        }

        // Verifica se esta trilha é usada como sub-trilha em outro diagrama
        List<PassoEntidade> referencias = repositorioPasso.findByIdDoPassoReferenciadoAndTipoPasso(
                String.valueOf(id),
                PassoEntidade.TipoPassoReferencia.TRILHA
        );

        if (!referencias.isEmpty()) {
            String trilhasQueReferenciam = referencias.stream()
                    .map(ref -> ref.getTrilhaPai().getTituloDiagrama() + " (ID: " + ref.getTrilhaPai().getId() + ")")
                    .collect(Collectors.joining(", "));
            registrador.warn("Tentativa de apagar a trilha ID {}, mas ela está sendo referenciada por: {}", id, trilhasQueReferenciam);
            throw new IllegalStateException("Esta trilha não pode ser apagada pois está sendo referenciada por outra(s): " + trilhasQueReferenciam);
        }

        repositorioTrilha.deleteById(id);
        registrador.info("Trilha com ID: {} deletada com sucesso.", id);
    }

    // Propaga a mudança de nome para outras trilhas que referenciam esta
    private void propagarMudancaDeNome(String idDaTrilhaRenomeada, String nomeNovo) {
        List<PassoEntidade> referencias = repositorioPasso.findByIdDoPassoReferenciadoAndTipoPasso(
                idDaTrilhaRenomeada,
                PassoEntidade.TipoPassoReferencia.TRILHA
        );
        registrador.debug("Encontradas {} trilhas que referenciam a trilha ID {}.", referencias.size(), idDaTrilhaRenomeada);

        for (PassoEntidade referencia : referencias) {
            TrilhaEntidade trilhaPai = referencia.getTrilhaPai();
            try {
                List<PassoModel> passosDoModelo = mapeadorJson.readValue(trilhaPai.getPassosJson(),
                        mapeadorJson.getTypeFactory().constructCollectionType(List.class, PassoModel.class));

                // Procura o passo específico que é a referência (usando tipoPasso e idReferencia)
                Optional<String> idDoPassoParaAtualizarOpt = passosDoModelo.stream()
                        .filter(p -> "trilha".equals(p.getTipoPasso()) && idDaTrilhaRenomeada.equals(p.getIdReferencia()))
                        .map(PassoModel::getId)
                        .findFirst();

                if (idDoPassoParaAtualizarOpt.isPresent()) {
                    String idDoPasso = idDoPassoParaAtualizarOpt.get();
                    boolean layoutFoiAtualizado = servicoLayoutJson.atualizarTextoBaseNoLayout(
                            trilhaPai,
                            idDoPasso,
                            nomeNovo
                    );

                    if (layoutFoiAtualizado) {
                        repositorioTrilha.save(trilhaPai);
                        registrador.info("Atualizado o nome da trilha referenciada em '{}' (ID: {}).", trilhaPai.getTituloDiagrama(), trilhaPai.getId());
                    }
                }
            } catch (IOException e) {
                registrador.error("Falha ao processar o JSON de *modelo* da trilha pai com ID: {}", trilhaPai.getId(), e);
                throw new RuntimeException("Falha ao propagar mudança de nome (leitura do modelo).", e);
            } catch (RuntimeException e) {
                registrador.error("Falha ao processar o JSON de *layout* da trilha pai com ID: {}", trilhaPai.getId(), e);
                throw e;
            }
        }
    }

    // Cria as relações de PassoEntidade para o banco relacional
    private void adicionarPassosReferenciados(TrilhaCompleta trilha, TrilhaEntidade entidade) {
        registrador.debug("Adicionando passos referenciados para a trilha: {}", entidade.getTituloDiagrama());

        trilha.modelo().passos().forEach(passo -> {
            String idReferencia = obterReferenciaParaPasso(passo);
            PassoEntidade.TipoPassoReferencia tipo = obterTipoPassoReferencia(passo);

            if (idReferencia != null && tipo != null) {
                PassoEntidade relacionamento = new PassoEntidade(entidade, idReferencia, tipo);
                entidade.getPassosReferenciados().add(relacionamento);
            }
        });
    }

    // Cria as relações de CaminhoEntidade para o banco relacional
    private void adicionarCaminhos(TrilhaCompleta trilha, TrilhaEntidade entidade) {
        registrador.debug("Adicionando caminhos iniciais para a trilha: {}", entidade.getTituloDiagrama());
        trilha.modelo().caminhos().forEach(caminho -> {
            CaminhoEntidade caminhoEntidade = new CaminhoEntidade(
                    entidade,
                    caminho.de(),
                    caminho.para(),
                    caminho.tipoCaminho(),
                    caminho.eHierarquia()
            );
            entidade.getCaminhos().add(caminhoEntidade);
        });
    }

    // Serializa os objetos de domínio para JSONs na entidade
    private void mapearDominioParaEntidadeJson(TrilhaCompleta trilha, TrilhaEntidade entidade) {
        registrador.debug("Mapeando objeto de domínio para entidade. Título: '{}'", trilha.modelo().tituloDiagrama());
        TrilhaModel modelo = trilha.modelo();
        TrilhaLayout layout = trilha.layout();

        entidade.setTituloDiagrama(modelo.tituloDiagrama());
        try {
            entidade.setPassosJson(mapeadorJson.writeValueAsString(modelo.passos()));
            entidade.setFluxoJson(mapeadorJson.writeValueAsString(modelo.fluxos()));
            entidade.setCaminhosJson(mapeadorJson.writeValueAsString(modelo.caminhos()));
            entidade.setLayoutJson(mapeadorJson.writeValueAsString(layout));
        } catch (JsonProcessingException e) {
            registrador.error("Erro fatal ao serializar modelo para JSON para a trilha: '{}'", modelo.tituloDiagrama(), e);
            throw new RuntimeException("Erro ao serializar modelo para JSON", e);
        }
    }

    // Atualiza a lista de passos referenciados (removendo antigos e adicionando novos)
    private void atualizarColecaoPassosReferenciados(TrilhaCompleta trilha, TrilhaEntidade entidade) {
        Set<String> chavesNovas = trilha.modelo().passos().stream()
                .map(passo -> {
                    String idRef = obterReferenciaParaPasso(passo);
                    PassoEntidade.TipoPassoReferencia tipo = obterTipoPassoReferencia(passo);
                    return (idRef != null && tipo != null) ? idRef + "::" + tipo.name() : null;
                })
                .filter(key -> key != null)
                .collect(Collectors.toSet());

        List<PassoEntidade> itensAtuais = new ArrayList<>(entidade.getPassosReferenciados());
        for (PassoEntidade itemExistente : itensAtuais) {
            String chaveExistente = itemExistente.getIdDoPassoReferenciado() + "::" + itemExistente.getTipoPasso().name();
            if (!chavesNovas.contains(chaveExistente)) {
                entidade.getPassosReferenciados().remove(itemExistente);
            }
        }

        chavesNovas.forEach(chaveComposta -> {
            String idRef = chaveComposta.split("::")[0];
            PassoEntidade.TipoPassoReferencia tipo = PassoEntidade.TipoPassoReferencia.valueOf(chaveComposta.split("::")[1]);

            boolean existe = entidade.getPassosReferenciados().stream()
                    .anyMatch(item -> item.getIdDoPassoReferenciado().equals(idRef) && item.getTipoPasso() == tipo);

            if (!existe) {
                PassoEntidade novoItem = new PassoEntidade(entidade, idRef, tipo);
                entidade.getPassosReferenciados().add(novoItem);
            }
        });
    }

    // Atualiza a lista de caminhos (setas)
    private void atualizarColecaoCaminhos(TrilhaCompleta trilha, TrilhaEntidade entidade) {
        Set<String> chavesNovas = trilha.modelo().caminhos().stream()
                .map(cam -> cam.de() + "->" + cam.para() + "::H" + cam.eHierarquia() + "::P" + cam.tipoCaminho())
                .collect(Collectors.toSet());

        List<CaminhoEntidade> caminhosAtuais = new ArrayList<>(entidade.getCaminhos());
        for (CaminhoEntidade camExistente : caminhosAtuais) {
            String chaveExistente = camExistente.getDe() + "->" + camExistente.getPara() + "::H" + camExistente.iseHierarquia() + "::P" + camExistente.getTipoCaminho();
            if (!chavesNovas.contains(chaveExistente)) {
                entidade.getCaminhos().remove(camExistente);
            }
        }

        trilha.modelo().caminhos().forEach(caminho -> {
            String chaveNova = caminho.de() + "->" + caminho.para() + "::H" + caminho.eHierarquia() + "::P" + caminho.tipoCaminho();
            boolean existe = entidade.getCaminhos().stream()
                    .anyMatch(cam -> (cam.getDe() + "->" + cam.getPara() + "::H" + cam.iseHierarquia() + "::P" + cam.getTipoCaminho()).equals(chaveNova));

            if (!existe) {
                CaminhoEntidade novoCaminho = new CaminhoEntidade(
                        entidade,
                        caminho.de(),
                        caminho.para(),
                        caminho.tipoCaminho(),
                        caminho.eHierarquia()
                );
                entidade.getCaminhos().add(novoCaminho);
            }
        });
    }

    // Helper simplificado para extrair ID de referência (agora centralizado na classe genérica)
    private String obterReferenciaParaPasso(PassoModel passo) {
        if (passo == null) return null;

        if ("content".equals(passo.getTipoPasso()) || "trilha".equals(passo.getTipoPasso())) {
            return passo.getIdReferencia();
        } else if ("subject".equals(passo.getTipoPasso())) {
            return passo.getId();
        }
        return null;
    }

    // Helper simplificado para determinar o tipo de referência usando strings
    private PassoEntidade.TipoPassoReferencia obterTipoPassoReferencia(PassoModel passo) {
        if (passo == null || passo.getTipoPasso() == null) return null;
        switch (passo.getTipoPasso()) {
            case "content": return PassoEntidade.TipoPassoReferencia.CONTEUDO;
            case "trilha": return PassoEntidade.TipoPassoReferencia.TRILHA;
            case "subject": return PassoEntidade.TipoPassoReferencia.ASSUNTO;
            default: return null;
        }
    }
}