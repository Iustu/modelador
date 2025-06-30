document.getElementById("export-button").addEventListener("click", () => {
    const data = { boxes: [], arrows: [] };
    canvas.getObjects().forEach(obj => {
        if (obj.type === 'box') {
            const textObj = obj._objects.find(o => o.type === 'textbox' && !o.isHierarchyNumber);
            const boxData = {
                id: obj.objectId, left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY,
                angle: obj.angle, text: textObj ? textObj.text : "", fill: obj._objects[0].fill,
                customType: obj.customType,
                hierarchyNumber: obj.hierarchyNumber
            };
            if (obj.customType === 'subject') {
                boxData.childrenIds = obj.childrenIds;
            } else {
                boxData.parentId = obj.parentId;
                boxData.contentId = obj.contentId;
                boxData.fullText = obj.fullText;
            }
            data.boxes.push(boxData);
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

        data.boxes.forEach(boxData => {
            const rectWidth = 140;
            const rectHeight = 60;

            const rect = new fabric.Rect({
                width: rectWidth, height: rectHeight,
                fill: boxData.fill, rx: 5, ry: 5,
                originX: 'center', originY: 'center'
            });

            const text = new fabric.Textbox(boxData.text, {
                width: 120, fontSize: 16, textAlign: 'center',
                fill: '#000', originX: 'center', originY: 'center'
            });

            const numberText = new fabric.Text(boxData.hierarchyNumber || '', {
                fontSize: 14, fontWeight: 'bold',
                fill: 'rgba(0,0,0,0.4)',
                isHierarchyNumber: true,
                originX: 'left', originY: 'top',
                left: -(rectWidth / 2) + 5,
                top: -(rectHeight / 2) + 5
            });

            const groupOptions = {
                left: boxData.left, top: boxData.top, scaleX: boxData.scaleX, scaleY: boxData.scaleY,
                angle: boxData.angle, objectId: boxData.id, type: 'box', hasControls: true, selectable: true,
                cornerStyle: 'circle',
                customType: boxData.customType, hierarchyNumber: boxData.hierarchyNumber
            };

            if (boxData.customType === 'subject') {
                groupOptions.childrenIds = boxData.childrenIds || [];
            } else {
                groupOptions.parentId = boxData.parentId || null;
                groupOptions.contentId = boxData.contentId;
                groupOptions.fullText = boxData.fullText;
            }
            
            const group = new fabric.Group([rect, text, numberText], groupOptions);
            canvas.add(group);
            idToObjectMap[boxData.id] = group;
        });

        data.arrows.forEach(arrowData => {
            const startObj = idToObjectMap[arrowData.from];
            const endObj = idToObjectMap[arrowData.to];
            if (!startObj || !endObj) return;
            if (arrowData.arrowSubType === 'selfLoop') { window.createSelfLoopArrow(startObj, arrowData.tipo); } 
            else { window.createStandardArrow(startObj, endObj, arrowData.tipo); }
        });
        
        // Recalcula tudo após importar para garantir consistência
        setTimeout(() => {
            canvas.getObjects().filter(o => o.type === 'box' && o.customType === 'subject').forEach(s => {
                if(window.rebuildChildrenList) window.rebuildChildrenList(s);
            });
            if(window.updateAllHierarchyNumbers) window.updateAllHierarchyNumbers();
        }, 100);
    };
    input.click();
});