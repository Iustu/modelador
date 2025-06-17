// Função principal que recalcula e atualiza todos os números hierárquicos.
window.updateAllHierarchyNumbers = function() {
    const objects = canvas.getObjects();
    const boxes = objects.filter(o => o.type === 'box');
    const subjects = boxes.filter(b => b.customType === 'subject');

    // ADIÇÃO: Primeiro, limpa a numeração de todas as caixas.
    // Isso garante que caixas "órfãs" percam seu número.
    boxes.forEach(box => {
        updateBoxNumber(box, ''); // Passa uma string vazia para limpar o número
    });

    // Ordena os "Assuntos" principais pela sua posição vertical (de cima para baixo).
    subjects.sort((a, b) => a.top - b.top);

    // Itera sobre cada Assunto para numerá-lo e aos seus filhos.
    subjects.forEach((subject, subjectIndex) => {
        const subjectNumber = subjectIndex + 1;
        updateBoxNumber(subject, `${subjectNumber}`);

        // Aplica a sub-numeração (1.1, 1.2, etc.).
        if (subject.childrenIds && subject.childrenIds.length > 0) {
            subject.childrenIds.forEach((childId, contentIndex) => {
                const contentBox = boxes.find(o => o.objectId === childId);
                if (contentBox) {
                    const contentNumber = `${subjectNumber}.${contentIndex + 1}`;
                    updateBoxNumber(contentBox, contentNumber);
                }
            });
        }
    });

    canvas.renderAll();
};

// Função auxiliar que atualiza a propriedade e o texto do número em uma caixa.
// Ela já funciona para limpar o texto ao receber uma string vazia.
function updateBoxNumber(box, number) {
    // Armazena o número no objeto para salvar/exportar.
    box.hierarchyNumber = number;
    // Encontra o objeto de texto do número dentro do grupo da caixa.
    const numberTextObj = box._objects.find(o => o.isHierarchyNumber);
    if (numberTextObj) {
        numberTextObj.set('text', number);
    }
}