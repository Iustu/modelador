/**
 * Serializa o estado atual do canvas para DTO.
 */
import { AppState } from './app.js';

export function serializarCanvasParaBackend() {
    const tituloDiagrama = document.getElementById('diagram-title-input').value || "Diagrama sem título";

    const dados = {
        tituloDiagrama: tituloDiagrama,
        objetosDiagrama: [],
        caminhos: []
    };

    AppState.canvas.getObjects().forEach(obj => {
        if (obj.type === 'box' || obj.type === 'node') {
            const rectObj = obj._objects ? obj._objects.find(o => o.type === 'rect') : null;
            const tipoDeNegocio = obj.tipoCustomizado || obj.customType;

            const dadosObjeto = {
                id: obj.objectId,
                type: obj.type,
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                fill: rectObj ? rectObj.fill : null,
                stroke: rectObj ? rectObj.stroke : null,
                strokeWidth: rectObj ? rectObj.strokeWidth : null,
                strokeDashArray: rectObj ? rectObj.strokeDashArray : null,
                tipoCustomizado: tipoDeNegocio,
                textoBase: obj.textoBase,
                idDoPai: obj.idDoPai || null,
                idsDosFilhos: (tipoDeNegocio === 'subject') ? (obj.idsDosFilhos || []) : undefined,
                idConteudo: obj.idConteudo || null,
                idTrilha: obj.idTrilha || null,
                tipoSelecao: obj.tipoSelecao || null
            };

            if (tipoDeNegocio !== 'subject') {
                delete dadosObjeto.idsDosFilhos;
                delete dadosObjeto.tipoSelecao;
            }

            if (tipoDeNegocio) {
                dados.objetosDiagrama.push(dadosObjeto);
            }

        } else if (obj.type === 'arrow') {
            dados.caminhos.push({
                de: obj.from,
                para: obj.to,
                subtipoSeta: "standard",
                eHierarquia: obj.isHierarchy,
                tipoCaminho: obj.pathType || 'OBRIGATORIO'
            });
        }
    });
    return dados;
}