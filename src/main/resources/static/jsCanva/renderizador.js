/**
 * Centraliza a lógica para desenhar (renderizar) os elementos visuais no canvas.
 */
import { Config } from './constantes.js';
import { gerarId } from './utilitarios.js';
import { AppState } from './app.js';

export function criarPassoVisual(opcoes) {
    const larguraRetangulo = Config.DIMENSOES.LARGURA_BOX;
    const alturaRetangulo = Config.DIMENSOES.ALTURA_BOX;

    let x = 0, y = 0;
    if (opcoes.left !== undefined) x = Number(opcoes.left);
    else if (opcoes.coords?.x !== undefined) x = Number(opcoes.coords.x);

    if (opcoes.top !== undefined) y = Number(opcoes.top);
    else if (opcoes.coords?.y !== undefined) y = Number(opcoes.coords.y);

    const tipoNegocio = opcoes.tipoCustomizado || opcoes.customType || 'subject';
    const textoNegocio = opcoes.textoBase || opcoes.baseText || 'Sem título';

    let corFundo = opcoes.fill;
    if (!corFundo) {
        switch (tipoNegocio) {
            case 'subject': corFundo = Config.CORES.ASSUNTO; break;
            case 'trilha':  corFundo = Config.CORES.TRILHA; break;
            case 'content': corFundo = Config.CORES.CONTEUDO; break;
            default:        corFundo = Config.CORES.PADRAO;
        }
    }

    const retangulo = new fabric.Rect({
        width: larguraRetangulo,
        height: alturaRetangulo,
        fill: corFundo,
        rx: Config.DIMENSOES.RAIO_CANTO,
        ry: Config.DIMENSOES.RAIO_CANTO,
        originX: 'center', originY: 'center',
        stroke: opcoes.stroke,
        strokeWidth: opcoes.strokeWidth,
        strokeDashArray: opcoes.strokeDashArray
    });

    if (!opcoes.stroke) {
        switch (tipoNegocio) {
            case 'subject':
                retangulo.set({
                    stroke: Config.CORES.BORDA_PADRAO,
                    strokeWidth: Config.ESTILOS.BORDA_ESPESSURA,
                    strokeDashArray: Config.ESTILOS.TRACEJADO_ASSUNTO
                });
                break;
            case 'trilha':
                retangulo.set({
                    stroke: Config.CORES.BORDA_PADRAO,
                    strokeWidth: Config.ESTILOS.BORDA_ESPESSURA
                });
                break;
            case 'content':
                retangulo.set({
                    stroke: Config.CORES.BORDA_CONTEUDO,
                    strokeWidth: Config.ESTILOS.BORDA_ESPESSURA,
                    strokeDashArray: Config.ESTILOS.TRACEJADO_CONTEUDO
                });
                break;
        }
    }

    let corTexto = (tipoNegocio === 'subject') ? Config.CORES.TEXTO_ESCURO : Config.CORES.TEXTO_CLARO;

    const objetoTexto = new fabric.Textbox(textoNegocio, {
        width: larguraRetangulo - 20,
        fontSize: Config.ESTILOS.FONTE_TAMANHO,
        textAlign: 'center',
        fill: corTexto,
        originX: 'center',
        originY: 'center',
        editable: tipoNegocio !== 'content'
    });

    const opcoesGrupo = {
        left: x, top: y,
        objectId: opcoes.id || opcoes.objectId || gerarId(),
        type: 'box',
        angle: opcoes.angle || 0,
        scaleX: opcoes.scaleX || 1,
        scaleY: opcoes.scaleY || 1,
        hasControls: false, lockRotation: true, selectable: true, cornerStyle: 'circle', opacity: 1,
        customType: tipoNegocio,
        tipoCustomizado: tipoNegocio,
        baseText: textoNegocio,
        textoBase: textoNegocio,
        parentId: opcoes.idDoPai || null,
        idDoPai: opcoes.idDoPai || null,
        childrenIds: (tipoNegocio === 'subject') ? (opcoes.idsDosFilhos || []) : undefined,
        idConteudo: opcoes.idConteudo || opcoes.idReferencia || null,
        idTrilha: opcoes.idTrilha || opcoes.idReferencia || null,
        tipoSelecao: (tipoNegocio === 'subject') ? (opcoes.tipoSelecao || 'MULTIPLA') : undefined
    };

    if (tipoNegocio !== 'subject') {
        delete opcoesGrupo.childrenIds;
        delete opcoesGrupo.tipoSelecao;
    }

    const elementosDoGrupo = [retangulo, objetoTexto];
    const marcadorVisual = criarMarcadorVisual(tipoNegocio, opcoesGrupo.tipoSelecao);

    if (marcadorVisual) {
        elementosDoGrupo.push(marcadorVisual);
    }

    return new fabric.Group(elementosDoGrupo, opcoesGrupo);
}

export function atualizarVisualAssunto(assunto) {
    const tipo = assunto.tipoCustomizado || assunto.customType;
    if (!assunto || tipo !== 'subject') return;

    const novoSimbolo = obterSimboloMarcador(assunto.tipoSelecao);
    if (!novoSimbolo) return;

    const objetoMarcador = assunto.getObjects().find(obj => obj.ehMarcador === true);

    if (objetoMarcador) {
        objetoMarcador.set('text', novoSimbolo);
        assunto.dirty = true;
    } else {
        const novoMarcador = criarMarcadorVisual(tipo, assunto.tipoSelecao);
        if (novoMarcador) {
            assunto.addWithUpdate(novoMarcador);
        }
    }
    AppState.canvas.requestRenderAll();
}

function obterSimboloMarcador(tipoSelecao) {
    switch (tipoSelecao) {
        case 'OBRIGATORIA': return '+';
        case 'EXCLUSIVA': return 'X';
        case 'MULTIPLA': return 'O';
        default: return null;
    }
}

function criarMarcadorVisual(tipoCustomizado, tipoSelecao) {
    if (tipoCustomizado !== 'subject') return null;
    const icone = obterSimboloMarcador(tipoSelecao);
    if (!icone) return null;

    return new fabric.Text(icone, {
        fontSize: 20, fontWeight: 'bold', fill: 'black',
        originX: 'left', originY: 'top', left: -90, top: -35,
        selectable: false, evented: false, ehMarcador: true
    });
}