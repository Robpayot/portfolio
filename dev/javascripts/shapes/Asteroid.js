import AbstractShape from './AbstractShape';
import { Vector3 } from 'three';
import { getRandom, toRadian } from '../helpers/utils';

export default class Asteroid extends AbstractShape {

	constructor(geometry, material, pos, rot, force, scale = 1, range, speed, speedRotate) {

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
			rot: [rot.x, rot.y, rot.z], // start rotation in degree
			move: true, // dynamic or statique
			density: 1,
			friction: 0.2,
			restitution: 0.2,
			belongsTo: 1, // The bits of the collision groups to which the shape belongs.
			collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
		}

		// for normal asts
		this.mesh.rotation.set(toRadian(rot.x), toRadian(rot.y), toRadian(rot.z));
		this.mesh.scale.set(scale, scale, scale);

		// Impulse force
		this.force = force;
		this.initForce = force;
		this.speed = speed;
		this.range = range;
		this.endY = pos.y - range / 2;
		this.initRotateY = rot.y;
		this.speedRotate = speedRotate;

	}

	changeDirection() {
		// reverse direction
		this.force.x = this.initForce.x = -this.initForce.x;
		this.force.y = this.initForce.y = -this.initForce.y;
		this.force.z = this.initForce.z = -this.initForce.z;

		// random x / y coef to have diff direction
		this.force.x += getRandom(-1, 1);
		this.force.y += getRandom(-1, 1);


		// Slow down force
		if (this.force.z < -10) {
			this.force.z += 60;
			this.initForce.z = this.force.z;
		}

		if (this.force.z > 10) {
			this.force.z -= 60;
			this.initForce.z = this.force.z;
		}
		// console.log(this.force.z);
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
