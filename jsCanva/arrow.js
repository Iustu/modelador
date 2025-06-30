// Variáveis de estado globais para o modo de desenho.
window.isDrawingArrow = false;
window.arrowTypeToDraw = null; 
window.arrowStartObject = null;

// Ativa o modo de desenho de seta.
document.getElementById('arrow-button').addEventListener('click', () => {
    window.isDrawingArrow = true;
    window.arrowTypeToDraw = 'Percorrível';
    window.arrowStartObject = null;
});

// Ativa o modo de desenho de seta tracejada.
document.getElementById('dashed-arrow-button').addEventListener('click', () => {
    window.isDrawingArrow = true;
    window.arrowTypeToDraw = 'Bloqueado';
    window.arrowStartObject = null;
});


// Define a função que manipula os cliques para criar a seta.
window.handleMouseDownForArrow = function (e) {
    if (!window.isDrawingArrow || !e.target || e.target.type !== 'box') return;

    if (!window.arrowStartObject) {
        window.arrowStartObject = e.target;
    } else {
        const endBox = e.target;
        // Apenas cria a seta se os objetos forem diferentes
        if (window.arrowStartObject.objectId !== endBox.objectId) {
            window.createStandardArrow(window.arrowStartObject, endBox, window.arrowTypeToDraw);
        }
        // Reseta o estado do desenho
        window.isDrawingArrow = false;
        window.arrowStartObject = null;
        window.arrowTypeToDraw = null;
    }
};

//Atualiza a relação de parentesco chamando a reconstrução da árvore.
function updateParentChildRelationship(startObj, endObj) {
    // A lógica de parentesco só se aplica a setas que terminam em um 'content'.
    if (endObj.customType !== 'content') return;

    let subject = null;
    // Encontra o "Assunto" raiz da cadeia.
    if (startObj.customType === 'subject') {
        subject = startObj;
    } else if (startObj.parentId) { // Se o objeto inicial já pertence a um assunto.
        subject = canvas.getObjects().find(o => o.objectId === startObj.parentId);
    }

    // Se um "Assunto" foi encontrado, reconstruímos toda a sua lista de filhos.
    if (subject && typeof window.rebuildChildrenList === 'function') {
        setTimeout(() => 
            {window.rebuildChildrenList(subject);
            window.updateAllHierarchyNumbers();}
        ,0) //atualiza hierarquia
    }
}

// A função agora recebe 'tipo' como parâmetro.
window.createStandardArrow = function(startObj, endObj, tipo) {
    const startPoint = getEdgePoint(startObj, endObj.getCenterPoint());
    const endPoint = getEdgePoint(endObj, startObj.getCenterPoint());

    const lineOptions = { stroke: 'black', strokeWidth: 2, selectable: false, objectCaching: false };
    if (tipo === 'Bloqueado') {
        lineOptions.strokeDashArray = [5, 5];
    }
    const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], lineOptions);
    
    const angle = fabric.util.radiansToDegrees(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)) + 90;
    const tri = new fabric.Triangle({ width: 10, height: 15, fill: 'black', left: endPoint.x, top: endPoint.y, angle: angle, originX: 'center', originY: 'center', selectable: false, objectCaching: false });
    
    const arrow = new fabric.Group([line, tri], {
        type: 'arrow',
        arrowSubType: 'standard',
        from: startObj.objectId,
        to: endObj.objectId,
        tipo: tipo,
        selectable: true,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false
    });

    canvas.add(arrow).setActiveObject(arrow);
    
    if (tipo === 'Percorrível') {
        updateParentChildRelationship(startObj, endObj);
    }
}

// Disponibiliza a função globalmente.
window.updateArrowsForObject = function(movedObj) {
    if (!movedObj || movedObj.type !== 'box') return;
    canvas.getObjects().forEach(obj => {
        if (obj.type === 'arrow' && (obj.from === movedObj.objectId || obj.to === movedObj.objectId)) {
            const startBox = canvas.getObjects().find(o => o.objectId === obj.from);
            const endBox = canvas.getObjects().find(o => o.objectId === obj.to);
            if (!startBox || !endBox) return;

            // A lógica para 'selfLoop' foi removida.
            // Apenas a lógica para setas padrão ('standard') permanece.
            const line = obj.item(0), tri = obj.item(1);
            const startPoint = getEdgePoint(startBox, endBox.getCenterPoint());
            const endPoint = getEdgePoint(endBox, startBox.getCenterPoint());
            line.set({ 'x1': startPoint.x, 'y1': startPoint.y, 'x2': endPoint.x, 'y2': endPoint.y });
            const angle = fabric.util.radiansToDegrees(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)) + 90;
            tri.set({ left: endPoint.x, top: endPoint.y, angle: angle });
            
            obj._calcBounds();
            obj._updateObjectsCoords();
            obj.setCoords();
        }
    });
    canvas.requestRenderAll();
}

// Calcula o ponto de conexão na borda de um retângulo.
function getEdgePoint(rectGroup, targetPoint) {
    const center = rectGroup.getCenterPoint();
    const w = (rectGroup.width * rectGroup.scaleX) / 2, h = (rectGroup.height * rectGroup.scaleY) / 2;
    const dx = targetPoint.x - center.x, dy = targetPoint.y - center.y;
    if (dx === 0) return { x: center.x, y: center.y + (dy > 0 ? h : -h) };
    const slope = dy / dx;
    const edgeX = dx > 0 ? w : -w;
    const edgeY = edgeX * slope;
    if (Math.abs(edgeY) <= h) {
        return { x: center.x + edgeX, y: center.y + edgeY };
    } else {
        const edgeY2 = dy > 0 ? h : -h;
        const edgeX2 = edgeY2 / slope;
        return { x: center.x + edgeX2, y: center.y + edgeY2 };
    }
}