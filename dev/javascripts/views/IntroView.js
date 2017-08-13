import EmitterManager from '../managers/EmitterManager';
import {toRadian, getRandom, clamp } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import Asteroid from '../shapes/Asteroid';
import SplitText from '../vendors/SplitText.js';

import { Vector2, Raycaster, PerspectiveCamera, Scene, DirectionalLight, BoxGeometry, PlaneGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color, MeshPhongMaterial } from 'three';
import { CameraDolly } from '../vendors/three-camera-dolly-custom';
import OrbitControls from '../vendors/OrbitControls';
import SimplexNoise from '../vendors/SimplexNoise';
import GPUComputationRenderer from '../vendors/GPUComputationRenderer';
import HeightmapFragmentShader from '../shaders/HeightmapFragmentShader';
import SmoothFragmentShader from '../shaders/SmoothFragmentShader';
import WaterVertexShader from '../shaders/WaterVertexShader';
import { World } from 'oimo';

import dat from 'dat-gui';

export default class IntroView {

	constructor(obj) {

		this.el = obj.el;
		this.gravity = obj.gravity;

		// We will need a UI selector in global.
		this.ui = {
			intro: document.querySelector('.intro'),
			overlay: document.querySelector('.intro__overlay'),
			title1: document.querySelector('.intro .title--1'),
			title2: document.querySelector('.intro .title--2'),
			button: document.querySelector('.intro .button')
		};

		// bind

		this.init = this.init.bind(this);
		this.raf = this.raf.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.valuesChanger = this.valuesChanger.bind(this);
		this.initWater = this.initWater.bind(this);
		this.fillTexture = this.fillTexture.bind(this);
		this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
		this.onDocumentTouchStart = this.onDocumentTouchStart.bind(this);
		this.onDocumentTouchMove = this.onDocumentTouchMove.bind(this);
		this.smoothWater = this.smoothWater.bind(this);
		this.setMouseCoords = this.setMouseCoords.bind(this);
		this.setAsteroids = this.setAsteroids.bind(this);
		this.setLight = this.setLight.bind(this);
		this.resetWater = this.resetWater.bind(this);
		this.onW = this.onW.bind(this);
		this.moveCameraIn = this.moveCameraIn.bind(this);
		this.transitionIn = this.transitionIn.bind(this);

		this.init();

		this.events(true);

		this.transitionIn();

	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.raf);

		document[evListener]( 'mousemove', this.onDocumentMouseMove, false );
		document[evListener]( 'touchstart', this.onDocumentTouchStart, false );
		document[evListener]( 'touchmove', this.onDocumentTouchMove, false );
		document[evListener]( 'keydown', this.onW , false );

