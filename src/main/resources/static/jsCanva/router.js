/**
 * Gerencia o roteamento da SPA.
 */
import { AppState } from './app.js';
import { buscarDiagramaPorId } from './servico_api.js';
import { reconstruirDadosParaImportar } from './persistencia.js';
import { carregarCanvasDoJson } from './importar_exportar.js';

export function atualizarUrlNavegador(id) {
    if (!id) return;
    const novaUrl = `/editor/${id}`;
    window.history.pushState({ trilhaId: id }, `Editor ${id}`, novaUrl);
}

export async function lidarRoteamentoAoCarregar() {
    const caminho = window.location.pathname;
    const correspondencia = caminho.match(/\/editor\/(\d+)/);

    if (correspondencia && correspondencia[1]) {
        const idTrilha = correspondencia[1];
        const dadosTrilhaBackend = await buscarDiagramaPorId(idTrilha);

        if (dadosTrilhaBackend && dadosTrilhaBackend.dados) {
            const dadosParaRenderizar = reconstruirDadosParaImportar(dadosTrilhaBackend);
            carregarCanvasDoJson(dadosParaRenderizar);
            AppState.idTrilhaAtual = dadosTrilhaBackend.id;
            document.getElementById('diagram-title-input').value = dadosParaRenderizar.tituloDiagrama || '';
        } else {
            window.history.replaceState({}, document.title, '/');
        }
    }
}