document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.shape[draggable="true"]').forEach(shape => {
        shape.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', 'rect');
            e.dataTransfer.setData('color', e.target.dataset.color);
        });
    });

    canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());

    canvas.upperCanvasEl.addEventListener('drop', function(e) {
        e.preventDefault();
        if (e.dataTransfer.getData('type') !== 'rect') return;
        const userText = prompt("Digite o texto para o retângulo:", "");
        if (userText === null || userText.trim() === "") return;

        const colorKey = e.dataTransfer.getData('color');
        const rectEl = document.querySelector(`[data-color="${colorKey}"]`);
        const fillColor = getComputedStyle(rectEl).backgroundColor;

        const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        const rectWidth = 140, rectHeight = 60;
        const rect = new fabric.Rect({ width: rectWidth, height: rectHeight, fill: fillColor, rx: 5, ry: 5 });
        const text = new fabric.Textbox(userText, { width: rectWidth - 20, fontSize: 16, textAlign: 'center', fill: '#000', originX: 'center', originY: 'center', left: rectWidth / 2, top: rectHeight / 2 });
        
        const groupOptions = {
            left: x, top: y, objectId: generateId(), type: 'box',
            hasControls: true, selectable: true
        };

        if (colorKey === 'yellow') {
            // Retângulos amarelos são ASSUNTOS
            groupOptions.customType = 'subject';
            groupOptions.childrenIds = []; // Inicializa o array de filhos
        } else {
            // Retângulos azuis são CONTEÚDOS
            groupOptions.customType = 'content';
            groupOptions.parentId = null; // Inicializa o ID do pai como nulo
        }

        const group = new fabric.Group([rect, text], { left: x, top: y, objectId: generateId(), type: 'box', hasControls: true, selectable: true });
        
        canvas.add(group).setActiveObject(group);
    });

    document.getElementById('edit-text-button').addEventListener('click', () => {
        const active = canvas.getActiveObject();
        if (!active || active.type !== 'box') return alert("Nenhum retângulo selecionado.");
        const textObj = active._objects.find(o => o instanceof fabric.Textbox);
        if (!textObj) return alert("O objeto não contém texto.");
        const newText = prompt("Editar texto:", textObj.text);
        if (newText !== null) {
            textObj.set('text', newText);
            active.setCoords();
            canvas.requestRenderAll();
        }
    });
});