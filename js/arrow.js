// js/arrow.js
document.addEventListener('DOMContentLoaded', function() {
    window.isDrawingArrow = false;
    window.arrowTypeToDraw = null; 
    window.arrowStartObject = null;

    document.getElementById('arrow-button').addEventListener('click', () => {
        window.isDrawingArrow = true;
        window.arrowTypeToDraw = 'Percorrível';
        window.arrowStartObject = null;
    });

    document.getElementById('dashed-arrow-button').addEventListener('click', () => {
        window.isDrawingArrow = true;
        window.arrowTypeToDraw = 'Bloqueado';
        window.arrowStartObject = null;
    });

    // Esta função agora é global e é chamada pelo canvas.js
    window.handleMouseDownForArrow = function (e) {
        if (!window.isDrawingArrow || !e.target || e.target.type !== 'box') return;

        if (!window.arrowStartObject) {
            window.arrowStartObject = e.target;
        } else {
            const endBox = e.target;
            if (window.arrowStartObject.objectId === endBox.objectId) {
                createSelfLoopArrow(window.arrowStartObject, window.arrowTypeToDraw);
            } else {
                createStandardArrow(window.arrowStartObject, endBox, window.arrowTypeToDraw);
            }
            window.isDrawingArrow = false;
            window.arrowStartObject = null;
            window.arrowTypeToDraw = null;
        }
    };

    // Percorre a árvore de filhos a partir de um nó e os associa a um Assunto pai.
    function traverseAndSetParent(startNode, parentSubject) {
        const queue = [startNode]; // Fila para busca em largura (BFS)
        const visited = new Set(); // Para evitar loops infinitos

        while (queue.length > 0) {
            const currentNode = queue.shift();

            if (visited.has(currentNode.objectId)) continue;
            visited.add(currentNode.objectId);

            // Define o parentesco para o nó atual.
            if (currentNode.customType === 'content') {
                currentNode.parentId = parentSubject.objectId;
                if (!parentSubject.childrenIds.includes(currentNode.objectId)) {
                    parentSubject.childrenIds.push(currentNode.objectId);
                }
            }

            // Encontra os próximos filhos e os adiciona na fila para processamento.
            const outgoingArrows = canvas.getObjects().filter(o =>
                o.type === 'arrow' && o.tipo === 'Percorrível' && o.from === currentNode.objectId
            );

            outgoingArrows.forEach(arrow => {
                const nextChild = canvas.getObjects().find(o => o.objectId === arrow.to);
                if (nextChild) {
                    queue.push(nextChild);
                }
            });
        }
    }

    // Atualiza a relação de parentesco com base na seta criada.
    function updateParentChildRelationship(startObj, endObj) {
        let parentSubject = null;
        
        // Determina qual é o Assunto raiz da cadeia.
        if (startObj.customType === 'subject') {
            parentSubject = startObj;
        } else if (startObj.customType === 'content' && startObj.parentId) {
            parentSubject = canvas.getObjects().find(o => o.objectId === startObj.parentId);
        }

        // Se encontramos um Assunto e o objeto final é um Conteúdo...
        if (parentSubject && endObj.customType === 'content') {
            // Inicia a travessia a partir do nó que acabou de ser conectado.
            traverseAndSetParent(endObj, parentSubject);
            console.log(`Relação de '${parentSubject.objectId}' atualizada. Filhos:`, parentSubject.childrenIds);
        }
    }
    
    // Funções de criação de seta permanecem as mesmas, mas agora chamam a nova lógica de relação.
    window.createStandardArrow = function(startObj, endObj, type) {
        const startPoint = getEdgePoint(startObj, endObj.getCenterPoint());
        const endPoint = getEdgePoint(endObj, startObj.getCenterPoint());
        const lineOptions = { stroke: 'black', strokeWidth: 2, selectable: false, objectCaching: false };
        if (type === 'Bloqueado') {
            lineOptions.strokeDashArray = [5, 5];
        }
        const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], lineOptions);
        const angle = fabric.util.radiansToDegrees(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)) + 90;
        const tri = new fabric.Triangle({ width: 10, height: 15, fill: 'black', left: endPoint.x, top: endPoint.y, angle: angle, originX: 'center', originY: 'center', selectable: false, objectCaching: false });
        const arrow = new fabric.Group([line, tri], { type: 'arrow', arrowSubType: 'standard', from: startObj.objectId, to: endObj.objectId, tipo: type, selectable: true });
        canvas.add(arrow).setActiveObject(arrow);
        if (type === 'Percorrível') {
            updateParentChildRelationship(startObj, endObj);
        }
    }

    window.createSelfLoopArrow = function(box, type) {
        const points = getSelfLoopPoints(box);
        const pathOptions = { stroke: 'black', strokeWidth: 2, fill: null, selectable: false, objectCaching: false };
        if (type === 'Bloqueado') {
            pathOptions.strokeDashArray = [5, 5];
        }
        const path = new fabric.Path([['M', points.P1.x, points.P1.y], ['L', points.P2.x, points.P2.y], ['L', points.P3.x, points.P3.y], ['L', points.P4.x, points.P4.y]], pathOptions);
        const arrowheadAngle = fabric.util.radiansToDegrees(Math.atan2(points.P4.y - points.P3.y, points.P4.x - points.P3.x)) + 90;
        const arrowhead = new fabric.Triangle({ width: 10, height: 15, fill: 'black', left: points.P4.x, top: points.P4.y, angle: arrowheadAngle, originX: 'center', originY: 'center', selectable: false, objectCaching: false });
        const arrowGroup = new fabric.Group([path, arrowhead], { type: 'arrow', arrowSubType: 'selfLoop', from: box.objectId, to: box.objectId, tipo: type, selectable: true });
        canvas.add(arrowGroup).setActiveObject(arrowGroup);
        if (type === 'Percorrível' && box.customType === 'subject') {
            updateParentChildRelationship(box, box); // Auto-referência não cria filhos
        }
    }

    // A função de atualização ao mover o objeto não precisa mudar, mas precisa ser global.
    window.updateArrowsForObject = function(movedObj) {
        if (!movedObj || movedObj.type !== 'box') return;
        canvas.getObjects().forEach(obj => {
            if (obj.type === 'arrow' && (obj.from === movedObj.objectId || obj.to === movedObj.objectId)) {
                const startBox = canvas.getObjects().find(o => o.objectId === obj.from);
                const endBox = canvas.getObjects().find(o => o.objectId === obj.to);
                if (!startBox || !endBox) return;

                if (obj.arrowSubType === 'selfLoop') {
                    const pathObj = obj.item(0), triangleObj = obj.item(1);
                    const points = getSelfLoopPoints(startBox);
                    if (points) {
                        pathObj.set({ path: [['M', points.P1.x, points.P1.y], ['L', points.P2.x, points.P2.y], ['L', points.P3.x, points.P3.y], ['L', points.P4.x, points.P4.y]] });
                        const angle = fabric.util.radiansToDegrees(Math.atan2(points.P4.y - points.P3.y, points.P4.x - points.P3.x)) + 90;
                        triangleObj.set({ left: points.P4.x, top: points.P4.y, angle: angle });
                    }
                } else {
                    const line = obj.item(0), tri = obj.item(1);
                    const startPoint = getEdgePoint(startBox, endBox.getCenterPoint());
                    const endPoint = getEdgePoint(endBox, startBox.getCenterPoint());
                    line.set({ 'x1': startPoint.x, 'y1': startPoint.y, 'x2': endPoint.x, 'y2': endPoint.y });
                    const angle = fabric.util.radiansToDegrees(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)) + 90;
                    tri.set({ left: endPoint.x, top: endPoint.y, angle: angle });
                }
                obj._calcBounds();
                obj._updateObjectsCoords();
                obj.setCoords();
            }
        });
        canvas.renderAll();
    }

    // Funções locais
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

    function getSelfLoopPoints(box) {
        if (!box.aCoords) box.setCoords();
        const { tr, br } = box.aCoords;
        const pStart = 0.25, pEnd = 0.75, dist = 40;
        const p1x = tr.x + (br.x - tr.x) * pStart, p1y = tr.y + (br.y - tr.y) * pStart;
        const p4x = tr.x + (br.x - tr.x) * pEnd, p4y = tr.y + (br.y - tr.y) * pEnd;
        const normal_x_dir = br.y - tr.y, normal_y_dir = tr.x - br.x;
        const len_normal_dir = Math.sqrt(normal_x_dir * normal_x_dir + normal_y_dir * normal_y_dir);
        let unit_normal_x = 0, unit_normal_y = 0;
        if (len_normal_dir !== 0) {
            unit_normal_x = normal_x_dir / len_normal_dir;
            unit_normal_y = normal_y_dir / len_normal_dir;
        } else { unit_normal_x = 1; }
        const P1 = { x: p1x, y: p1y }, P4 = { x: p4x, y: p4y };
        const P2 = { x: P1.x + unit_normal_x * dist, y: P1.y + unit_normal_y * dist };
        const P3 = { x: P4.x + unit_normal_x * dist, y: P4.y + unit_normal_y * dist };
        return { P1, P2, P3, P4 };
    }
});