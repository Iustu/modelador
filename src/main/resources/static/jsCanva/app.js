/**
 * Estado global da aplicação.
 * Substitui o antigo window.App e mantém o canvas e o ID atual.
 */
export const AppState = {
    canvas: null,
    idTrilhaAtual: null,

    // Flags de controle de desenho
    desenhandoCaminho: false,
    ehCaminhoHierarquia: false,
    objetoInicioCaminho: null
};