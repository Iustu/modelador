document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("export-button").addEventListener("click", () => {
        const data = { boxes: [], arrows: [] };
        canvas.getObjects().forEach(obj => {
            if (obj.type === 'box') {
                const textObj = obj._objects.find(o => o instanceof fabric.Textbox);
                data.boxes.push({ id: obj.objectId, left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY, angle: obj.angle, text: textObj ? textObj.text : "", fill: obj._objects[0] ? obj._objects[0].fill : 'grey' });
            } else if (obj.type === 'arrow') {
                data.arrows.push({ from: obj.from, to: obj.to, arrowSubType: obj.arrowSubType || 'standard' });
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
                const rect = new fabric.Rect({ width: 140, height: 60, fill: boxData.fill, rx: 5, ry: 5 });
                const text = new fabric.Textbox(boxData.text, { width: 120, fontSize: 16, textAlign: 'center', fill: '#000', originX: 'center', originY: 'center', left: 70, top: 30 });
                const group = new fabric.Group([rect, text], { left: boxData.left, top: boxData.top, scaleX: boxData.scaleX, scaleY: boxData.scaleY, angle: boxData.angle, objectId: boxData.id, type: 'box', hasControls: true, selectable: true });
                canvas.add(group);
                idToObjectMap[boxData.id] = group;
            });
            data.arrows.forEach(arrowData => {
                const startObj = idToObjectMap[arrowData.from];
                const endObj = idToObjectMap[arrowData.to];
                if (!startObj || !endObj) return;
                if (arrowData.arrowSubType === 'selfLoop') {
                    createSelfLoopArrow(startObj);
                } else {
                    createStandardArrow(startObj, endObj);
                }
            });
            canvas.requestRenderAll();
        };
        input.click();
    });
});