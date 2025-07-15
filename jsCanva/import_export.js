document.getElementById("export-button").addEventListener("click", () => {
    const diagramTitle = document.getElementById('diagram-title-input').value || "Diagrama sem título";
    const data = { 
        diagramTitle: diagramTitle, 
        diagramObjects: [], 
        arrows: [] 
    };

    canvas.getObjects().forEach(obj => {
        let objData = {};
        if (obj.type === 'box') {
            const textObj = obj._objects.find(o => o.type === 'textbox' && !o.isHierarchyNumber);
            const rectObj = obj._objects.find(o => o.type === 'rect');
            objData = {
                type: 'box', customType: obj.customType, id: obj.objectId,
                left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY, angle: obj.angle,
                text: textObj ? textObj.text : "", textColor: textObj ? textObj.fill : "#000000",
                fill: rectObj.fill, stroke: rectObj.stroke, strokeWidth: rectObj.strokeWidth,
                strokeDashArray: rectObj.strokeDashArray, hierarchyNumber: obj.hierarchyNumber,
                parentId: obj.parentId, childrenIds: obj.childrenIds || []
            };
            if (obj.customType === 'content') {
                objData.contentId = obj.contentId; objData.fullText = obj.fullText;
            } else if (obj.customType === 'trilha') {
                objData.trilhaId = obj.trilhaId;
            }
            data.diagramObjects.push(objData);

        } else if (obj.type === 'node') {
            objData = {
                type: 'node', customType: obj.customType, id: obj.objectId,
                left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY, angle: obj.angle,
            };
            data.diagramObjects.push(objData);

        } else if (obj.type === 'arrow') {
            data.arrows.push({ 
                from: obj.from, 
                to: obj.to, 
                // A propriedade arrowSubType foi REMOVIDA daqui.
                isHierarchy: obj.isHierarchy, 
                pathType: obj.pathType 
            });
        }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${diagramTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

document.getElementById("import-button").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const content = await file.text();
        const data = JSON.parse(content);

        canvas.clear();
        const diagramTitleInput = document.getElementById('diagram-title-input');
        diagramTitleInput.value = data.diagramTitle || "";

        const idToObjectMap = {};
        const objectsToLoad = data.diagramObjects || [];

        objectsToLoad.forEach(objData => {
            let newObj;
            const objectOptions = { ...objData, objectId: objData.id, hasControls: false, lockRotation: true };

            if (objData.type === 'box') {
                const rect = new fabric.Rect({
                    width: 200, height: 80,
                    fill: objData.fill, rx: 5, ry: 5,
                    originX: 'center', originY: 'center', stroke: objData.stroke,
                    strokeWidth: objData.strokeWidth, strokeDashArray: objData.strokeDashArray
                });
                
                const textColor = objData.textColor || '#000000';
                const text = new fabric.Textbox(objData.baseText || '', {
                    width: 180, fontSize: 16, textAlign: 'center',
                    fill: textColor, originX: 'center', originY: 'center'
                });
                
                newObj = new fabric.Group([rect, text], objectOptions);
            
            } else if (objData.type === 'node') {
                switch(objData.customType) {
                    case 'start': case 'end':
                        newObj = window.createStartEndNode(objectOptions); break;
                    case 'exclusive_gateway': case 'parallel_gateway': case 'inclusive_gateway':
                        newObj = window.createGatewayNode(objectOptions); break;
                }
            }
            if (newObj) {
                canvas.add(newObj);
                idToObjectMap[objData.id] = newObj;
            }
        });

        canvas.renderAll();
        canvas.getObjects().forEach(obj => obj.setCoords());

        if (data.arrows) {
            data.arrows.forEach(arrowData => {
                const startObj = idToObjectMap[arrowData.from];
                const endObj = idToObjectMap[arrowData.to];
                if (startObj && endObj) {
                    // A propriedade arrowSubType não é mais necessária aqui.
                    window.createStandardArrow(startObj, endObj, arrowData.isHierarchy, arrowData.pathType);
                }
            });
        }
        
        setTimeout(() => {
            if(window.updateAllHierarchyNumbers) window.updateAllHierarchyNumbers();
        }, 100);
    };
    input.click();
});