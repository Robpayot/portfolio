import { Object3D, Mesh } from 'three';

export default class AbstractShape {

    constructor() {

        this.container = new Object3D();

    }

    createMesh(geometry, material) {

        this.mesh = new Mesh(geometry, material);
    }

    isHover() {

    	return this.hover;
    }

}
