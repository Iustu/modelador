/* ARQUIVO: jsCanva/content.js */

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


    // --- Lógica de Drag & Drop (Apenas a parte de 'dragstart') ---
    document.querySelectorAll('.shape[draggable="true"]').forEach(shape => {
        shape.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('data-type', e.target.dataset.type);
        });
    });

    // --- Funções de Criação (refatoradas para retornar o objeto) ---

    window.openTrilhaModal = function(coords) {
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
                const box = createBox({
                    coords: coords,
                    color: '#009c3b',
                    text: selectedTrilha.titulo,
                    customType: 'trilha',
                    trilhaId: selectedTrilha.id
                });
                window.addObjectToCanvas(box); // Usa a nova função central
                trilhaSelectModal.style.display = 'none';
            }
        };
    }

    window.createSubject = function(coords) {
        const userText = prompt("Digite o título para o Assunto:", "");
        if (userText && userText.trim() !== "") {
            const box = createBox({
                coords: coords,
                color: '#f1c40f',
                text: userText,
                customType: 'subject'
            });
            window.addObjectToCanvas(box); // Usa a nova função central
        }
    };

    window.openContentModal = function(coords) {
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
                const box = createBox({
                    coords: coords,
                    color: '#3498db',
                    text: selectedContent.título,
                    customType: 'content',
                    contentId: selectedContent.id,
                    fullText: selectedContent.texto
                });
                window.addObjectToCanvas(box); // Usa a nova função central
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

    // A função createBox agora APENAS CRIA e RETORNA a caixa.
    function createBox(options) {
        const rectWidth = 140;
        const rectHeight = 60;
    
        const rect = new fabric.Rect({
            width: rectWidth, height: rectHeight, fill: options.color,
            rx: 5, ry: 5, originX: 'center', originY: 'center'
        });

        switch (options.customType) {
            case 'subject':
                rect.set({ stroke: 'black', strokeWidth: 2, strokeDashArray: [8, 4] });
                break;
            case 'trilha':
                rect.set({ stroke: 'black', strokeWidth: 2 });
                break;
        }
    
        let textColor = '#000000';
        if (options.customType !== 'subject') {
            textColor = '#ffffff';
        }
    
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
    
        return new fabric.Group([rect, text, numberText], groupOptions);
    }

    // --- Eventos de Botões e Fechamento de Modais ---
    contentCloseButton.addEventListener('click', () => {
        contentModal.style.display = 'none';
    });
    trilhaModalCloseButton.addEventListener('click', () => {
        trilhaSelectModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === contentModal || e.target === trilhaSelectModal) {
            contentModal.style.display = 'none';
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