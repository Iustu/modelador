document.addEventListener('DOMContentLoaded', function () {
    const completeButton = document.getElementById('complete-button');
    let targetObject = null;

    canvas.on('mouse:over', function (e) {
        if (e.target && e.target.type === 'box') {
            targetObject = e.target;
            positionCompleteButton(e.target);
            completeButton.style.display = 'block';
        }
    });

    canvas.on('mouse:out', function (e) {
        if (e.target && e.target.type === 'box') {
            if (e.target === targetObject) {
                 setTimeout(() => {
                    if (!completeButton.matches(':hover')) {
                        completeButton.style.display = 'none';
                        targetObject = null;
                    }
                }, 100);
            }
        }
    });

    completeButton.addEventListener('mouseleave', () => {
        completeButton.style.display = 'none';
        targetObject = null;
    });

    completeButton.addEventListener('click', () => {
        if (!targetObject) return;
        handleCompletion(targetObject);
        completeButton.style.display = 'none';
        targetObject = null;
    });

    // --- FUNÇÃO DE POSICIONAMENTO MANUAL E SIMPLIFICADA ---
    function positionCompleteButton(obj) {
        // Pega as coordenadas do canto superior direito (tr) do objeto.
        const objCoords = obj.aCoords.tr;
        
        const canvasWrapperRect = document.querySelector('.canvas-wrapper').getBoundingClientRect();
        const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();

        // Calcula a posição do canto do objeto relativa ao wrapper.
        const left = (objCoords.x - canvasRect.left) + (canvasRect.left - canvasWrapperRect.left);
        const top = (objCoords.y - canvasRect.top) + (canvasRect.top - canvasWrapperRect.top);
        
        // Deslocamento "manual" a partir do canto superior direito.
        // Simplesmente move o botão para a esquerda e para baixo por um valor fixo.
        const offsetX = -20; // Move o botão 20px para a esquerda do canto.
        const offsetY = 5;  // Move o botão 5px para baixo do canto.

        completeButton.style.left = `${left + offsetX}px`;
        completeButton.style.top = `${top + offsetY}px`;
    }

    function handleCompletion(obj) {
        if (obj.isCompleted) {
            console.log("Este item já está concluído.");
            return;
        }
        if (obj.customType === 'content') {
            handleContentCompletion(obj);
        } else if (obj.customType === 'subject') {
            handleSubjectCompletion(obj);
        }
    }
    
    function handleContentCompletion(content) {
        const prerequisite = findUncompletedPrerequisite(content);
        if (prerequisite) {
            const prereqText = prerequisite._objects.find(o => o.type === 'textbox').text;
            alert(`Pré-requisito necessário: Conclua a tarefa "${prereqText}" primeiro.`);
            return;
        }
        markAsCompleted(content);
    }

    function handleSubjectCompletion(subject) {
        const allChildren = subject.childrenIds.map(id => canvas.getObjects().find(o => o.objectId === id));
        const uncompletedChild = allChildren.find(child => !child || !child.isCompleted);
        
        if (uncompletedChild) {
            const childText = uncompletedChild._objects.find(o => o.type === 'textbox').text;
            alert(`Para concluir o assunto, primeiro conclua todos os seus conteúdos. Falta: "${childText}".`);
            return;
        }
        markAsCompleted(subject);
    }
    
    function findUncompletedPrerequisite(content) {
        let current = content;
        while (true) {
            const incomingArrow = canvas.getObjects().find(o => 
                o.type === 'arrow' && o.tipo === 'Percorrível' && o.to === current.objectId
            );
            if (!incomingArrow) break;
            
            const prerequisite = canvas.getObjects().find(o => o.objectId === incomingArrow.from);
            if (!prerequisite || (prerequisite.customType !== 'content' && prerequisite.customType !== 'subject')) break;
            if (prerequisite.customType === 'subject') break;

            if (!prerequisite.isCompleted) {
                return prerequisite;
            }
            current = prerequisite;
        }
        return null;
    }

    function markAsCompleted(obj) {
        obj.isCompleted = true;
        obj.item(0).set('fill', '#2ecc71');
        canvas.renderAll();
    }
});