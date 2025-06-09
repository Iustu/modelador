document.addEventListener('DOMContentLoaded', function() {
    // Variáveis de estado locais para este módulo.
    let isDrawingArrow = false;
    let arrowStartObject = null;

    // Listener para o botão 'Inserir Seta'
    document.getElementById('arrow-button').addEventListener('click', () => {
        isDrawingArrow = true;
        arrowStartObject = null;
        alert('Clique no objeto de início e depois no objeto de destino para criar uma seta.');
    });

    // Listener principal no canvas para desenhar a seta em dois cliques.
    canvas.on('mouse:down', function (e) {
        // Só continua se estivermos no modo de desenho e o clique for numa caixa.
        if (!isDrawingArrow || !e.target || e.target.type !== 'box') return;

        if (!arrowStartObject) {
            // Primeiro clique: define o objeto de início.
            arrowStartObject = e.target;
        } else {
            // Segundo clique: define o objeto de fim e cria a seta.
            const endBox = e.target;
            if (arrowStartObject.objectId === endBox.objectId) {
                // Se o objeto de início e fim for o mesmo, cria um loop.
                window.createSelfLoopArrow(arrowStartObject);
            } else {
                // Senão, cria uma seta padrão.
                window.createStandardArrow(arrowStartObject, endBox);
            }
            // Reseta o modo de desenho.
            isDrawingArrow = false;
            arrowStartObject = null;
        }
    });

    function updateParentChildRelationship(startObj, endObj) {
        // Regra A: Seta de Assunto -> Conteúdo
        if (startObj.customType === 'subject' && endObj.customType === 'content') {
            // Evita adicionar filhos duplicados
            if (!startObj.childrenIds.includes(endObj.objectId)) {
                startObj.childrenIds.push(endObj.objectId);
            }
            endObj.parentId = startObj.objectId;
            console.log(`Conteúdo '${endObj.objectId}' agora é filho do Assunto '${startObj.objectId}'.`);
            console.log("Filhos do Assunto:", startObj.childrenIds);
        }
        // Regra B: Seta de Conteúdo -> Conteúdo (relação transitiva)
        else if (startObj.customType === 'content' && endObj.customType === 'content') {
            // Se o conteúdo de origem tiver um pai...
            if (startObj.parentId) {
                // Encontra o objeto pai (o Assunto) no canvas
                const parentSubject = canvas.getObjects().find(o => o.objectId === startObj.parentId);
                if (parentSubject) {
                    // Adiciona o novo conteúdo como filho do mesmo Assunto
                    if (!parentSubject.childrenIds.includes(endObj.objectId)) {
                        parentSubject.childrenIds.push(endObj.objectId);
                    }
                    endObj.parentId = parentSubject.objectId;
                    console.log(`Conteúdo '${endObj.objectId}' agora também é filho do Assunto '${parentSubject.objectId}'.`);
                    console.log("Filhos do Assunto:", parentSubject.childrenIds);
                }
            }
        }
    }

    window.createStandardArrow = function(startObj, endObj) {
        const startPoint = getEdgePoint(startObj, endObj.getCenterPoint());
        const endPoint = getEdgePoint(endObj, startObj.getCenterPoint());
        const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], { stroke: 'black', strokeWidth: 2, selectable: false, objectCaching: false });
        const angle = fabric.util.radiansToDegrees(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)) + 90;
        const tri = new fabric.Triangle({ width: 10, height: 15, fill: 'black', left: endPoint.x, top: endPoint.y, angle: angle, originX: 'center', originY: 'center', selectable: false, objectCaching: false });
        const arrow = new fabric.Group([line, tri], { type: 'arrow', arrowSubType: 'standard', from: startObj.objectId, to: endObj.objectId, selectable: true });
        
        canvas.add(arrow).setActiveObject(arrow);
        
        // Chama a nova função após criar a seta
        updateParentChildRelationship(startObj, endObj);
    }

    //cria uma seta de auto-loop em um objeto.
    window.createSelfLoopArrow = function(box) {
        const points = getSelfLoopPoints(box);
        const pathData = [['M', points.P1.x, points.P1.y], ['L', points.P2.x, points.P2.y], ['L', points.P3.x, points.P3.y], ['L', points.P4.x, points.P4.y]];
        const path = new fabric.Path(pathData, { stroke: 'black', strokeWidth: 2, fill: null, selectable: false, objectCaching: false });
        const arrowheadAngle = fabric.util.radiansToDegrees(Math.atan2(points.P4.y - points.P3.y, points.P4.x - points.P3.x)) + 90;
        const arrowhead = new fabric.Triangle({ width: 10, height: 15, fill: 'black', left: points.P4.x, top: points.P4.y, angle: arrowheadAngle, originX: 'center', originY: 'center', selectable: false, objectCaching: false });
        const arrowGroup = new fabric.Group([path, arrowhead], { type: 'arrow', arrowSubType: 'selfLoop', from: box.objectId, to: box.objectId, selectable: true });
        canvas.add(arrowGroup).setActiveObject(arrowGroup);
    }

    //Atualiza as setas quando um objeto conectado é movido.
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

                // Lógica de atualização corrigida, vinda do seu script original.
                obj._calcBounds();
                obj._updateObjectsCoords();
                obj.setCoords();
            }
        });
        canvas.requestRenderAll();
    }

    function getEdgePoint(rectGroup, targetPoint) {
        const center = rectGroup.getCenterPoint();
        const w = (rectGroup.width * rectGroup.scaleX) / 2;
        const h = (rectGroup.height * rectGroup.scaleY) / 2;
        const dx = targetPoint.x - center.x;
        const dy = targetPoint.y - center.y;
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
        const p1x = tr.x + (br.x - tr.x) * pStart;
        const p1y = tr.y + (br.y - tr.y) * pStart;
        const p4x = tr.x + (br.x - tr.x) * pEnd;
        const p4y = tr.y + (br.y - tr.y) * pEnd;
        const normal_x_dir = br.y - tr.y;
        const normal_y_dir = tr.x - br.x;
        const len_normal_dir = Math.sqrt(normal_x_dir * normal_x_dir + normal_y_dir * normal_y_dir);
        let unit_normal_x = 0, unit_normal_y = 0;
        if (len_normal_dir !== 0) {
            unit_normal_x = normal_x_dir / len_normal_dir;
            unit_normal_y = normal_y_dir / len_normal_dir;
        } else {
            unit_normal_x = 1;
        }
        const P1 = { x: p1x, y: p1y };
        const P4 = { x: p4x, y: p4y };
        const P2 = { x: P1.x + unit_normal_x * dist, y: P1.y + unit_normal_y * dist };
        const P3 = { x: P4.x + unit_normal_x * dist, y: P4.y + unit_normal_y * dist };
        return { P1, P2, P3, P4 };
    }
});