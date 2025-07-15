//Atualiza o texto da caixa, concatenando o número da hierarquia com o título base.
function updateBoxNumber(box, number) {
    if (!box || !box.getObjects) return;
    box.hierarchyNumber = number;
    const textBox = box.getObjects('textbox')[0];
    if (textBox) {
        // Se houver um número, concatena. Senão, mostra apenas o título base.
        const newText = number ? `${number} - ${box.baseText}` : box.baseText;
        textBox.set('text', newText);
    }
}

//Função recursiva que numera os filhos hierárquicos de um nó pai.
function numberHierarchyChildren(parent, parentNumber, objectMap) {
    if (!parent || parent.customType !== 'subject' || !parent.childrenIds || parent.childrenIds.length === 0) {
        return;
    }
    if (window.rebuildChildrenList) {
        window.rebuildChildrenList(parent);
    }
    const childrenObjects = parent.childrenIds
        .map(id => objectMap.get(id))
        .filter(Boolean);
    
    childrenObjects.forEach((child, index) => {
        const childNumber = `${parentNumber}.${index + 1}`;
        updateBoxNumber(child, childNumber);
        numberHierarchyChildren(child, childNumber, objectMap);
    });
}

//Recalcula e atualiza todos os números hierárquicos no canvas.
window.updateAllHierarchyNumbers = function() {
    const allObjects = canvas.getObjects();
    const allDiagramObjects = allObjects.filter(o => o.type === 'box' || o.type === 'node');
    const arrows = allObjects.filter(o => o.type === 'arrow');
    const objectMap = new Map(allDiagramObjects.map(o => [o.objectId, o]));

    allDiagramObjects.forEach(obj => updateBoxNumber(obj, ''));

    const startNodes = allDiagramObjects.filter(o => o.customType === 'start').sort((a, b) => a.top - b.top);
    
    startNodes.forEach(startNode => {
        let counter = 1;
        let current = startNode;
        const visited = new Set();
        while (current) {
            if (visited.has(current.objectId)) break;
            visited.add(current.objectId);
            if (current.type === 'box') {
                updateBoxNumber(current, `${counter}`);
                counter++;
            }
            const nextArrow = arrows.find(a => a.from === current.objectId && !a.isHierarchy);
            current = nextArrow ? objectMap.get(nextArrow.to) : null;
        }
    });

    const subjects = allDiagramObjects.filter(b => b.customType === 'subject');
    subjects.forEach(subject => {
        if (subject.hierarchyNumber && !subject.parentId) {
             numberHierarchyChildren(subject, subject.hierarchyNumber, objectMap);
        }
    });

    canvas.renderAll();
};