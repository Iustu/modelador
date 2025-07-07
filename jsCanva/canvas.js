document.addEventListener('DOMContentLoaded', function () {
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    window.canvas = new fabric.Canvas('canvas');
    resizeCanvas();
    const debouncedResize = debounce(resizeCanvas, 150);
    window.addEventListener('resize', debouncedResize);
    
    // --- Configuração Central de Eventos do Canvas ---
    canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
    canvas.upperCanvasEl.addEventListener('drop', handleDropOnCanvas); // Centraliza o evento de drop aqui
    canvas.on('mouse:down', window.handleMouseDownForArrow);
    canvas.on('object:modified', e => {
        if (e.target && (e.target.type === 'box' || e.target.type === 'node')) {
            window.updateArrowsForObject(e.target);
            window.updateAllHierarchyNumbers();
        }
    });

    document.getElementById('delete-button').addEventListener('click', handleDelete);
    document.addEventListener('keydown', e => {
        if (e.key === 'Delete') {
            e.preventDefault();
            handleDelete();
        }
    });

    document.querySelector('.sidebar').addEventListener('click', function(e) {
        const clickedButton = e.target.closest('button');
        if (!clickedButton) return;
        const arrowButtonIds = ['arrow-button', 'dashed-arrow-button'];
        if (!arrowButtonIds.includes(clickedButton.id)) {
            if (window.isDrawingArrow && typeof window.cancelArrowDrawing === 'function') {
                window.cancelArrowDrawing();
            }
        }
    });

    // --- Nova Função Central para Adicionar Objetos ao Canvas ---
    window.addObjectToCanvas = function(obj) {
        if (!obj) return;
        canvas.add(obj).setActiveObject(obj);
        canvas.renderAll();
        if (window.updateAllHierarchyNumbers) {
            window.updateAllHierarchyNumbers();
        }
    }

    function handleDropOnCanvas(e) {
        e.preventDefault();
        const dataType = e.dataTransfer.getData('data-type');
        if (!dataType) return;

        const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
        const dropCoords = {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top
        };

        let newObject = null;

        switch (dataType) {
            case 'subject':
                window.createSubject(dropCoords);
                break;
            case 'content':
                window.openContentModal(dropCoords);
                break;
            case 'start':
            case 'end':
                newObject = window.createStartEndNode({ coords: dropCoords, type: dataType });
                break;
            case 'trilha':
                window.openTrilhaModal(dropCoords);
                break;
            case 'exclusive_gateway':
            case 'parallel_gateway':
            case 'inclusive_gateway':
                newObject = window.createGatewayNode({ coords: dropCoords, type: dataType });
                break;
        }

        if (newObject) {
            window.addObjectToCanvas(newObject);
        }
    }

    // --- Outras Funções do Canvas ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    function resizeCanvas() {
        const width = canvasWrapper.clientWidth;
        const height = canvasWrapper.clientHeight;
        canvas.setDimensions({ width: width, height: height });
        canvas.renderAll();
    }

    function rebuildChildrenList(subject) {
        if (!subject || subject.customType !== 'subject') return;
        const allObjects = canvas.getObjects();
        const oldChildrenIds = new Set(subject.childrenIds);
        
        subject.childrenIds = [];
        const q = [subject]; 
        const visited = new Set([subject.objectId]);

        while (q.length > 0) {
            const current = q.shift();
            
            const outgoingArrows = allObjects.filter(o => 
                o.type === 'arrow' && (o.tipo === 'continua' || o.tipo === 'tracejada') && o.from === current.objectId
            );

            for (const arrow of outgoingArrows) {
                const childObj = allObjects.find(o => o.objectId === arrow.to);
                if (childObj && childObj.customType === 'content' && !visited.has(childObj.objectId)) {
                    visited.add(childObj.objectId);
                    subject.childrenIds.push(childObj.objectId);
                    childObj.parentId = subject.objectId;
                    q.push(childObj);
                }
            }
        }
        
        oldChildrenIds.forEach(childId => {
            if (!subject.childrenIds.includes(childId)) {
                const orphanedChild = allObjects.find(o => o.objectId === childId);
                if (orphanedChild) {
                    orphanedChild.parentId = null;
                }
            }
        });
    }
    window.rebuildChildrenList = rebuildChildrenList;
    
    function handleDelete() {
        const activeSelection = canvas.getActiveObject();
        if (!activeSelection) {
            alert("Nenhum item selecionado para excluir.");
            return;
        }
        const objectsInSelection = activeSelection.type === 'activeSelection'
            ? activeSelection.getObjects()
            : [activeSelection];
        if (objectsInSelection.length > 1) {
            if (!confirm(`Você tem certeza que deseja excluir os ${objectsInSelection.length} itens selecionados?`)) {
                return;
            }
        }
        const subjectsToRevalidate = new Set();
        const allObjectsToRemove = new Set(objectsInSelection);

        objectsInSelection.forEach(selectedObj => {
            let parentSubject = null;
            if (selectedObj.type === 'box' || selectedObj.type === 'node') {
                if (selectedObj.customType === 'subject') {
                    parentSubject = selectedObj;
                } else if (selectedObj.parentId) {
                    parentSubject = canvas.getObjects().find(o => o.objectId === selectedObj.parentId);
                }
                canvas.getObjects().forEach(arrow => {
                    if (arrow.type === 'arrow' && (arrow.from === selectedObj.objectId || arrow.to === selectedObj.objectId)) {
                        allObjectsToRemove.add(arrow);
                    }
                });
            }
            else if (selectedObj.type === 'arrow' && selectedObj.from) {
                const startObj = canvas.getObjects().find(o => o.objectId === selectedObj.from);
                if (startObj) {
                    if (startObj.customType === 'subject') {
                        parentSubject = startObj;
                    } else if (startObj.parentId) {
                        parentSubject = canvas.getObjects().find(o => o.objectId === startObj.parentId);
                    }
                }
            }
            if (parentSubject) {
                subjectsToRevalidate.add(parentSubject);
            }
        });

        allObjectsToRemove.forEach(obj => canvas.remove(obj));
        canvas.discardActiveObject();

        subjectsToRevalidate.forEach(subject => {
            if (!allObjectsToRemove.has(subject)) {
                window.rebuildChildrenList(subject);
            }
        });

        window.updateAllHierarchyNumbers();
        canvas.renderAll();
    }
});