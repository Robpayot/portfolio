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


        setInterval(() => {
            console.log('change force !!!');

            this.force.x = getRandom(-10,10);
            this.force.y = getRandom(-10,10);
            this.force.z = getRandom(-10,10);

        }, 500);

    }

    changeDirection() {

        // console.log(this.mesh);

        console.log('changeDirection');


        // this.body.move = false;


        // this.mesh.position.x = 50;
        // this.mesh.position.y = 50;
        // this.mesh.position.z = 50;

        // this.force.x = -this.initForce.x;
        // this.force.y = -this.initForce.y;
        // this.force.z = -this.initForce.z;


        // this.force.x = -20;
        // this.force.y = -20;
        // this.force.z = -20;

        // reticleExclude("shapeName");




        // this.body.setPosition({ x: 50, y: 50, z: 50 });

        // this.body.linearVelocity.x = 100;
        // this.body.linearVelocity.y = 100;
        // this.body.linearVelocity.z = 100;

        // console.log(this.body);

        // console.log(this.mesh.position.x);

        // this.mesh.position.copy(this.body.getPosition());

        // this.body.applyImpulse({ x: 50, y: 50, z: 50 }, this.force);

        // this.body.move = true;

        // this.annilled = true;

        // setTimeout(() => {
        // 	 console.log(this.mesh.position.x);
        //     // this.mesh.position.x = 50;
        //     // this.mesh.position.y = 50;
        //     // this.mesh.position.z = 50;

        //     // this.body.pos.x = 50;
        //     // this.body.pos.y = 50;
        //     // this.body.pos.z = 50;

        //     // this.force.x = 10;
        //     // this.force.y = 0;
        //     // this.force.z = 0;
        //     this.annilled = false;
        // }, 2000);




    }

}
