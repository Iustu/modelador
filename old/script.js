//Cria o canvas
const canvas = new fabric.Canvas('canvas');
let isDrawingArrow = false;
let arrowStartObject = null;

// Gera ID único
function generateId() {
	return 'obj-' + Math.random().toString(36).substr(2, 9);
}

// Drag & Drop de Retângulos
document.querySelectorAll('.shape[draggable="true"]').forEach(shape => {
	shape.addEventListener('dragstart', (e) => {
		e.dataTransfer.setData('type', 'rect');
		e.dataTransfer.setData('color', e.target.dataset.color);
	});
});

canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
canvas.upperCanvasEl.addEventListener('drop', function(e) {
	e.preventDefault();

	// Tipo e cor
	const type = e.dataTransfer.getData('type');
	if (type !== 'rect') return;
	const colorKey = e.dataTransfer.getData('color');
	const rectEl = document.querySelector(`[data-color="${colorKey}"]`);
	const fillColor = getComputedStyle(rectEl).backgroundColor;

	// Posições e dimensões
	const rectWidth = 140;
	const rectHeight = 60;
	const box = canvas.upperCanvasEl.getBoundingClientRect();
	const x = e.clientX - box.left;
	const y = e.clientY - box.top;

	// Prompt de texto
	const userText = prompt("Digite o texto para o retângulo:", "");
	if (userText === null || userText.trim() === "") return;

	// Cria retângulo e texto
	const rect = new fabric.Rect({
		width: rectWidth,
		height: rectHeight,
		fill: fillColor,
		rx: 5,
		ry: 5
	});

	const text = new fabric.Textbox(userText, {
		width: rectWidth - 20,
		fontSize: 16,
		textAlign: 'center',
		fill: '#000',
		originX: 'center',
		originY: 'center',
		left: rectWidth / 2,
		top: rectHeight / 2
	});

	// Agrupa e adiciona ao canvas
	const group = new fabric.Group([rect, text], {
		left: x,
		top: y,
		objectId: generateId(),
		type: 'box',
		hasControls: true,
		selectable: true
	});

	canvas.add(group);
	canvas.setActiveObject(group);
});

// Botão Inserir Seta
document.getElementById('arrow-button').addEventListener('click', () => {
	isDrawingArrow = true;
});

// Função para calcular ponto na borda do retângulo (grupo)
function getEdgePoint(rectGroup, targetPoint) {
	const center = rectGroup.getCenterPoint();
	const w = (rectGroup.width * rectGroup.scaleX) / 2;
	const h = (rectGroup.height * rectGroup.scaleY) / 2;

	const dx = targetPoint.x - center.x;
	const dy = targetPoint.y - center.y;

	if (dx === 0) {
		return {
			x: center.x,
			y: center.y + (dy > 0 ? h : -h)
		};
	}

	const slope = dy / dx;

	const edgeX = dx > 0 ? w : -w;
	const edgeY = edgeX * slope;

	if (Math.abs(edgeY) <= h) {
		return {
			x: center.x + edgeX,
			y: center.y + edgeY
		};
	} else {
		const edgeY2 = dy > 0 ? h : -h;
		const edgeX2 = edgeY2 / slope;
		return {
			x: center.x + edgeX2,
			y: center.y + edgeY2
		};
	}
}

// CONSTANTES GLOBAIS PARA O LOOP (pode ajustar conforme necessário)
const SELF_LOOP_ATTACH_EDGE = 'right'; // Poderia ser 'top', 'left', 'bottom' no futuro
const SELF_LOOP_P1_PERCENT = 0.25;   // Ponto de saída a 25% da borda
const SELF_LOOP_P4_PERCENT = 0.75;   // Ponto de entrada a 75% da borda
const SELF_LOOP_OUTWARD_DISTANCE = 40; // Distância que o loop se projeta para fora

