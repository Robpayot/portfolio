import AbstractShape from './AbstractShape';
import { SphereGeometry, MeshLambertMaterial } from 'three';

export default class Symbol extends AbstractShape {

    constructor(geometry, material, pos) {

        super();

        this.createMesh(geometry, material);
        
        this.mesh.position.copy(pos);

        // physic body
        this.mesh.physics = {
            type: 'sphere', // type of shape : sphere, box, cylinder 
            size: [geometry.parameters.radius, geometry.parameters.radius, geometry.parameters.radius], // size of shape
            pos: [pos.x, pos.y, pos.z], // start position in degree
            rot: [0, 0, 0], // start rotation in degree
            move: false, // dynamic or statique
            density: 1,
            friction: 0.2,
            restitution: 0.2,
            belongsTo: 1, // The bits of the collision groups to which the shape belongs.
            collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        }


        return this.mesh;

    }
}
