/**
 * Gerencia a criação dos nós de controle de fluxo (Início e Fim).
 */
import { Config } from './constantes.js';
import { gerarId } from './utilitarios.js';

export function criarNoInicioFim(opcoes) {
    let no;
    let x = 0, y = 0;
    if (opcoes.left !== undefined) x = Number(opcoes.left);
    else if (opcoes.coords?.x !== undefined) x = Number(opcoes.coords.x);

    if (opcoes.top !== undefined) y = Number(opcoes.top);
    else if (opcoes.coords?.y !== undefined) y = Number(opcoes.coords.y);

    const tipoNegocio = opcoes.tipoCustomizado || opcoes.customType || opcoes.type;
    const ehInicio = (tipoNegocio === 'start');

    const opcoesComuns = {
        left: x, top: y,
        originX: 'center', originY: 'center',
        selectable: true, hasControls: false,
        objectId: opcoes.objectId || gerarId(),
        opacity: 1,
        tipoCustomizado: ehInicio ? 'start' : 'end',
        type: 'node'
    };

    if (ehInicio) {
        const circulo = new fabric.Circle({
            radius: Config.DIMENSOES.RAIO_INICIO,
            fill: Config.CORES.INICIO,
            originX: 'center', originY: 'center'
        });
        no = new fabric.Group([circulo], opcoesComuns);

    } else {
        const circuloInterno = new fabric.Circle({
            radius: Config.DIMENSOES.RAIO_FIM_INTERNO,
            fill: Config.CORES.FIM,
            originX: 'center', originY: 'center'
        });
        const circuloExterno = new fabric.Circle({
            radius: Config.DIMENSOES.RAIO_FIM_EXTERNO,
            fill: 'transparent',
            stroke: Config.CORES.FIM,
            strokeWidth: Config.ESTILOS.BORDA_ESPESSURA,
            strokeDashArray: Config.ESTILOS.TRACEJADO_FIM,
            originX: 'center', originY: 'center'
        });
        no = new fabric.Group([circuloExterno, circuloInterno], opcoesComuns);
    }
    return no;
}