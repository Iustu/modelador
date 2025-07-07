window.isDrawingArrow = false;
window.arrowTypeToDraw = null; 
window.arrowStartObject = null;

// Listener para o botão de seta contínua
document.getElementById('arrow-button').addEventListener('click', (e) => {
    document.getElementById('dashed-arrow-button').classList.remove('active');
    e.currentTarget.classList.add('active');
    window.isDrawingArrow = true;
    window.arrowTypeToDraw = 'continua';
    window.arrowStartObject = null;
});

// Listener para o botão de seta tracejada
document.getElementById('dashed-arrow-button').addEventListener('click', (e) => {
    document.getElementById('arrow-button').classList.remove('active');
    e.currentTarget.classList.add('active');
    window.isDrawingArrow = true;
    window.arrowTypeToDraw = 'tracejada';
    window.arrowStartObject = null;
});

// Manipulador de clique para criar a seta no canvas
window.handleMouseDownForArrow = function (e) {
    if (!window.isDrawingArrow) return;

    if (e.target && (e.target.type === 'box' || e.target.type === 'node')) {
        if (!window.arrowStartObject) {
            window.arrowStartObject = e.target;
        } else {
            const endBox = e.target;
            if (window.arrowStartObject.objectId !== endBox.objectId) {
                window.createStandardArrow(window.arrowStartObject, endBox, window.arrowTypeToDraw);
            }
            window.cancelArrowDrawing();
        }
    } else {
        window.cancelArrowDrawing();
    }
};

// Cancela o modo de desenho de seta e remove o estado ativo dos botões.
window.cancelArrowDrawing = function() {
    document.getElementById('arrow-button').classList.remove('active');
    document.getElementById('dashed-arrow-button').classList.remove('active');
    window.isDrawingArrow = false;
    window.arrowStartObject = null;
    window.arrowTypeToDraw = null;
    canvas.discardActiveObject().renderAll();
}

// A função updateParentChildRelationship é mantida para popular a lista de filhos.
function updateParentChildRelationship(startObj, endObj) {
    if (endObj.customType !== 'content') return;
    let subject = null;
    if (startObj.customType === 'subject') {
        subject = startObj;
    } else if (startObj.parentId) {
        subject = canvas.getObjects().find(o => o.objectId === startObj.parentId);
    }
    if (subject && typeof window.rebuildChildrenList === 'function') {
        // O setTimeout é removido pois a chamada global já cuidará da ordem.
        window.rebuildChildrenList(subject);
    }
}

window.createStandardArrow = function(startObj, endObj, tipo) {
    const startPoint = getEdgePoint(startObj, endObj.getCenterPoint());
    const endPoint = getEdgePoint(endObj, startObj.getCenterPoint());
    const lineOptions = { stroke: 'black', strokeWidth: 2, selectable: false, objectCaching: false };
    if (tipo === 'tracejada') {
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
    
    // CORREÇÃO: A atualização da hierarquia agora é chamada sempre.
    updateParentChildRelationship(startObj, endObj);
    if (window.updateAllHierarchyNumbers) {
        window.updateAllHierarchyNumbers();
    }
};

window.updateArrowsForObject = function(movedObj) {
    if (!movedObj || (movedObj.type !== 'box' && movedObj.type !== 'node')) return;
    canvas.getObjects().forEach(obj => {
        if (obj.type === 'arrow' && (obj.from === movedObj.objectId || obj.to === movedObj.objectId)) {
            const startBox = canvas.getObjects().find(o => o.objectId === obj.from);
            const endBox = canvas.getObjects().find(o => o.objectId === obj.to);
            if (!startBox || !endBox) return;
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