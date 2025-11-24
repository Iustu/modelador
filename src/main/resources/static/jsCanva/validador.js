/**
 * Lógica de validação do diagrama.
 */
import { AppState } from './app.js';

export function inicializarValidador() {
    const botaoValidar = document.getElementById('validate-button');
    if (botaoValidar) {
        botaoValidar.addEventListener('click', validarDiagrama);
    }
}

function validarDiagrama() {
    const objetos = AppState.canvas.getObjects();
    const todosObjetosDiagrama = objetos.filter(o => o.type === 'box' || o.type === 'node');
    const caminhos = objetos.filter(o => o.type === 'arrow');
    let erros = [];

    const mapaObjetos = new Map(todosObjetosDiagrama.map(o => [o.objectId, o]));

    todosObjetosDiagrama.forEach(objeto => {
        const caminhosEntrada = caminhos.filter(c => c.to === objeto.objectId);
        const caminhosSaida = caminhos.filter(c => c.from === objeto.objectId);

        switch (objeto.customType) {
            case 'start':
                erros.push(...validarNoInicio(objeto, caminhosEntrada, caminhosSaida));
                break;
            case 'end':
                erros.push(...validarNoFim(objeto, caminhosEntrada, caminhosSaida));
                break;
            case 'subject':
                erros.push(...validarNoAssunto(objeto, caminhosEntrada, caminhosSaida, mapaObjetos));
                break;
            case 'content':
                erros.push(...validarNoConteudo(objeto, caminhosEntrada, caminhosSaida, mapaObjetos));
                break;
            case 'trilha':
                erros.push(...validarNoConteudo(objeto, caminhosEntrada, caminhosSaida, mapaObjetos));
                break;
        }
    });

    erros.push(...verificarPassosOrfaos(todosObjetosDiagrama, caminhos, mapaObjetos));
    erros.push(...verificarConexoesDuplicadas(caminhos, mapaObjetos));

    if (erros.length === 0) {
        alert('✅ Diagrama válido! Nenhum erro estrutural encontrado.');
    } else {
        const mensagensErro = "Erros encontrados:\n\n- " + erros.join("\n- ");
        alert(mensagensErro);
    }
}

function validarNoInicio(no, caminhosEntrada, caminhosSaida) {
    const erros = [];
    if (caminhosEntrada.length > 0) erros.push("Início não pode receber caminhos.");
    if (caminhosSaida.length === 0) erros.push("Início deve ter saída.");
    return erros;
}

function validarNoFim(no, caminhosEntrada, caminhosSaida) {
    const erros = [];
    if (caminhosSaida.length > 0) erros.push("Fim não pode ter saída.");
    if (caminhosEntrada.length === 0) erros.push("Fim deve ter entrada.");
    return erros;
}

function validarNoAssunto(assunto, caminhosEntrada, caminhosSaida, mapaObjetos) {
    const erros = [];
    const texto = assunto.baseText || 'Assunto sem nome';
    const tipoSelecao = assunto.tipoSelecao || 'MULTIPLA';

    if (caminhosSaida.length === 0) erros.push(`Assunto "${texto}" sem saída.`);

    const caminhosHierarquiaSaida = caminhosSaida.filter(c => c.isHierarchy === true);
    if (caminhosHierarquiaSaida.length === 0) erros.push(`"${texto}" deve ter caminho hierárquico.`);

    const caminhosFluxoSaida = caminhosSaida.filter(c => !c.isHierarchy);
    if (caminhosFluxoSaida.length > 0) {
        if (tipoSelecao === 'OBRIGATORIA' && caminhosFluxoSaida.some(c => c.pathType === 'PREFERENCIAL')) {
            erros.push(`"${texto}": Seleção Obrigatória não permite Preferencial.`);
        }
        if (tipoSelecao === 'EXCLUSIVA') {
            const pref = caminhosFluxoSaida.filter(c => c.pathType === 'PREFERENCIAL');
            if (pref.length !== 1) erros.push(`"${texto}": Exclusiva exige exato 1 Preferencial.`);
        }
    }
    return erros;
}

function validarNoConteudo(conteudo, caminhosEntrada, caminhosSaida, mapaObjetos) {
    const erros = [];
    const texto = conteudo.baseText || 'Item sem nome';
    if (caminhosEntrada.length === 0) erros.push(`Item órfão: "${texto}".`);
    return erros;
}

function verificarPassosOrfaos(todos, caminhos, mapa) {
    const erros = [];
    const inicios = todos.filter(o => o.customType === 'start');
    if (inicios.length === 0 && todos.length > 0) return ["Sem nó de Início."];

    const passos = todos.filter(o => o.type === 'box');
    const alcancaveis = new Set();
    const fila = [...inicios];
    const visitados = new Set();

    while(fila.length > 0) {
        const atual = fila.shift();
        if(!atual || visitados.has(atual.objectId)) continue;
        visitados.add(atual.objectId);
        if (atual.type === 'box') alcancaveis.add(atual);
        caminhos.filter(c => c.from === atual.objectId)
            .forEach(c => { const viz = mapa.get(c.to); if (viz && !visitados.has(viz.objectId)) fila.push(viz); });
    }

    passos.forEach(p => {
        if (!alcancaveis.has(p)) erros.push(`${p.customType} inalcançável: "${p.baseText}".`);
    });
    return erros;
}

function verificarConexoesDuplicadas(caminhos, mapa) {
    const erros = [];
    const conexoes = new Set();
    caminhos.forEach(c => {
        const key = `${c.from}->${c.to}`;
        if (conexoes.has(key)) {
            const i = mapa.get(c.from), f = mapa.get(c.to);
            erros.push(`Conexão duplicada entre "${i.baseText}" e "${f.baseText}".`);
        } else conexoes.add(key);
    });
    return erros;
}