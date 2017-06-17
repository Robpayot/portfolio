import AbstractShape from './AbstractShape';
import { toDegree } from '../helpers/utils';
// import { SphereGeometry, MeshLambertMaterial } from 'three';

export default class Envelop extends AbstractShape {

	constructor(geometry, material, pos, rot) {

		super();

		this.createMesh(geometry, material);

		this.mesh.position.copy(pos);
		this.mesh.rotation.x = rot.x;
		this.mesh.rotation.y = rot.y;
		this.mesh.rotation.z = rot.z;

		// physic body
		this.mesh.physics = {
			type: 'box', // type of shape : sphere, box, cylinder
			size: [geometry.parameters.width, geometry.parameters.height, geometry.parameters.depth], // size of shape
			pos: [pos.x, pos.y, pos.z], // start position in degree
			rot: [toDegree(rot.x), toDegree(rot.y), toDegree(rot.z)], // start rotation in degree
			move: false, // dynamic or statique
			density: 1,
			friction: 0.2,
			restitution: 0.2,
			belongsTo: 1, // The bits of the collision groups to which the shape belongs.
			collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
		};


		return this.mesh;

	}
}
