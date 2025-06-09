document.addEventListener('DOMContentLoaded', function () {

    // Helper para otimizar o redimensionamento (evita que a função rode centenas de vezes)
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const canvasWrapper = document.querySelector('.canvas-wrapper');
    // Inicializamos o canvas sem dimensões, pois a função resizeCanvas cuidará disso.
    window.canvas = new fabric.Canvas('canvas');

    //rezise
    function resizeCanvas() {
        const width = canvasWrapper.clientWidth;
        const height = canvasWrapper.clientHeight;
        // Usa o método setDimensions do Fabric.js para ajustar o canvas
        canvas.setDimensions({ width: width, height: height });
        canvas.renderAll();
    }

    // Cria uma versão "debounced" da nossa função de redimensionar
    const debouncedResize = debounce(resizeCanvas, 150); // Delay de 150ms

    // Adiciona o "ouvinte" de redimensionamento à janela do navegador
    window.addEventListener('resize', debouncedResize);

    // Chama a função uma vez no início para definir o tamanho inicial correto
    resizeCanvas();

    canvas.on('object:modified', e => {
        if (e.target && e.target.type === 'box') {
            updateArrowsForObject(e.target);
        }
    });

    document.getElementById('delete-button').addEventListener('click', () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            if (activeObject.type === 'box') removeConnectedArrows(activeObject);
            canvas.remove(activeObject);
            canvas.requestRenderAll();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Delete') {
            const activeObject = canvas.getActiveObject();
            if (activeObject) {
                if (activeObject.type === 'box') removeConnectedArrows(activeObject);
                canvas.remove(activeObject);
                canvas.requestRenderAll();
            }
        }
    });

    function removeConnectedArrows(targetObject) {
        const objectId = targetObject.objectId;
        if (!objectId) return;
        const arrowsToRemove = canvas.getObjects().filter(obj => obj.type === 'arrow' && (obj.from === objectId || obj.to === objectId));
        arrowsToRemove.forEach(arrow => canvas.remove(arrow));
    }
});