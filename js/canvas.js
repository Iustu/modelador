document.addEventListener('DOMContentLoaded', function () {
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    window.canvas = new fabric.Canvas('canvas');
    resizeCanvas();
    const debouncedResize = debounce(resizeCanvas, 150);
    window.addEventListener('resize', debouncedResize);

    // Configuração central de eventos do canvas.
    canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
    canvas.upperCanvasEl.addEventListener('drop', window.handleDropOnCanvas);
    canvas.on('mouse:down', window.handleMouseDownForArrow);
    canvas.on('object:modified', e => {
        if (e.target && e.target.type === 'box') {
            window.updateArrowsForObject(e.target);
        }
    });
    
    // Configura os listeners dos botões e teclas.
    document.getElementById('delete-button').addEventListener('click', handleDelete);
    document.getElementById('edit-text-button').addEventListener('click', window.handleTextBoxEdit);
    document.getElementById('arrow-button').addEventListener('click', window.activateArrowDrawing);
    document.getElementById('dashed-arrow-button').addEventListener('click', window.activateDashedArrowDrawing);
    // As funções de import/export são configuradas em seu próprio arquivo.

    document.addEventListener('keydown', e => {
        if (e.key === 'Delete') {
            handleDelete();
        }
    });

    // Otimiza a frequência de execução de uma função.
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
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

        if (!parentObj || !childObj) return;

        let subjectParent = null;
        if (parentObj.customType === 'subject') {
            subjectParent = parentObj;
        } else if (parentObj.customType === 'content' && parentObj.parentId) {
            subjectParent = canvas.getObjects().find(o => o.objectId === parentObj.parentId);
        }
        
        if (subjectParent && childObj.parentId === subjectParent.objectId) {
            subjectParent.childrenIds = subjectParent.childrenIds.filter(id => id !== childObj.objectId);
            childObj.parentId = null;
        }
    }

    // Remove setas conectadas a uma caixa que será excluída.
    function removeConnectedArrows(box) {
        const objectId = box.objectId;
        if (!objectId) return;
        const arrowsToRemove = canvas.getObjects().filter(obj => obj.type === 'arrow' && (obj.from === objectId || obj.to === objectId));
        arrowsToRemove.forEach(arrow => {
            removeChildRelationship(arrow);
            canvas.remove(arrow);
        });
    }

    // Lógica de exclusão com suporte a múltiplos itens e confirmação.
    function handleDelete() {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length === 0) {
            alert("Nenhum item selecionado para excluir.");
            return;
        }

        // Pede confirmação apenas se mais de um item estiver selecionado.
        if (activeObjects.length > 1) {
            if (!confirm(`Tem certeza que deseja excluir os ${activeObjects.length} itens selecionados?`)) {
                return;
            }
        }
        
        activeObjects.forEach(obj => {
            if (obj.type === 'box') {
                removeConnectedArrows(obj);
            } else if (obj.type === 'arrow') {
                removeChildRelationship(obj);
            }
            canvas.remove(obj);
        });

        canvas.discardActiveObject();
        canvas.requestRenderAll();
    }
});