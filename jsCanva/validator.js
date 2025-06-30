document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('validate-button').addEventListener('click', validateDiagram);
});

// Função principal que executa todas as validações.
function validateDiagram() {
    const objects = canvas.getObjects();
    const boxes = objects.filter(o => o.type === 'box');
    const arrows = objects.filter(o => o.type === 'arrow');
    let errors = [];

    const boxMap = new Map(boxes.map(b => [b.objectId, b]));

    errors.push(...checkOrphanedBoxes(boxes, arrows));
    errors.push(...checkConnectionRules(arrows, boxMap));
    errors.push(...checkSubjectArrowRules(boxes, arrows));
    errors.push(...checkContentInputRules(boxes, arrows, boxMap));
    errors.push(...checkContentOutputRules(boxes, arrows)); // Nova validação
    errors.push(...checkOrphanedChains(boxes, arrows, boxMap));
    errors.push(...checkDuplicateConnections(arrows, boxMap));

    if (errors.length === 0) {
        alert('✅ Diagrama válido! Nenhum erro encontrado.');
    } else {
        const errorMessages = "Erros encontrados no diagrama:\n\n- " + errors.join("\n- ");
        alert(errorMessages);
    }
}

// REGRA 1: Verifica se existem caixas sem nenhuma conexão.
function checkOrphanedBoxes(boxes, arrows) {
    const errors = [];
    const connectedBoxIds = new Set();
    arrows.forEach(arrow => {
        connectedBoxIds.add(arrow.from);
        connectedBoxIds.add(arrow.to);
    });

    boxes.forEach(box => {
        if (!connectedBoxIds.has(box.objectId)) {
            const boxText = box._objects.find(o => o.type === 'textbox').text;
            errors.push(`A caixa "${boxText}" não possui nenhuma conexão.`);
        }
    });
    return errors;
}

// REGRA 2: Verifica as regras de conexão entre tipos de caixas.
function checkConnectionRules(arrows, boxMap) {
    const errors = [];
    arrows.forEach(arrow => {
        const startBox = boxMap.get(arrow.from);
        const endBox = boxMap.get(arrow.to);

        if (!startBox || !endBox) {
            errors.push('Foi encontrada uma seta que não está conectada corretamente a duas caixas.');
            return;
        }

        const startText = startBox._objects.find(o => o.type === 'textbox').text;
        const endText = endBox._objects.find(o => o.type === 'textbox').text;
        const startType = startBox.customType;
        const endType = endBox.customType;

        if (startType === 'content' && endType === 'subject') {
            errors.push(`Hierarquia inválida: Um Conteúdo ("${startText}") não pode se conectar a um Assunto ("${endText}").`);
        }
    });
    return errors;
}

// REGRA 3: Verifica se um "Assunto" tem mais de uma seta tracejada de saída.
function checkSubjectArrowRules(boxes, arrows) {
    const errors = [];
    const subjects = boxes.filter(b => b.customType === 'subject');

    subjects.forEach(subject => {
        const outgoingDashedArrows = arrows.filter(a => a.from === subject.objectId && a.tipo === 'tracejada');
        
        if (outgoingDashedArrows.length > 1) {
            const subjectText = subject._objects.find(o => o.type === 'textbox').text;
            errors.push(`Regra violada: O Assunto "${subjectText}" não pode ter mais de uma seta tracejada (início de cadeia).`);
        }
    });

    return errors;
}

// REGRA 4: Um conteúdo não pode ter mais de uma entrada vinda de outro conteúdo.
function checkContentInputRules(boxes, arrows, boxMap) {
    const errors = [];
    const contents = boxes.filter(b => b.customType === 'content');

    contents.forEach(content => {
        const incomingFromContent = arrows.filter(arrow => {
            if (arrow.to !== content.objectId) return false;
            const fromBox = boxMap.get(arrow.from);
            return fromBox && fromBox.customType === 'content';
        });

        if (incomingFromContent.length > 1) {
            const contentText = content._objects.find(o => o.type === 'textbox').text;
            errors.push(`Regra violada: O Conteúdo "${contentText}" recebe mais de uma seta de outro Conteúdo, o que não é permitido.`);
        }
    });
    return errors;
}

// REGRA 5: Um conteúdo não pode ter mais de uma seta de saída.
function checkContentOutputRules(boxes, arrows) {
    const errors = [];
    const contents = boxes.filter(b => b.customType === 'content');

    contents.forEach(content => {
        const outgoingArrows = arrows.filter(arrow => arrow.from === content.objectId);

        if (outgoingArrows.length > 1) {
            const contentText = content._objects.find(o => o.type === 'textbox').text;
            errors.push(`Regra violada: O Conteúdo "${contentText}" não pode ter mais de uma seta de saída.`);
        }
    });

    return errors;
}

// REGRA 6: Um conteúdo deve pertencer a uma cadeia que se origina de um Assunto.
function checkOrphanedChains(boxes, arrows, boxMap) {
    const errors = [];
    const subjects = boxes.filter(b => b.customType === 'subject');
    const allContent = boxes.filter(b => b.customType === 'content');
    
    if (allContent.length === 0) return [];

    const reachableContentIds = new Set();
    const q = [...subjects];
    const visited = new Set(subjects.map(s => s.objectId));

    while (q.length > 0) {
        const currentBox = q.shift();
        const outgoingArrows = arrows.filter(a => a.from === currentBox.objectId);

        for (const arrow of outgoingArrows) {
            const childBox = boxMap.get(arrow.to);
            if (childBox && !visited.has(childBox.objectId)) {
                visited.add(childBox.objectId);
                q.push(childBox);
                if (childBox.customType === 'content') {
                    reachableContentIds.add(childBox.objectId);
                }
            }
        }
    }

    allContent.forEach(content => {
        if (!reachableContentIds.has(content.objectId)) {
            const contentText = content._objects.find(o => o.type === 'textbox').text;
            errors.push(`Conteúdo órfão: O Conteúdo "${contentText}" não pertence a uma trilha iniciada por um Assunto.`);
        }
    });
    return errors;
}

// REGRA 7: Verifica se existem setas duplicadas.
function checkDuplicateConnections(arrows, boxMap) {
    const errors = [];
    const existingConnections = new Set();

    arrows.forEach(arrow => {
        const connectionKey = `${arrow.from}->${arrow.to}`;
        if (existingConnections.has(connectionKey)) {
            const startBox = boxMap.get(arrow.from);
            const endBox = boxMap.get(arrow.to);
            const startText = startBox._objects.find(o => o.type === 'textbox').text;
            const endText = endBox._objects.find(o => o.type === 'textbox').text;
            errors.push(`Conexão duplicada entre "${startText}" e "${endText}".`);
        } else {
            existingConnections.add(connectionKey);
        }
    });
    return errors;
}