import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import {toRadian, getRandom, clamp, round } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import Asteroid from '../shapes/Asteroid';
import Symbol from '../shapes/Symbol';
import SplitText from '../vendors/SplitText.js';
import { Device } from '../helpers/Device';
import Ui from '../components/Ui';
import Menu from '../components/Menu';


import { Vector2, Raycaster, Vector3, Scene, Box3, DirectionalLight, JSONLoader, BoxGeometry, PerspectiveCamera, MeshLambertMaterial, PlaneGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color, MeshPhongMaterial } from 'three';
import { CameraDolly } from '../vendors/three-camera-dolly-custom';
import OrbitControls from '../vendors/OrbitControls';
import SimplexNoise from '../vendors/SimplexNoise';
import GPUComputationRenderer from '../vendors/GPUComputationRenderer';
import HeightmapFragmentShader from '../shaders/HeightmapFragmentShader';
import SmoothFragmentShader from '../shaders/SmoothFragmentShader';
import WaterVertexShader from '../shaders/WaterVertexShader';


import dat from 'dat-gui';

export default class IntroView extends AbstractView {

	constructor(obj) {

		super();

		// properties


		this.el = this.ui.webGl;
		this.gravity = obj.gravity;
		this.UI = Ui.ui; // Global UI selector
		this.name = 'intro';
		this.isControls = false;

		// bind

		this.init = this.init.bind(this);
		this.raf = this.raf.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.valuesChanger = this.valuesChanger.bind(this);
		this.initWater = this.initWater.bind(this);
		this.fillTexture = this.fillTexture.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onDocumentTouchStart = this.onDocumentTouchStart.bind(this);
		this.onDocumentTouchMove = this.onDocumentTouchMove.bind(this);
		this.smoothWater = this.smoothWater.bind(this);
		this.setMouseCoords = this.setMouseCoords.bind(this);
		this.setSymbol = this.setSymbol.bind(this);
		this.setLight = this.setLight.bind(this);
		this.resetWater = this.resetWater.bind(this);
		this.onW = this.onW.bind(this);
		this.moveCameraIn = this.moveCameraIn.bind(this);
		this.transitionIn = this.transitionIn.bind(this);
		this.transitionOut = this.transitionOut.bind(this);
		this.onClickStart = this.onClickStart.bind(this);
		this.onClick = this.onClick.bind(this);

		// preload Models
		Promise.all([
			this.loadJSON('datas/models/iceberg-1.json'),
			this.loadJSON('datas/models/iceberg-2.json'),
			this.loadJSON('datas/models/iceberg-3.json')
		]).then((results) => {
			// when all is loaded
			this.models = results;
			this.init();

			this.events(true);
			this.ui.overlay.classList.add('black');

			this.transitionIn();

		}, (err) => {
			console.log(err);
			// error here
		});

		// init

		// this.onClickStart();

	}

