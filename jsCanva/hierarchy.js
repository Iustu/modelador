window.updateAllHierarchyNumbers = function() {
    const allObjects = canvas.getObjects();
    const boxes = allObjects.filter(o => o.type === 'box');
    const arrows = allObjects.filter(o => o.type === 'arrow');
    const startNodes = allObjects.filter(o => o.customType === 'start');
    const objectMap = new Map(allObjects.map(o => [o.objectId, o]));

    // 1. Limpa toda a numeração existente
    boxes.forEach(box => updateBoxNumber(box, ''));

    // 2. Ordena os nós de início pela posição para ter uma ordem de trilha consistente
    startNodes.sort((a, b) => a.top - b.top);

    // 3. Itera por cada trilha (iniciada por um nó de Início)
    startNodes.forEach((startNode, trailIndex) => {
        const trailNumber = trailIndex + 1;
        
        // Encontra a seta que sai do nó de início
        const startArrow = arrows.find(a => a.from === startNode.objectId);
        if (!startArrow) return;

        // Encontra o Assunto conectado ao início
        const subject = objectMap.get(startArrow.to);
        if (!subject || subject.customType !== 'subject') return;

        // 4. Numera o Assunto principal da trilha
        updateBoxNumber(subject, `${trailNumber}`);

        // 5. Numera os conteúdos filhos deste assunto (lógica anterior mantida)
        if (subject.childrenIds && subject.childrenIds.length > 0) {
            const childrenObjects = subject.childrenIds
                .map(id => boxes.find(o => o.objectId === id))
                .filter(Boolean)
                .sort((a, b) => a.top - b.top);
            
            childrenObjects.forEach((contentBox, contentIndex) => {
                const contentNumber = `${trailNumber}.${contentIndex + 1}`;
                updateBoxNumber(contentBox, contentNumber);
            });
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