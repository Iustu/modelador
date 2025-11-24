/**
 * Contém funções utilitárias de uso geral.
 */

// Gera um ID único alfanumérico para objetos do canvas
export function gerarId() {
    return 'obj-' + Math.random().toString(36).substr(2, 9);
}