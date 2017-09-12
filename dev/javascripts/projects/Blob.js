import ProjectView from '../views/ProjectView';
import PreloadManager from '../managers/PreloadManager';
import { getRandom, toRadian, clamp, round } from '../helpers/utils';
import { loadJSON } from '../helpers/utils-three';
import Asteroid from '../shapes/Asteroid';

// THREE JS
import { ShaderMaterial, RGBFormat, LinearFilter, WebGLRenderTarget, Raycaster, PerspectiveCamera, Scene, Mesh, Texture, TorusGeometry, PlaneGeometry, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial, MeshPhongMaterial, Vector3, BoxGeometry, Object3D } from 'three';
import EffectComposer, { RenderPass, ShaderPass } from 'three-effectcomposer-es6';
import OrbitControls from '../vendors/OrbitControls';
import { CameraDolly } from '../vendors/three-camera-dolly-custom';
import { BrightnessShader } from '../shaders/BrightnessShader'; // VerticalTiltShiftShader shader


// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader


export default class Blob extends ProjectView {

	constructor(obj) {

		super(obj);

		this.init();


		console.log('Blob view');

	}

	setAsteroids() {


		const props = {
			RADIUS: 5,
			SEGMENTS: 32,
			RINGS: 32,
			geometry: null,
			glow: this.glow
		};

		this.asteroids = [];
		this.asteroidsM = [];

		const geometry = new SphereGeometry(props.RADIUS, props.SEGMENTS, props.RINGS);

		// const material = new MeshLambertMaterial({ color: 0x4682b4 });
		const img = PreloadManager.getResult('texture-asteroid');

		const tex = new Texture(img);
		tex.needsUpdate = true;

		this.brightness = new BrightnessShader();

		this.brightness2 = new BrightnessShader();

		this.brightness.uniforms.tInput.value = tex;
		this.brightness2.uniforms.tInput.value = tex;


		this.materialAst1 = new ShaderMaterial({
			uniforms: this.brightness.uniforms,
			vertexShader: this.brightness.vertexShader,
			fragmentShader: this.brightness.fragmentShader,
			transparent: true,
			opacity: 0.5
		});

		this.materialAst2 = new ShaderMaterial({
			uniforms: this.brightness2.uniforms,
			vertexShader: this.brightness2.vertexShader,
			fragmentShader: this.brightness2.fragmentShader,
			transparent: true,
			opacity: 0.5
		});

		let pos;

		for (let i = 0; i < this.nbAst; i++) {

			const rot = {
				x: getRandom(-180, 180),
				y: getRandom(-180, 180),
				z: getRandom(-180, 180),
			};
			// Intra perimeter radius
			const ipRadius = 50;

			pos = {
				x: getRandom(-80, 80),
				y: getRandom(-80, 80),
				z: getRandom(-80, 80),
			};

			if (pos.x < ipRadius && pos.x > -ipRadius && pos.y < ipRadius && pos.y > -ipRadius && pos.z < ipRadius && pos.z > -ipRadius) {
				console.log(i, ' dans le périmetre !');
				pos.x += ipRadius;
				pos.y += ipRadius;
				pos.z += ipRadius;

			}

			//  force impulsion
			const force = {
				x: getRandom(-10, 10),
				y: getRandom(-10, 10),
				z: getRandom(-10, 10)
			};

			const scale = this.astd === 'spheres' ? 1 : getRandom(1, 4);
			const speed = getRandom(500, 800); // more is slower
			const range = getRandom(3, 8);
			const timeRotate = getRandom(15000, 17000);

			let finalMat;

			if (i % 2 === 0) {
				finalMat = this.materialAst1;
			} else {
				finalMat = this.materialAst2;
			}

			const asteroid = new Asteroid({
				geometry,
				material: finalMat,
				pos,
				rot,
				force,
				scale,
				range,
				speed,
				timeRotate
			});

			if (this.gravity === true) {
				// add physic body to world
				asteroid.body = this.world.add(asteroid.physics);

				// Set rotation impulsion
				asteroid.body.angularVelocity.x = getRandom(-0.3, 0.3);
				asteroid.body.angularVelocity.y = getRandom(-0.3, 0.3);
				asteroid.body.angularVelocity.z = getRandom(-0.3, 0.3);
			}

			asteroid.mesh.index = i;

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);

		}
		// super.setAsteroids(this.models[0].geometry);

	}

	setLight() {

		let paramsLight = [
			// { x: 70, y: 70, z: 0 },
			{ x: -100, y: 0, z: 0 },
			{ x: 100, y: 0, z: 0 },
			{ x: 0, y: 0, z: 170 },
			{ x: 0, y: -0, z: 0 }
		];

		// Check Ambient Light
		// scene.add( new THREE.AmbientLight( 0x00020 ) );

		for (let i = 0; i < paramsLight.length; i++) {

			// create a point light
			let pointLight = new PointLight(0xFFFFFF, 0.8, 600, 2);
			// set its position
			pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
			// pointLight.power = 20;
			pointLight.visible = true;

			// add to the scene
			this.scene.add(pointLight);
		}
	}

	raf() {
		// update world
		// if (this.gravity === true) {
		// 	this.world.step();

		// 	// Symbol body
		// 	// this.symbol.mesh.position.copy(this.symbol.body.getPosition());
		// 	// this.symbol.mesh.quaternion.copy(this.symbol.body.getQuaternion());
		// 	// Asteroids bodies
		// 	this.asteroids.forEach( (el) => {

		// 		if (el.mesh.position.x > this.bounceArea / 2 - 50 || el.mesh.position.x < -this.bounceArea / 2 + 50 || el.mesh.position.y > this.bounceArea / 2 - 50 || el.mesh.position.y < -this.bounceArea / 2 + 50 || el.mesh.position.z > this.bounceArea / 2 - 50 || el.mesh.position.z < -this.bounceArea / 2 + 50) {
		// 			// Reverse Force Vector
		// 			if (el.annilled !== true) {

		// 				el.changeDirection();
		// 				el.annilled = true;
		// 			}
		// 		}

		// 		if (el.body !== undefined) {

		// 			// APPLY IMPULSE
		// 			el.body.linearVelocity.x = el.force.x;
		// 			el.body.linearVelocity.y = el.force.y;
		// 			el.body.linearVelocity.z = el.force.z;

		// 			// console.log(el.body.angularVelocity);
		// 			// angular Velocity always inferior to 1 (or too much rotations)

		// 			el.body.angularVelocity.x = clamp(el.body.angularVelocity.x, -1, 1);
		// 			el.body.angularVelocity.y = clamp(el.body.angularVelocity.y, -1, 1);
		// 			el.body.angularVelocity.z = clamp(el.body.angularVelocity.z, -1, 1);
		// 			// if (i === 0) {
		// 			//   console.log(el.body.angularVelocity.x);
		// 			// }

		// 			el.mesh.position.copy(el.body.getPosition());
		// 			el.mesh.quaternion.copy(el.body.getQuaternion());


		// 		}
		// 	});
		// }
		// console.log(this.symbol.glowMesh.insideMesh.material.uniforms['power'].value);
		this.brightness.uniforms['contrast'].value = (Math.sin(this.time / 40) + 1.2) * 3;
		this.brightness2.uniforms['contrast'].value = (Math.cos(this.time / 40) + 1.2) * 3;

		super.raf();

	}

}
