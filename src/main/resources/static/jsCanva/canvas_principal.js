/**
 * Orquestrador principal da aplicação.
 */
import { AppState } from './app.js';
import { lidarComCliqueParaCaminho, atualizarCaminhosParaObjeto } from './caminho.js';
import { atualizarNumerosHierarquia } from './hierarquia.js';
import { inicializarPainelPropriedades, abrirModalEdicao } from './propriedades.js';
import { inicializarGerenciadorPassos } from './passo.js';
import { inicializarImportarExportar } from './importar_exportar.js';
import { inicializarPersistencia } from './persistencia.js';
import { inicializarValidador } from './validador.js';
import { lidarRoteamentoAoCarregar } from './router.js';

document.addEventListener('DOMContentLoaded', function () {
    const envoltorioCanvas = document.querySelector('.canvas-wrapper');
    const canvas = new fabric.Canvas('canvas');
    AppState.canvas = canvas;

    if (!AppState.canvas) {
        console.error("ERRO CRÍTICO: Falha ao criar Canvas.");
        return;
    }

    redimensionarCanvas();
    window.addEventListener('resize', () => setTimeout(redimensionarCanvas, 150));

    canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
    canvas.upperCanvasEl.addEventListener('drop', lidarComSolturaNoCanvas);

    // Eventos do Fabric
    canvas.on('mouse:down', lidarComCliqueParaCaminho);
    canvas.on('object:moving', lidarObjetoMovendo);
    canvas.on('object:modified', lidarObjetoModificado);
    canvas.on('selection:created', (e) => lidarSelecao(e, 'criada'));
    canvas.on('selection:updated', (e) => lidarSelecao(e, 'atualizada'));
    canvas.on('selection:cleared', (e) => lidarSelecao(e, 'limpa'));
    canvas.on('mouse:dblclick', (e) => { if (e.target) abrirModalEdicao(e.target); });

    // Inicialização de Módulos
    document.querySelector('.sidebar').addEventListener('click', lidarCliqueBarraLateral);
    document.getElementById('delete-button').addEventListener('click', lidarComExclusao);
    document.addEventListener('keydown', lidarTeclaPressionada);

    inicializarPainelPropriedades();
    inicializarGerenciadorPassos();
    inicializarImportarExportar();
    inicializarPersistencia();
    inicializarValidador();
    lidarRoteamentoAoCarregar();

    function lidarObjetoMovendo(evento) {
        const alvo = evento.target;
        if (!alvo) return;
        if (alvo.type === 'activeSelection') {
            alvo.getObjects().forEach(o => {
                if (o.type === 'box' || o.type === 'node') atualizarCaminhosParaObjeto(o);
            });
        } else if (alvo.type === 'box' || alvo.type === 'node') {
            atualizarCaminhosParaObjeto(alvo);
        }
        canvas.requestRenderAll();
    }

    function lidarObjetoModificado(evento) {
        const alvo = evento.target;
        if (!alvo) return;
        if (alvo.type === 'activeSelection') {
            alvo.getObjects().forEach(obj => {
                obj.setCoords();
                if (obj.type === 'box' || obj.type === 'node') atualizarCaminhosParaObjeto(obj);
            });
        } else if (alvo.type === 'box' || alvo.type === 'node') {
            alvo.setCoords();
            atualizarCaminhosParaObjeto(alvo);
        }
        atualizarNumerosHierarquia();
        atualizarTodasHierarquias();
        canvas.renderAll();
    }

    function lidarCliqueBarraLateral(evento) {
        const elementoForma = evento.target.closest('.shape');
        if (elementoForma && elementoForma.dataset.type && !evento.target.closest('button')) {
            // Lógica de criação delegada para window.criarObjetoPorTipo (definido em passo.js)
            // Idealmente, passo.js exportaria isso, mas para drag/drop simples mantivemos global
            if (window.criarObjetoPorTipo) {
                const centro = canvas.getCenter();
                window.criarObjetoPorTipo(elementoForma.dataset.type, { x: centro.left, y: centro.top });
            }
        }
    }

    function lidarComSolturaNoCanvas(evento) {
        evento.preventDefault();
        const tipoDado = evento.dataTransfer.getData('data-type');
        if (!tipoDado || !window.criarObjetoPorTipo) return;
        const ponteiro = canvas.getPointer(evento);
        window.criarObjetoPorTipo(tipoDado, { x: ponteiro.x, y: ponteiro.y });
    }

    function lidarTeclaPressionada(evento) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        if (evento.key === 'Delete' || evento.key === 'Backspace') {
            evento.preventDefault();
            lidarComExclusao();
        }
    }

    function lidarComExclusao() {
        const selecao = canvas.getActiveObject();
        if (!selecao) return;
        const objetos = selecao.type === 'activeSelection' ? selecao.getObjects() : [selecao];
        if (objetos.length > 1 && !confirm(`Excluir ${objetos.length} itens?`)) return;

        const paraRemover = new Set();
        objetos.forEach(obj => {
            paraRemover.add(obj);
            if (obj.type === 'box' || obj.type === 'node') {
                canvas.getObjects().forEach(c => {
                    if (c.type === 'arrow' && (c.from === obj.objectId || c.to === obj.objectId)) paraRemover.add(c);
                });
            }
        });
        paraRemover.forEach(obj => canvas.remove(obj));
        canvas.discardActiveObject();
        atualizarTodasHierarquias();
        atualizarNumerosHierarquia();
        canvas.renderAll();
    }

    function redimensionarCanvas() {
        if (!envoltorioCanvas || !canvas) return;
        canvas.setDimensions({ width: envoltorioCanvas.clientWidth, height: envoltorioCanvas.clientHeight });
        canvas.renderAll();
    }

    function lidarSelecao(evento, tipo) {
        if (tipo === 'criada' || tipo === 'atualizada') {
            if (evento.selected) evento.selected.forEach(obj => aplicarEstilosSelecao(obj));
        }
        if (tipo === 'atualizada' || tipo === 'limpa') {
            if (evento.deselected) evento.deselected.forEach(obj => removerEstilosSelecao(obj));
        }
        canvas.requestRenderAll();
    }

    function aplicarEstilosSelecao(alvo) {
        if (!alvo || alvo.type === 'activeSelection') return;
        alvo.set({ stroke: '#3498db', strokeWidth: 3 });
        alvo._possuiEstiloSelecao = true;
    }

    function removerEstilosSelecao(alvo) {
        if (!alvo || alvo.type === 'activeSelection' || !alvo._possuiEstiloSelecao) return;
        // Restaura estilo original (lógica simplificada)
        alvo.set({ stroke: (alvo.tipoCustomizado === 'subject' || alvo.customType === 'subject') ? 'black' : '#2c3e50', strokeWidth: 2 });
        alvo._possuiEstiloSelecao = false;
    }
});