	loadJSON(source) {
		this.loaderM = new JSONLoader();

		return new Promise((resolve, reject) => {
			this.loaderM.load(source, (geometry) => {

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

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.raf);

		if (Device.touch === false) {
			// move camera
			document[evListener]( 'mousemove', this.onMouseMove, false );
		} else {
			document[evListener]( 'touchstart', this.onDocumentTouchStart, false );
			document[evListener]( 'touchmove', this.onDocumentTouchMove, false );
		}

		document[evListener]( 'keydown', this.onW , false );
		document[evListener]( 'click', this.onClick , false );

		this.UI.button[evListener]('click', this.onClickStart);

	}

	init() {

		// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		this.scene = new Scene();

		SceneManager.renderer.setClearColor( 0x000000 );
		SceneManager.renderer.setPixelRatio( clamp(window.devicePixelRatio, 1, 1.5)); // passer à 1.5 si rétina
		// console.log(clamp(window.devicePixelRatio, 1, 1.5));

		// set Camera
		this.setCamera();
		this.setCameraPos();

		// set Light
		this.setLight();

		// Set physics
		if (this.gravity === true) this.initPhysics();

		this.nbAst = 16;
		this.mouseSize = 32.0; // wave agitation
		this.time = 0;
		this.asteroids = [];
		this.asteroidsM = [];
		this.asteroidsMove = false;

		this.mouseMoved = false;
		this.mouseCoords = new Vector2();
		this.raycaster = new Raycaster();

		this.simplex = new SimplexNoise();

		// Mouse
		this.mouse = { x: 0, y: 0 };
		this.camRotTarget = new Vector3(0, 0, 0);
		this.camRotSmooth = new Vector3(0, 0, 0);

		this.cameraMove = true;

		// Camera controls
		if (this.isControls === true) {
			this.controls = new OrbitControls(this.camera, SceneManager.renderer.domElement);
			this.controls.enableZoom = true;
		}

		this.initWater();

		this.setAsteroids();
		this.setGround();
		// this.setSymbol();

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
		gui.close();

	}

	////////////////////
	// SET SCENE
	////////////////////

	setCameraPos() {

		console.log('setCamera');

		// this.camera.position.set(0, 30, 0);
		// this.camera.rotation.x = toRadian(-90);
		// debug add this.controls
		this.camera.position.set(0, 70, 0);
		this.camera.rotation.x = toRadian(-90);


	}

	setLight() {
		let sun = new DirectionalLight( 0xFFFFFF, 1.0 );
		sun.position.set( 300, 400, -205 );
		this.scene.add( sun );

		let sun2 = new DirectionalLight( 0xe8f0ff, 0.2 );
		sun2.position.set( -100, 350, -20 );
		this.scene.add( sun2 );
	}

	initWater() {

		this.WIDTH = 62; // Texture width for simulation bits

		// Magic calculs ;)
		const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		const height = 2 * Math.tan( vFOV / 2 ) * 400; // dist between 0 and camerapos.y
		const extra =  100; // for rotation camera left / right

		const aspect = window.innerWidth / window.innerHeight;
		let finalBounds;
		if (aspect > 1) {
			// landscape
			finalBounds = height * aspect;
		} else {
			finalBounds = height;
		}

		this.BOUNDS = finalBounds + extra; // Water size
		console.log(this.BOUNDS);

		let materialColor = 0xffffff;

		let geometry = new PlaneGeometry( this.BOUNDS, this.BOUNDS , this.WIDTH - 1, this.WIDTH - 1 );

		// material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
		let material = new ShaderMaterial({
			uniforms: UniformsUtils.merge([
				ShaderLib[ 'phong' ].uniforms,
				{
					heightmap: { value: null }
				}
			]),
			vertexShader: WaterVertexShader.vertexShader,
			fragmentShader: ShaderChunk[ 'meshphong_frag' ]

		});

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
		this.waterMesh.position.set( 0, 0, 0);
		// this.waterMesh.matrixAutoUpdate = false;
		// this.waterMesh.updateMatrix();

		this.scene.add( this.waterMesh );

		// Mesh just for mouse raycasting
		// let geometryRay = new PlaneBufferGeometry( this.BOUNDS, this.BOUNDS, 1, 1 );
		// this.meshRay = this.waterMesh;
		// this.meshRay.rotation.x = -Math.PI / 2;
		// this.meshRay.position.x = 400;
		// this.meshRay.matrixAutoUpdate = false;
		// this.meshRay.updateMatrix();
		// this.scene.add( this.meshRay );


		// Creates the gpu computation class and sets it up
		// console.log(GPUComputationRenderer);

		this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, SceneManager.renderer );

		let heightmap0 = this.gpuCompute.createTexture();

		this.fillTexture( heightmap0 );

		this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', HeightmapFragmentShader.fragmentShader, heightmap0 );

		// console.log(this.heightmapVariable);

		this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );

		this.heightmapVariable.material.uniforms.debug = { value: new Vector2( 0, 0 ) };
		this.heightmapVariable.material.uniforms.mousePos = { value: new Vector2( 10000, 10000 ) };
		this.heightmapVariable.material.uniforms.viscosityConstant = { value: 0.08 };
		this.heightmapVariable.material.defines.BOUNDS = this.BOUNDS.toFixed( 1 );

		let error = this.gpuCompute.init();
		if ( error !== null ) {
			console.error( error );
		}

		// Create compute shader to smooth the water surface and velocity
		// this.smoothShader = this.gpuCompute.createShaderMaterial( SmoothFragmentShader.fragmentShader, { texture: { value: null } } ); --> A étudier

		// console.log(this.heightmapVariable, this.smoothShader);

	}

	setGround() {
		const geometry = new PlaneGeometry(4000,4000);
		const mat = new MeshPhongMaterial({color: 0xFFFFFF});

		const ground = new Mesh(geometry, mat);

		ground.rotation.x = toRadian(-90);
		ground.position.y = -15;

		this.scene.add(ground);
	}

	setAsteroids() {
		// ADD Iceberg
		this.astXMin = -180;
		this.astXMax = 180;
		for (let i = 0; i < this.nbAst; i++) {
			let finalMat = new MeshLambertMaterial( {color: 0xFFFFFF, transparent: true} );
			finalMat.shininess = 1;

			const rot = {
				x: 0,
				y: getRandom(-180, 180),
				z: 90,
			};


			let pos = {
				x: getRandom(this.astXMin, this.astXMax),
				y: 4,
				z: getRandom(-600, -100),
			};

			//  force impulsion
			const force = {
				x: 0,
				y: 0,
				z: getRandom(40, 50)
			};

			const scale = getRandom(3, 8);
			const speed = getRandom(500, 600); // more is slower
			const range = getRandom(2, 5);
			const timeRotate = getRandom(14000, 16000);

			const model = Math.round(getRandom(0, 2));

			const asteroid = new Asteroid({
				width: this.models[model].size.x,
				height: this.models[model].size.y,
				depth: this.models[model].size.z,
				geometry: this.models[model],
				material: finalMat,
				pos,
				rot,
				force,
				scale,
				range,
				speed,
				timeRotate
			});

			asteroid.mesh.index = i;
			asteroid.speedZ = getRandom(0.3, 0.8);

			if (this.gravity === true) {
				// add physic body to world
				asteroid.body = this.world.add(asteroid.physics);
				// Set rotation impulsion
				asteroid.body.angularVelocity.x = getRandom(-0.2, 0.2);
				asteroid.body.angularVelocity.y = getRandom(-0.5, 0.5);
				asteroid.body.angularVelocity.z = getRandom(-0.2, 0.2);
			}

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);


		}
	}

