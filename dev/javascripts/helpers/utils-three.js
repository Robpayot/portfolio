import { Mesh, MeshBasicMaterial, Box3, JSONLoader } from 'three';

export function loadJSON(source) {

	const loader = new JSONLoader();

	return new Promise((resolve, reject) => {
		loader.load(source, (geometry) => {

			const model = geometry;

			geometry.computeVertexNormals();
			geometry.computeFaceNormals();

			const mesh = new Mesh( model, new MeshBasicMaterial());
			const box = new Box3().setFromObject( mesh );
			model.size = box.getSize();

			resolve(model);
		});
	});
}