		this.ui.button[evListener]('click', () => {
			window.location.href = `${window.location.origin}/#project-0`;
			window.location.reload();
		});
	}

	init() {

		// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		this.scene = new Scene();

		SceneManager.renderer.setClearColor( 0x000000 );
		SceneManager.renderer.setPixelRatio( window.devicePixelRatio );

		// set Camera
		this.setCamera();

		// set Light
		this.setLight();

		// Set physics
		if (this.gravity === true) this.initPhysics();

		this.WIDTH = 128; // Texture width for simulation bits
		this.BOUNDS = 512; // Water size in system units
		this.nbAst = 20;
		this.time = 0;
		this.asteroids = [];
		this.asteroidsM = [];

		this.mouseMoved = false;
		this.mouseCoords = new Vector2();
		this.raycaster = new Raycaster();

		this.simplex = new SimplexNoise();

		this.controls = new OrbitControls( this.camera, SceneManager.renderer.domElement );

		this.initWater();

		this.setAsteroids();

		// reset Water bits to 64
		// setInterval(() => {
		// 	this.resetWater();
		// }, 10000);

		let gui = new dat.GUI();

		this.effectController = {
			mouseSize: 20.0,
			viscosity: 0.03
		};

		gui.add( this.effectController, 'mouseSize', 1.0, 100.0, 1.0 ).onChange( this.valuesChanger );
		gui.add( this.effectController, 'viscosity', 0.0, 0.1, 0.001 ).onChange( this.valuesChanger );
		this.valuesChanger();
		let buttonSmooth = {
			smoothWater: () => {
				this.smoothWater();
			}
		};
		gui.add( buttonSmooth, 'smoothWater' );

	}

	initPhysics() {

		this.world = new World({
			timestep: 1 / 60,
			iterations: 8,
			broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
			worldscale: 1, // scale full world
			random: true, // randomize sample
			info: false, // calculate statistic or not
			gravity: [0, 0, 0] // 0 gravity
		});

		// this.world.gravity.y = 0;

	}

	////////////////////
	// SET SCENE
	////////////////////

	setCamera() {

		this.camera = new PerspectiveCamera(
			45, // fov
			window.innerWidth / window.innerHeight, // aspect
			1, // near
			3000 // far
		);


		this.camera.position.set(0, 30, 0);
		this.camera.rotation.x = toRadian(-90);
		// this.camera.rotation.x = toRadian(45);


	}

	setLight() {
		let sun = new DirectionalLight( 0xFFFFFF, 1.0 );
		sun.position.set( 300, 400, 175 );
		this.scene.add( sun );

		let sun2 = new DirectionalLight( 0xe8f0ff, 0.2 );
		sun2.position.set( -100, 350, -200 );
		this.scene.add( sun2 );
	}

	initWater() {

		let materialColor = 0xffffff;

		let geometry = new PlaneGeometry( this.BOUNDS, this.BOUNDS , this.WIDTH - 1, this.WIDTH - 1 );

		// material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
		let material = new ShaderMaterial( {
			uniforms: UniformsUtils.merge( [
				ShaderLib[ 'phong' ].uniforms,
				{
					heightmap: { value: null }
				}
			] ),
			vertexShader: WaterVertexShader.vertexShader,
			fragmentShader: ShaderChunk[ 'meshphong_frag' ]

		} );

		material.lights = true;
		// Material attributes from MeshPhongMaterial
		material.color = new Color( materialColor );
		material.specular = new Color( 0x111111 );
		material.shininess = 1;

		// Sets the uniforms with the material values
		material.uniforms.diffuse.value = material.color;
		material.uniforms.specular.value = material.specular;
		material.uniforms.shininess.value = Math.max( material.shininess, 1e-4 );
		material.uniforms.opacity.value = material.opacity;

		// Defines
		material.defines.WIDTH = this.WIDTH.toFixed( 1 );
		material.defines.BOUNDS = this.BOUNDS.toFixed( 1 );

		this.waterUniforms = material.uniforms;

		this.waterMesh = new Mesh( geometry, material );
		this.waterMesh.rotation.x = -Math.PI / 2;
		this.waterMesh.position.set( 0, 0, -this.BOUNDS / 2 + 300);
		this.waterMesh.matrixAutoUpdate = false;
		this.waterMesh.updateMatrix();

		this.scene.add( this.waterMesh );

		// Mesh just for mouse raycasting
		let geometryRay = new PlaneBufferGeometry( this.BOUNDS, this.BOUNDS, 1, 1 );
		this.meshRay = new Mesh( geometryRay, new MeshBasicMaterial( { color: 0xFFFFFF, visible: false } ) );
		this.meshRay.rotation.x = -Math.PI / 2;
		// this.meshRay.position.x = 400;
		this.meshRay.matrixAutoUpdate = false;
		this.meshRay.updateMatrix();
		// this.scene.add( this.meshRay );


		// Creates the gpu computation class and sets it up
		// console.log(GPUComputationRenderer);

		this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, SceneManager.renderer );

		let heightmap0 = this.gpuCompute.createTexture();

		this.fillTexture( heightmap0 );

		this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', HeightmapFragmentShader.fragmentShader, heightmap0 );

		this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );

		this.heightmapVariable.material.uniforms.mousePos = { value: new Vector2( 10000, 10000 ) };
		this.heightmapVariable.material.uniforms.mouseSize = { value: 20.0 };
		this.heightmapVariable.material.uniforms.viscosityConstant = { value: 0.03 };
		this.heightmapVariable.material.defines.BOUNDS = this.BOUNDS.toFixed( 1 );

		let error = this.gpuCompute.init();
		if ( error !== null ) {
			console.error( error );
		}

		// Create compute shader to smooth the water surface and velocity
		this.smoothShader = this.gpuCompute.createShaderMaterial( SmoothFragmentShader.fragmentShader, { texture: { value: null } } );

		console.log(this.heightmapVariable, this.smoothShader);

	}

	setAsteroids() {
		// ADD BOXES

		let geometry = new BoxGeometry( 6, 6, 6 );
		let finalMat = new MeshPhongMaterial( {color: 0xFFFFFF} );
		finalMat.shininess = 900;
		console.log(geometry.parameters);

		for (let i = 0; i < this.nbAst; i++) {

			const rot = {
				x: getRandom(-180, 180),
				y: getRandom(-180, 180),
				z: getRandom(-180, 180),
			};

			let pos = {
				x: getRandom(-180, 180),
				y: 0,
				z: getRandom(30, 300),
			};

			//  force impulsion
			const force = {
				x: 0,
				y: 0,
				z: -getRandom(40, 50)
			};

			const scale = getRandom(1, 4);
			const speed = getRandom(500, 800); // more is slower
			const range = getRandom(-3, 4);
			const speedRotate = getRandom(15000, 17000);

			const asteroid = new Asteroid(geometry, finalMat, pos, rot, force, scale, range, speed, speedRotate);

			asteroid.mesh.index = i;
			asteroid.speedZ = getRandom(0.3, 0.8);
			// console.log(asteroid.speedZ);
			if (this.gravity === true) {
				// add physic body to world
				asteroid.body = this.world.add(asteroid.physics);
				// Set rotation impulsion
				asteroid.body.angularVelocity.x = getRandom(-0.2, 0.2);
				asteroid.body.angularVelocity.y = getRandom(-0.2, 0.2);
				asteroid.body.angularVelocity.z = getRandom(-0.2, 0.2);
			}

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);


		}
	}

	fillTexture( texture ) {

		let waterMaxHeight = 10;

		let noise = ( x, y, z ) => {
			let multR = waterMaxHeight;
			let mult = 0.025;
			let r = 0;
			for ( let i = 0; i < 15; i++ ) {
				r += multR * this.simplex.noise( x * mult, y * mult );
				multR *= 0.53 + 0.025 * i;
				mult *= 1.25;
			}
			return r;
		};

		let pixels = texture.image.data;

		let p = 0;
		for ( let j = 0; j < this.WIDTH; j++ ) {
			for ( let i = 0; i < this.WIDTH; i++ ) {

				let x = i * 128 / this.WIDTH;
				let y = j * 128 / this.WIDTH;

				pixels[ p + 0 ] = noise( x, y, 123.4 );
				pixels[ p + 1 ] = 0;
				pixels[ p + 2 ] = 0;
				pixels[ p + 3 ] = 1;

				p += 4;
			}
		}

	}

	valuesChanger() {

		this.heightmapVariable.material.uniforms.mouseSize.value = this.effectController.mouseSize;
		this.heightmapVariable.material.uniforms.viscosityConstant.value = this.effectController.viscosity;

	}

	smoothWater() {

		let currentRenderTarget = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable );
		let alternateRenderTarget = this.gpuCompute.getAlternateRenderTarget( this.heightmapVariable );

		// for ( let i = 0; i < 10; i++ ) {

			this.smoothShader.uniforms.texture.value = currentRenderTarget.texture;
			// this.smoothShader.uniforms.texture.value = this.heightmapVariable.initialValueTexture;
			this.gpuCompute.doRenderTarget( this.smoothShader, alternateRenderTarget );

			this.smoothShader.uniforms.texture.value = alternateRenderTarget.texture;
			// this.smoothShader.uniforms.texture.value = this.heightmapVariable.initialValueTexture;
			this.gpuCompute.doRenderTarget( this.smoothShader, currentRenderTarget );

		// }
	}

	resetWater() {

		let currentRenderTarget = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable );
		let alternateRenderTarget = this.gpuCompute.getAlternateRenderTarget( this.heightmapVariable );

		this.smoothShader.uniforms.texture.value = this.heightmapVariable.initialValueTexture;
		this.gpuCompute.doRenderTarget( this.smoothShader, alternateRenderTarget );

		this.smoothShader.uniforms.texture.value = this.heightmapVariable.initialValueTexture;
		this.gpuCompute.doRenderTarget( this.smoothShader, currentRenderTarget );
	}

	setMouseCoords( x, y ) {

		this.mouseCoords.set( ( x / SceneManager.renderer.domElement.clientWidth ) * 2 - 1, - ( y / SceneManager.renderer.domElement.clientHeight ) * 2 + 1 );
		this.mouseMoved = true;

	}

	onDocumentMouseMove( event ) {

		this.setMouseCoords( event.clientX, event.clientY );

	}

	onDocumentTouchStart( event ) {

		if ( event.touches.length === 1 ) {

			event.preventDefault();

			this.setMouseCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );


		}

	}

	onDocumentTouchMove( event ) {

		if ( event.touches.length === 1 ) {

			event.preventDefault();

			this.setMouseCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );


		}

	}

	onW(event) {

		// W Pressed: Toggle wireframe
		if ( event.keyCode === 87 ) {

			this.waterMesh.material.wireframe = !this.waterMesh.material.wireframe;
			this.waterMesh.material.needsUpdate = true;

		}
	}

	resizeHandler() {

		this.width = window.innerWidth * window.devicePixelRatio;
		this.height = window.innerHeight * window.devicePixelRatio;

		SceneManager.resizeHandler({
			camera: this.camera
		});

	}

	raf() {

		// Set uniforms: mouse interaction
		// let uniforms = this.heightmapVariable.material.uniforms;

		// if ( this.mouseMoved ) {

		// 	this.raycaster.setFromCamera( this.mouseCoords, this.camera );

		// 	let intersects = this.raycaster.intersectObject( this.meshRay );

		// 	if ( intersects.length > 0 ) {
		// 		let point = intersects[ 0 ].point;
		// 		uniforms.mousePos.value.set( point.x, point.z );

		// 	}
		// 	else {
		// 		uniforms.mousePos.value.set( 10000, 10000 );
		// 	}

		// 	this.mouseMoved = false;
		// }
		// else {
		// 	uniforms.mousePos.value.set( 10000, 10000 );
		// }

		// Do the gpu computation
		this.gpuCompute.compute();

		// console.log(this.heightmapVariable, this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ));

		// Get compute output in custom uniform
		this.waterUniforms.heightmap.value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
		// this.waterUniforms.heightmap.value = this.heightmapVariable.initialValueTexture; // get aperçu of init HeightMap stade 1
		// this.waterUniforms.heightmap.value = this.heightmapVariable.renderTargets[1];  --> equivalent to gpu value


		if (this.gravity === true) this.world.step();

		// Moving Icebergs
		this.asteroids.forEach((el) => {
			// el.mesh.position.z -= 1 * el.speedZ;
			if (el.mesh.position.z <= -200) el.mesh.position.z = 300;

			// Move top and bottom --> Float effect
			// Start Number + Math.sin(this.time*2*Math.PI/PERIOD)*(SCALE/2) + (SCALE/2)
			el.mesh.position.y = el.endY + Math.sin(this.time * 2 * Math.PI / el.speed) * (el.range / 2) + el.range / 2;
			// rotate
			// console.log(Math.sin(this.time * 2 * Math.PI / 5000) * (360 / 2) + (360 / 2));
			el.mesh.rotation.y = toRadian(el.initRotateY + Math.sin(this.time * 2 * Math.PI / el.speedRotate) * (360 / 2) + 360 / 2);
			el.mesh.rotation.x = toRadian(el.initRotateY + Math.cos(this.time * 2 * Math.PI / el.speedRotate) * (360 / 2) + 360 / 2);
			el.mesh.rotation.z = toRadian(el.initRotateY + Math.sin(this.time * 2 * Math.PI / el.speedRotate) * (360 / 2) + 360 / 2);

			if (el.body !== undefined) {

				// APPLY IMPULSE
				el.body.linearVelocity.x = el.force.x;
				el.body.linearVelocity.y = el.force.y;
				el.body.linearVelocity.z = el.force.z;

				// console.log(el.body.angularVelocity);
				// angular Velocity always inferior to 1 (or too much rotations)

				el.body.angularVelocity.x = clamp(el.body.angularVelocity.x, -0.5, 0.5);
				el.body.angularVelocity.y = clamp(el.body.angularVelocity.y, -0.5, 0.5);
				el.body.angularVelocity.z = clamp(el.body.angularVelocity.z, -0.5, 0.5);
				// if (i === 0) {
				//   console.log(el.body.angularVelocity.x);
				// }

				el.mesh.position.copy(el.body.getPosition());
				el.mesh.quaternion.copy(el.body.getQuaternion());
				if (el.mesh.position.z <= -200) {
					el.mesh.position.z = 300;
					el.body.position.z = 300;
					// reboot
				}

			}
		});

		// Render Scenes
		SceneManager.render({
			camera: this.camera,
			scene: this.scene,
			cssScene: null,
			effectController: null,
			composer: null
		});


		if (this.controls !== undefined ) this.controls.update();

		this.time++;

	}

	transitionIn() {

		this.ui.intro.style.display = 'block';

		const tl = new TimelineMax();

		const title1Arr = new SplitText(this.ui.title1, { type: 'chars' });
		const title2Arr = new SplitText(this.ui.title2, { type: 'words' });

		tl.set(this.ui.overlay, {opacity: 1});
		tl.set([title1Arr.chars, title2Arr.words], {opacity: 0});
		console.log(title1Arr);

		tl.staggerFromTo(title1Arr.chars, 0.7, {
			opacity: 0,
			y: 10,
			// force3D: true,
			ease: Expo.easeOut
		}, {
			opacity: 1,
			y: 0
		}, 0.07, 1);

		tl.staggerFromTo(title2Arr.words, 0.7, {
			opacity: 0,
			y: 10,
			// force3D: true,
			ease: Expo.easeOut
		}, {
			opacity: 1,
			y: 0
		}, 0.07);
		tl.to(this.ui.overlay, 1.5, {opacity: 0});
		tl.add(() => {
			this.moveCameraIn();
		});
		tl.to([this.ui.title1,this.ui.title2], 2, {autoAlpha: 0}, '+=1');


	}

	moveCameraIn(dest) {

		if (this.animating === true) return false;
		this.animating = true;

		this.cameraMove = true;
		// Set camera Dolly
		const points = {
			'camera': [{
				'x': 0,
				'y': 30,
				'z': 0
			}, {
				'x': 0,
				'y': 40,
				'z': -100
			}, {
				'x': 0,
				'y': 40,
				'z': -200
			}],
			'lookat': [{
				'x': 0,
				'y': 15,
				'z': 0
			}, {
				'x': 0,
				'y': 40,
				'z': 5
			}, {
				'x': 0,
				'y': 40,
				'z': 10
			}]
		};

		this.dolly = new CameraDolly(this.camera, this.scene, points, null, false);

		this.dolly.cameraPosition = 0;
		this.dolly.lookatPosition = 0;
		this.dolly.range = [0, 1];
		this.dolly.both = 0;

		const tl = new TimelineMax({
			onComplete: () => {
				console.log('ok ');
			}
		});

		tl.to(this.dolly, 7, {
			cameraPosition: 1,
			lookatPosition: 1,
			ease: window.Power3.easeInOut,
			onUpdate: () => {
				this.dolly.update();
				console.log(this.dolly);
			}
		});
		tl.set(this.ui.button, {opacity: 0, display: 'block'}, 5);
		tl.to(this.ui.button, 1, {opacity: 1}, 5);

		console.log('moveCameraIn');

	}

	destroy(all = false) {

		if (all === true) {

			this.scene.traverse((obj) => {

				// remove physics
				if (obj.body) obj.body.remove();

				if (obj.geometry) obj.geometry.dispose();

				if (obj.material) {

					if (obj.material.materials) {

						for (const mat of obj.material.materials) {

							if (mat.map) mat.map.dispose();

							mat.dispose();
						}
					} else {

						if (obj.material.map) obj.material.map.dispose();

						obj.material.dispose();
					}
				}

			});

			for (let i = this.scene.children.length - 1; i >= 0; i--) {

				this.scene.remove(this.scene.children[i]);
			}

		}
		// Wait destroy scene before stop js events
		// setTimeout(() => {
		this.events(false);
		// }, 500);

	}
}
