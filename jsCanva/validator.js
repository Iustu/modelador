document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('validate-button').addEventListener('click', validateDiagram);
});

// Função principal que executa todas as validações.
function validateDiagram() {
    const objects = canvas.getObjects();
    const boxes = objects.filter(o => o.type === 'box');
    const arrows = objects.filter(o => o.type === 'arrow');
    const errors = [];

    // Mapeia IDs para caixas para facilitar a busca.
    const boxMap = new Map(boxes.map(b => [b.objectId, b]));

    errors.push(...checkOrphanedBoxes(boxes, arrows));
    errors.push(...checkConnectionRules(arrows, boxMap));
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

// REGRAS 2, 3 e 4: Verifica as regras de conexão entre tipos de caixas.
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
        const arrowType = arrow.tipo;

        // Assunto só pode se ligar a Assunto com seta tracejada ('Bloqueado')
        if (startType === 'subject' && endType === 'subject' && arrowType !== 'Bloqueado') {
            errors.push(`Conexão inválida: Assuntos ("${startText}" e "${endText}") só podem ser ligados por setas tracejadas.`);
        }
        // Assunto só pode se ligar a Conteúdo com seta contínua ('Percorrível')
        if (startType === 'subject' && endType === 'content' && arrowType !== 'Percorrível') {
            errors.push(`Conexão inválida: Um Assunto ("${startText}") só pode se ligar a um Conteúdo ("${endText}") com seta contínua.`);
        }
        // Conteúdo só pode se ligar a Conteúdo com seta contínua ('Percorrível')
        if (startType === 'content' && endType === 'content' && arrowType !== 'Percorrível') {
            errors.push(`Conexão inválida: Conteúdos ("${startText}" e "${endText}") só podem ser ligados por setas contínuas.`);
        }
        // Regra adicional: Conteúdo não pode se ligar a um Assunto com seta contínua, pois quebra a hierarquia.
        if (startType === 'content' && endType === 'subject' && arrowType === 'Percorrível') {
            errors.push(`Hierarquia inválida: Um Conteúdo ("${startText}") não pode ser pai de um Assunto ("${endText}").`);
        }
    });
    return errors;
}

// REGRA 5: Verifica se existem setas duplicadas entre as mesmas duas caixas.
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