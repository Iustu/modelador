/**
 * Gerencia Salvar/Abrir na Nuvem.
 */
import { AppState } from './app.js';
import { serializarCanvasParaBackend } from './serializador.js';
import { salvarDiagrama, buscarTodosDiagramas, buscarDiagramaPorId, deletarDiagramaPorId } from './servico_api.js';
import { carregarCanvasDoJson } from './importar_exportar.js';
import { atualizarUrlNavegador } from './router.js';

export function inicializarPersistencia() {
    const botaoSalvar = document.getElementById('salvar-button');
    const botaoAbrir = document.getElementById('abrir-button');
    const botaoDeletarTrilha = document.getElementById('delete-trilha-button');
    const modalAbrir = document.getElementById('open-from-db-modal');
    const botaoFecharModal = document.getElementById('open-modal-close-button');
    const listaTrilhasDb = document.getElementById('trilha-db-list');

    botaoSalvar.addEventListener('click', async () => {
        const dadosDiagrama = serializarCanvasParaBackend();
        if (!dadosDiagrama || dadosDiagrama.objetosDiagrama.length === 0) {
            alert("O diagrama está vazio.");
            return;
        }
        const dadosSalvos = await salvarDiagrama(dadosDiagrama, AppState.idTrilhaAtual);
        if (dadosSalvos && dadosSalvos.id) {
            const ehNova = AppState.idTrilhaAtual !== dadosSalvos.id;
            AppState.idTrilhaAtual = dadosSalvos.id;
            alert(`Diagrama salvo! ID: ${AppState.idTrilhaAtual}`);
            if (ehNova || !window.location.pathname.includes(`/editor/${AppState.idTrilhaAtual}`)) {
                atualizarUrlNavegador(AppState.idTrilhaAtual);
            }
        }
    });

    botaoAbrir.addEventListener('click', async () => {
        listaTrilhasDb.innerHTML = '<li>Carregando...</li>';
        modalAbrir.style.display = 'flex';
        const trilhas = await buscarTodosDiagramas();
        listaTrilhasDb.innerHTML = '';

        if (!trilhas || trilhas.length === 0) {
            listaTrilhasDb.innerHTML = '<li>Nenhuma trilha encontrada.</li>';
            const btnFechar = document.createElement('button');
            btnFechar.textContent = 'Fechar';
            btnFechar.onclick = () => modalAbrir.style.display = 'none';
            listaTrilhasDb.appendChild(btnFechar);
            return;
        }
        trilhas.forEach(trilha => {
            const li = document.createElement('li');
            const titulo = trilha.dados?.modelo?.tituloDiagrama || 'Sem título';
            li.textContent = `ID: ${trilha.id} - ${titulo}`;
            li.dataset.id = trilha.id;
            listaTrilhasDb.appendChild(li);
        });
    });

    listaTrilhasDb.addEventListener('click', async (e) => {
        if (e.target.tagName === 'LI' && e.target.dataset.id) {
            const id = e.target.dataset.id;
            const dadosTrilhaBackend = await buscarDiagramaPorId(id);

            if (dadosTrilhaBackend && dadosTrilhaBackend.dados) {
                const dadosParaRenderizar = reconstruirDadosParaImportar(dadosTrilhaBackend);
                carregarCanvasDoJson(dadosParaRenderizar);
                AppState.idTrilhaAtual = dadosTrilhaBackend.id;
                document.getElementById('diagram-title-input').value = dadosParaRenderizar.tituloDiagrama || '';
                modalAbrir.style.display = 'none';
                atualizarUrlNavegador(AppState.idTrilhaAtual);
                alert('Diagrama carregado!');
            }
        }
    });

    botaoFecharModal.addEventListener('click', () => modalAbrir.style.display = 'none');

    botaoDeletarTrilha.addEventListener('click', async () => {
        if (!AppState.idTrilhaAtual) {
            alert("Nenhuma trilha carregada.");
            return;
        }
        if (!confirm(`APAGAR PERMANENTEMENTE a trilha atual?`)) return;

        const resultado = await deletarDiagramaPorId(AppState.idTrilhaAtual);
        if (resultado.sucesso) {
            alert("Trilha apagada.");
            AppState.canvas.clear();
            document.getElementById('diagram-title-input').value = '';
            AppState.idTrilhaAtual = null;
            window.history.replaceState({}, document.title, '/');
        } else {
            alert(`Erro ao apagar: ${resultado.mensagem}`);
        }
    });
}

export function reconstruirDadosParaImportar(dadosBackend) {
    const modelo = dadosBackend.dados?.modelo;
    const layout = dadosBackend.dados?.layout;

    if (!modelo || !layout) return { tituloDiagrama: "Erro", objetosDiagrama: [], caminhos: [] };

    const objetosDiagrama = [];
    const mapaLayout = new Map();

    (layout.layoutPassos || []).forEach(p => mapaLayout.set(p.idDoPasso, p));
    (layout.layoutFluxos || []).forEach(f => mapaLayout.set(f.idFluxo, f));

    (modelo.passos || []).forEach(noModelo => {
        const noLayout = mapaLayout.get(noModelo.id);
        if (noLayout) {
            objetosDiagrama.push({
                id: noModelo.id,
                tipoCustomizado: noModelo.tipoPasso,
                idDoPai: noModelo.idDoPai,
                idsDosFilhos: noModelo.idsDosFilhos,
                tipoSelecao: noModelo.tipoSelecao,
                idConteudo: noModelo.tipoPasso === 'content' ? noModelo.idReferencia : null,
                idTrilha: noModelo.tipoPasso === 'trilha' ? noModelo.idReferencia : null,
                textoBase: noLayout.textoBase,
                type: 'box',
                left: noLayout.left,
                top: noLayout.top,
                fill: noLayout.fill,
                stroke: noLayout.stroke,
                strokeWidth: noLayout.strokeWidth,
                strokeDashArray: noLayout.strokeDashArray,
                scaleX: noLayout.scaleX || 1,
                scaleY: noLayout.scaleY || 1,
                angle: noLayout.angle || 0
            });
        }
    });

    (modelo.fluxos || []).forEach(noModelo => {
        const noLayout = mapaLayout.get(noModelo.id);
        if (noLayout) {
            objetosDiagrama.push({
                id: noModelo.id,
                tipoCustomizado: noModelo.tipoCustomizado,
                type: 'node',
                left: noLayout.left,
                top: noLayout.top,
                scaleX: noLayout.scaleX || 1,
                scaleY: noLayout.scaleY || 1,
                angle: noLayout.angle || 0
            });
        }
    });

    const caminhos = (modelo.caminhos || []).map(caminho => ({
        de: caminho.de,
        para: caminho.para,
        tipoCaminho: caminho.tipoCaminho,
        eHierarquia: caminho.eHierarquia
    }));

    return { tituloDiagrama: modelo.tituloDiagrama, objetosDiagrama, caminhos };
}