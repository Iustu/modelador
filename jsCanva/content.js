document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos do Modal
    const modal = document.getElementById('content-modal');
    const contentList = document.getElementById('content-list');
    const closeButton = document.getElementById('modal-close-button');

    // Habilita o drag & drop das formas da sidebar.
    document.querySelectorAll('.shape[draggable="true"]').forEach(shape => {
        shape.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', 'rect');
            e.dataTransfer.setData('color', e.target.dataset.color);
        });
    });

    // Fecha o modal ao clicar no 'X'
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Fecha o modal ao clicar fora da área de conteúdo dele
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // A nova função que lida com o drop no canvas
    window.handleDropOnCanvas = function(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        if (type !== 'rect') return;

        const colorKey = e.dataTransfer.getData('color');
        const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
        
        // Mantém as coordenadas do drop para usar depois da seleção no modal
        const dropCoords = {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top
        };

        if (colorKey === 'yellow') {
            // "Assunto" continua com o prompt
            createSubject(dropCoords);
        } else if (colorKey === 'blue') {
            // "Conteúdo" agora abre o modal
            openContentModal(dropCoords);
        }
    };

    function createSubject(coords) {
        const userText = prompt("Digite o título para o Assunto:", "");
        if (userText === null || userText.trim() === "") return;

        createBox({
            coords: coords,
            color: '#f1c40f', // Amarelo
            text: userText,
            isSubject: true
        });
    }

    function openContentModal(coords) {
        // Limpa a lista antiga
        contentList.innerHTML = '';

        // Pega todos os IDs de conteúdo que já estão no canvas
        const usedContentIds = new Set();
        canvas.getObjects().forEach(obj => {
            if (obj.contentId) {
                usedContentIds.add(obj.contentId);
            }
        });

        // Filtra para mostrar apenas os conteúdos ainda não utilizados
        const availableContent = window.backendData.conteudos.filter(c => !usedContentIds.has(c.id));

        if (availableContent.length === 0) {
            alert("Todos os conteúdos já foram adicionados ao diagrama!");
            return;
        }
        
        // Popula a lista no modal
        availableContent.forEach(content => {
            const li = document.createElement('li');
            li.textContent = content.título;
            li.dataset.contentId = content.id; // Guarda o ID no elemento
            contentList.appendChild(li);
        });

        // Mostra o modal
        modal.style.display = 'flex';
        
        // Adiciona o listener de clique na lista (usando delegação de eventos)
        contentList.onclick = function(e) {
            if (e.target && e.target.nodeName === "LI") {
                const selectedId = e.target.dataset.contentId;
                const selectedContent = window.backendData.conteudos.find(c => c.id === selectedId);

                createBox({
                    coords: coords,
                    color: '#3498db', // Azul
                    text: selectedContent.título,
                    isSubject: false,
                    contentId: selectedContent.id, // Armazena o ID do conteúdo original
                    fullText: selectedContent.texto // Armazena o texto completo
                });

                modal.style.display = 'none'; // Fecha o modal
            }
        };
    }

    // --- FUNÇÃO ATUALIZADA ---
    // Adiciona o número da hierarquia e corrige o layout do grupo.
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
    
        // ADIÇÃO: Cria o objeto de texto para o número da hierarquia.
        const numberText = new fabric.Text('', { // Usamos fabric.Text que é mais simples
            fontSize: 14,
            fontWeight: 'bold',
            fill: 'rgba(0,0,0,0.4)',
            isHierarchyNumber: true, // Propriedade para identificá-lo
            // Posicionamento corrigido para ficar dentro da caixa
            originX: 'left',
            originY: 'top',
            left: -(rectWidth / 2) + 5,  // 5px de margem da borda esquerda
            top: -(rectHeight / 2) + 5   // 5px de margem da borda de cima
        });
    
        const groupOptions = {
            left: options.coords.x,
            top: options.coords.y,
            objectId: generateId(),
            type: 'box',
            hasControls: true,
            selectable: true,
            cornerStyle: 'circle' // Adicionado para um visual melhor
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
    
        // ADIÇÃO: O texto do número agora faz parte do grupo.
        const group = new fabric.Group([rect, text, numberText], groupOptions);
        canvas.add(group).setActiveObject(group);
    
        // ADIÇÃO: Chama a função global para atualizar todos os números.
        if (window.updateAllHierarchyNumbers) {
            window.updateAllHierarchyNumbers();
        }
    }
    
    // Configura o botão de editar texto para funcionar apenas com "Assuntos"
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

        // Correção para encontrar o objeto de texto correto, ignorando o número da hierarquia
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