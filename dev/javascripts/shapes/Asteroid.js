import AbstractShape from './AbstractShape';
// import { Vector3 } from 'three';
import { getRandom, toRadian } from '../helpers/utils';
import p2 from 'p2';

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



		if (obj.physics) { // Only use for Intro Ast
			// physic body
			// Add a Shape
			let shape;

			switch (obj.type) {
				case 'box':
					shape = new p2.Box({ width: obj.width, height: obj.height});
					break;
				case 'circle':
					shape = new p2.Circle({ radius: obj.width });
					break;
			}

			// Add a physic Body
			this.body = new p2.Body({
				mass: obj.mass || 180, // mass 0 = static
				position: [obj.pos.x, obj.pos.z],
				angle: toRadian(obj.rot.y)
			});
			this.body.addShape(shape);

			// copy positions and rotation
			this.mesh.position.x = this.body.position[0];
			this.mesh.position.z = -this.body.position[1];
			this.mesh.rotation.y = this.body.angle;

		} else {
			// Position mesh
			this.mesh.position.copy(obj.pos);
			// for normal asts
			this.mesh.rotation.set(toRadian(obj.rot.x), toRadian(obj.rot.y), toRadian(obj.rot.z));
			this.mesh.scale.set(obj.scale, obj.scale, obj.scale);
		}

		// Impulse force --> deprecated
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

}
