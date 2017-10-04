import ProjectView from '../views/ProjectView';
import { getRandom, toRadian } from '../helpers/utils';
import { loadJSON } from '../helpers/utils-three';

// THREE JS
import { MeshLambertMaterial, PointLight, SpotLight, DirectionalLight } from 'three';
import Asteroid from '../shapes/Asteroid';


// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader


export default class Levit extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind
		this.setAsteroids = this.setAsteroids.bind(this);

		this.nbAst = 10;
		this.bounceArea = 100;

		// preload Models
		Promise.all([
			loadJSON('datas/models/iceberg-1.json'),
			loadJSON('datas/models/iceberg-2.json'),
			loadJSON('datas/models/iceberg-3.json')
		]).then((results) => {
			// when all is loaded
			this.models = results;
			this.init();

		}, (err) => {
			console.log(err);
			// error here
		});

		console.log('Levit view');

	}

	setAsteroids() {

		this.asteroids = [];
		this.asteroidsM = [];

		const material = new MeshLambertMaterial({
			color: 0x343434,
		});

		// this.materialAst1.shininess = 100;

		let pos;
		let posFixed;
		// get positions from a json
		// /! nu;brer of astd needed
		posFixed = [
			{ x: -40, y: -10, z: 80 },
			{ x: -50, y: 5, z: 10 },
			{ x: -30, y: -60, z: -20 },
			{ x: -10, y: 40, z: -40 },
			{ x: -60, y: 10, z: -40 },
			{ x: 0, y: -40, z: -60 },
			{ x: 30, y: 20, z: 60 },
			{ x: 20, y: -20, z: -30 },
			{ x: 50, y: -40, z: 30 },
			{ x: 40, y: 20, z: -80 }
		];

		for (let i = 0; i < this.nbAst; i++) {

			const rot = {
				x: getRandom(150, 210),
				y: getRandom(-180, 180),
				z: getRandom(-15, 15),
			};

			pos = posFixed[i];

			// //  force impulsion
			// const force = {
			// 	x: getRandom(-10, 10),
			// 	y: getRandom(-10, 10),
			// 	z: getRandom(-10, 10)
			// };

			const scale = getRandom(1, 4);
			const speed = getRandom(0.5,0.72);
			const range = getRandom(3, 8);
			const timeRotate = getRandom(0.02, 0.04);

			const model = Math.round(getRandom(0, 2));

			const asteroid = new Asteroid({
				width: this.models[model].size.x,
				height: this.models[model].size.y,
				depth: this.models[model].size.z,
				geometry: this.models[model],
				material,
				pos,
				rot,
				// force,
				scale,
				range,
				speed,
				timeRotate
			});

			asteroid.mesh.index = i;
			asteroid.dir = Math.round(getRandom(0,1)) === 0 ? -1 : 1;
			asteroid.rotateRangeZ = getRandom(-15,15);
			asteroid.rotateRangeX = getRandom(-30,30);
			asteroid.offset = getRandom(0,10);

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);

		}
		// super.setAsteroids(this.models[0].geometry);

		console.log(this.asteroids);

	}

	setLight() {

		// let paramsLight = [
		// 	// { x: 70, y: 70, z: 0 },
		// 	{ x: 0, y: 0, z: -100, d: 160, it: 2 },
		// 	{ x: 0, y: 0, z: -100, d: 160, it: 2 },
		// 	{ x: 0, y: 0, z: 0, d: 110, it: 4 },
		// 	// { x: 0, y: 30, z: 30 },
		// 	// { x: 0, y: 30, z: -30 },
		// 	// { x: -30, y: 30, z: 0 },
		// 	// { x: 0, y: -30, z: 0 }
		// ];

		// // Check Ambient Light
		// // scene.add( new THREE.AmbientLight( 0x00020 ) );

		// for (let i = 0; i < paramsLight.length; i++) {

		// 	const d = paramsLight[i].d || 100;
		// 	const it = paramsLight[i].it || 1;

		// 	// create a point light
		// 	let pointLight = new PointLight(0x707070, it, d, 1);
		// 	// set its position
		// 	pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
		// 	// pointLight.power = 20;
		// 	pointLight.visible = true;

		// 	// add to the scene
		// 	this.scene.add(pointLight);
		// }
		let light = new DirectionalLight( 0xffffff, 1 );
		light.position.set( 0, 0, 1 );
		this.scene.add( light );
		let light2 = new DirectionalLight( 0xffffff, 1 );
		light2.position.set( 1, 0, 0 );
		this.scene.add( light2 );
		// white spotlight shining from the side, casting a shadow

		// const spotLight = new SpotLight(0xffffff);
		// spotLight.position.set(0, 0, -100);
		// spotLight.angle = toRadian(180);

		// spotLight.castShadow = false;

		// spotLight.shadow.mapSize.width = 1024;
		// spotLight.shadow.mapSize.height = 1024;

		// spotLight.shadow.camera.near = 500;
		// spotLight.shadow.camera.far = 4;
		// spotLight.shadow.camera.fov = 120;

		// this.scene.add(spotLight);

		// let directionalLight = new DirectionalLight(0xffffff, 0.7);
		// directionalLight.position.set(-1, 0, 0);
		// // directionalLight.rotation.set(toRadian(90), toRadian(90), toRadian(90));
		// // this.scene.add(directionalLight);

		// directionalLight = new DirectionalLight(0xffffff, 0.7);
		// directionalLight.position.set(0, 1, 1);
		// // directionalLight.rotation.set(toRadian(90), toRadian(90), toRadian(90));
		// this.scene.add(directionalLight);
	}

	onChangeAst() {

		this.asteroidsM[0].material.color.setHex(this.effectController.astColor);
	}

	raf() {

		// Asteroids meshs
		this.asteroids.forEach( (el)=> {

			// Move top and bottom --> Levit effect
			// Start Number + Math.sin(this.time*2*Math.PI/PERIOD)*(SCALE/2) + (SCALE/2)
			el.mesh.position.y = el.endY + Math.sin( this.clock.getElapsedTime() * el.speed + el.offset) * (el.range / 2) + el.range / 2;
			// rotate

			el.mesh.rotation.y = toRadian(el.initRotateY + Math.sin(this.clock.getElapsedTime() * el.timeRotate + el.offset) * (360 / 2) + 360 / 2 ) * el.dir;
			// el.mesh.rotation.x = toRadian(Math.sin(this.clock.getElapsedTime() * 400) * el.rotateRangeX ); // -30 to 30 deg rotation
			el.mesh.rotation.z = toRadian(el.initRotateZ + Math.sin(this.clock.getElapsedTime() * el.timeRotate + el.offset) * el.rotateRangeZ ) * el.dir; // -30 to 30 deg rotation

			// if (el.mesh.index === 0) {
			// 	console.log(Math.sin(this.clock.getElapsedTime() * 400) * el.rotateRangeZ, el.rotateRangeZ);
			// }
		});

		super.raf();
	}

}