function getSelfLoopPoints(box, edgeName = SELF_LOOP_ATTACH_EDGE, pStart = SELF_LOOP_P1_PERCENT, pEnd = SELF_LOOP_P4_PERCENT, dist = SELF_LOOP_OUTWARD_DISTANCE) {
    if (!box.aCoords) box.setCoords(); // Garante que aCoords (coordenadas absolutas dos cantos) estejam calculadas
    const { tl, tr, br, bl } = box.aCoords;

    let p1x, p1y, p4x, p4y;
    let normal_x_dir, normal_y_dir;

    // Por simplicidade, vamos focar na borda direita ('right')
    // Outras bordas exigiriam lógicas similares para os vetores e normais
    if (edgeName === 'right') {
        // P1 e P4 são calculados ao longo da borda direita (de tr para br)
        p1x = tr.x + (br.x - tr.x) * pStart;
        p1y = tr.y + (br.y - tr.y) * pStart;
        p4x = tr.x + (br.x - tr.x) * pEnd;
        p4y = tr.y + (br.y - tr.y) * pEnd;

        // Vetor normal apontando para fora da borda direita
        normal_x_dir = br.y - tr.y;
        normal_y_dir = tr.x - br.x;
    } else if (edgeName === 'top') {
        p1x = tl.x + (tr.x - tl.x) * pStart;
        p1y = tl.y + (tr.y - tl.y) * pStart;
        p4x = tl.x + (tr.x - tl.x) * pEnd;
        p4y = tl.y + (tr.y - tl.y) * pEnd;
        normal_x_dir = tl.y - tr.y;
        normal_y_dir = tr.x - tl.x;
    } else {
        console.warn(`Self-loop edge "${edgeName}" não implementada, usando 'right'.`);
        // Recalcula para 'right' como fallback
        p1x = tr.x + (br.x - tr.x) * pStart;
        p1y = tr.y + (br.y - tr.y) * pStart;
        p4x = tr.x + (br.x - tr.x) * pEnd;
        p4y = tr.y + (br.y - tr.y) * pEnd;
        normal_x_dir = br.y - tr.y;
        normal_y_dir = tr.x - br.x;
    }


    const len_normal_dir = Math.sqrt(normal_x_dir * normal_x_dir + normal_y_dir * normal_y_dir);
    let unit_normal_x = 0, unit_normal_y = 0;

    if (len_normal_dir !== 0) {
        unit_normal_x = normal_x_dir / len_normal_dir;
        unit_normal_y = normal_y_dir / len_normal_dir;
    } else { // Caso degenerado (objeto com altura/largura zero na borda)
        // Fallback para uma normal baseada na borda (simplificado)
        if (edgeName === 'right') unit_normal_x = 1;
        else if (edgeName === 'left') unit_normal_x = -1;
        else if (edgeName === 'top') unit_normal_y = -1;
        else if (edgeName === 'bottom') unit_normal_y = 1;
        else unit_normal_x = 1; // Default
    }

    const P1 = { x: p1x, y: p1y };
    const P4 = { x: p4x, y: p4y };
    // P2 e P3 são projetados para fora a partir de P1 e P4
    const P2 = { x: P1.x + unit_normal_x * dist, y: P1.y + unit_normal_y * dist };
    const P3 = { x: P4.x + unit_normal_x * dist, y: P4.y + unit_normal_y * dist };

    return { P1, P2, P3, P4 };
}

// Desenha seta entre dois grupos na tela
canvas.on('mouse:down', function(e) {
    if (!isDrawingArrow) return;

    // Garante que o alvo é um 'box' (grupo de retângulo e texto)
    const target = e.target;
    if (!(target instanceof fabric.Group && target.type === 'box')) return;

    if (!arrowStartObject) {
        arrowStartObject = target;
    } else {
        const startBox = arrowStartObject;
        const endBox = target;

        if (startBox.objectId === endBox.objectId) {
            // Objeto de início e fim são os mesmos: criar seta de loop
            createSelfLoopArrow(startBox);
        } else {
            // Objetos diferentes: criar seta padrão
            createStandardArrow(startBox, endBox);
        }

        // Reseta variáveis
        arrowStartObject = null;
        isDrawingArrow = false;
    }
});

