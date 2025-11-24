package com.learningcurve.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningcurve.DTO.CaminhoDTO;
import com.learningcurve.DTO.ObjetoDiagramaDTO;
import com.learningcurve.DTO.TrilhaInputDTO;
import com.learningcurve.DTO.TrilhaOutputDTO;
import com.learningcurve.domain.TrilhaCompleta;
import com.learningcurve.domain.layout.FluxoLayout;
import com.learningcurve.domain.layout.PassoLayout;
import com.learningcurve.domain.layout.TrilhaLayout;
import com.learningcurve.domain.model.CaminhoModel;
import com.learningcurve.domain.model.FluxoModel;
import com.learningcurve.domain.model.PassoModel;
import com.learningcurve.domain.model.TrilhaModel;
import com.learningcurve.entity.TrilhaEntidade;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Classe utilitária responsável por converter DTOs em objetos de domínio e vice-versa.
 * Atualizada para lidar com a classe genérica PassoModel.
 */
public class TrilhaMapper {

    private static final Logger registrador = LoggerFactory.getLogger(TrilhaMapper.class);

    // Converte DTO de entrada para o objeto de domínio TrilhaCompleta
    public static TrilhaCompleta converterDeInputDTO(TrilhaInputDTO dtoEntrada) {
        if (dtoEntrada == null) return null;

        List<PassoModel> listaPassos = new ArrayList<>();
        List<FluxoModel> listaFluxos = new ArrayList<>();
        List<PassoLayout> listaLayoutPassos = new ArrayList<>();
        List<FluxoLayout> listaLayoutFluxos = new ArrayList<>();

        List<ObjetoDiagramaDTO> objetosDiagrama =
                dtoEntrada.objetosDoDiagrama() != null ? dtoEntrada.objetosDoDiagrama() : Collections.emptyList();

        for (ObjetoDiagramaDTO dto : objetosDiagrama) {
            String tipo = dto.tipoCustomizado();

            // Se for um nó de fluxo (Início/Fim), tratamos separado
            if ("start".equals(tipo) || "end".equals(tipo)) {
                listaFluxos.add(criarFluxoModel(dto));
                listaLayoutFluxos.add(criarFluxoLayout(dto));
            } else {
                // Para qualquer outro tipo (subject, content, trilha), usamos o modelo genérico
                listaPassos.add(criarPassoModelGenerico(dto));
                listaLayoutPassos.add(criarPassoLayout(dto));
            }
        }

        List<CaminhoDTO> caminhosDto =
                dtoEntrada.caminhos() != null ? dtoEntrada.caminhos() : Collections.emptyList();

        List<CaminhoModel> listaCaminhos = caminhosDto.stream()
                .map(TrilhaMapper::criarCaminhoModel)
                .collect(Collectors.toList());

        TrilhaModel modelo = new TrilhaModel(
                dtoEntrada.tituloDiagrama(),
                listaPassos,
                listaCaminhos,
                listaFluxos
        );

        TrilhaLayout layout = new TrilhaLayout(listaLayoutPassos, listaLayoutFluxos);

        return new TrilhaCompleta(modelo, layout);
    }

    // Converte a entidade persistida para o DTO de saída
    public static TrilhaOutputDTO converterParaOutputDTO(TrilhaEntidade entidade, ObjectMapper objectMapper) {
        try {
            List<PassoModel> passos = entidade.getPassosJson() != null ?
                    objectMapper.readValue(entidade.getPassosJson(), objectMapper.getTypeFactory().constructCollectionType(List.class, PassoModel.class)) : new ArrayList<>();
            List<FluxoModel> fluxos = entidade.getFluxoJson() != null ?
                    objectMapper.readValue(entidade.getFluxoJson(), objectMapper.getTypeFactory().constructCollectionType(List.class, FluxoModel.class)) : new ArrayList<>();
            List<CaminhoModel> caminhos = entidade.getCaminhosJson() != null ?
                    objectMapper.readValue(entidade.getCaminhosJson(), objectMapper.getTypeFactory().constructCollectionType(List.class, CaminhoModel.class)) : new ArrayList<>();
            TrilhaLayout layout = entidade.getLayoutJson() != null ?
                    objectMapper.readValue(entidade.getLayoutJson(), TrilhaLayout.class) : new TrilhaLayout(new ArrayList<>(), new ArrayList<>());

            TrilhaModel modelo = new TrilhaModel(entidade.getTituloDiagrama(), passos, caminhos, fluxos);
            TrilhaCompleta dados = new TrilhaCompleta(modelo, layout);
            return new TrilhaOutputDTO(entidade.getId(), dados);
        } catch (JsonProcessingException e) {
            registrador.error("Erro ao converter entidade para DTO", e);
            throw new RuntimeException("Erro ao processar dados da trilha.", e);
        }
    }

    // Cria um PassoModel genérico mapeando todos os campos possíveis do DTO
    private static PassoModel criarPassoModelGenerico(ObjetoDiagramaDTO dto) {
        PassoModel passo = new PassoModel();
        passo.setId(dto.id());
        passo.setTipoPasso(dto.tipoCustomizado());
        passo.setIdDoPai(dto.idDoPai());

        // Campos específicos de Assunto
        if ("subject".equals(dto.tipoCustomizado())) {
            passo.setIdsDosFilhos(dto.idsDosFilhos());
            passo.setTipoSelecao(dto.tipoSelecao());
        }

        // Campos específicos de Conteúdo ou Trilha (Referência)
        if ("content".equals(dto.tipoCustomizado())) {
            passo.setIdReferencia(dto.idConteudo());
        } else if ("trilha".equals(dto.tipoCustomizado())) {
            passo.setIdReferencia(dto.idTrilha());
        }

        return passo;
    }

    private static PassoLayout criarPassoLayout(ObjetoDiagramaDTO dto) {
        return new PassoLayout(
                dto.id(), dto.left(), dto.top(), dto.angle(), dto.scaleX(), dto.scaleY(),
                dto.fill(), dto.stroke(), dto.strokeWidth(), dto.strokeDashArray(), dto.textoBase()
        );
    }

    private static FluxoModel criarFluxoModel(ObjetoDiagramaDTO dto) {
        FluxoModel fluxo = new FluxoModel();
        fluxo.setId(dto.id());
        fluxo.setTipoCustomizado(dto.tipoCustomizado());
        return fluxo;
    }

    private static FluxoLayout criarFluxoLayout(ObjetoDiagramaDTO dto) {
        return new FluxoLayout(
                dto.id(), dto.left(), dto.top(), dto.angle(), dto.scaleX(), dto.scaleY()
        );
    }

    private static CaminhoModel criarCaminhoModel(CaminhoDTO dto) {
        return new CaminhoModel(dto.de(), dto.para(), dto.tipoCaminho(), dto.eHierarquia());
    }
}