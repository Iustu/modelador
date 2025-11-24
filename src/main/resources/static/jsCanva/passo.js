/**
 * Gerencia a criação interativa de passos e seus modais.
 */
import { AppState } from './app.js';
import { Config } from './constantes.js';
import { criarPassoVisual } from './renderizador.js';
// CORREÇÃO: Importar criarNoInicioFim do módulo correto (fluxo.js)
import { criarNoInicioFim } from './fluxo.js';
import { buscarTodosDiagramas, buscarTodasDocumentacoes, buscarDocumentosPorUuid } from './servico_api.js';
import { abrirModalEdicao } from './propriedades.js';

export function inicializarGerenciadorPassos() {
    const modalPasso = document.getElementById('passo-modal');
    const modalSelecaoTrilha = document.getElementById('trilha-select-modal');
    const visaoDocumentacao = document.getElementById('passo-documentacao-view');
    const listaDocumentacao = document.getElementById('passo-documentacao-lista');
    const visaoConteudo = document.getElementById('passo-conteudo-view');
    const listaConteudo = document.getElementById('passo-conteudo-lista');
    const tituloVisaoConteudo = document.getElementById('passo-conteudo-titulo');
    const botaoVoltarModal = document.getElementById('passo-modal-voltar-btn');
    const botaoFecharModal = document.getElementById('passo-modal-fechar-btn');

    let coordsAtuais = null;

    // Drag and Drop
    document.querySelectorAll('.shape[draggable="true"]').forEach(forma => {
        forma.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('data-type', e.target.dataset.type);
        });
    });

    // Função Global para gerenciar criação por tipo (usada no drag/drop)
    // Nota: Mantemos no window para facilitar a integração com o evento drop do canvas_principal.js
    window.criarObjetoPorTipo = function(tipoDado, coords) {
        let novoObjeto = null;
        coordsAtuais = coords;

        switch (tipoDado) {
            case 'subject':
                criarAssunto(coords);
                break;
            case 'content':
                abrirModalDocumentacao(coords);
                break;
            case 'start':
            case 'end':
                novoObjeto = criarNoInicioFim({ left: coords.x, top: coords.y, tipoCustomizado: tipoDado });
                break;
            case 'trilha':
                abrirModalTrilhas(coords);
                break;
        }
        if (novoObjeto) adicionarObjetoAoCanvas(novoObjeto);
    };

    function adicionarObjetoAoCanvas(obj) {
        if (!obj || !AppState.canvas) return;
        AppState.canvas.add(obj);
        if (obj.type !== 'arrow') AppState.canvas.setActiveObject(obj);
        AppState.canvas.renderAll();
    }

    async function abrirModalTrilhas(coords) {
        const listaTrilhas = document.getElementById('trilha-list');
        listaTrilhas.innerHTML = '<li>Carregando trilhas...</li>';
        modalSelecaoTrilha.style.display = 'flex';

        const trilhasSalvas = await buscarTodosDiagramas();
        listaTrilhas.innerHTML = '';

        const idsTrilhasNoCanvas = new Set();
        AppState.canvas.getObjects().forEach(obj => { if (obj.idTrilha) idsTrilhasNoCanvas.add(String(obj.idTrilha)) });

        const trilhasDisponiveis = trilhasSalvas.filter(trilha => {
            const trilhaApiId = Number(trilha.id);
            const trilhaAtualId = AppState.idTrilhaAtual ? Number(AppState.idTrilhaAtual) : null;
            const jaEstaNoCanvas = idsTrilhasNoCanvas.has(String(trilhaApiId));
            const ehPropriaTrilha = trilhaAtualId !== null && trilhaApiId === trilhaAtualId;
            return !jaEstaNoCanvas && !ehPropriaTrilha;
        });

        if (trilhasDisponiveis.length === 0) {
            listaTrilhas.innerHTML = '<li>Nenhuma outra trilha disponível.</li>';
            const btnFechar = document.createElement('button');
            btnFechar.textContent = 'Fechar';
            btnFechar.onclick = () => modalSelecaoTrilha.style.display = 'none';
            listaTrilhas.appendChild(btnFechar);
            return;
        }

        trilhasDisponiveis.forEach(trilha => {
            const li = document.createElement('li');
            const titulo = (trilha.dados && trilha.dados.modelo) ? trilha.dados.modelo.tituloDiagrama : `Trilha ID ${trilha.id}`;
            li.textContent = titulo;
            li.dataset.trilhaId = trilha.id;
            li.dataset.trilhaTitulo = titulo;
            listaTrilhas.appendChild(li);
        });

        listaTrilhas.onclick = function(e) {
            // Verifica se o clique foi no LI ou em um filho dele
            const liClicado = e.target.closest('li');
            if (liClicado && liClicado.dataset.trilhaId) {
                const caixa = criarPassoVisual({
                    left: coordsAtuais.x,
                    top: coordsAtuais.y,
                    fill: Config.CORES.TRILHA,
                    textoBase: liClicado.dataset.trilhaTitulo,
                    tipoCustomizado: 'trilha',
                    idTrilha: liClicado.dataset.trilhaId
                });
                adicionarObjetoAoCanvas(caixa);
                modalSelecaoTrilha.style.display = 'none';
            }
        };
    }

    function criarAssunto(coords) {
        const textoUsuario = prompt("Digite o título para o Assunto:", "");
        if (textoUsuario && textoUsuario.trim() !== "") {
            const caixa = criarPassoVisual({
                left: coords.x,
                top: coords.y,
                fill: Config.CORES.ASSUNTO,
                textoBase: textoUsuario,
                tipoCustomizado: 'subject'
            });
            adicionarObjetoAoCanvas(caixa);
        }
    }

    async function abrirModalDocumentacao(coords) {
        visaoConteudo.style.display = 'none';
        listaConteudo.innerHTML = '';
        visaoDocumentacao.style.display = 'block';
        botaoVoltarModal.style.display = 'none';
        listaDocumentacao.innerHTML = '<li>Buscando documentações...</li>';
        modalPasso.style.display = 'flex';

        const todasDocumentacoes = await buscarTodasDocumentacoes();
        listaDocumentacao.innerHTML = '';

        if (!todasDocumentacoes || todasDocumentacoes.length === 0) {
            listaDocumentacao.innerHTML = '<li>Nenhuma documentação encontrada.</li>';
            return;
        }

        todasDocumentacoes.forEach(doc => {
            const li = document.createElement('li');
            li.textContent = doc.name || 'Sem nome';
            li.dataset.docUuid = doc.uuid;
            li.dataset.docNome = doc.name || 'Sem nome';
            listaDocumentacao.appendChild(li);
        });
    }

    listaDocumentacao.onclick = async function(e) {
        const liClicado = e.target.closest('li');
        if (liClicado && liClicado.dataset.docUuid) {
            const uuidDoc = liClicado.dataset.docUuid;
            const nomeDoc = liClicado.dataset.docNome;
            visaoDocumentacao.style.display = 'none';
            visaoConteudo.style.display = 'block';
            botaoVoltarModal.style.display = 'inline-block';
            tituloVisaoConteudo.textContent = `Documentos em "${nomeDoc}"`;
            listaConteudo.innerHTML = '<li>Buscando documentos...</li>';

            const documentos = await buscarDocumentosPorUuid(uuidDoc);
            listaConteudo.innerHTML = '';

            const idsConteudosNoCanvas = new Set();
            AppState.canvas.getObjects().forEach(obj => { if (obj.idConteudo) idsConteudosNoCanvas.add(obj.idConteudo); });

            const documentosDisponiveis = documentos.filter(d => d.uuid && !idsConteudosNoCanvas.has(d.uuid));

            if (documentosDisponiveis.length === 0) {
                listaConteudo.innerHTML = '<li>Todos os documentos já adicionados.</li>';
                return;
            }

            documentosDisponiveis.forEach(doc => {
                const li = document.createElement('li');
                li.textContent = doc.title || 'Sem título';
                li.dataset.contentUuid = doc.uuid;
                li.dataset.contentTitle = doc.title || 'Sem título';
                listaConteudo.appendChild(li);
            });
        }
    };

    listaConteudo.onclick = function(e) {
        const liClicado = e.target.closest('li');
        if (liClicado && liClicado.dataset.contentUuid) {
            const caixa = criarPassoVisual({
                left: coordsAtuais.x,
                top: coordsAtuais.y,
                fill: Config.CORES.CONTEUDO,
                textoBase: liClicado.dataset.contentTitle,
                tipoCustomizado: 'content',
                idConteudo: liClicado.dataset.contentUuid
            });
            adicionarObjetoAoCanvas(caixa);
            modalPasso.style.display = 'none';
        }
    };

    botaoVoltarModal.onclick = function() {
        visaoConteudo.style.display = 'none';
        listaConteudo.innerHTML = '';
        visaoDocumentacao.style.display = 'block';
        botaoVoltarModal.style.display = 'none';
    };

    const btnEditarTexto = document.getElementById('edit-text-button');
    if (btnEditarTexto) {
        btnEditarTexto.addEventListener('click', () => {
            const ativo = AppState.canvas.getActiveObject();
            if (ativo) {
                abrirModalEdicao(ativo);
            } else {
                alert("Nenhum item selecionado.");
            }
        });
    }

    if(botaoFecharModal) botaoFecharModal.addEventListener('click', () => modalPasso.style.display = 'none');
    if(document.getElementById('trilha-modal-close-button')) {
        document.getElementById('trilha-modal-close-button').addEventListener('click', () => modalSelecaoTrilha.style.display = 'none');
    }
}