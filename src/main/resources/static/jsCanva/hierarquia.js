/**
 * Gerencia a lógica de numeração hierárquica automática.
 */
import { AppState } from './app.js';

export function atualizarNumerosHierarquia() {
    if (!AppState.canvas) return;
    const todosObjetos = AppState.canvas.getObjects();

    limparNumeracaoVisual(todosObjetos);

    const { nos, setas, mapaNosCanvas } = extrairDadosDoCanvas(todosObjetos);
    const mapaDeNumeros = calcularNumerosHierarquia(nos, setas);

    aplicarNumerosAoCanvas(mapaDeNumeros, mapaNosCanvas);

    AppState.canvas.renderAll();
}

function calcularNumerosHierarquia(nos, setas) {
    const { mapaNos, mapaSaidas } = criarMapasDoDiagrama(nos, setas);

    const nosInicio = nos.filter(o => o.tipoCustomizado === 'start');
    nosInicio.sort((a, b) => a.top - b.top);

    const visitados = new Map();
    let ultimoNumeroGlobal = '0';

    nosInicio.forEach(inicio => {
        ultimoNumeroGlobal = atravessar(inicio.objectId, ultimoNumeroGlobal, mapaNos, mapaSaidas, visitados);
    });

    return visitados;
}

function criarMapasDoDiagrama(nos, setas) {
    const mapaNos = new Map();
    const mapaSaidas = new Map();

    nos.forEach(obj => {
        mapaNos.set(obj.objectId, obj);
        mapaSaidas.set(obj.objectId, []);
    });

    setas.forEach(seta => {
        if (mapaSaidas.has(seta.from)) {
            mapaSaidas.get(seta.from).push({
                seta: seta,
                destinoId: seta.to,
                ehHierarquia: seta.isHierarchy
            });
        }
    });

    return { mapaNos, mapaSaidas };
}

function atravessar(idNoAtual, numeroEntrada, mapaNos, mapaSaidas, visitados) {
    const noAtual = mapaNos.get(idNoAtual);
    if (!noAtual) return numeroEntrada;

    let numeroSaidaAtual;
    const ehPassoNumeravel = noAtual.type === 'box';

    if (ehPassoNumeravel) {
        numeroSaidaAtual = incrementarSequencia(numeroEntrada);
    } else {
        numeroSaidaAtual = numeroEntrada;
    }

    if (visitados.has(idNoAtual)) {
        const maiorNumeroVisto = visitados.get(idNoAtual);
        if (compararNumerosHierarquicos(numeroSaidaAtual, maiorNumeroVisto) <= 0) {
            return maiorNumeroVisto;
        }
    }

    visitados.set(idNoAtual, numeroSaidaAtual);

    const saidas = (mapaSaidas.get(idNoAtual) || []).sort((a, b) => {
        const noA = mapaNos.get(a.destinoId);
        const noB = mapaNos.get(b.destinoId);
        return (noA && noB) ? noA.top - noB.top : 0;
    });

    saidas.filter(s => s.ehHierarquia).forEach(saida => {
        const entradaHierarquica = numeroSaidaAtual === '0' ? '0' : numeroSaidaAtual + '.0';
        atravessar(saida.destinoId, entradaHierarquica, mapaNos, mapaSaidas, visitados);
    });

    let ultimoNumeroSequencial = numeroSaidaAtual;
    saidas.filter(s => !s.ehHierarquia).forEach(saida => {
        ultimoNumeroSequencial = atravessar(saida.destinoId, ultimoNumeroSequencial, mapaNos, mapaSaidas, visitados);
    });

    return ultimoNumeroSequencial;
}

function incrementarSequencia(numStr) {
    if (!numStr || numStr === '0') return '1';
    const partes = numStr.split('.');
    const ultimo = parseInt(partes.pop(), 10);
    partes.push(ultimo + 1);
    return partes.join('.');
}

function compararNumerosHierarquicos(a, b) {
    if (a === b) return 0;
    if (a === '0') return -1;
    if (b === '0') return 1;
    const partesA = a.split('.').map(Number);
    const partesB = b.split('.').map(Number);
    const len = Math.max(partesA.length, partesB.length);
    for (let i = 0; i < len; i++) {
        const valA = partesA[i] || 0;
        const valB = partesB[i] || 0;
        if (valA !== valB) return valA - valB;
    }
    return 0;
}

function extrairDadosDoCanvas(todosObjetos) {
    const nos = [];
    const setas = [];
    const mapaNosCanvas = new Map();

    todosObjetos.forEach(obj => {
        if (obj.type === 'box' || obj.type === 'node') {
            nos.push({
                objectId: obj.objectId,
                tipoCustomizado: obj.tipoCustomizado || obj.customType,
                top: obj.top,
                type: obj.type
            });
            mapaNosCanvas.set(obj.objectId, obj);
        } else if (obj.type === 'arrow') {
            setas.push({
                from: obj.from,
                to: obj.to,
                isHierarchy: obj.isHierarchy
            });
        }
    });
    return { nos, setas, mapaNosCanvas };
}

function aplicarNumerosAoCanvas(mapaDeNumeros, mapaNosCanvas) {
    mapaDeNumeros.forEach((numero, objectId) => {
        const noDoCanvas = mapaNosCanvas.get(objectId);
        if (noDoCanvas && noDoCanvas.type === 'box') {
            aplicarNumeroVisualAoNo(noDoCanvas, numero);
        }
    });
}

function aplicarNumeroVisualAoNo(no, numero) {
    if (!no || !numero || numero === '0') return;
    no.hierarchyNumber = numero;

    const textoOriginal = no.textoBase || no.baseText || '';
    const objetoTexto = no.getObjects('textbox')[0];
    if (objetoTexto) {
        objetoTexto.set('text', `${numero} - ${textoOriginal}`);
    }
}

function limparNumeracaoVisual(objetosDoCanvas) {
    objetosDoCanvas.forEach(obj => {
        if (obj.type === 'box' && (obj.textoBase || obj.baseText)) {
            delete obj.hierarchyNumber;
            const textoOriginal = obj.textoBase || obj.baseText;
            const objetoTexto = obj.getObjects('textbox')[0];
            if (objetoTexto) {
                objetoTexto.set('text', textoOriginal);
            }
        }
    });
}