window.updateAllHierarchyNumbers = function() {
    const allObjects = canvas.getObjects();
    const boxes = allObjects.filter(o => o.type === 'box');
    const arrows = allObjects.filter(o => o.type === 'arrow');
    const objectMap = new Map(allObjects.map(o => [o.objectId, o]));

    // 1. Limpa toda a numeração existente.
    boxes.forEach(box => updateBoxNumber(box, ''));

    // 2. Encontra os pontos de partida de todas as trilhas.
    const startNodes = allObjects.filter(o => o.customType === 'start').sort((a, b) => a.top - b.top);
    
    let subjectCounter = 1; // Contador global para os assuntos.

    // 3. PRIMEIRO PASSO: Percorre cada trilha para numerar a sequência principal de Assuntos.
    startNodes.forEach(startNode => {
        let currentObject = startNode;
        const visitedInTrail = new Set(); // Para evitar loops infinitos

        while (currentObject) {
            if (visitedInTrail.has(currentObject.objectId)) break;
            visitedInTrail.add(currentObject.objectId);

            const outgoingArrows = arrows.filter(a => a.from === currentObject.objectId);
            let nextSubject = null;

            // Procura pela continuação da trilha (uma seta para outro assunto).
            for (const arrow of outgoingArrows) {
                const target = objectMap.get(arrow.to);
                if (target && target.customType === 'subject') {
                    // Se encontrar, numera o alvo e o define como o próximo a ser visitado.
                    updateBoxNumber(target, `${subjectCounter}`);
                    subjectCounter++;
                    nextSubject = target;
                    break;
                }
            }
            // Avança para o próximo assunto na cadeia.
            currentObject = nextSubject;
        }
    });

    // 4. SEGUNDO PASSO: Numera os conteúdos filhos de cada assunto que já foi numerado.
    const subjects = boxes.filter(b => b.customType === 'subject');
    subjects.forEach(subject => {
        // Procede apenas se o assunto recebeu um número no passo anterior.
        if (subject.hierarchyNumber) {
            // Garante que a lista de filhos do assunto está atualizada.
            if (window.rebuildChildrenList) {
                window.rebuildChildrenList(subject);
            }

            if (subject.childrenIds && subject.childrenIds.length > 0) {
                const childrenObjects = subject.childrenIds
                    .map(id => objectMap.get(id))
                    .filter(Boolean)
                    .sort((a, b) => a.top - b.top);
                
                childrenObjects.forEach((contentBox, contentIndex) => {
                    const contentNumber = `${subject.hierarchyNumber}.${contentIndex + 1}`;
                    updateBoxNumber(contentBox, contentNumber);
                });
            }
        }
    });

    canvas.renderAll();
};

function updateBoxNumber(box, number) {
    if (!box) return;
    box.hierarchyNumber = number;
    const numberTextObj = box._objects.find(o => o.isHierarchyNumber);
    if (numberTextObj) {
        numberTextObj.set('text', number);
    }
}