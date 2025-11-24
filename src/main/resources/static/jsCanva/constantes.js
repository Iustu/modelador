/**
 * Centraliza as configurações, cores e dimensões do sistema (Tema).
 * Define os padrões de linha para os caminhos.
 */
export const Config = {
    DIMENSOES: {
        LARGURA_BOX: 200,
        ALTURA_BOX: 80,
        RAIO_CANTO: 5,
        RAIO_INICIO: 15,
        RAIO_FIM_INTERNO: 12,
        RAIO_FIM_EXTERNO: 18
    },
    CORES: {
        // Cores de Fundo
        ASSUNTO: '#f1c40f', // Amarelo
        TRILHA: '#009c3b',  // Verde
        CONTEUDO: '#3498db',// Azul
        INICIO: 'black',
        FIM: 'black',
        PADRAO: '#cccccc',

        // Cores de Texto
        TEXTO_ESCURO: '#000000',
        TEXTO_CLARO: '#ffffff',

        // Cores de Borda
        BORDA_PADRAO: 'black',
        BORDA_CONTEUDO: '#2c3e50'
    },
    ESTILOS: {
        BORDA_ESPESSURA: 2,
        TRACEJADO_ASSUNTO: [8, 4],
        TRACEJADO_CONTEUDO: [3, 3],
        TRACEJADO_FIM: [5, 3],
        FONTE_TAMANHO: 16,

        // Configuração de Linhas (Stroke Dash Array)
        // null = linha sólida
        LINHAS: {
            OBRIGATORIO: null,              // Linha Sólida
            OPCIONAL: [5, 5],               // Tracejado simples
            RECOMENDADO: [15, 3, 3, 3],     // Traço longo, ponto
            PREFERENCIAL: [2, 2]            // Pontilhado fino
        }
    }
};