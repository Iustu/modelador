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

// Desenha seta entre dois grupos na tela
canvas.on('mouse:down', function(e) {
	if (!isDrawingArrow) return;

	const target = e.target;
	if (!(target instanceof fabric.Group)) return;

	if (!arrowStartObject) {
		arrowStartObject = target;
	} else {
		const start = arrowStartObject;
		const end = target;

		// Calcula pontos da borda para início e fim da seta
		const startPoint = getEdgePoint(start, end.getCenterPoint());
		const endPoint = getEdgePoint(end, start.getCenterPoint());

		// Linha da seta
		const line = new fabric.Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
			stroke: 'black',
			strokeWidth: 2,
			selectable: false,
			objectCaching: false
		});

		// Cabeça da seta (triângulo)
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
			selectable: false
		});

		// Agrupa linha e triângulo
		const arrow = new fabric.Group([line, tri], {
			type: 'arrow',
			from: start.objectId,
			to: end.objectId,
			selectable: true
		});

		canvas.add(arrow);
		canvas.setActiveObject(arrow);

		// Reseta variáveis
		arrowStartObject = null;
		isDrawingArrow = false;
	}
});

// Atualiza setas ligadas ao objeto que foi movido, escalado ou rotacionado
function updateArrowsForObject(movedObj) {
	if (!movedObj || movedObj.type !== 'box') return;

	movedObj.setCoords();

	canvas.getObjects().forEach(obj => {
		if (obj.type === 'arrow') {
			const startId = obj.from;
			const endId = obj.to;

			if (movedObj.objectId === startId || movedObj.objectId === endId) {
				const startObj = canvas.getObjects().find(o => o.objectId === startId);
				const endObj = canvas.getObjects().find(o => o.objectId === endId);

				if (!startObj || !endObj) return;

				startObj.setCoords();
				endObj.setCoords();

				const startPoint = getEdgePoint(startObj, endObj.getCenterPoint());
				const endPoint = getEdgePoint(endObj, startObj.getCenterPoint());

				const line = obj.item(0);
				const tri = obj.item(1);

				line.set({ x1: startPoint.x, y1: startPoint.y, x2: endPoint.x, y2: endPoint.y });

				const angle = fabric.util.radiansToDegrees(
					Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)
				) + 90;

				tri.set({
					left: endPoint.x,
					top: endPoint.y,
					angle: angle
				});

				line.setCoords();
				tri.setCoords();
				obj.setCoords();
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
				width: obj.width,
				height: obj.height,
				scaleX: obj.scaleX,
				scaleY: obj.scaleY,
				angle: obj.angle,
				text: textObj ? textObj.text : ""
			});
		} else if (obj.type === 'arrow') {
			const line = obj.item(0);
			const tri = obj.item(1);
			data.arrows.push({
				from: obj.from,
				to: obj.to,
				line: { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2 },
				triangle: { left: tri.left, top: tri.top, angle: tri.angle }
			});
		}
	});

	const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "canvas-data.json";
	a.click();
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

		// Reconstrói caixas
		data.boxes.forEach(box => {
			const rect = new fabric.Rect({
				width: box.width,
				height: box.height,
				fill: "yellow",
				rx: 5,
				ry: 5
			});

			const text = new fabric.Textbox(box.text, {
				width: box.width - 20,
				fontSize: 16,
				textAlign: 'center',
				fill: '#000',
				originX: 'center',
				originY: 'center',
				left: box.width / 2,
				top: box.height / 2
			});

			const group = new fabric.Group([rect, text], {
				left: box.left,
				top: box.top,
				scaleX: box.scaleX,
				scaleY: box.scaleY,
				angle: box.angle,
				objectId: box.id,
				type: 'box',
				hasControls: true,
				selectable: true
			});

			canvas.add(group);
			idToObject[box.id] = group;
		});

		// Reconstrói setas
		data.arrows.forEach(arrowData => {
			const line = new fabric.Line([
				arrowData.line.x1,
				arrowData.line.y1,
				arrowData.line.x2,
				arrowData.line.y2
			], {
				stroke: 'black',
				strokeWidth: 2,
				selectable: false,
				objectCaching: false
			});

			const tri = new fabric.Triangle({
				width: 10,
				height: 15,
				fill: 'black',
				left: arrowData.triangle.left,
				top: arrowData.triangle.top,
				angle: arrowData.triangle.angle,
				originX: 'center',
				originY: 'center',
				selectable: false
			});

			const arrow = new fabric.Group([line, tri], {
				type: 'arrow',
				from: arrowData.from,
				to: arrowData.to,
				selectable: true
			});

			canvas.add(arrow);
		});
	};
	input.click();
});
