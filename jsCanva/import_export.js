document.getElementById("export-button").addEventListener("click", () => {
    const data = { diagramObjects: [], arrows: [] };

    canvas.getObjects().forEach(obj => {
        let objData = {};

        if (obj.type === 'box') {
            const textObj = obj._objects.find(o => o.type === 'textbox' && !o.isHierarchyNumber);
            objData = {
                type: 'box',
                customType: obj.customType,
                id: obj.objectId,
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                angle: obj.angle,
                text: textObj ? textObj.text : "",
                textColor: textObj ? textObj.fill : "#000000", // Salva a cor do texto
                fill: obj._objects[0].fill,
                hierarchyNumber: obj.hierarchyNumber
            };
            if (obj.customType === 'subject') {
                objData.childrenIds = obj.childrenIds;
            } else if (obj.customType === 'content') {
                objData.parentId = obj.parentId;
                objData.contentId = obj.contentId;
                objData.fullText = obj.fullText;
            } else if (obj.customType === 'trilha') {
                objData.trilhaId = obj.trilhaId;
            }
            data.diagramObjects.push(objData);

        } else if (obj.type === 'node') {
            objData = {
                type: 'node',
                customType: obj.customType,
                id: obj.objectId,
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                angle: obj.angle,
            };
            data.diagramObjects.push(objData);

        } else if (obj.type === 'arrow') {
            data.arrows.push({ from: obj.from, to: obj.to, arrowSubType: obj.arrowSubType, tipo: obj.tipo });
        }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "diagrama.json";
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
        const idToObjectMap = {};

        const objectsToLoad = data.diagramObjects || data.boxes || [];

        objectsToLoad.forEach(objData => {
            let newObj;
            const objectOptions = { ...objData, objectId: objData.id };

            if (objData.type === 'box') {
                const rectWidth = 140;
                const rectHeight = 60;
                const rect = new fabric.Rect({
                    width: rectWidth, height: rectHeight, fill: objData.fill, rx: 5, ry: 5,
                    originX: 'center', originY: 'center'
                });
                
                // Usa a cor do texto salva no JSON, com um fallback para preto por segurança.
                const textColor = objData.textColor || '#000000';
                const text = new fabric.Textbox(objData.text, {
                    width: 120, fontSize: 16, textAlign: 'center',
                    fill: textColor, originX: 'center', originY: 'center'
                });

                const numberText = new fabric.Text(objData.hierarchyNumber || '', {
                    fontSize: 14, fontWeight: 'bold', fill: 'rgba(0,0,0,0.4)',
                    isHierarchyNumber: true, originX: 'left', originY: 'top',
                    left: -(rectWidth / 2) + 5, top: -(rectHeight / 2) + 5
                });
                
                newObj = new fabric.Group([rect, text, numberText], objectOptions);
            
            } else if (objData.type === 'node') {
                const nodeOptions = { ...objectOptions, originX: 'center', originY: 'center' };
                if (objData.customType === 'start') {
                    newObj = new fabric.Circle({ ...nodeOptions, radius: 15, fill: 'black' });
                } else { // 'end'
                    const innerCircle = new fabric.Circle({ radius: 12, fill: 'black', originX: 'center', originY: 'center' });
                    const outerCircle = new fabric.Circle({ radius: 18, fill: 'transparent', stroke: 'black', strokeWidth: 2, strokeDashArray: [5, 3], originX: 'center', originY: 'center' });
                    newObj = new fabric.Group([outerCircle, innerCircle], nodeOptions);
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
                    window.createStandardArrow(startObj, endObj, arrowData.tipo);
                }
            });
        }
        
        setTimeout(() => {
            canvas.getObjects().filter(o => o.customType === 'subject').forEach(s => {
                if(window.rebuildChildrenList) window.rebuildChildrenList(s);
            });
            if(window.updateAllHierarchyNumbers) window.updateAllHierarchyNumbers();
        }, 100);
    };
    input.click();
});