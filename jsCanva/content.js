document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('content-modal');
    const contentList = document.getElementById('content-list');
    const closeButton = document.getElementById('modal-close-button');

    document.querySelectorAll('.shape[draggable="true"]').forEach(shape => {
        shape.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', 'rect');
            e.dataTransfer.setData('color', e.target.dataset.color);
        });
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    window.handleDropOnCanvas = function(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        if (type !== 'rect') return;
        const colorKey = e.dataTransfer.getData('color');
        const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
        const dropCoords = {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top
        };
        if (colorKey === 'yellow') {
            createSubject(dropCoords);
        } else if (colorKey === 'blue') {
            openContentModal(dropCoords);
        }
    };

    function createSubject(coords) {
        const userText = prompt("Digite o título para o Assunto:", "");
        if (userText === null || userText.trim() === "") return;
        createBox({
            coords: coords,
            color: '#f1c40f',
            text: userText,
            isSubject: true
        });
    }

    function openContentModal(coords) {
        const documentationView = document.getElementById('documentation-view');
        const contentView = document.getElementById('content-view');
        const documentationList = document.getElementById('documentation-list');
        const contentList = document.getElementById('content-list');
        const contentViewTitle = document.getElementById('content-view-title');
        const backButton = document.getElementById('modal-back-button');
        const modal = document.getElementById('content-modal');

        // Reseta o modal para o estado inicial (visão de documentação)
        documentationList.innerHTML = '';
        contentList.innerHTML = '';
        contentView.style.display = 'none';
        documentationView.style.display = 'block';

        // Popula a lista de documentações
        window.backendData.documentacoes.forEach(doc => {
            const li = document.createElement('li');
            li.textContent = doc.titulo;
            li.dataset.docId = doc.id;
            documentationList.appendChild(li);
        });

        // Mostra o modal
        modal.style.display = 'flex';

        // Gerenciador de clique para a lista de documentações
        documentationList.onclick = function(e) {
            if (e.target && e.target.nodeName === "LI") {
                const docId = e.target.dataset.docId;
                const selectedDoc = window.backendData.documentacoes.find(d => d.id === docId);
                if (selectedDoc) {
                    showContentView(selectedDoc);
                }
            }
        };

        // Gerenciador de clique para a lista de conteúdos (lógica original)
        contentList.onclick = function(e) {
            if (e.target && e.target.nodeName === "LI") {
                const selectedId = e.target.dataset.contentId;
                const docId = e.target.dataset.docId; // Precisamos saber de qual doc veio
                const selectedDoc = window.backendData.documentacoes.find(d => d.id === docId);
                const selectedContent = selectedDoc.conteudos.find(c => c.id === selectedId);

                createBox({
                    coords: coords,
                    color: '#3498db',
                    text: selectedContent.título,
                    isSubject: false,
                    contentId: selectedContent.id,
                    fullText: selectedContent.texto
                });

                modal.style.display = 'none';
            }
        };

        // Gerenciador de clique para o botão "Voltar"
        backButton.onclick = function() {
            contentView.style.display = 'none';
            documentationView.style.display = 'block';
        };

        function showContentView(doc) {
            contentList.innerHTML = '';

            // Pega todos os IDs de conteúdo que já estão no canvas
            const usedContentIds = new Set();
            canvas.getObjects().forEach(obj => {
                if (obj.contentId) {
                    usedContentIds.add(obj.contentId);
                }
            });

            const availableContent = doc.conteudos.filter(c => !usedContentIds.has(c.id));

            if (availableContent.length === 0) {
                alert("Todos os conteúdos desta documentação já foram adicionados!");
                return;
            }

            // Popula a lista de conteúdos
            availableContent.forEach(content => {
                const li = document.createElement('li');
                li.textContent = content.título;
                li.dataset.contentId = content.id;
                li.dataset.docId = doc.id; // Armazena o ID da documentação também
                contentList.appendChild(li);
            });

            // Troca as visualizações
            documentationView.style.display = 'none';
            contentView.style.display = 'block';
            contentViewTitle.textContent = `Selecione um Conteúdo de "${doc.titulo}"`;
        }
    }

    function createBox(options) {
        const rectWidth = 140;
        const rectHeight = 60;
        const rect = new fabric.Rect({
            width: rectWidth,
            height: rectHeight,
            fill: options.color,
            rx: 5,
            ry: 5,
            originX: 'center',
            originY: 'center'
        });
        const text = new fabric.Textbox(options.text, {
            width: 120,
            fontSize: 16,
            textAlign: 'center',
            fill: '#000',
            originX: 'center',
            originY: 'center'
        });
        const numberText = new fabric.Text('', {
            fontSize: 14,
            fontWeight: 'bold',
            fill: 'rgba(0,0,0,0.4)',
            isHierarchyNumber: true,
            originX: 'left',
            originY: 'top',
            left: -(rectWidth / 2) + 5,
            top: -(rectHeight / 2) + 5
        });
        const groupOptions = {
            left: options.coords.x,
            top: options.coords.y,
            objectId: generateId(),
            type: 'box',
            hasControls: true,
            selectable: true,
            cornerStyle: 'circle'
        };

        if (options.isSubject) {
            groupOptions.customType = 'subject';
            groupOptions.childrenIds = [];
        } else {
            groupOptions.customType = 'content';
            groupOptions.parentId = null;
            groupOptions.contentId = options.contentId;
            groupOptions.fullText = options.fullText;
        }
    
        const group = new fabric.Group([rect, text, numberText], groupOptions);
        canvas.add(group).setActiveObject(group);
    
        if (window.updateAllHierarchyNumbers) {
            window.updateAllHierarchyNumbers();
        }
    }
    
    document.getElementById('edit-text-button').addEventListener('click', () => {
        const active = canvas.getActiveObject();
        if (!active || active.type !== 'box') {
            alert("Nenhum item selecionado.");
            return;
        }
        if (active.customType !== 'subject') {
            alert("Apenas o título de 'Assuntos' pode ser editado manualmente.");
            return;
        }
        const textObj = active._objects.find(o => o.type === 'textbox' && !o.isHierarchyNumber);
        if (!textObj) return;
        const newText = prompt("Editar título do Assunto:", textObj.text);
        if (newText !== null) {
            textObj.set('text', newText);
            active.setCoords();
            canvas.requestRenderAll();
        }
    });
});