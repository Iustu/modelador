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

    document.getElementById('delete-button').addEventListener('click', () => {
        handleDelete(canvas.getActiveObject());
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Delete') {
            handleDelete(canvas.getActiveObject());
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
    // Esta é a forma mais segura de garantir a consistência após uma exclusão.
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
        
        // Limpa o parentId de quaisquer filhos que se tornaram órfãos.
        oldChildrenIds.forEach(childId => {
            if (!subject.childrenIds.includes(childId)) {
                const orphanedChild = allObjects.find(o => o.objectId === childId);
                if (orphanedChild) {
                    orphanedChild.parentId = null;
                }
            }
        });
        
        console.log(`Árvore do Assunto '${subject.objectId}' reconstruída. Filhos:`, subject.childrenIds);
    }
    
    // Lógica central de exclusão, agora mais robusta.
    function handleDelete(activeObject) {
        if (!activeObject) return alert("Nenhum item selecionado para excluir.");

        let subjectToRevalidate = null;
        
        // Determina se a exclusão afeta uma árvore de filhos.
        if (activeObject.type === 'box') {
            if (activeObject.customType === 'subject') {
                subjectToRevalidate = activeObject;
            } else if (activeObject.customType === 'content' && activeObject.parentId) {
                subjectToRevalidate = canvas.getObjects().find(o => o.objectId === activeObject.parentId);
            }
        } else if (activeObject.type === 'arrow' && activeObject.from) {
             const startObj = canvas.getObjects().find(o => o.objectId === activeObject.from);
             if (startObj && startObj.parentId) {
                 subjectToRevalidate = canvas.getObjects().find(o => o.objectId === startObj.parentId);
             } else if (startObj && startObj.customType === 'subject') {
                 subjectToRevalidate = startObj;
             }
        }

        // Encontra todos os objetos a serem removidos.
        const objectsToRemove = [activeObject];
        if (activeObject.type === 'box') {
            canvas.getObjects().forEach(obj => {
                if (obj.type === 'arrow' && (obj.from === activeObject.objectId || obj.to === activeObject.objectId)) {
                    objectsToRemove.push(obj);
                }
            });
        }
        
        // Remove os objetos do canvas.
        objectsToRemove.forEach(obj => canvas.remove(obj));

        // Se uma árvore foi afetada, reconstrói sua lista de filhos.
        if (subjectToRevalidate) {
            rebuildChildrenList(subjectToRevalidate);
        }

        canvas.renderAll();
    }
});