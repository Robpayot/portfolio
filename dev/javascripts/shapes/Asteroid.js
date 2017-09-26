import AbstractShape from './AbstractShape';
// import { Vector3 } from 'three';
import { getRandom, toRadian } from '../helpers/utils';

export default class Asteroid extends AbstractShape {

	constructor(obj = {}) {

		super();

		obj.type = obj.type || 'box';
		obj.scale = obj.scale || 1;
		obj.offsetScale = obj.offsetScale || 0;
		obj.rot = obj.rot || { x: 0, y: 0, z: 0 };
		obj.width = obj.geometry.parameters !== undefined ? obj.geometry.parameters.width : obj.width;
		obj.height = obj.geometry.parameters !== undefined ? obj.geometry.parameters.height : obj.height;
		obj.depth = obj.geometry.parameters !== undefined ? obj.geometry.parameters.depth : obj.depth;
		this.annilled = false;

		this.createMesh(obj.geometry, obj.material);

		// Position mesh
		this.mesh.position.copy(obj.pos);

		// physic body
		this.physics = {
			type: obj.type, // type of shape : sphere, box, cylinder
			// size: [geometry.parameters.radius, geometry.parameters.radius, geometry.parameters.radius], // size of shape
			size: [obj.width * obj.scale + obj.offsetScale, obj.height * obj.scale + obj.offsetScale, obj.depth * obj.scale + obj.offsetScale],
			pos: [obj.pos.x, obj.pos.y, obj.pos.z], // start position in degree
			rot: [obj.rot.x, obj.rot.y, obj.rot.z], // start rotation in degree
			move: true, // dynamic or statique
			density: 1,
			friction: 0.2,
			restitution: 0.2,
			belongsTo: 1, // The bits of the collision groups to which the shape belongs.
			collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
		};

		// for normal asts
		this.mesh.rotation.set(toRadian(obj.rot.x), toRadian(obj.rot.y), toRadian(obj.rot.z));
		this.mesh.scale.set(obj.scale, obj.scale, obj.scale);

		// Impulse force
		this.force = this.initForce = obj.force;
		this.speed = obj.speed;
		this.range = obj.range;
		this.endY = obj.pos.y - obj.range / 2;
		this.initRotateY = obj.rot.y;
		this.initRotateZ = obj.rot.z;
		this.timeRotate = obj.timeRotate;
		this.height = obj.height;
		this.scale = obj.scale;

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
