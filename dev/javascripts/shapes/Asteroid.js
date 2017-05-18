import AbstractShape from './AbstractShape';
// import { SphereGeometry, MeshLambertMaterial } from 'three';
import { getRandom, toRadian } from '../helpers/utils';

export default class Asteroid extends AbstractShape {

    constructor(geometry, material, pos, force) {

        super();

        this.annilled = false;

        this.createMesh(geometry, material);

        // Position mesh
        this.mesh.position.copy(pos);

        // physic body
        this.physics = {
                type: 'sphere', // type of shape : sphere, box, cylinder 
                size: [geometry.parameters.radius, geometry.parameters.radius, geometry.parameters.radius], // size of shape
                pos: [pos.x, pos.y, pos.z], // start position in degree
                rot: [0, 0, 0], // start rotation in degree
                move: true, // dynamic or statique
                density: 1,
                friction: 0.2,
                restitution: 0.2,
                belongsTo: 1, // The bits of the collision groups to which the shape belongs.
                collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
            }
            // Impulse force
        this.force = force;

        this.initForce = force;

    }

    changeDirection() {
        // reverse direction
        console.log('change direction');
        this.force.x = this.initForce.x = -this.initForce.x;
        this.force.y = this.initForce.y = -this.initForce.y;
        this.force.z = this.initForce.z = -this.initForce.z;

    }

}