function createStandardArrow(startObj, endObj) {
    const startPoint = getEdgePoint(startObj, endObj.getCenterPoint());
    const endPoint = getEdgePoint(endObj, startObj.getCenterPoint());

    const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
        stroke: 'black',
        strokeWidth: 2,
        selectable: false,
        objectCaching: false
    });

    const angle = fabric.util.radiansToDegrees(
        Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)
    ) + 90;

    const tri = new fabric.Triangle({
        width: 10,
        height: 15,
        fill: 'black',
        left: endPoint.x,
        top: endPoint.y,
        angle: angle,
        originX: 'center',
        originY: 'center',
        selectable: false,
        objectCaching: false
    });

    const arrow = new fabric.Group([line, tri], {
        type: 'arrow',
        arrowSubType: 'standard', // Adicionamos um subtipo
        from: startObj.objectId,
        to: endObj.objectId,
        selectable: true
    });

    canvas.add(arrow);
    canvas.setActiveObject(arrow);
    arrow.setCoords(); // Garante que as coordenadas do grupo estão corretas
}

function createSelfLoopArrow(box) {
    const points = getSelfLoopPoints(box); // Usa as constantes globais
    if (!points) return;

    const { P1, P2, P3, P4 } = points;

    // O formato para fabric.Path é um array de arrays de comandos
    const pathData = [
        ['M', P1.x, P1.y], // Move to P1
        ['L', P2.x, P2.y], // Line to P2
        ['L', P3.x, P3.y], // Line to P3
        ['L', P4.x, P4.y]  // Line to P4 (ponto de entrada da seta)
    ];

    const path = new fabric.Path(pathData, {
        stroke: 'black',
        strokeWidth: 2,
        fill: null, // Caminho não preenchido
        selectable: false,
        objectCaching: false
    });

    const arrowheadAngle = fabric.util.radiansToDegrees(
        Math.atan2(P4.y - P3.y, P4.x - P3.x) // Direção de P3 para P4
    ) + 90;

    const arrowhead = new fabric.Triangle({
        width: 10,
        height: 15,
        fill: 'black',
        left: P4.x,
        top: P4.y,
        angle: arrowheadAngle,
        originX: 'center',
        originY: 'center',
        selectable: false,
        objectCaching: false
    });

    const arrowGroup = new fabric.Group([path, arrowhead], {
        type: 'arrow',
        arrowSubType: 'selfLoop', // Subtipo para identificar este tipo de seta
        from: box.objectId,
        to: box.objectId, // from e to são o mesmo para self-loop
        selectable: true,
        // objectCaching: false // Opcional para o grupo
    });

    canvas.add(arrowGroup);
    canvas.setActiveObject(arrowGroup);
    arrowGroup.setCoords(); // Garante que as coordenadas do grupo estão corretas
}

function updateArrowsForObject(movedObj) {
    if (!movedObj || movedObj.type !== 'box') return;

    canvas.getObjects().forEach(obj => {
        if (obj.type === 'arrow') {
            const startId = obj.from;
            const endId = obj.to;

            // Verifica se a seta está conectada ao objeto movido
            if (movedObj.objectId === startId || movedObj.objectId === endId) {
                const startBox = canvas.getObjects().find(o => o.type === 'box' && o.objectId === startId);

                if (!startBox) { // Objeto de início não encontrado (talvez excluído)
                    // canvas.remove(obj); // Opcional: remover setas órfãs
                    return;
                }

                if (obj.arrowSubType === 'selfLoop') {
                    // Atualiza seta de loop (startBox é o movedObj)
                    const pathObj = obj.item(0);    // O fabric.Path
                    const triangleObj = obj.item(1); // O fabric.Triangle

                    const points = getSelfLoopPoints(startBox); // Recalcula pontos
                    if (points) {
                        const { P1, P2, P3, P4 } = points;
                        const newPathData = [
                            ['M', P1.x, P1.y], ['L', P2.x, P2.y],
                            ['L', P3.x, P3.y], ['L', P4.x, P4.y]
                        ];
                        pathObj.set({ path: newPathData }); // Atualiza o caminho

                        const arrowheadAngle = fabric.util.radiansToDegrees(
                            Math.atan2(P4.y - P3.y, P4.x - P3.x)
                        ) + 90;
                        triangleObj.set({
                            left: P4.x,
                            top: P4.y,
                            angle: arrowheadAngle
                        });
                    }
                } else { // Seta padrão ('standard')
                    const endBox = canvas.getObjects().find(o => o.type === 'box' && o.objectId === endId);
                    if (!endBox) {
                        // canvas.remove(obj); // Opcional: remover setas órfãs
                        return;
                    }

                    const line = obj.item(0);
                    const tri = obj.item(1);
                    const startPoint = getEdgePoint(startBox, endBox.getCenterPoint());
                    const endPoint = getEdgePoint(endBox, startBox.getCenterPoint());

                    line.set({
                        'x1': startPoint.x, 'y1': startPoint.y,
                        'x2': endPoint.x, 'y2': endPoint.y
                    });

                    const angle = fabric.util.radiansToDegrees(
                        Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)
                    ) + 90;
                    tri.set({
                        left: endPoint.x,
                        top: endPoint.y,
                        angle: angle
                    });
                }

                // Garante atualização visual do grupo da seta
                obj._calcBounds();
                obj._updateObjectsCoords(); // Atualiza coordenadas dos filhos do grupo
                obj.setCoords();          // Atualiza coordenadas do grupo no canvas
            }
        }
    });
    canvas.requestRenderAll();
}

