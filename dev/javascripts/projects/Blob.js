import ProjectView from '../views/ProjectView';
import PreloadManager from '../managers/PreloadManager';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';
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

		super.raf();
		return false;
		// // Update meth size

		// ////////////
		// // hight
		// ///////////

		// let coefAttenuate = 0.01;
		// const hightAvg = this.sound.hightAvg * coefAttenuate + 0.5;

		// for (let i = 0; i < this.spheres.length; i++) {
		//     this.spheres[i].scale.x = hightAvg;
		//     this.spheres[i].scale.y = hightAvg;
		//     this.spheres[i].scale.z = hightAvg;
		// }

		// ////////////
		// // medium
		// ///////////

		// const mediumAvg = this.sound.mediumAvg * coefAttenuate + 0.5;

		// for (let i = 0; i < this.pyramides.length; i++) {
		//     this.pyramides[i].scale.x = mediumAvg;
		//     this.pyramides[i].scale.y = mediumAvg;
		//     this.pyramides[i].scale.z = mediumAvg;
		// }

		// ////////////
		// // low
		// ///////////

		// const lowAvg = this.sound.lowAvg * coefAttenuate + 0.5;

		// for (let i = 0; i < this.cubes.length; i++) {
		//     this.cubes[i].scale.x = lowAvg;
		//     this.cubes[i].scale.y = lowAvg;
		//     this.cubes[i].scale.z = lowAvg;
		// }

		//////////////////
		// Raycasters
		//////////////////

		if (this.ui.body.style.cursor !== 'auto') this.ui.body.style.cursor = 'auto';

		this.raycaster.setFromCamera(this.mouse, this.camera);

		// const intersects = this.raycaster.intersectObjects([this.symbol.mesh]);

		// if (intersects.length > 0) {
		// 	this.ui.body.style.cursor = 'pointer';
		// 	this.clickSymbol = true;

		// } else {

		// 	this.clickSymbol = false;
		// }

		const intersectsAst = this.raycaster.intersectObjects(this.asteroidsM);

		if (intersectsAst.length > 0) {
			this.ui.body.style.cursor = 'pointer';
			this.clickAsteroid = true;
			this.currentAstClicked = this.asteroids[intersectsAst[0].object.index];
		} else {
			// this.ui.body.style.cursor = 'auto';
			this.clickAsteroid = false;
		}



		// update world
		if (this.gravity === true) {
			this.world.step();

			// Symbol body
			// this.symbol.mesh.position.copy(this.symbol.body.getPosition());
			// this.symbol.mesh.quaternion.copy(this.symbol.body.getQuaternion());
			// Asteroids bodies
			this.asteroids.forEach( (el) => {

				if (el.mesh.position.x > this.bounceArea / 2 - 50 || el.mesh.position.x < -this.bounceArea / 2 + 50 || el.mesh.position.y > this.bounceArea / 2 - 50 || el.mesh.position.y < -this.bounceArea / 2 + 50 || el.mesh.position.z > this.bounceArea / 2 - 50 || el.mesh.position.z < -this.bounceArea / 2 + 50) {
					// Reverse Force Vector
					if (el.annilled !== true) {

						el.changeDirection();
						el.annilled = true;
					}
				}

				if (el.body !== undefined) {

					// APPLY IMPULSE
					el.body.linearVelocity.x = el.force.x;
					el.body.linearVelocity.y = el.force.y;
					el.body.linearVelocity.z = el.force.z;

					// console.log(el.body.angularVelocity);
					// angular Velocity always inferior to 1 (or too much rotations)

					el.body.angularVelocity.x = clamp(el.body.angularVelocity.x, -1, 1);
					el.body.angularVelocity.y = clamp(el.body.angularVelocity.y, -1, 1);
					el.body.angularVelocity.z = clamp(el.body.angularVelocity.z, -1, 1);
					// if (i === 0) {
					//   console.log(el.body.angularVelocity.x);
					// }

					el.mesh.position.copy(el.body.getPosition());
					el.mesh.quaternion.copy(el.body.getQuaternion());


				}
			});
		} else {
			// Rotate Symbol

			// this.symbol.mesh.rotation.y = toRadian(this.symbol.initRotateY + Math.sin(this.time * 2 * Math.PI / this.symbol.timeRotate) * (360 / 2) + 360 / 2);
			// this.symbol.mesh.rotation.x = toRadian(this.symbol.initRotateY + Math.cos(this.time * 2 * Math.PI / this.symbol.timeRotate) * (360 / 2) + 360 / 2);
			// this.symbol.mesh.rotation.z = toRadian(this.symbol.initRotateY + Math.sin(this.time * 2 * Math.PI / this.symbol.timeRotate) * (360 / 2) + 360 / 2);

			// Asteroids meshs
			this.asteroids.forEach( (el)=> {
				// Move top and bottom --> Float effect
				// Start Number + Math.sin(this.time*2*Math.PI/PERIOD)*(SCALE/2) + (SCALE/2)
				el.mesh.position.y = el.endY + Math.sin(this.time * 2 * Math.PI / el.speed) * (el.range / 2) + el.range / 2;
				// rotate
				// console.log(Math.sin(this.time * 2 * Math.PI / 5000) * (360 / 2) + (360 / 2));
				el.mesh.rotation.y = toRadian(el.initRotateY + Math.sin(this.time * 2 * Math.PI / el.timeRotate) * (360 / 2) + 360 / 2);
				el.mesh.rotation.x = toRadian(el.initRotateY + Math.cos(this.time * 2 * Math.PI / el.timeRotate) * (360 / 2) + 360 / 2);
				el.mesh.rotation.z = toRadian(el.initRotateY + Math.sin(this.time * 2 * Math.PI / el.timeRotate) * (360 / 2) + 360 / 2);
			});

		}








		// Glow continuously
		// this.symbol.glowMesh.outsideMesh.material.uniforms['coeficient'].value = (Math.sin(this.time / 30) + 1) / 5;

		// console.log(this.symbol.glowMesh.outsideMesh.material.uniforms['coeficient'].value);
		// Glow arrows
		if (this.cameraMove === false && this.ui.arrowL !== undefined && this.ui.arrowL !== null) {
			this.ui.arrowL.style.opacity = 0.4 + (Math.sin(this.time / 30) + 1) / 5;
			this.ui.arrowR.style.opacity = 0.4 + (Math.sin(this.time / 30) + 1) / 5;
			// console.log(5 + (Math.sin(this.time / 30) + 1) / 5);
		}


		// console.log(this.symbol.glowMesh.insideMesh.material.uniforms['power'].value);
		if (this.glow === true) {
			// Glow brightness material Asteroids
			this.brightness.uniforms['contrast'].value = (Math.sin(this.time / 40) + 1.2) * 3;
			this.brightness2.uniforms['contrast'].value = (Math.cos(this.time / 40) + 1.2) * 3;
		}

		// scroll gallery
		if (this.initGalleryY) {
			this.topContent.position.y = this.topContentY;
			this.gallery.position.y = this.topContentY + this.initGalleryY;
			this.footer.position.y = this.topContentY + this.initFooterY;
		}


		// Zoom ??

		// const delta = (this.finalFov - this.camera.fov) * 0.25;

		// if (Math.abs(delta) > 0.01) {

		//     this.camera.fov += delta;
		//     this.camera.updateProjectionMatrix();

		//     // console.log(this.camera.fov);

		//     // FOV : 70 : zoom middle
		//     // FOV : 60 : zoom max
		// }

		// On mouse Move Camera movement

		// deceleration duplicate /!\
		if (this.cameraMove === false) {

			// Specify target we want
			this.camRotTarget.x = toRadian(round(this.mouse.y * 4, 100));
			this.camRotTarget.y = -toRadian(round(this.mouse.x * 8, 100));

			// Smooth it with deceleration
			this.camRotSmooth.x += (this.camRotTarget.x - this.camRotSmooth.x) * 0.08;
			this.camRotSmooth.y += (this.camRotTarget.y - this.camRotSmooth.y) * 0.08;

			// Apply rotation

			this.camera.rotation.x = this.camRotSmooth.x;
			this.camera.rotation.y = this.camRotSmooth.y;

		}

		this.render();

		// glitch title
		if (this.glitch) {

			if (this.glitch.stop !== true) {
				if (this.glitch.hover === true ) {
					this.glitch.raf();
				} else {
					this.glitch.raf(true);
				}
			}
		}

	}

}
