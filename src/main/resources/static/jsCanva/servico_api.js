/**
 * Centraliza a comunicação com as APIs (Backend e Externa).
 */

const URL_BASE_API_INTERNA = '/api/trilhas';
const URL_BASE_API_EXTERNA = 'https://api.learningcurv.es';

export async function buscarTodosDiagramas() {
    try {
        const resposta = await fetch(URL_BASE_API_INTERNA);
        if (!resposta.ok) throw new Error(`Erro HTTP interno: ${resposta.status}`);
        return await resposta.json();
    } catch (erro) {
        console.error("Erro ao buscar diagramas:", erro);
        alert("Falha ao buscar diagramas salvos.");
        return [];
    }
}

export async function buscarDiagramaPorId(id) {
    try {
        const resposta = await fetch(`${URL_BASE_API_INTERNA}/${id}`);
        if (!resposta.ok) throw new Error(`Erro HTTP interno: ${resposta.status}`);
        return await resposta.json();
    } catch (erro) {
        console.error(`Erro ao buscar diagrama com ID ${id}:`, erro);
        alert("Falha ao abrir o diagrama selecionado.");
        return null;
    }
}

export async function salvarDiagrama(dadosDiagrama, id) {
    const ehAtualizacao = id != null;
    const url = ehAtualizacao ? `${URL_BASE_API_INTERNA}/${id}` : URL_BASE_API_INTERNA;
    const metodo = ehAtualizacao ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosDiagrama),
        });

        if (!resposta.ok) {
            const corpoErro = await resposta.text();
            throw new Error(`Erro HTTP interno: ${resposta.status}\nDetalhes: ${corpoErro}`);
        }

        return await resposta.json();
    } catch (erro) {
        console.error("Erro ao salvar diagrama:", erro);
        alert("Falha ao salvar o diagrama.");
        return null;
    }
}

export async function deletarDiagramaPorId(id) {
    try {
        const resposta = await fetch(`${URL_BASE_API_INTERNA}/${id}`, { method: 'DELETE' });
        if (resposta.status === 204) return { sucesso: true };
        if (resposta.status === 409) {
            const mensagemAviso = await resposta.text();
            return { sucesso: false, mensagem: mensagemAviso };
        }
        const corpoErro = await resposta.text();
        throw new Error(`Erro HTTP interno: ${resposta.status}\nDetalhes: ${corpoErro}`);
    } catch (erro) {
        console.error(`Erro ao apagar diagrama ID ${id}:`, erro);
        return { sucesso: false, mensagem: "Falha ao apagar." };
    }
}

export async function buscarTodasDocumentacoes() {
    try {
        const resposta = await fetch(`${URL_BASE_API_EXTERNA}/documentations`);
        if (!resposta.ok) throw new Error(`Erro HTTP Externo: ${resposta.status}`);
        return await resposta.json();
    } catch (erro) {
        console.error("Erro ao buscar documentações externas:", erro);
        alert("Falha ao carregar lista de documentações.");
        return [];
    }
}

export async function buscarDocumentosPorUuid(uuidDoc) {
    if (!uuidDoc) return [];
    try {
        const resposta = await fetch(`${URL_BASE_API_EXTERNA}/documentations/${uuidDoc}`);
        if (!resposta.ok) throw new Error(`Erro HTTP Externo: ${resposta.status}`);
        return await resposta.json();
    } catch (erro) {
        console.error(`Erro ao buscar documentos para ${uuidDoc}:`, erro);
        alert("Falha ao carregar documentos.");
        return [];
    }
}