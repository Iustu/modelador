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

    // ATUALIZADO: Eventos de exclusão agora chamam handleDelete sem argumentos.
    document.getElementById('delete-button').addEventListener('click', () => {
        handleDelete();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Delete') {
            e.preventDefault(); // Impede ações padrão do navegador.
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

    // Reconstrói a lista de filhos de um Assunto a partir do zero.
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
                o.type === 'arrow' && o.tipo === 'Percorrível' && o.from === current.objectId
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
        
        console.log(`Árvore do Assunto '${subject.text || subject.objectId}' reconstruída. Filhos:`, subject.childrenIds);
    }
    
    window.rebuildChildrenList = rebuildChildrenList;
    
    // ATUALIZADO: Lógica de exclusão que suporta múltiplos itens com confirmação.
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
            const confirmed = confirm(`Você tem certeza que deseja excluir os ${objectsInSelection.length} itens selecionados?`);
            if (!confirmed) {
                return;
            }
        }

        const subjectsToRevalidate = new Set();
        const allObjectsToRemove = new Set(objectsInSelection);

        objectsInSelection.forEach(selectedObj => {
            let parentSubject = null;
            if (selectedObj.type === 'box') {
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