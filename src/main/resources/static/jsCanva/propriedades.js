/**
 * Gerencia o modal de propriedades.
 */
import { AppState } from './app.js';
import { atualizarVisualAssunto } from './renderizador.js';
// CORREÇÃO: Importar atualizarVisualCaminho de caminho.js, não de renderizador.js
import { atualizarVisualCaminho } from './caminho.js';

let modalPropriedades, botaoFecharModal, botaoConcluir;
let grupoPropsAssunto, grupoPropsCaminho, grupoPropsNenhum, grupoPropsTexto;
let seletorTipoSelecao, seletorTipoCaminho, inputTexto;
let elementoSelecionado = null;

export function inicializarPainelPropriedades() {
    console.log("DEBUG: propriedades.js - Inicializando...");

    modalPropriedades = document.getElementById('modal-propriedades');
    botaoFecharModal = document.getElementById('btn-fechar-modal-propriedades');
    botaoConcluir = document.getElementById('btn-salvar-props');

    grupoPropsAssunto = document.getElementById('grupo-props-assunto');
    grupoPropsCaminho = document.getElementById('grupo-props-caminho');
    grupoPropsNenhum = document.getElementById('grupo-props-nenhum');
    grupoPropsTexto = document.getElementById('grupo-props-texto');

    seletorTipoSelecao = document.getElementById('select-tipo-selecao');
    seletorTipoCaminho = document.getElementById('select-tipo-caminho');
    inputTexto = document.getElementById('input-texto-elemento');

    if (!modalPropriedades) return;

    if (inputTexto) {
        inputTexto.addEventListener('input', (evento) => {
            const novoTexto = evento.target.value;
            if (elementoSelecionado && elementoSelecionado.type === 'box') {
                elementoSelecionado.textoBase = novoTexto;
                const objetoTexto = elementoSelecionado.getObjects('textbox')[0];
                if (objetoTexto) {
                    const prefixo = elementoSelecionado.hierarchyNumber ? `${elementoSelecionado.hierarchyNumber} - ` : '';
                    objetoTexto.set('text', prefixo + novoTexto);
                }
                AppState.canvas.requestRenderAll();
            }
        });
    }

    if (seletorTipoSelecao) {
        seletorTipoSelecao.addEventListener('change', (evento) => {
            const novoValor = evento.target.value;
            if (elementoSelecionado && elementoSelecionado.customType === 'subject') {
                elementoSelecionado.set('tipoSelecao', novoValor);
                atualizarVisualAssunto(elementoSelecionado);
                AppState.canvas.renderAll();
            }
        });
    }

    if (seletorTipoCaminho) {
        seletorTipoCaminho.addEventListener('change', (evento) => {
            const novoValor = evento.target.value;
            if (elementoSelecionado && elementoSelecionado.type === 'arrow') {
                elementoSelecionado.set('pathType', novoValor);
                // CORREÇÃO: Usa a função importada corretamente de caminho.js
                atualizarVisualCaminho(elementoSelecionado);
            }
        });
    }

    if (botaoFecharModal) botaoFecharModal.addEventListener('click', fecharModal);
    if (botaoConcluir) botaoConcluir.addEventListener('click', fecharModal);

    if (AppState.canvas) {
        AppState.canvas.on('mouse:dblclick', (evento) => {
            if (evento.target) abrirModalEdicao(evento.target);
        });
        AppState.canvas.on('selection:cleared', fecharModal);
    }
};

export function abrirModalEdicao(elemento) {
    if (!elemento) return;

    const ehBox = (elemento.type === 'box');
    const ehAssunto = (ehBox && elemento.customType === 'subject');
    const ehCaminho = (elemento.type === 'arrow');

    if (!ehBox && !ehCaminho) return;

    elementoSelecionado = elemento;
    modalPropriedades.style.display = 'flex';
    esconderTodosGrupos();

    if (ehBox) {
        grupoPropsTexto.style.display = 'block';
        inputTexto.value = elemento.textoBase || '';
        inputTexto.focus();

        if (ehAssunto) {
            grupoPropsAssunto.style.display = 'block';
            seletorTipoSelecao.value = elemento.tipoSelecao || 'MULTIPLA';
        }
    } else if (ehCaminho) {
        grupoPropsCaminho.style.display = 'block';
        seletorTipoCaminho.value = elemento.pathType || 'OBRIGATORIO';
    }
}

function fecharModal() {
    if (modalPropriedades) {
        modalPropriedades.style.display = 'none';
        elementoSelecionado = null;
    }
}

function esconderTodosGrupos() {
    if (grupoPropsTexto) grupoPropsTexto.style.display = 'none';
    if (grupoPropsAssunto) grupoPropsAssunto.style.display = 'none';
    if (grupoPropsCaminho) grupoPropsCaminho.style.display = 'none';
    if (grupoPropsNenhum) grupoPropsNenhum.style.display = 'none';
}