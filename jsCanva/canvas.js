/* ARQUIVO: jsCanva/canvas.js */

document.addEventListener('DOMContentLoaded', function () {
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    window.canvas = new fabric.Canvas('canvas');
    resizeCanvas();
    const debouncedResize = debounce(resizeCanvas, 150);
    window.addEventListener('resize', debouncedResize);
    
    // --- Configuração Central de Eventos do Canvas ---
    canvas.upperCanvasEl.addEventListener('dragover', e => e.preventDefault());
    canvas.upperCanvasEl.addEventListener('drop', handleDropOnCanvas);
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
        // CORREÇÃO: A chamada para a numeração foi REMOVIDA daqui.
    }

    // --- Controlador de "Drop" Refatorado ---
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

    //Reconstrói a lista de filhos de um Assunto, agora seguindo as cadeias de conteúdo.
    function rebuildChildrenList(subject) {
        if (!subject || subject.customType !== 'subject') return;
        
        const allObjects = canvas.getObjects();
        const oldChildrenIds = new Set(subject.childrenIds || []);
        
        subject.childrenIds = [];
        const visitedInHierarchy = new Set();
        
        const chainStarters = allObjects.filter(o => 
            o.type === 'arrow' && o.from === subject.objectId && o.isHierarchy
        );

        chainStarters.forEach(arrow => {
            let current = allObjects.find(o => o.objectId === arrow.to);
            while (current && !visitedInHierarchy.has(current.objectId)) {
                visitedInHierarchy.add(current.objectId);
                
                subject.childrenIds.push(current.objectId);
                current.parentId = subject.objectId;

                const nextArrow = allObjects.find(a => a.type === 'arrow' && a.from === current.objectId && !a.isHierarchy);
                current = nextArrow ? allObjects.find(o => o.objectId === nextArrow.to) : null;
            }
        });
        
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
    
    //Lida com a exclusão de objetos e suas setas conectadas.
    function handleDelete() {
        const activeSelection = canvas.getActiveObject();
        if (!activeSelection) return;
        const objectsInSelection = activeSelection.type === 'activeSelection' ? activeSelection.getObjects() : [activeSelection];
        if (objectsInSelection.length > 1 && !confirm(`Excluir ${objectsInSelection.length} itens?`)) return;

        const parentsToRevalidate = new Set();
        const allObjectsToRemove = new Set(objectsInSelection);

        objectsInSelection.forEach(selectedObj => {
            if (selectedObj.parentId) {
                const parentObj = canvas.getObjects().find(o => o.objectId === selectedObj.parentId);
                if (parentObj) parentsToRevalidate.add(parentObj);
            }
            if (selectedObj.type === 'box' || selectedObj.type === 'node') {
                canvas.getObjects().forEach(arrow => {
                    if (arrow.type === 'arrow' && (arrow.from === selectedObj.objectId || arrow.to === selectedObj.objectId)) {
                        allObjectsToRemove.add(arrow);
                    }
                });
            }
        });

        allObjectsToRemove.forEach(obj => canvas.remove(obj));
        canvas.discardActiveObject();

        parentsToRevalidate.forEach(parent => {
            if (!allObjectsToRemove.has(parent)) {
                window.rebuildChildrenList(parent);
            }
        });

        window.updateAllHierarchyNumbers();
        canvas.renderAll();
    }
});