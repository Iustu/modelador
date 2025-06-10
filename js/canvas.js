document.addEventListener('DOMContentLoaded', function () {
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    window.canvas = new fabric.Canvas('canvas');
    
    // Otimiza a frequência de execução de uma função.
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Ajusta as dimensões do canvas com base no seu contêiner.
    function resizeCanvas() {
        const width = canvasWrapper.clientWidth;
        const height = canvasWrapper.clientHeight;
        canvas.setDimensions({ width: width, height: height });
        canvas.renderAll();
    }

    // Desfaz a relação de parentesco ao excluir uma seta.
    function removeChildRelationship(arrow) {
        if (!arrow || arrow.type !== 'arrow' || !arrow.from || !arrow.to) return;
        const parentObj = canvas.getObjects().find(o => o.objectId === arrow.from);
        const childObj = canvas.getObjects().find(o => o.objectId === arrow.to);
        if (parentObj && parentObj.customType === 'subject' && childObj) {
            parentObj.childrenIds = parentObj.childrenIds.filter(id => id !== childObj.objectId);
            childObj.parentId = null;
        } else if (parentObj && parentObj.customType === 'content' && childObj && parentObj.parentId) {
            const grandParentSubject = canvas.getObjects().find(o => o.objectId === parentObj.parentId);
            if (grandParentSubject) {
                grandParentSubject.childrenIds = grandParentSubject.childrenIds.filter(id => id !== childObj.objectId);
                childObj.parentId = null;
            }
        }
    }

    // Remove setas conectadas a uma caixa que será excluída.
    function removeConnectedArrows(box) {
        const objectId = box.objectId;
        if (!objectId) return;
        const arrowsToRemove = canvas.getObjects().filter(obj => obj.type === 'arrow' && (obj.from === objectId || obj.to === objectId));
        arrowsToRemove.forEach(arrow => canvas.remove(arrow));
    }

    // Centraliza a lógica de exclusão de objetos.
    function handleDelete(activeObject) {
        if (!activeObject) return alert("Nenhum item selecionado para excluir.");
        if (activeObject.type === 'arrow') {
            removeChildRelationship(activeObject);
        } else if (activeObject.type === 'box') {
            removeConnectedArrows(activeObject);
        }
        canvas.remove(activeObject);
        canvas.requestRenderAll();
    }

    resizeCanvas();
    const debouncedResize = debounce(resizeCanvas, 150);
    window.addEventListener('resize', debouncedResize);
    
    // Centraliza a configuração de eventos do canvas.
    canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
    canvas.upperCanvasEl.addEventListener('drop', window.handleDropOnCanvas);
    canvas.on('mouse:down', window.handleMouseDownForArrow);
    canvas.on('object:modified', e => {
        if (e.target && e.target.type === 'box') {
            window.updateArrowsForObject(e.target);
        }
    });

    // Configura os listeners dos botões.
    document.getElementById('delete-button').addEventListener('click', () => {
        handleDelete(canvas.getActiveObject());
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Delete') {
            handleDelete(canvas.getActiveObject());
        }
    });
});