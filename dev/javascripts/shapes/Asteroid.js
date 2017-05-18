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
        this.force.x = this.initForce.x = -this.initForce.x;
        this.force.y = this.initForce.y = -this.initForce.y;
        this.force.z = this.initForce.z = -this.initForce.z;

        // random x / y coef to have diff direction
        this.force.x += 1;
        this.force.y += 1;


        // Slow down force
        if (this.force.z < -10) {
            this.force.z += 10;
            this.initForce.z = this.force.z;
        }

        if (this.force.z > 10) {
            this.force.z -= 10;
            this.initForce.z = this.force.z;
        }
        setTimeout(() => {
            this.annilled = false;
        }, 2000);
    }

    impulse() {
        this.initForce.x = this.force.x;
        this.initForce.y = this.force.y = -Math.abs(-this.force.y);
        this.initForce.z = this.force.z = -70;
    }

}
