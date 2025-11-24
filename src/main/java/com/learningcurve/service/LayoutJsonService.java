package com.learningcurve.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningcurve.domain.layout.PassoLayout;
import com.learningcurve.domain.layout.TrilhaLayout;
import com.learningcurve.entity.TrilhaEntidade;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Serviço focado em manipular a lógica de atualização de JSONs de Layout.
 * Extraído do TrilhaService para maior coesão e testabilidade.
 */
@Service
public class LayoutJsonService {

    private static final Logger registrador = LoggerFactory.getLogger(LayoutJsonService.class);

    @Autowired
    private ObjectMapper mapeadorJson;

    // Atualiza o texto base de um passo específico no JSON de layout
    public boolean atualizarTextoBaseNoLayout(TrilhaEntidade trilhaPai, String idDoPassoParaAtualizar, String nomeNovo) {
        try {
            TrilhaLayout layoutAntigo = mapeadorJson.readValue(trilhaPai.getLayoutJson(), TrilhaLayout.class);
            List<PassoLayout> layoutPassos = new ArrayList<>(layoutAntigo.layoutPassos());
            boolean atualizado = false;

            for (int i = 0; i < layoutPassos.size(); i++) {
                PassoLayout layoutPasso = layoutPassos.get(i);
                if (idDoPassoParaAtualizar.equals(layoutPasso.idDoPasso())) {

                    // Otimização: Só atualiza se o nome for realmente diferente
                    if (nomeNovo.equals(layoutPasso.textoBase())) {
                        registrador.debug("Texto base já está atualizado para o passo {} na trilha {}.", idDoPassoParaAtualizar, trilhaPai.getId());
                        return false;
                    }

                    PassoLayout novoLayoutPasso = new PassoLayout(
                            layoutPasso.idDoPasso(),
                            layoutPasso.left(),
                            layoutPasso.top(),
                            layoutPasso.angle(),
                            layoutPasso.scaleX(),
                            layoutPasso.scaleY(),
                            layoutPasso.fill(),
                            layoutPasso.stroke(),
                            layoutPasso.strokeWidth(),
                            layoutPasso.strokeDashArray(),
                            nomeNovo
                    );

                    layoutPassos.set(i, novoLayoutPasso);
                    atualizado = true;
                    break;
                }
            }

            if (atualizado) {
                TrilhaLayout novoLayout = new TrilhaLayout(layoutPassos, layoutAntigo.layoutFluxos());
                trilhaPai.setLayoutJson(mapeadorJson.writeValueAsString(novoLayout));
                registrador.info("Layout JSON atualizado na memória para a trilha pai ID: {}.", trilhaPai.getId());
            }

            return atualizado;

        } catch (IOException e) {
            registrador.error("Falha grave ao processar o JSON de *layout* da trilha pai com ID: {}", trilhaPai.getId(), e);
            throw new RuntimeException("Falha ao processar JSON de layout.", e);
        }
    }
}