canvas.on('object:modified', e => {
	updateArrowsForObject(e.target);
});

// Botão Editar Texto
document.getElementById('edit-text-button').addEventListener('click', () => {
	const active = canvas.getActiveObject();
	if (!(active instanceof fabric.Group)) {
		alert("Nenhum retângulo selecionado para editar o texto.");
		return;
	}

	const textObj = active._objects.find(o => o instanceof fabric.Textbox || o.type === 'text');
	if (!textObj) {
		alert("O objeto selecionado não contém texto para editar.");
		return;
	}

	const newText = prompt("Editar texto:", textObj.text);
	if (newText === null) return;

	textObj.set('text', newText);
	active.setCoords();
	canvas.requestRenderAll();
});

// Botão Excluir Item
document.getElementById('delete-button').addEventListener('click', () => {
	const active = canvas.getActiveObject();
	if (!active) {
		alert("Nenhum item selecionado para excluir.");
		return;
	}
	canvas.remove(active);
});

// Delete com Tecla Delete
document.addEventListener('keydown', e => {
	if (e.key === 'Delete') {
		const active = canvas.getActiveObject();
		if (active) canvas.remove(active);
	}
});

// Exportar dados
function exportCanvas() {
    const data = {
        boxes: [],
        arrows: []
    };

    canvas.getObjects().forEach(obj => {
        if (obj.type === 'box') {
            const textObj = obj._objects.find(o => o instanceof fabric.Textbox || o.type === 'text');
            data.boxes.push({
                id: obj.objectId,
                left: obj.left,
                top: obj.top,
                width: obj.width, // Largura original do grupo (calculada pelo Fabric)
                height: obj.height, // Altura original do grupo
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                angle: obj.angle,
                text: textObj ? textObj.text : "",
                // Para a cor, pegamos do primeiro objeto do grupo (o retângulo)
                // É importante que a estrutura do grupo seja consistente
                fill: obj._objects[0] ? obj._objects[0].fill : 'grey'
            });
        } else if (obj.type === 'arrow') {
            const arrowData = {
                from: obj.from,
                to: obj.to,
                arrowSubType: obj.arrowSubType || 'standard', // Salva o subtipo
                // Salva as propriedades do triângulo (cabeça da seta)
                triangle: {
                    left: obj.item(1).left, // Supondo que item(1) é o triângulo
                    top: obj.item(1).top,
                    angle: obj.item(1).angle,
                    width: obj.item(1).width, // Salvar para recriar com mesmo tamanho
                    height: obj.item(1).height
                }
            };

            if (obj.arrowSubType === 'selfLoop') {
                // Para selfLoop, salva os dados do path
                arrowData.path = obj.item(0).path; // Supondo que item(0) é o fabric.Path
            } else {
                // Para setas padrão, salva as coordenadas da linha
                const line = obj.item(0);
                arrowData.line = { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2 };
            }
            data.arrows.push(arrowData);
        }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "canvas-data.json";
    document.body.appendChild(a); // Necessário para Firefox
    a.click();
	document.body.removeChild(a); // Limpeza
}

document.getElementById("export-button").addEventListener("click", exportCanvas);

// Importar dados
document.getElementById("import-button").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const content = await file.text();
        const data = JSON.parse(content);

        canvas.clear();
        const idToObject = {};

        data.boxes.forEach(box => {
            const rect = new fabric.Rect({
                width: 140, // Largura original do retângulo interno
                height: 60, // Altura original do retângulo interno
                fill: box.fill,
                rx: 5, ry: 5
            });

            const text = new fabric.Textbox(box.text, {
                width: rect.width - 20, // Baseado na largura original do retângulo
                fontSize: 16,
                textAlign: 'center',
                fill: '#000',
                originX: 'center', originY: 'center',
                left: rect.width / 2,
                top: rect.height / 2
            });

            const group = new fabric.Group([rect, text], {
                left: box.left,
                top: box.top,
                scaleX: box.scaleX, // Aplica a escala salva ao grupo
                scaleY: box.scaleY, // Aplica a escala salva ao grupo
                angle: box.angle,
                objectId: box.id,
                type: 'box',
                hasControls: true, selectable: true
            });
            canvas.add(group);
            idToObject[box.id] = group;
        });

        // Reconstrói setas
        data.arrows.forEach(arrowData => {
            const startObj = idToObject[arrowData.from];
            // const endObj = idToObject[arrowData.to]; // endObj será o mesmo que startObj para selfLoop

            if (!startObj) {
                console.warn("Objeto de início da seta não encontrado na importação:", arrowData.from);
                return;
            }

            let arrowElements = []; // Array para [linha/path, triangulo]
            let newArrow;

            // Recriar o triângulo (cabeça da seta) - comum a ambos os tipos
            const triData = arrowData.triangle;
            const tri = new fabric.Triangle({
                width: triData.width || 10, // Usa valor salvo ou default
                height: triData.height || 15,
                fill: 'black',
                left: triData.left, // Será recalculado, mas pode usar como inicial
                top: triData.top,
                angle: triData.angle,
                originX: 'center', originY: 'center',
                selectable: false, objectCaching: false
            });

            if (arrowData.arrowSubType === 'selfLoop') {
                // RECALCULA pontos para selfLoop baseado no startObj recriado
                const points = getSelfLoopPoints(startObj); // Usa constantes globais
                const pathData = [
                    ['M', points.P1.x, points.P1.y], ['L', points.P2.x, points.P2.y],
                    ['L', points.P3.x, points.P3.y], ['L', points.P4.x, points.P4.y]
                ];
                const path = new fabric.Path(pathData, { // Cria com os pontos recalculados
                    stroke: 'black', strokeWidth: 2, fill: null,
                    selectable: false, objectCaching: false
                });
                arrowElements.push(path);

                // Atualiza posição e ângulo do triângulo para o selfLoop recalculado
                const arrowheadAngle = fabric.util.radiansToDegrees(
                    Math.atan2(points.P4.y - points.P3.y, points.P4.x - points.P3.x)
                ) + 90;
                tri.set({ left: points.P4.x, top: points.P4.y, angle: arrowheadAngle });

            } else { // Seta padrão
                const endObj = idToObject[arrowData.to];
                if (!endObj) {
                    console.warn("Objeto de fim da seta não encontrado na importação:", arrowData.to);
                    return;
                }
                // RECALCULA pontos para seta padrão
                const startPoint = getEdgePoint(startObj, endObj.getCenterPoint());
                const endPoint = getEdgePoint(endObj, startObj.getCenterPoint());

                const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
                    stroke: 'black', strokeWidth: 2,
                    selectable: false, objectCaching: false
                });
                arrowElements.push(line);

                // Atualiza posição e ângulo do triângulo para seta padrão recalculada
                const angle = fabric.util.radiansToDegrees(
                    Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)
                ) + 90;
                tri.set({ left: endPoint.x, top: endPoint.y, angle: angle });
            }

            arrowElements.push(tri); // Adiciona o triângulo (já atualizado)

            newArrow = new fabric.Group(arrowElements, {
                type: 'arrow',
                arrowSubType: arrowData.arrowSubType || 'standard',
                from: arrowData.from,
                to: arrowData.to,
                selectable: true
            });

            canvas.add(newArrow);
            newArrow.setCoords(); // Fundamental após adicionar e popular o grupo
        });
        canvas.requestRenderAll();
    };
    input.click();
});
