import AbstractShape from './AbstractShape';
// import { toDegree } from '../helpers/utils';
// import { SphereGeometry, MeshLambertMaterial } from 'three';

export default class Envelop extends AbstractShape {

	constructor(geometry, material, pos, rot) {

		super();

		this.createMesh(geometry, material);

		this.mesh.position.copy(pos);
		this.mesh.rotation.x = rot.x;
		this.mesh.rotation.y = rot.y;
		this.mesh.rotation.z = rot.z;


		return this.mesh;

	}
}
