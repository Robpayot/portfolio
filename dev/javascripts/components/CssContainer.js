import { CSS3DObject } from '../vendors/CSS3DRenderer';

export default class CssContainer {

    constructor(template, scene, tab) {

        const div = document.createElement('div');
        div.classList.add('css-container');
        div.innerHTML = template;

        const object = new CSS3DObject(div);

        scene.add(object);
        tab.push(object);

        return object;

    }
}
