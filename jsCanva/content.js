document.addEventListener('DOMContentLoaded', function() {
    // --- Referências aos Elementos ---
    const contentModal = document.getElementById('content-modal');
    const textInputModal = document.getElementById('text-input-modal');
    const trilhaSelectModal = document.getElementById('trilha-select-modal');

    const contentList = document.getElementById('content-list');
    const contentCloseButton = document.getElementById('modal-close-button');
    const documentationView = document.getElementById('documentation-view');
    const contentView = document.getElementById('content-view');
    const documentationList = document.getElementById('documentation-list');
    const contentViewTitle = document.getElementById('content-view-title');
    const backButton = document.getElementById('modal-back-button');
    
    const trilhaList = document.getElementById('trilha-list');
    const trilhaModalCloseButton = document.getElementById('trilha-modal-close-button');


    // --- Lógica de Drag & Drop ---
    document.querySelectorAll('.shape[draggable="true"]').forEach(shape => {
        shape.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('data-type', e.target.dataset.type);
        });
    });

    window.handleDropOnCanvas = function(e) {
        e.preventDefault();
        const dataType = e.dataTransfer.getData('data-type');
        if (!dataType) return;

        const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
        const dropCoords = {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top
        };

        switch (dataType) {
            case 'subject':
                createSubject(dropCoords);
                break;
            case 'content':
                openContentModal(dropCoords);
                break;
            case 'start':
            case 'end':
                createStartEndNode({ coords: dropCoords, type: dataType });
                break;
            case 'trilha':
                openTrilhaModal(dropCoords);
                break;
        }
    };

    // --- Funções de Criação de Objetos ---

    function createStartEndNode(options) {
        let node;
        const commonOptions = {
            left: options.coords.x,
            top: options.coords.y,
            originX: 'center',
            originY: 'center',
            selectable: true,
            hasControls: false,
            objectId: generateId(),
        };

        if (options.type === 'start') {
            node = new fabric.Circle({ ...commonOptions, radius: 15, fill: 'black', customType: 'start', type: 'node' });
        } else { // 'end'
            const innerCircle = new fabric.Circle({ radius: 12, fill: 'black', originX: 'center', originY: 'center' });
            const outerCircle = new fabric.Circle({ radius: 18, fill: 'transparent', stroke: 'black', strokeWidth: 2, strokeDashArray: [5, 3], originX: 'center', originY: 'center' });
            node = new fabric.Group([outerCircle, innerCircle], { ...commonOptions, customType: 'end', type: 'node' });
        }
        canvas.add(node).setActiveObject(node);
    }
    
    function createSubject(coords) {
        const userText = prompt("Digite o título para o Assunto:", "");
        if (userText === null || userText.trim() === "") return;
        createBox({
            coords: coords,
            color: '#f1c40f',
            text: userText,
            customType: 'subject'
        });
    }
    
    function createBox(options) {
        const rectWidth = 140;
        const rectHeight = 60;

        const rect = new fabric.Rect({
            width: rectWidth, height: rectHeight, fill: options.color,
            rx: 5, ry: 5, originX: 'center', originY: 'center'
        });

        let textColor = (options.customType === 'subject' || options.customType === 'content' || options.customType === 'trilha') 
            ? '#ffffff' 
            : '#000000';

        const text = new fabric.Textbox(options.text, {
            width: 120, fontSize: 16, textAlign: 'center',
            fill: textColor, originX: 'center', originY: 'center'
        });

        const numberText = new fabric.Text('', {
            fontSize: 14, fontWeight: 'bold', fill: 'rgba(0,0,0,0.4)',
            isHierarchyNumber: true, originX: 'left', originY: 'top',
            left: -(rectWidth / 2) + 5, top: -(rectHeight / 2) + 5
        });

        const groupOptions = {
            left: options.coords.x, top: options.coords.y,
            objectId: generateId(), type: 'box', hasControls: true,
            selectable: true, cornerStyle: 'circle', customType: options.customType
        };

        if (options.customType === 'subject') {
            groupOptions.childrenIds = [];
        } else if (options.customType === 'content') {
            groupOptions.parentId = null;
            groupOptions.contentId = options.contentId;
            groupOptions.fullText = options.fullText;
        } else if (options.customType === 'trilha') {
            groupOptions.trilhaId = options.trilhaId;
        }

        const group = new fabric.Group([rect, text, numberText], groupOptions);
        canvas.add(group).setActiveObject(group);

        if (window.updateAllHierarchyNumbers) {
            window.updateAllHierarchyNumbers();
        }
    }

    // --- Lógica dos Modais ---

    function openTrilhaModal(coords) {
        trilhaList.innerHTML = '';
        const usedTrilhaIds = new Set();
        canvas.getObjects().forEach(obj => {
            if (obj.trilhaId) {
                usedTrilhaIds.add(obj.trilhaId);
            }
        });
        const availableTrilhas = window.backendData.trilhas.filter(t => !usedTrilhaIds.has(t.id));

        if (availableTrilhas.length === 0) {
            alert("Todas as trilhas já foram adicionadas ao diagrama!");
            return;
        }

        availableTrilhas.forEach(trilha => {
            const li = document.createElement('li');
            li.textContent = trilha.titulo;
            li.dataset.trilhaId = trilha.id;
            trilhaList.appendChild(li);
        });

        trilhaSelectModal.style.display = 'flex';

        trilhaList.onclick = function(e) {
            if (e.target && e.target.nodeName === "LI") {
                const trilhaId = e.target.dataset.trilhaId;
                const selectedTrilha = window.backendData.trilhas.find(t => t.id === trilhaId);
                
                createBox({
                    coords: coords,
                    color: '#009c3b',
                    text: selectedTrilha.titulo,
                    customType: 'trilha',
                    trilhaId: selectedTrilha.id
                });

                trilhaSelectModal.style.display = 'none';
            }
        };
    }

    function openContentModal(coords) {
        documentationList.innerHTML = '';
        contentList.innerHTML = '';
        contentView.style.display = 'none';
        documentationView.style.display = 'block';

        window.backendData.documentacoes.forEach(doc => {
            const li = document.createElement('li');
            li.textContent = doc.titulo;
            li.dataset.docId = doc.id;
            documentationList.appendChild(li);
        });

        contentModal.style.display = 'flex';

        documentationList.onclick = function(e) {
            if (e.target && e.target.nodeName === "LI") {
                const docId = e.target.dataset.docId;
                const selectedDoc = window.backendData.documentacoes.find(d => d.id === docId);
                if (selectedDoc) {
                    showContentView(selectedDoc);
                }
            }
        };
        
        contentList.onclick = function(e) {
            if (e.target && e.target.nodeName === "LI") {
                const selectedId = e.target.dataset.contentId;
                const docId = e.target.dataset.docId;
                const selectedDoc = window.backendData.documentacoes.find(d => d.id === docId);
                const selectedContent = selectedDoc.conteudos.find(c => c.id === selectedId);

                createBox({
                    coords: coords,
                    color: '#3498db',
                    text: selectedContent.título,
                    customType: 'content',
                    contentId: selectedContent.id,
                    fullText: selectedContent.texto
                });
                contentModal.style.display = 'none';
            }
        };

        backButton.onclick = function() {
            contentView.style.display = 'none';
            documentationView.style.display = 'block';
        };

        function showContentView(doc) {
            contentList.innerHTML = '';
            const usedContentIds = new Set();
            canvas.getObjects().forEach(obj => { if (obj.contentId) { usedContentIds.add(obj.contentId); } });
            const availableContent = doc.conteudos.filter(c => !usedContentIds.has(c.id));
            if (availableContent.length === 0) {
                alert("Todos os conteúdos desta documentação já foram adicionados!");
                return;
            }
            availableContent.forEach(content => {
                const li = document.createElement('li');
                li.textContent = content.título;
                li.dataset.contentId = content.id;
                li.dataset.docId = doc.id;
                contentList.appendChild(li);
            });
            documentationView.style.display = 'none';
            contentView.style.display = 'block';
            contentViewTitle.textContent = `Selecione um Conteúdo de "${doc.titulo}"`;
        }
    }

    // --- Eventos de Botões e Fechamento de Modais ---
    contentCloseButton.addEventListener('click', () => {
        contentModal.style.display = 'none';
    });
    trilhaModalCloseButton.addEventListener('click', () => {
        trilhaSelectModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === contentModal || e.target === textInputModal || e.target === trilhaSelectModal) {
            contentModal.style.display = 'none';
            textInputModal.style.display = 'none';
            trilhaSelectModal.style.display = 'none';
        }
    });

    document.getElementById('edit-text-button').addEventListener('click', () => {
        const active = canvas.getActiveObject();
        if (!active || active.type !== 'box') {
            alert("Nenhum item selecionado.");
            return;
        }
        if (active.customType !== 'subject' && active.customType !== 'trilha') {
            alert("Apenas o título de 'Assuntos' e 'Trilhas' pode ser editado manualmente.");
            return;
        }
        const textObj = active._objects.find(o => o.type === 'textbox' && !o.isHierarchyNumber);
        if (!textObj) return;
        const newText = prompt("Editar título:", textObj.text);
        if (newText !== null) {
            textObj.set('text', newText);
            active.setCoords();
            canvas.requestRenderAll();
        }
    });
});