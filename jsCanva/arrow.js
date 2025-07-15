window.isDrawingArrow = false;
window.isHierarchyArrow = false;
window.arrowStartObject = null;

//Helper para limpar o estado ativo dos botões de seta.
function clearActiveArrowButtons() {
    document.getElementById('arrow-button').classList.remove('active');
    document.getElementById('dashed-arrow-button').classList.remove('active');
}

//Listener para o botão de seta contínua (NÃO HIERÁRQUICA)
document.getElementById('arrow-button').addEventListener('click', (e) => {
    clearActiveArrowButtons();
    e.currentTarget.classList.add('active');
    window.isDrawingArrow = true;
    window.isHierarchyArrow = false;
    window.arrowStartObject = null;
});

//Listener para o botão de seta tracejada (HIERÁRQUICA)
document.getElementById('dashed-arrow-button').addEventListener('click', (e) => {
    clearActiveArrowButtons();
    e.currentTarget.classList.add('active');
    window.isDrawingArrow = true;
    window.isHierarchyArrow = true;
    window.arrowStartObject = null;
});

//Manipulador de clique para criar a seta no canvas
window.handleMouseDownForArrow = function (e) {
    if (!window.isDrawingArrow) return;
    if (e.target && (e.target.type === 'box' || e.target.type === 'node')) {
        if (!window.arrowStartObject) {
            window.arrowStartObject = e.target;
        } else {
            const endBox = e.target;
            if (window.arrowStartObject.objectId !== endBox.objectId) {
                let pathType = 'obrigatório';
                const startType = window.arrowStartObject.customType;
                if (startType === 'exclusive_gateway') pathType = 'caminho exclusivo';
                else if (startType === 'parallel_gateway') pathType = 'opcional';
                window.createStandardArrow(window.arrowStartObject, endBox, window.isHierarchyArrow, pathType);
            }
            window.cancelArrowDrawing();
        }
    } else {
        window.cancelArrowDrawing();
    }
};

//Cancela o modo de desenho de seta e remove o estado ativo dos botões.
window.cancelArrowDrawing = function() {
    clearActiveArrowButtons();
    window.isDrawingArrow = false;
    window.isHierarchyArrow = false;
    window.arrowStartObject = null;
    canvas.discardActiveObject().renderAll();
}

//Atualiza a relação pai-filho com base na propriedade isHierarchy.
function updateParentChildRelationship(startObj, endObj, isHierarchy) {
    if (!isHierarchy) return;
    if (startObj.customType === 'subject') {
        if (typeof window.rebuildChildrenList === 'function') {
            window.rebuildChildrenList(startObj);
        }
    }
}

//Cria a seta padrão no canvas.
window.createStandardArrow = function(startObj, endObj, isHierarchy, pathType) {
    const startPoint = getEdgePoint(startObj, endObj.getCenterPoint());
    const endPoint = getEdgePoint(endObj, startObj.getCenterPoint());
    const lineOptions = { stroke: 'black', strokeWidth: 2, selectable: false, objectCaching: false };
    if (isHierarchy) lineOptions.strokeDashArray = [5, 5];
    
    const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], lineOptions);
    const angle = fabric.util.radiansToDegrees(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)) + 90;
    const tri = new fabric.Triangle({ width: 10, height: 15, fill: 'black', left: endPoint.x, top: endPoint.y, angle: angle, originX: 'center', originY: 'center', selectable: false, objectCaching: false });
    
    const arrow = new fabric.Group([line, tri], {
        type: 'arrow',
        // A propriedade arrowSubType foi REMOVIDA daqui.
        from: startObj.objectId,
        to: endObj.objectId,
        isHierarchy: isHierarchy,
        pathType: pathType,
        selectable: true,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false
    });

    canvas.add(arrow).setActiveObject(arrow);
    updateParentChildRelationship(startObj, endObj, isHierarchy);
    if (window.updateAllHierarchyNumbers) {
        window.updateAllHierarchyNumbers();
    }
};

//Atualiza a posição das setas quando um objeto é movido.
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

//Calcula o ponto de conexão na borda de um objeto.
function getEdgePoint(rectGroup, targetPoint) {
    const center = rectGroup.getCenterPoint();
    const w = (rectGroup.width * rectGroup.scaleX) / 2, h = (rectGroup.height * rectGroup.scaleY) / 2;
    const dx = targetPoint.x - center.x, dy = targetPoint.y - center.y;
    if (dx === 0) return { x: center.x, y: center.y + (dy > 0 ? h : -h) };
    const slope = dy / dx;
    const edgeX = dx > 0 ? w : -w;
    const edgeY = edgeX * slope;
    if (Math.abs(edgeY) <= h) return { x: center.x + edgeX, y: center.y + edgeY };
    else {
        const edgeY2 = dy > 0 ? h : -h;
        const edgeX2 = edgeY2 / slope;
        return { x: center.x + edgeX2, y: center.y + edgeY2 };
    }
}