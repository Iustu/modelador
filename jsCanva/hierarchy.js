window.updateAllHierarchyNumbers = function() {
    const objects = canvas.getObjects();
    const boxes = objects.filter(o => o.type === 'box');
    const subjects = boxes.filter(b => b.customType === 'subject');

    boxes.forEach(box => {
        updateBoxNumber(box, '');
    });

    subjects.sort((a, b) => a.top - b.top);

    subjects.forEach((subject, subjectIndex) => {
        const subjectNumber = subjectIndex + 1;
        updateBoxNumber(subject, `${subjectNumber}`);

        if (subject.childrenIds && subject.childrenIds.length > 0) {
            const childrenObjects = subject.childrenIds
                .map(id => boxes.find(o => o.objectId === id))
                .filter(Boolean)
                .sort((a, b) => a.top - b.top);
            
            childrenObjects.forEach((contentBox, contentIndex) => {
                const contentNumber = `${subjectNumber}.${contentIndex + 1}`;
                updateBoxNumber(contentBox, contentNumber);
            });
        }
    });

    canvas.renderAll();
};

function updateBoxNumber(box, number) {
    box.hierarchyNumber = number;
    const numberTextObj = box._objects.find(o => o.isHierarchyNumber);
    if (numberTextObj) {
        numberTextObj.set('text', number);
    }
}