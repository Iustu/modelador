/**
 * Gerencia importação/exportação local.
 */
import { AppState } from './app.js';
import { serializarCanvasParaBackend } from './serializador.js';
import { criarPassoVisual } from './renderizador.js';
import { criarNoInicioFim } from './fluxo.js';
import { criarCaminhoPadrao } from './caminho.js';
import { atualizarTodasHierarquias } from './canvas_principal.js';
import { atualizarNumerosHierarquia } from './hierarquia.js';

export function inicializarImportarExportar() {
    const btnExportar = document.getElementById("export-button");
    if (btnExportar) {
        btnExportar.addEventListener("click", () => {
            const dados = serializarCanvasParaBackend();
            const titulo = dados.tituloDiagrama;
            const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
            const linkDownload = document.createElement("a");
            linkDownload.href = URL.createObjectURL(blob);
            const nomeSeguro = titulo.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase() || 'diagrama';
            linkDownload.download = `${nomeSeguro}.json`;
            document.body.appendChild(linkDownload);
            linkDownload.click();
            document.body.removeChild(linkDownload);
        });
    }

    const btnImportar = document.getElementById("import-button");
    if (btnImportar) {
        btnImportar.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = async (e) => {
                const arquivo = e.target.files[0];
                if (!arquivo) return;
                const conteudo = await arquivo.text();
                try {
                    const dados = JSON.parse(conteudo);
                    carregarCanvasDoJson(dados);
                } catch (erro) {
                    console.error("Erro ao importar JSON:", erro);
                    alert("Arquivo JSON inválido.");
                }
            };
            input.click();
        });
    }
}

export function carregarCanvasDoJson(dados) {
    AppState.canvas.clear();
    document.getElementById('diagram-title-input').value = dados.tituloDiagrama || "";
    const mapaIdObjeto = {};
    const objetosParaCarregar = dados.objetosDiagrama || [];

    objetosParaCarregar.forEach(dadosObj => {
        let novoObjeto;
        const opcoesObjeto = { ...dadosObj, objectId: dadosObj.id };

        if (dadosObj.type === 'box') {
            novoObjeto = criarPassoVisual(opcoesObjeto);
        } else if (dadosObj.type === 'node') {
            if (['start', 'end'].includes(dadosObj.tipoCustomizado)) {
                novoObjeto = criarNoInicioFim(opcoesObjeto);
            }
        }

        if (novoObjeto) {
            AppState.canvas.add(novoObjeto);
            mapaIdObjeto[dadosObj.id] = novoObjeto;
        }
    });

    AppState.canvas.renderAll();
    AppState.canvas.getObjects().forEach(obj => obj.setCoords());

    if (dados.caminhos) {
        dados.caminhos.forEach(dadosCaminho => {
            const objInicio = mapaIdObjeto[dadosCaminho.de];
            const objFim = mapaIdObjeto[dadosCaminho.para];
            if (objInicio && objFim) {
                criarCaminhoPadrao(objInicio, objFim, dadosCaminho.eHierarquia, dadosCaminho.tipoCaminho);
            }
        });
    }

    setTimeout(() => {
        atualizarTodasHierarquias();
        atualizarNumerosHierarquia();
        AppState.canvas.renderAll();
    }, 100);
}