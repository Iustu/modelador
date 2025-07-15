/* ARQUIVO: jsCanva/content.js */

document.addEventListener('DOMContentLoaded', function() {
    // --- Referências aos Elementos ---
    const contentModal = document.getElementById('content-modal');
    const trilhaSelectModal = document.getElementById('trilha-select-modal');

    // --- Lógica de Drag & Drop ---
    document.querySelectorAll('.shape[draggable="true"]').forEach(shape => {
        shape.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('data-type', e.target.dataset.type);
        });
    });

    // --- Funções de Criação ---
    window.openTrilhaModal = function(coords) {
        const trilhaList = document.getElementById('trilha-list');
        trilhaList.innerHTML = '';
        const usedTrilhaIds = new Set();
        canvas.getObjects().forEach(obj => { if (obj.trilhaId) usedTrilhaIds.add(obj.trilhaId) });
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
            if (e.target.nodeName === "LI") {
                const trilhaId = e.target.dataset.trilhaId;
                const selectedTrilha = window.backendData.trilhas.find(t => t.id === trilhaId);
                const box = createBox({
                    coords: coords, color: '#009c3b', text: selectedTrilha.titulo,
                    customType: 'trilha', trilhaId: selectedTrilha.id
                });
                window.addObjectToCanvas(box);
                trilhaSelectModal.style.display = 'none';
            }
        };
    };

    window.createSubject = function(coords) {
        const userText = prompt("Digite o título para o Assunto:", "");
        if (userText && userText.trim() !== "") {
            const box = createBox({
                coords: coords, color: '#f1c40f', text: userText, customType: 'subject'
            });
            window.addObjectToCanvas(box);
        }
    };

    window.openContentModal = function(coords) {
        const documentationList = document.getElementById('documentation-list');
        const contentList = document.getElementById('content-list');
        const contentView = document.getElementById('content-view');
        const documentationView = document.getElementById('documentation-view');
        
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
            if (e.target.nodeName === "LI") {
                const docId = e.target.dataset.docId;
                const selectedDoc = window.backendData.documentacoes.find(d => d.id === docId);
                if (selectedDoc) showContentView(selectedDoc);
            }
        };
        
        contentList.onclick = function(e) {
            if (e.target.nodeName === "LI") {
                const selectedId = e.target.dataset.contentId;
                const docId = e.target.dataset.docId;
                const selectedDoc = window.backendData.documentacoes.find(d => d.id === docId);
                const selectedContent = selectedDoc.conteudos.find(c => c.id === selectedId);
                const box = createBox({
                    coords: coords, color: '#3498db', text: selectedContent.título,
                    customType: 'content', contentId: selectedContent.id, fullText: selectedContent.texto
                });
                window.addObjectToCanvas(box);
                contentModal.style.display = 'none';
            }
        };

        function showContentView(doc) {
            const contentList = document.getElementById('content-list');
            const documentationView = document.getElementById('documentation-view');
            const contentView = document.getElementById('content-view');
            const contentViewTitle = document.getElementById('content-view-title');
            
            contentList.innerHTML = '';
            const usedContentIds = new Set();
            canvas.getObjects().forEach(obj => { if (obj.contentId) usedContentIds.add(obj.contentId) });
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
    };

    function createBox(options) {
        // Aumenta o tamanho das caixas
        const rectWidth = 200; 
        const rectHeight = 80;
    
        const rect = new fabric.Rect({
            width: rectWidth, height: rectHeight, fill: options.color,
            rx: 5, ry: 5, originX: 'center', originY: 'center'
        });

        switch (options.customType) {
            case 'subject': rect.set({ stroke: 'black', strokeWidth: 2, strokeDashArray: [8, 4] }); break;
            case 'trilha': rect.set({ stroke: 'black', strokeWidth: 2 }); break;
        }
    
        let textColor = '#000000';
        if (options.customType !== 'subject') textColor = '#ffffff';
    
        const text = new fabric.Textbox(options.text || '', {
            width: rectWidth - 20, // Ajusta a área de texto
            fontSize: 16, textAlign: 'center',
            fill: textColor, originX: 'center', originY: 'center'
        });
    
        const groupOptions = {
            left: options.coords.x, top: options.coords.y,
            objectId: generateId(), type: 'box', hasControls: false, lockRotation: true,
            selectable: true, cornerStyle: 'circle', customType: options.customType,
            baseText: options.text || '', // Armazena o título original
            parentId: null,
            childrenIds: (options.customType === 'subject') ? [] : undefined
        };
        
        if (options.customType === 'content') {
            groupOptions.contentId = options.contentId;
            groupOptions.fullText = options.fullText;
        } else if (options.customType === 'trilha') {
            groupOptions.trilhaId = options.trilhaId;
        }
    
        // O objeto de texto do número foi REMOVIDO daqui.
        return new fabric.Group([rect, text], groupOptions);
    }

    // --- Eventos de Botões ---
    document.getElementById('edit-text-button').addEventListener('click', () => {
        const active = canvas.getActiveObject();
        if (!active || active.type !== 'box') return alert("Nenhum item selecionado.");
        if (active.customType !== 'subject' && active.customType !== 'trilha') {
            alert("Apenas o título de 'Assuntos' e 'Trilhas' pode ser editado manualmente.");
            return;
        }

        // Usa o 'baseText' para a edição, que não contém o número.
        const newText = prompt("Editar título:", active.baseText);
        if (newText !== null) {
            active.baseText = newText; // Atualiza o título base
            window.updateAllHierarchyNumbers(); // Recalcula a hierarquia para atualizar o texto exibido
            canvas.renderAll();
        }
    });

    // ... (outros listeners de fechamento de modais)
});