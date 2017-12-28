import ProjectView from '../views/ProjectView';
import { getRandom, toRadian } from '../helpers/utils';
import { Device } from '../helpers/Device';

// THREE JS
import { MeshPhongMaterial, DirectionalLight } from 'three';
import Asteroid from '../shapes/Asteroid';



export default class Levit extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind
		this.setAsteroids = this.setAsteroids.bind(this);

		this.nbAst = 10;
		this.toggle = 0;

		this.models = global.MODELS;
		super.startScene();

		// console.log('Levit view');

	}

	setAsteroids() {

		this.asteroids = [];
		this.asteroidsM = [];

		const material = new MeshPhongMaterial({
			color: 0x343434,
			flatShading: true
		});

		// this.materialAst1.shininess = 100;

		let pos;
		let posFixed;
		// get positions from a json
		// /! nu;brer of astd needed
		posFixed = [
			{ x: -50, y: -10, z: 80 },
			{ x: -50, y: 5, z: 10 },
			{ x: -30, y: -60, z: -20 },
			{ x: -10, y: 40, z: -40 },
			{ x: -60, y: 50, z: -40 },
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

			const scale = getRandom(0.018, 0.035);
			const speed = getRandom(0.5,0.72);
			const range = getRandom(3, 8);
			const timeRotate = getRandom(0.0013, 0.0016);

			const model = Math.round(getRandom(2, 4));

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
			asteroid.velocity = 0;

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);

		}


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

		// // Test Ambient Light
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

		let light = new DirectionalLight( 0x125714, 2 );
		light.position.set( 0, 0, 1 );
		this.scene.add( light );

	}

	onChangeAst() {

		this.asteroidsM[0].material.color.setHex(this.effectController.astColor);
	}

	raf() {


		if (Device.touch === false) {
			this.raycaster.setFromCamera(this.mouse, this.camera);

			const intersectsAst = this.raycaster.intersectObjects(this.asteroidsM);
			this.intersection = intersectsAst.length > 0 ? intersectsAst[ 0 ] : null;

			if ( this.toggle > 0.02 && this.intersection !== null) {
				document.body.style.cursor = 'pointer';
				this.hoverAst = true;
				this.currentHoverAst = this.asteroids[intersectsAst[0].object.index];
				const el = this.asteroids[intersectsAst[0].object.index];
				el.active = true;

			} else {
				this.hoverAst = false;
				for (let i = 0; i < this.nbAst; i++) {
					this.asteroids[i].active = false;
				}
			}
		}


		this.toggle += this.clock.getDelta();

		// Asteroids meshs
		for (let i = 0; i < this.nbAst; i++) {

			if (this.asteroids[i].active === true) {

				this.asteroids[i].velocity += 0.01;
				this.asteroids[i].velocity = Math.min(0.04, this.asteroids[i].velocity);
				this.asteroids[i].mesh.rotation.y += (this.asteroids[i].timeRotate + this.asteroids[i].velocity) * this.asteroids[i].dir ;

			} else {
				if (this.asteroids[i].velocity !== 0) {
					this.asteroids[i].velocity -= 0.0004;
					this.asteroids[i].velocity = Math.max(0, this.asteroids[i].velocity);
				}

				this.asteroids[i].mesh.rotation.y += (this.asteroids[i].timeRotate + this.asteroids[i].velocity) * this.asteroids[i].dir;

			}
			// Move top and bottom --> Levit effect
			// Start Number + Math.sin(this.time*2*Math.PI/PERIOD)*(SCALE/2) + (SCALE/2)
			this.asteroids[i].mesh.position.y = this.asteroids[i].endY + Math.sin( this.clock.getElapsedTime() * this.asteroids[i].speed + this.asteroids[i].offset) * (this.asteroids[i].range / 2) + this.asteroids[i].range / 2;
			this.asteroids[i].mesh.rotation.z = toRadian(this.asteroids[i].initRotateZ + Math.sin(this.clock.getElapsedTime() * this.asteroids[i].timeRotate + this.asteroids[i].offset) * this.asteroids[i].rotateRangeZ ) * this.asteroids[i].dir; // -30 to 30 deg rotation
		}

		super.raf();
	}

}
