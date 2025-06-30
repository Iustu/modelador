document.addEventListener('DOMContentLoaded', function() {
    // --- Referências aos elementos do Modal ---
    const modal = document.getElementById('content-modal');
    const contentList = document.getElementById('content-list');
    const closeButton = document.getElementById('modal-close-button');
    const documentationView = document.getElementById('documentation-view');
    const contentView = document.getElementById('content-view');
    const documentationList = document.getElementById('documentation-list');
    const contentViewTitle = document.getElementById('content-view-title');
    const backButton = document.getElementById('modal-back-button');

    // --- Lógica de Drag & Drop ---

    // Habilita o drag & drop para todas as formas da sidebar.
    document.querySelectorAll('.shape[draggable="true"]').forEach(shape => {
        shape.addEventListener('dragstart', (e) => {
            // Passa o tipo do objeto (subject, content, start, end) para o evento.
            e.dataTransfer.setData('data-type', e.target.dataset.type);
        });
    });

    // Manipula o drop no canvas para criar o objeto correspondente.
    window.handleDropOnCanvas = function(e) {
        e.preventDefault();
        const dataType = e.dataTransfer.getData('data-type');
        if (!dataType) return;

        const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
        const dropCoords = {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top
        };

        // Decide qual função de criação chamar com base no tipo de objeto arrastado.
        if (dataType === 'subject') {
            createSubject(dropCoords);
        } else if (dataType === 'content') {
            openContentModal(dropCoords);
        } else if (dataType === 'start' || dataType === 'end') {
            createStartEndNode({ coords: dropCoords, type: dataType });
        }
    };

    // --- Funções de Criação de Objetos ---

    // Cria um nó de Início ou Fim no canvas.
    function createStartEndNode(options) {
        let node;
        const commonOptions = {
            left: options.coords.x,
            top: options.coords.y,
            originX: 'center',
            originY: 'center',
            selectable: true,
            hasControls: false, // Nós simples não precisam de controles de redimensionamento
            objectId: generateId(),
        };

        if (options.type === 'start') {
            const innerCircle = new fabric.Circle({
                radius: 12,
                fill: 'black',
                originX: 'center',
                originY: 'center'
            });
            const outerCircle = new fabric.Circle({
                radius: 18,
                fill: 'transparent',
                stroke: 'black',
                strokeWidth: 2,
                strokeDashArray: [5, 3],
                originX: 'center',
                originY: 'center'
            });
            node = new fabric.Group([outerCircle, innerCircle], {
                ...commonOptions,
                customType: 'start',
                type: 'node'
            });
        } else { // type === 'end'
            node = new fabric.Circle({
                ...commonOptions,
                radius: 15,
                fill: 'black',
                customType: 'end',
                type: 'node'
            });
        }
        canvas.add(node).setActiveObject(node);
    }
    
    // Cria uma caixa de Assunto.
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
    
    // Cria uma caixa de Assunto ou Conteúdo.
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

    // --- Lógica do Modal de Conteúdo ---
    
    // Abre e gerencia o modal de 2 níveis.
    function openContentModal(coords) {
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

        modal.style.display = 'flex';

        // Gerenciador de clique para a lista de documentações (Nível 1)
        documentationList.onclick = function(e) {
            if (e.target && e.target.nodeName === "LI") {
                const docId = e.target.dataset.docId;
                const selectedDoc = window.backendData.documentacoes.find(d => d.id === docId);
                if (selectedDoc) {
                    showContentView(selectedDoc);
                }
            }
        };
        
        // Gerenciador de clique para a lista de conteúdos (Nível 2)
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

    // --- Eventos de Botões ---

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

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