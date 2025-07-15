window.createStartEndNode = function(options) {
    let node;
    const commonOptions = {
        left: options.left || options.coords.x,
        top: options.top || options.coords.y,
        originX: 'center',
        originY: 'center',
        selectable: true,
        hasControls: false,
        objectId: options.objectId || generateId(),
    };

    if ((options.customType || options.type) === 'start') {
        // CORREÇÃO: O nó de Início agora também é um Grupo para garantir consistência.
        const circle = new fabric.Circle({ radius: 15, fill: 'black', originX: 'center', originY: 'center' });
        node = new fabric.Group([circle], { ...commonOptions, customType: 'start', type: 'node' });
    } else { // 'end'
        const innerCircle = new fabric.Circle({ radius: 12, fill: 'black', originX: 'center', originY: 'center' });
        const outerCircle = new fabric.Circle({ radius: 18, fill: 'transparent', stroke: 'black', strokeWidth: 2, strokeDashArray: [5, 3], originX: 'center', originY: 'center' });
        node = new fabric.Group([outerCircle, innerCircle], { ...commonOptions, customType: 'end', type: 'node' });
    }
    return node;
}


/**
 * Cria um gateway (losango) de paralelismo.
 * @param {object} options - As opções para o gateway, incluindo coordenadas e tipo.
 * @returns {fabric.Group} O grupo de objetos Fabric.js que representa o gateway.
 */
window.createGatewayNode = function(options) {
    const size = 40;
    const diamond = new fabric.Rect({
        width: size,
        height: size,
        angle: 45,
        fill: '#f9f9f9',
        stroke: 'black',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
    });

    const elements = [diamond];
    let customType = '';

    switch (options.customType || options.type) {
        case 'exclusive_gateway':
            customType = 'exclusive_gateway';
            elements.push(new fabric.Path('M -10 -10 L 10 10 M 10 -10 L -10 10', {
                stroke: 'black', strokeWidth: 3, originX: 'center', originY: 'center'
            }));
            break;
        case 'parallel_gateway':
            customType = 'parallel_gateway';
            elements.push(new fabric.Path('M 0 -10 L 0 10 M -10 0 L 10 0', {
                stroke: 'black', strokeWidth: 3, originX: 'center', originY: 'center'
            }));
            break;
        case 'inclusive_gateway':
            customType = 'inclusive_gateway';
            elements.push(new fabric.Circle({
                radius: 8, fill: 'transparent', stroke: 'black',
                strokeWidth: 2, originX: 'center', originY: 'center'
            }));
            break;
    }

    const commonOptions = {
        left: options.left || options.coords.x,
        top: options.top || options.coords.y,
        originX: 'center', originY: 'center', selectable: true,
        hasControls: false, objectId: options.objectId || generateId(),
        customType: customType, type: 'node'
    };

    return new fabric.Group(elements, commonOptions);
}