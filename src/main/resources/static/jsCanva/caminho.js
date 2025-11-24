/**
 * Gerencia a criação e atualização dos Caminhos.
 * Aplica a regra visual de pontas e tipos de linha.
 */
import { AppState } from './app.js';
import { Config } from './constantes.js';
import { atualizarTodasHierarquias } from './canvas_principal.js';
import { atualizarNumerosHierarquia } from './hierarquia.js';

// Lida com o clique no canvas para iniciar ou finalizar uma seta
export function lidarComCliqueParaCaminho(evento) {
    if (!AppState.desenhandoCaminho) return;

    const alvo = evento.target;

    if (alvo && (alvo.type === 'box' || alvo.type === 'node')) {
        if (!AppState.objetoInicioCaminho) {
            AppState.objetoInicioCaminho = alvo;
            console.log("DEBUG: Início do caminho definido.");
        } else {
            const objetoFim = alvo;
            if (AppState.objetoInicioCaminho.objectId !== objetoFim.objectId) {
                let tipoCaminho = 'OBRIGATORIO';
                criarCaminhoPadrao(AppState.objetoInicioCaminho, objetoFim, AppState.ehCaminhoHierarquia, tipoCaminho);
            }
            cancelarDesenhoCaminho();
        }
    } else {
        cancelarDesenhoCaminho();
    }
}

export function cancelarDesenhoCaminho() {
    // Limpa classe ativa dos botões na sidebar
    document.getElementById('arrow-button').classList.remove('active');
    document.getElementById('dashed-arrow-button').classList.remove('active');

    AppState.desenhandoCaminho = false;
    AppState.ehCaminhoHierarquia = false;
    AppState.objetoInicioCaminho = null;

    if (AppState.canvas) {
        AppState.canvas.discardActiveObject().renderAll();
    }
}

export function criarCaminhoPadrao(objInicio, objFim, ehHierarquia, tipoCaminho) {
    const pontoInicio = calcularPontoBorda(objInicio, objFim.getCenterPoint());
    const pontoFim = calcularPontoBorda(objFim, objInicio.getCenterPoint());

    const opcoesLinha = {
        stroke: 'black',
        strokeWidth: 2,
        selectable: false,
        objectCaching: false
    };

    const linha = new fabric.Line([pontoInicio.x, pontoInicio.y, pontoFim.x, pontoFim.y], opcoesLinha);

    const angulo = fabric.util.radiansToDegrees(Math.atan2(pontoFim.y - pontoInicio.y, pontoFim.x - pontoInicio.x)) + 90;

    const triangulo = new fabric.Triangle({
        width: 12,
        height: 18,
        left: pontoFim.x,
        top: pontoFim.y,
        angle: angulo,
        originX: 'center',
        originY: 'center',
        selectable: false,
        objectCaching: false
    });

    const caminho = new fabric.Group([linha, triangulo], {
        type: 'arrow',
        from: objInicio.objectId,
        to: objFim.objectId,
        isHierarchy: ehHierarquia,
        pathType: tipoCaminho || 'OBRIGATORIO',
        selectable: true,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false
    });

    estilizarCaminho(caminho);

    if(AppState.canvas) {
        AppState.canvas.add(caminho);
        AppState.canvas.sendToBack(caminho);
    }

    atualizarTodasHierarquias();
    atualizarNumerosHierarquia();
}

export function atualizarVisualCaminho(caminho) {
    if (!caminho || caminho.type !== 'arrow') return;
    estilizarCaminho(caminho);
    AppState.canvas.requestRenderAll();
}

// Aplica estilos visuais conforme o tipo do caminho e hierarquia
export function estilizarCaminho(caminho) {
    if (!caminho) return;

    const linha = caminho.getObjects('line')[0];
    const triangulo = caminho.getObjects('triangle')[0];

    if (!linha || !triangulo) return;

    const tipoCaminho = caminho.pathType || 'OBRIGATORIO';
    const ehHierarquia = caminho.isHierarchy;

    // 1. Configuração da LINHA (Baseada no Tipo de Caminho)
    const estiloLinha = Config.ESTILOS.LINHAS[tipoCaminho] !== undefined
        ? Config.ESTILOS.LINHAS[tipoCaminho]
        : null;

    linha.set({
        stroke: 'black',
        strokeWidth: 2,
        strokeDashArray: estiloLinha
    });

    // 2. Configuração da PONTA (Baseada se é Hierarquia ou Fluxo)
    if (ehHierarquia) {
        // HIERARQUIA: Ponta Vazada (Branca com borda preta)
        triangulo.set({
            fill: '#ffffff',
            stroke: 'black',
            strokeWidth: 2
        });
    } else {
        // FLUXO: Ponta Preenchida (Preta)
        triangulo.set({
            fill: 'black',
            stroke: 'black',
            strokeWidth: 1
        });
    }

    caminho.dirty = true;
}

export function atualizarCaminhosParaObjeto(objetoMovido) {
    if (!objetoMovido || (objetoMovido.type !== 'box' && objetoMovido.type !== 'node')) return;

    const todosObjetos = AppState.canvas.getObjects();

    todosObjetos.forEach(obj => {
        if (obj.type === 'arrow' && (obj.from === objetoMovido.objectId || obj.to === objetoMovido.objectId)) {
            const objInicio = todosObjetos.find(o => o.objectId === obj.from);
            const objFim = todosObjetos.find(o => o.objectId === obj.to);

            if (!objInicio || !objFim) return;

            const linha = obj.getObjects('line')[0];
            const triangulo = obj.getObjects('triangle')[0];

            if (!linha || !triangulo) return;

            const pontoInicio = calcularPontoBorda(objInicio, objFim.getCenterPoint());
            const pontoFim = calcularPontoBorda(objFim, objInicio.getCenterPoint());

            linha.set({ 'x1': pontoInicio.x, 'y1': pontoInicio.y, 'x2': pontoFim.x, 'y2': pontoFim.y });

            const angulo = fabric.util.radiansToDegrees(Math.atan2(pontoFim.y - pontoInicio.y, pontoFim.x - pontoInicio.x)) + 90;
            triangulo.set({ left: pontoFim.x, top: pontoFim.y, angle: angulo });

            obj._calcBounds();
            obj._updateObjectsCoords();
            obj.setCoords();
        }
    });
}

function calcularPontoBorda(grupoObj, pontoAlvo) {
    const centro = grupoObj.getCenterPoint();
    const larguraReal = (grupoObj.width * grupoObj.scaleX) / 2;
    const alturaReal = (grupoObj.height * grupoObj.scaleY) / 2;

    const dx = pontoAlvo.x - centro.x;
    const dy = pontoAlvo.y - centro.y;

    if (dx === 0) {
        return { x: centro.x, y: centro.y + (dy > 0 ? alturaReal : -alturaReal) };
    }

    const inclinacao = dy / dx;
    const bordaX = dx > 0 ? larguraReal : -larguraReal;
    const bordaY = bordaX * inclinacao;

    if (Math.abs(bordaY) <= alturaReal) {
        return { x: centro.x + bordaX, y: centro.y + bordaY };
    } else {
        const bordaY2 = dy > 0 ? alturaReal : -alturaReal;
        const bordaX2 = bordaY2 / inclinacao;
        return { x: centro.x + bordaX2, y: centro.y + bordaY2 };
    }
}