// Reconstrução Lógica (Exportada para uso em outros módulos se necessário)
export function atualizarTodasHierarquias() {
    const todos = AppState.canvas.getObjects();
    const mapa = new Map(todos.map(o => [o.objectId, o]));

    todos.forEach(obj => {
        if (obj.type === 'box') {
            obj.idDoPai = null;
            if (obj.customType === 'subject') obj.idsDosFilhos = [];
        }
    });

    const assuntos = todos.filter(obj => obj.customType === 'subject' || obj.tipoCustomizado === 'subject');
    assuntos.forEach(pai => reconstruirSubHierarquia(pai, mapa, todos));
}

function reconstruirSubHierarquia(pai, mapa, todos) {
    const fila = [];
    const visitados = new Set([pai.objectId]);

    const caminhosH = todos.filter(o => o.type === 'arrow' && o.from === pai.objectId && o.isHierarchy);
    caminhosH.forEach(c => {
        const alvo = mapa.get(c.to);
        if (alvo && !visitados.has(alvo.objectId)) {
            visitados.add(alvo.objectId);
            fila.push({ obj: alvo, paiLogico: pai });
        }
    });

    let i = 0;
    while (i < fila.length) {
        const { obj, paiLogico } = fila[i++];
        let proxPai = paiLogico;

        if (obj.type === 'box') {
            if (!obj.idDoPai) obj.idDoPai = paiLogico.objectId;
            if ((paiLogico.customType === 'subject') && paiLogico.idsDosFilhos && !paiLogico.idsDosFilhos.includes(obj.objectId)) {
                paiLogico.idsDosFilhos.push(obj.objectId);
            }
            if (obj.customType === 'subject') proxPai = obj;
        }

        if (obj.customType === 'subject') {
            todos.filter(o => o.type === 'arrow' && o.from === obj.objectId && o.isHierarchy).forEach(c => {
                const alvo = mapa.get(c.to);
                if (alvo && !visitados.has(alvo.objectId)) {
                    visitados.add(alvo.objectId);
                    fila.push({ obj: alvo, paiLogico: obj });
                }
            });
        }

        todos.filter(o => o.type === 'arrow' && o.from === obj.objectId && !o.isHierarchy).forEach(c => {
            const alvo = mapa.get(c.to);
            if (alvo && !visitados.has(alvo.objectId)) {
                visitados.add(alvo.objectId);
                fila.push({ obj: alvo, paiLogico: proxPai });
            }
        });
    }
}