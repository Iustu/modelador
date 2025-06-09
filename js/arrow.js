document.addEventListener('DOMContentLoaded', function() {
    let isDrawingArrow = false;
    let arrowStartObject = null;

    document.getElementById('arrow-button').addEventListener('click', () => {
        isDrawingArrow = true;
        arrowStartObject = null;
        alert('Clique no objeto de início e depois no objeto de destino para criar uma seta.');
    });

    canvas.on('mouse:down', function (e) {
        if (!isDrawingArrow || !e.target || e.target.type !== 'box') return;
        if (!arrowStartObject) {
            arrowStartObject = e.target;
        } else {
            const endBox = e.target;
            if (arrowStartObject.objectId === endBox.objectId) {
                createSelfLoopArrow(arrowStartObject);
            } else {
                createStandardArrow(arrowStartObject, endBox);
            }
            isDrawingArrow = false;
            arrowStartObject = null;
        }
    });

    function createStandardArrow(startObj, endObj) {
        const startPoint = getEdgePoint(startObj, endObj.getCenterPoint());
        const endPoint = getEdgePoint(endObj, startObj.getCenterPoint());
        const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], { stroke: 'black', strokeWidth: 2, selectable: false, objectCaching: false });
        const angle = fabric.util.radiansToDegrees(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)) + 90;
        const tri = new fabric.Triangle({ width: 10, height: 15, fill: 'black', left: endPoint.x, top: endPoint.y, angle: angle, originX: 'center', originY: 'center', selectable: false, objectCaching: false });
        const arrow = new fabric.Group([line, tri], { type: 'arrow', arrowSubType: 'standard', from: startObj.objectId, to: endObj.objectId, selectable: true });
        canvas.add(arrow).setActiveObject(arrow).renderAll();
    }

    function createSelfLoopArrow(box) {
        const points = getSelfLoopPoints(box);
        const pathData = [['M', points.P1.x, points.P1.y], ['L', points.P2.x, points.P2.y], ['L', points.P3.x, points.P3.y], ['L', points.P4.x, points.P4.y]];
        const path = new fabric.Path(pathData, { stroke: 'black', strokeWidth: 2, fill: null, selectable: false, objectCaching: false });
        const arrowheadAngle = fabric.util.radiansToDegrees(Math.atan2(points.P4.y - points.P3.y, points.P4.x - points.P3.x)) + 90;
        const arrowhead = new fabric.Triangle({ width: 10, height: 15, fill: 'black', left: points.P4.x, top: points.P4.y, angle: arrowheadAngle, originX: 'center', originY: 'center', selectable: false, objectCaching: false });
        const arrowGroup = new fabric.Group([path, arrowhead], { type: 'arrow', arrowSubType: 'selfLoop', from: box.objectId, to: box.objectId, selectable: true });
        canvas.add(arrowGroup).setActiveObject(arrowGroup).renderAll();
    }

    window.updateArrowsForObject = function(movedObj) {
        const movedId = movedObj.objectId;
        canvas.getObjects().forEach(obj => {
            if (obj.type !== 'arrow' || (obj.from !== movedId && obj.to !== movedId)) return;
            const startBox = canvas.getObjects().find(o => o.type === 'box' && o.objectId === obj.from);
            const endBox = canvas.getObjects().find(o => o.type === 'box' && o.objectId === obj.to);
            if (!startBox || !endBox) return;
            if (obj.arrowSubType === 'selfLoop') {
                const pathObj = obj.item(0), triangleObj = obj.item(1);
                const points = getSelfLoopPoints(startBox);
                pathObj.set({ path: [['M', points.P1.x, points.P1.y], ['L', points.P2.x, points.P2.y], ['L', points.P3.x, points.P3.y], ['L', points.P4.x, points.P4.y]] });
                const angle = fabric.util.radiansToDegrees(Math.atan2(points.P4.y - points.P3.y, points.P4.x - points.P3.x)) + 90;
                triangleObj.set({ left: points.P4.x, top: points.P4.y, angle: angle });
            } else {
                const line = obj.item(0), tri = obj.item(1);
                const startPoint = getEdgePoint(startBox, endBox.getCenterPoint());
                const endPoint = getEdgePoint(endBox, startBox.getCenterPoint());
                line.set({ 'x1': startPoint.x, 'y1': startPoint.y, 'x2': endPoint.x, 'y2': endPoint.y });
                const angle = fabric.util.radiansToDegrees(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)) + 90;
                tri.set({ left: endPoint.x, top: endPoint.y, angle: angle });
            }
            obj.setCoords();
        });
        canvas.requestRenderAll();
    }

    function getEdgePoint(rectGroup, targetPoint) {
        const center = rectGroup.getCenterPoint();
        const w = (rectGroup.width * rectGroup.scaleX) / 2, h = (rectGroup.height * rectGroup.scaleY) / 2;
        const angleRad = fabric.util.degreesToRadians(rectGroup.angle);
        const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
        const dx = targetPoint.x - center.x, dy = targetPoint.y - center.y;
        const rotatedDx = dx * cos + dy * sin, rotatedDy = dy * cos - dx * sin;
        let edgeX, edgeY;
        if (Math.abs(rotatedDx) * h > Math.abs(rotatedDy) * w) {
            edgeX = rotatedDx > 0 ? w : -w;
            edgeY = (edgeX * rotatedDy) / rotatedDx;
        } else {
            edgeY = rotatedDy > 0 ? h : -h;
            edgeX = (edgeY * rotatedDx) / rotatedDy;
        }
        return { x: center.x + (edgeX * cos - edgeY * sin), y: center.y + (edgeX * sin + edgeY * cos) };
    }

    function getSelfLoopPoints(box) {
        if (!box.aCoords) box.setCoords();
        const { tr, br } = box.aCoords;
        const pStartPercent = 0.25, pEndPercent = 0.75, dist = 40;
        const P1 = new fabric.Point(tr.x + (br.x - tr.x) * pStartPercent, tr.y + (br.y - tr.y) * pStartPercent);
        const P4 = new fabric.Point(tr.x + (br.x - tr.x) * pEndPercent, tr.y + (br.y - tr.y) * pEndPercent);
        const normalVector = new fabric.Point(br.y - tr.y, tr.x - br.x).normalize(dist);
        const P2 = P1.add(normalVector), P3 = P4.add(normalVector);
        return { P1, P2, P3, P4 };
    }
});