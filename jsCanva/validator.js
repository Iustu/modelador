document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('validate-button').addEventListener('click', validateDiagram);
});

// Função principal que executa todas as validações.
function validateDiagram() {
    const objects = canvas.getObjects();
    const allDiagramObjects = objects.filter(o => o.type === 'box' || o.type === 'node');
    const arrows = objects.filter(o => o.type === 'arrow');
    let errors = [];

    const objectMap = new Map(allDiagramObjects.map(o => [o.objectId, o]));

    allDiagramObjects.forEach(obj => {
        const incoming = arrows.filter(a => a.to === obj.objectId);
        const outgoing = arrows.filter(a => a.from === obj.objectId);

        switch (obj.customType) {
            case 'start':
                errors.push(...validateStartNode(obj, incoming, outgoing, objectMap));
                break;
            case 'end':
                errors.push(...validateEndNode(obj, incoming, outgoing));
                break;
            case 'subject':
                errors.push(...validateSubjectNode(obj, incoming, outgoing, objectMap));
                break;
            case 'content':
                errors.push(...validateContentNode(obj, incoming, outgoing, objectMap));
                break;
        }
    });

    errors.push(...checkOrphanedTrails(allDiagramObjects, arrows, objectMap));
    errors.push(...checkDuplicateConnections(arrows, objectMap));

    if (errors.length === 0) {
        alert('✅ Diagrama válido! Nenhum erro encontrado.');
    } else {
        const errorMessages = "Erros encontrados no diagrama:\n\n- " + errors.join("\n- ");
        alert(errorMessages);
    }
}

function validateStartNode(node, incoming, outgoing, objectMap) {
    const errors = [];
    if (incoming.length > 0) {
        errors.push("O nó de Início não pode receber setas.");
    }
    if (outgoing.length !== 1) {
        errors.push("O nó de Início deve ter exatamente uma seta de saída para um Assunto.");
    } else {
        const target = objectMap.get(outgoing[0].to);
        if (!target || target.customType !== 'subject') {
            errors.push("O nó de Início deve apontar para um Assunto.");
        }
    }
    return errors;
}

function validateEndNode(node, incoming, outgoing) {
    const errors = [];
    if (outgoing.length > 0) {
        errors.push("O nó de Fim não pode ter setas de saída.");
    }
    if (incoming.length === 0) {
        errors.push("O nó de Fim deve receber ao menos uma seta.");
    }
    return errors;
}

function validateSubjectNode(subject, incoming, outgoing, objectMap) {
    const errors = [];
    const subjectText = subject._objects.find(o => o.type === 'textbox').text;

    if (outgoing.length === 0) {
        errors.push(`Beco sem saída: O Assunto "${subjectText}" não possui nenhuma seta de saída.`);
    }

    const hasContentConnection = outgoing.some(a => objectMap.get(a.to)?.customType === 'content');
    if (!hasContentConnection) {
        errors.push(`O Assunto "${subjectText}" deve estar conectado a pelo menos um Conteúdo.`);
    }

    const outgoingHierarchyArrows = outgoing.filter(a => a.isHierarchy === true);
    if (outgoingHierarchyArrows.length > 1) {
        errors.push(`Regra violada: O Assunto "${subjectText}" não pode ter mais de uma seta hierárquica (tracejada).`);
    }

    if (hasContentConnection && outgoingHierarchyArrows.length === 0) {
        errors.push(`Início de cadeia inválido: O Assunto "${subjectText}" se conecta a Conteúdos, mas não possui a seta hierárquica (tracejada) obrigatória.`);
    }

    const ambiguousOutgoing = outgoing.filter(a => {
        const target = objectMap.get(a.to);
        return target && (target.customType === 'subject' || target.customType === 'end');
    });
    if (ambiguousOutgoing.length > 1) {
        errors.push(`Ambiguidade: O Assunto "${subjectText}" tem múltiplas saídas para outros Assuntos ou para o Fim.`);
    }

    return errors;
}

function validateContentNode(content, incoming, outgoing, objectMap) {
    const errors = [];
    const contentText = content._objects.find(o => o.type === 'textbox').text;

    const incomingFromContent = incoming.filter(a => objectMap.get(a.from)?.customType === 'content');
    if (incomingFromContent.length > 1) {
        errors.push(`Regra violada: O Conteúdo "${contentText}" não pode receber setas de mais de um outro Conteúdo.`);
    }

    if (outgoing.length > 1) {
        errors.push(`Regra violada: O Conteúdo "${contentText}" não pode ter mais de uma seta de saída.`);
    }
    
    const pointsToSubject = outgoing.some(a => objectMap.get(a.to)?.customType === 'subject');
    if(pointsToSubject) {
        errors.push(`Hierarquia inválida: O Conteúdo "${contentText}" não pode se conectar a um Assunto.`);
    }

    return errors;
}

function checkOrphanedTrails(allDiagramObjects, arrows, objectMap) {
    const errors = [];
    const startNodes = allDiagramObjects.filter(o => o.customType === 'start');
    const subjects = allDiagramObjects.filter(o => o.customType === 'subject');
    const contents = allDiagramObjects.filter(o => o.customType === 'content');
    
    const reachableFromStart = new Set();
    const q = [...startNodes];
    const visited = new Set();

    while(q.length > 0) {
        const current = q.shift();
        if(visited.has(current.objectId)) continue;
        visited.add(current.objectId);
        reachableFromStart.add(current);

        arrows.filter(a => a.from === current.objectId)
              .forEach(a => {
                  const neighbor = objectMap.get(a.to);
                  if (neighbor && !visited.has(neighbor.objectId)) {
                      q.push(neighbor);
                  }
              });
    }

    subjects.forEach(subject => {
        if (!reachableFromStart.has(subject)) {
            const subjectText = subject._objects.find(o => o.type === 'textbox').text;
            errors.push(`Assunto órfão: O Assunto "${subjectText}" não pertence a uma trilha iniciada.`);
        }
    });

    contents.forEach(content => {
        if (!reachableFromStart.has(content)) {
            const contentText = content._objects.find(o => o.type === 'textbox').text;
            errors.push(`Conteúdo órfão: O Conteúdo "${contentText}" não pertence a uma trilha iniciada.`);
        }
    });
    
    return errors;
}

function checkDuplicateConnections(arrows, objectMap) {
    const errors = [];
    const existingConnections = new Set();
    arrows.forEach(arrow => {
        const connectionKey = `${arrow.from}->${arrow.to}`;
        if (existingConnections.has(connectionKey)) {
            const startBox = objectMap.get(arrow.from);
            const endBox = objectMap.get(arrow.to);
            let startText = startBox.customType;
            let endText = endBox.customType;
            if (startBox.type === 'box') startText = startBox._objects.find(o => o.type === 'textbox').text;
            if (endBox.type === 'box') endText = endBox._objects.find(o => o.type === 'textbox').text;
            errors.push(`Conexão duplicada entre "${startText}" e "${endText}".`);
        } else {
            existingConnections.add(connectionKey);
        }
    });
    return errors;
}