	setSymbol() {

		const geometry = new BoxGeometry(20, 20, 20);
		// const img = PreloadManager.getResult('texture-asteroid');
		// const tex = new Texture(img);
		// tex.needsUpdate = true;
		// #4682b4
		const material = new MeshPhongMaterial({ color: 0x4682b4, transparent: true, opacity: 1, map: null });
		const pos = {
			x: 0,
			y: 170, // 60 end point
			z: 100,
		};
		const timeRotate = 7000;

		const symbol = new Symbol({
			geometry,
			material,
			pos,
			timeRotate
		});

		symbol.initPointY = 70;
		symbol.endPointY = 2000;
		symbol.endPointZ = 5000;

		this.symbol = symbol;

		// add mesh to the scene
		this.scene.add(symbol.mesh);

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

		// this.heightmapVariable.material.uniforms.mouseSize.value = this.effectController.mouseSize;
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

	onMouseMove( e ) {

		this.setMouseCoords( e.clientX, e.clientY );

		const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		this.mouse.x = eventX / window.innerWidth * 2 - 1;
		this.mouse.y = -(eventY / window.innerHeight) * 2 + 1;

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

	onClick() {
		if (this.clickAsteroid === true) {

			this.currentAstClicked = this.currentAstHover;
			this.currentAstClicked.animated = true;
			this.onAsteroidAnim = true;
			const dest = this.currentAstClicked.height * this.currentAstClicked.scale;

			const tl = new TimelineMax();

			tl.to([this.currentAstClicked.mesh.position, this.currentAstClicked.body.position], 3, {y: -dest, ease: window.Expo.easeOut});

			tl.add(()=> {
				this.onAsteroidAnim = false;
			});

		} else {
			// console.log('false');
		}
	}

	onClickStart() {

		if (this.clicked === true) return false;
		this.clicked = true;

		// const tl = new TimelineMax({delay: 2});
		const tl = new TimelineMax();

		// glitch
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY + 5, x: 0});
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 3, x: 1}, 0.01);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY + 3, x: 2}, 0.03);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 4, x: -2}, 0.05);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 1, x: 3}, 0.07);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY + 5, x: 2}, 0.09);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY, x: 0}, 0.12);

		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 2, x: -4});
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 2, x: 3}, 0.2);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY + 4, x: 2}, 0.23);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 2, x: -4}, 0.25);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 2, x: 3}, 0.27);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY + 2, x: 2}, 0.29);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 4, x: -3}, 0.32);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY + 4, x: -2}, 0.37);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 2, x: 2}, 0.39);
		// tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY, x: 0}, 0.40);

		tl.add(() => {
			this.transitionOut();
		}, '+=0.5');

		// tl.to(this.symbol.mesh.position, 10, {y: this.symbol.endPointY, z: this.symbol.endPointZ, ease: window.Expo.easeOut }, '+=0.2');
		// tl.to(this.symbol.mesh.material, 0.5, {opacity: 0 }, 1.5);

		tl.to(this.UI.button, 0.5, {opacity: 0}, 0);
		tl.set(this.UI.button, {opacity: 0, display: 'none'}, 0.5);


	}

	raf() {

		// console.log(this.waterMesh.position);

		// Set uniforms: mouse interaction
		// let uniforms = this.heightmapVariable.material.uniforms;

		// this.mouseMoved = true;

		// if ( this.mouseMoved ) {

		// 	this.raycaster.setFromCamera( this.mouse, this.camera );

		// 	let intersects = this.raycaster.intersectObject( this.waterMesh );

		// 	if ( intersects.length > 0 ) {
		// 		// console.log('yes');
		// 		let point = intersects[ 0 ].point;
		// 		uniforms.mousePos.value.set( point.x, point.z );


		// 	}
		// 	else {
		// 		// console.log('no');
		// 		uniforms.mousePos.value.set( 10000, 10000 );
		// 	}

		// 	this.mouseMoved = false;
		// }
		// else {
		// 	uniforms.mousePos.value.set( 10000, 10000 );

		// }


		// Manual simulation of infinite waves
		let pointX = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.x : Math.sin(this.time / 15 ) * this.BOUNDS / 4;
		let pointZ = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.z : -this.BOUNDS / 2;

		// console.log(pointX, pointZ);

		this.heightmapVariable.material.uniforms.mousePos.value.set( pointX, pointZ );
		this.heightmapVariable.material.uniforms.mouseSize = { value: this.mouseSize }; // water agitation

		// Do the gpu computation
		this.gpuCompute.compute();

		// Get compute output in custom uniform
		this.waterUniforms.heightmap.value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
		// this.waterUniforms.heightmap.value = this.heightmapVariable.initialValueTexture; // get aperçu of init HeightMap stade 1
		// this.waterUniforms.heightmap.value = this.heightmapVariable.renderTargets[1];  --> equivalent to gpu value

		// issue of heightmap y increase, because of waves, dont know why, try to compense the gpuCompute but the value is exponentiel
		this.waterMesh.position.y -= 0.0012;

		// console.log(this.waterMesh.position);


		if (this.gravity === true && this.startMove === true) this.world.step();

		// Rotate Symbol

		// this.symbol.mesh.rotation.y = toRadian(this.symbol.initRotateY + Math.sin(this.time * 2 * Math.PI / this.symbol.timeRotate) * (360 / 2) + 360 / 2);
		// this.symbol.mesh.rotation.x = toRadian(this.symbol.initRotateY + Math.cos(this.time * 2 * Math.PI / this.symbol.timeRotate) * (360 / 2) + 360 / 2);
		// this.symbol.mesh.rotation.z = toRadian(this.symbol.initRotateY + Math.sin(this.time * 2 * Math.PI / this.symbol.timeRotate) * (360 / 2) + 360 / 2);

		// Moving Icebergs
		this.asteroids.forEach((el) => {

			// el.mesh.position.z -= 1 * el.speedZ;
			// if (el.mesh.position.z >= 200) el.mesh.position.z = -300;

			// Move top and bottom --> Float effect
			// Start Number + Math.sin(this.time*2*Math.PI/PERIOD)*(SCALE/2) + (SCALE/2)
			if (el.animated === false) {
				// el.mesh.position.y = el.body.position.y = el.endY + Math.sin(this.time * 2 * Math.PI / el.speed) * (el.range / 2) + el.range / 2;
			}

			// rotate Manually

			el.mesh.rotation.y = el.body.rotation.y = toRadian(el.initRotateY + Math.sin(this.time * 2 * Math.PI / el.timeRotate) * (360 / 2) + 360 / 2);
			el.mesh.rotation.x = el.body.rotation.x = toRadian(el.initRotateY + Math.cos(this.time * 2 * Math.PI / el.timeRotate) * (360 / 2) + 360 / 2);
			el.mesh.rotation.z = el.body.rotation.z = toRadian(el.initRotateY + Math.sin(this.time * 2 * Math.PI / el.timeRotate) * (360 / 2) + 360 / 2);


			if (el.body !== undefined ) {

				if (this.asteroidsMove === true) {
					// APPLY IMPULSE
					el.body.linearVelocity.x = el.force.x;
					el.body.linearVelocity.y = el.force.y;
					el.body.linearVelocity.z = el.force.z;

					// Clamp rotation

					el.body.angularVelocity.x = 0;
					el.body.angularVelocity.y = clamp(el.body.angularVelocity.y, -0.5, 0.5);
					el.body.angularVelocity.z = 0;
				}


				el.mesh.position.copy(el.body.getPosition());
				el.mesh.quaternion.copy(el.body.getQuaternion());
				if (el.mesh.position.z >= 200) {
					el.mesh.position.z = el.body.position.z = el.mesh.index % 2 === 0 ? getRandom(0, -300) : -300;
					el.body.position.x = el.mesh.position.x = getRandom(this.astXMin, this.astXMax);
					el.animated = true;
					const dest = el.height * el.scale;
					// TweenMax.fromTo(el.mesh.material, 0.5, {opacity: 0}, {opacity: 1}); // convert in time raf
					TweenMax.fromTo([el.mesh.position, el.body.position], 3, {y: -dest}, {y: el.endY, onComplete:() => {
						el.animated = false;
					}});
					// reboot
				}

			}
		});

		// console.log(this.asteroids[1].mesh.position.y);

		// Raycaster
		this.raycaster.setFromCamera(this.mouse, this.camera);

		// on Click asteroids
		const intersectsAst = this.raycaster.intersectObjects(this.asteroidsM);

		if (intersectsAst.length > 0) {
			this.ui.body.style.cursor = 'pointer';
			this.clickAsteroid = true;
			this.currentAstHover = this.asteroids[intersectsAst[0].object.index];
		} else {
			this.ui.body.style.cursor = 'auto';
			this.clickAsteroid = false;
		}

		// // deceleration
		if (this.cameraMove === false && this.isControls === false) {

			// Specify target we want
			this.camRotTarget.x = toRadian(round(this.mouse.y * 4, 100));
			this.camRotTarget.y = -toRadian(round(this.mouse.x * 4, 100));

			// Smooth it with deceleration
			this.camRotSmooth.x += (this.camRotTarget.x - this.camRotSmooth.x) * 0.08;
			this.camRotSmooth.y += (this.camRotTarget.y - this.camRotSmooth.y) * 0.08;

			// Apply rotation

			this.camera.rotation.x = this.camRotSmooth.x + this.currentCameraRotX;
			this.camera.rotation.y =  clamp(this.camRotSmooth.y, -0.13, 0.13); // --> radian

		}

		this.render();


	}

	transitionIn() {

		this.el.classList.add('intro');
		this.el.classList.remove('project');

		// set ui
		this.UI.intro.style.display = 'block';
		Menu.el.classList.remove('is-active');

		Ui.el.style.display = 'block';

		const tl = new TimelineMax();

		const title1Arr = new SplitText(this.UI.title1, { type: 'chars' });
		const title2Arr = new SplitText(this.UI.title2, { type: 'words' });

		tl.set(this.UI.overlay, {opacity: 1});
		tl.set([title1Arr.chars, title2Arr.words], {opacity: 0});
		// tl.set(this.asteroidsM.material, {opacity: 0});

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
		tl.to(this.UI.overlay, 1.5, {opacity: 0});
		tl.add(() => {
			this.moveCameraIn();
		});
		tl.to([this.UI.title1,this.UI.title2], 2, {autoAlpha: 0}, '+=3');
		tl.set(this.UI.button, {opacity: 0, display: 'block'}, '+=1.5');
		tl.to(this.UI.button, 3, {opacity: 1});

		tl.add(() => {
			// start move Ast
			this.startMove = true;
		},0);

		// tl.o(this.asteroidsM.material, 0.5, {opacity: 1}, 5);

	}

	moveCameraIn(dest) {

		// this.camera.lookAt(new Vector3(0,0,0));
		// const tl2 = new TimelineMax();

		// tl2.to(this.camera.position, 5, {y: 800});
		// tl2.to(this.camera.rotation, 5, {x: toRadian(180)});
		// const tl2 = new TimelineMax();
		// tl2.to(this.camera.position, 10, {y: -400});

		if (this.animating === true) return false;
		this.animating = true;

		const tl = new TimelineMax({
			onComplete: () => {
				this.cameraMove = false;
				this.currentCameraRotX = this.camera.rotation.x;

			}
		});
		tl.to(this.camera.position, 7, {y: 400, ease: window.Expo.easeInOut});
		tl.add(() => {

			this.asteroidsMove = true;
		}, 0);

		// this.cameraMove = true;
		// // Set camera Dolly
		// const points = {
		// 	'camera': [{
		// 		'x': 0,
		// 		'y': 70,
		// 		'z': 0
		// 	}, {
		// 		'x': 0,
		// 		'y': 150,
		// 		'z': 0
		// 	}, {
		// 		'x': 0,
		// 		'y': 400,
		// 		'z': 0
		// 	}],
		// 	'lookat': [{
		// 		'x': 0,
		// 		'y': 0,
		// 		'z': 0
		// 	}, {
		// 		'x': 0,
		// 		'y': 0,
		// 		'z': 0
		// 	}, {
		// 		'x': 0,
		// 		'y': 0,
		// 		'z': 0
		// 	}]
		// };

		// this.dolly = new CameraDolly(this.camera, this.scene, points, null, false);

		// this.dolly.cameraPosition = 0;
		// this.dolly.lookatPosition = 0;
		// this.dolly.range = [0, 1];
		// this.dolly.both = 0;

		// const tl = new TimelineMax({
		// 	onComplete: () => {
		// 		this.cameraMove = false;
		// 		this.currentCameraRotX = this.camera.rotation.x;

		// 	}
		// });

		// tl.to(this.dolly, 7, {
		// 	cameraPosition: 1,
		// 	lookatPosition: 1,
		// 	ease: window.Power3.easeInOut,
		// 	onUpdate: () => {
		// 		this.dolly.update();
		// 	}
		// });
		// tl.add(() => {

		// 	this.asteroidsMove = true;
		// }, 0);

		// tl.to(this.symbol.mesh.position, 7, {y: this.symbol.initPointY, ease: window.Power3.easeOut }, 2);
		// tl.set(this.UI.button, {opacity: 0, display: 'block'}, '-=3');
		// tl.to(this.UI.button, 3, {opacity: 1}, '-=3');

	}

	transitionOut(dest) {

		this.animating = true;

		this.cameraMove = true;

		const tl2 = new TimelineMax();

		tl2.to(this.camera.position, 1, {y: 500});
		tl2.to(this.camera.rotation, 2, {x: toRadian(0), ease: window.Expo.easeOut}, 0);
		// tl2.to(this.camera.position, 2, {z: 0}, 2);
		tl2.to(this.camera.position, 2, {z: -5000}, 1);
		// tl2.to(this.camera.rotation, 2, {x: toRadian(90)})

		return false;

		// if (this.animating === true) return false;


		// console.log(this.symbols[0].mesh.getPosition());
		// Set camera Dolly
		const points = {
			'camera': [{
				'x': this.camera.position.x,
				'y': this.camera.position.y,
				'z': this.camera.position.z
			}, {
				'x': 0,
				'y': 640,
				'z': 800
			}],
			'lookat': [{
				'x': 0,
				'y': 40,
				'z': 10
			}, {
				'x': 0,
				'y': 2000, // symbol.endPointY = 2000;
				'z': 5000 // symbol.endPointZ = 5000;
			}]
		};

		this.dolly = new CameraDolly(this.camera, this.scene, points, null, false);

		this.dolly.cameraPosition = 0;
		this.dolly.lookatPosition = 0;
		this.dolly.range = [0, 1];
		this.dolly.both = 0;

		const tl = new TimelineMax({
			onComplete: () => {

				this.cameraMove = false;
				// this.currentCameraRotX = this.camera.rotation.x;

				EmitterManager.emit('router:switch', '/project-0', 0);
				EmitterManager.emit('view:transition:out');
			}
		});

		tl.to(this.dolly, 2, {
			cameraPosition: 1,
			lookatPosition: 1,
			ease: window.Power1.easeIn,
			onUpdate: () => {
				this.dolly.update();
			}
		});

		tl.to('.overlay', 0.5, {
			opacity: 1
		}, 1.7);

	}

}
