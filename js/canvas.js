document.addEventListener('DOMContentLoaded', function () {
    window.canvas = new fabric.Canvas('canvas');

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