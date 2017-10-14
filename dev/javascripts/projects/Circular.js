import ProjectView from '../views/ProjectView';
import PreloadManager from '../managers/PreloadManager';
import { getRandom, toRadian, clamp, round, toDegree } from '../helpers/utils';
import { loadJSON } from '../helpers/utils-three';
import Asteroid from '../shapes/Asteroid';

// THREE JS
import { Mesh, Group, PlaneGeometry, DirectionalLight, MeshLambertMaterial, PointLight, Object3D } from 'three';

// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader


export default class Circular extends ProjectView {

	constructor(obj) {

		super(obj);

		this.nbAst = 25;
		this.color1 = 0xEF2178;
		this.color2 = 0x8F28EF;
		this.color3 = 0x4e4e4e;

		this.init();


		console.log('Blob view');

	}

	setAsteroids() {


		this.asteroids = [];
		this.asteroidsM = [];
		this.materials = [
			new MeshLambertMaterial({color: this.color1}),
			new MeshLambertMaterial({color: this.color2}),
			new MeshLambertMaterial({color: this.color3})
		];

		this.groupAst = new Group();

		for (let i = 0; i < this.nbAst; i++) {

			const asteroid = new Group();
			const width = getRandom(3, 4);
			const height = getRandom(6, 12);
			const radius = getRandom(80, 160);
			const pivotY = 20;
			const coefRot = getRandom(3,4);
			const initRot = getRandom(toRadian(0), toRadian(360));


			const nbPalm = getRandom(2, 5);

			const geometry = new PlaneGeometry(width,height);

			// const material = this.materials[Math.round(getRandom(0, this.materials.length - 1))];
			const material = this.materials[i % 3]; // every 3 times


			for (let i = 0; i < nbPalm; i++) {

				const palm = new Mesh(geometry, material);

				palm.position.x = 0;
				palm.position.y = radius - pivotY;

				// create point
				// const geometryp = new Geometry();
				// geometryp.vertices.push(
				// 	new Vector3( 0, 0, 0 )
				// );

				// const pivotPalm = new Points(geometryp, material);
				const pivotPalm = new Object3D();
				pivotPalm.position.y = -pivotY;

				// Pivot each palms
				if (nbPalm % 2 === 0) {

					if (i <= nbPalm / 2 - 1) {
						let rot = nbPalm / 2 - i;
						pivotPalm.rotation.z = toRadian(rot * coefRot) + toRadian(coefRot * (rot - 1));
					}

					if (i > nbPalm / 2 - 1) {
						let rot = i - (nbPalm / 2 - 1);
						pivotPalm.rotation.z = toRadian(-rot * coefRot) + toRadian(-coefRot * (rot - 1));
					}
				} else {

					if (i < nbPalm / 2 - 0.5) {
						let rot = nbPalm / 2 - i;
						pivotPalm.rotation.z = toRadian(rot * coefRot) + toRadian(coefRot * (rot - 1));
					}

					if (i > nbPalm / 2 - 0.5) {
						let rot = i - (nbPalm / 2 - 1);
						pivotPalm.rotation.z = toRadian(-rot * coefRot) + toRadian(-coefRot * (rot - 1));
					}
				}

				pivotPalm.add(palm);

				asteroid.add(pivotPalm);
				// this.pivotPalm.push(pivotPalm);

			}

			asteroid.dir = Math.round(getRandom(0,1)) === 0 ? -1 : 1;
			asteroid.speed = getRandom(5,35);
			asteroid.position.z = getRandom(-160,10);
			asteroid.rotation.z = asteroid.initRot = initRot;

			this.asteroidsM.push(asteroid);

			this.groupAst.add(asteroid);

		}

		this.scene.add(this.groupAst);

	}

	setLight() {

		// this.envelop.visible = false;

		let paramsLight = [
			// { x: 70, y: 70, z: 0 },
			// { x: -100, y: 0, z: 0 },
			// { x: 100, y: 0, z: 0 },
			// { x: 0, y: 0, z: 170 },
			// { x: 0, y: -0, z: 0 },
			// { x: 0, y: 20, z: -100, l: 480 },
		];

		// Check Ambient Light
		// scene.add( new THREE.AmbientLight( 0x00020 ) );

		for (let i = 0; i < paramsLight.length; i++) {

			const l = paramsLight[i].l || 480;

			// create a point light
			let pointLight = new PointLight(0xFFFFFF, 0.8, l, 2);
			// set its position
			pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
			// pointLight.power = 20;
			pointLight.visible = true;

			// add to the scene
			this.scene.add(pointLight);
		}
		let light = new DirectionalLight( 0xffffff, 1 );
		light.position.set( 0, 0, 1 );
		this.scene.add( light );
		// let light2 = new DirectionalLight( 0xffffff, 1 );
		// light2.position.set( 1, 0, 0 );
		// this.scene.add( light2 );
	}

	raf() {

		// Asteroids meshs
		this.asteroidsM.forEach( (el)=> {

			el.rotation.z = el.initRot + toRadian(this.clock.getElapsedTime() * el.speed * el.dir);
			// el.position.x = -this.camRotSmooth.y * 400;

		});

		// console.log(this.camRotSmooth.y);

		this.groupAst.rotation.y = toRadian(this.camRotSmooth.y * 50);
		this.groupAst.rotation.x = toRadian(this.camRotSmooth.x * 50);

		// this.groupAst.rotateOnAxis(new Vector3(0,1,0),toRadian(this.camRotSmooth.y * 1));

		super.raf();

	}

}
