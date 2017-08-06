import EmitterManager from '../managers/EmitterManager';
import {toRadian } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';

import { Vector2, Raycaster, PerspectiveCamera, Scene, DirectionalLight, BoxGeometry, PlaneGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color } from 'three';
import OrbitControls from '../vendors/OrbitControls';
import SimplexNoise from '../vendors/SimplexNoise';
import GPUComputationRenderer from '../vendors/GPUComputationRenderer';
import HeightmapFragmentShader from '../shaders/HeightmapFragmentShader';
import SmoothFragmentShader from '../shaders/SmoothFragmentShader';
import WaterVertexShader from '../shaders/WaterVertexShader';


import dat from 'dat-gui';

export default class IntroView {

	constructor(el) {

		this.el = el;

		this.ui = {

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
		this.addAsteroids = this.addAsteroids.bind(this);
		this.setLight = this.setLight.bind(this);
		this.resetWater = this.resetWater.bind(this);
		this.onW = this.onW.bind(this);

		this.init();

		this.events(true);

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

		this.WIDTH = 64; // Texture width for simulation bits
		this.BOUNDS = 512; // Water size in system units

		this.mouseMoved = false;
		this.mouseCoords = new Vector2();
		this.raycaster = new Raycaster();

		this.simplex = new SimplexNoise();

		this.controls = new OrbitControls( this.camera, SceneManager.renderer.domElement );

		this.initWater();

		this.addAsteroids();

		// reset Water bits to 64
		setInterval(() => {
			this.resetWater();
		}, 10000);

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


		this.camera.position.set(0, 600, 0);
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
		material.shininess = 50;

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
		console.log(heightmap0);

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

	addAsteroids() {
		// ADD BOXES
		// let numberBox = 2;

		// for (let i = 0; i < numberBox; i++) {

		// 	let geometry = new BoxGeometry( 100, 100, 100 );
		// 	let material = new MeshBasicMaterial( {color: 0xFFFFFF} );
		// 	let cube = new Mesh( geometry, material );
		// 	cube.position.x = i * 200 - 100;
		// 	cube.position.z = i * 200 - 100;

		// 	this.scene.add( cube );

		// 	const tl = new TimelineMax({repeat: -1});
		// 	tl.fromTo(cube.position, 2, {y:-50 }, {y:50, ease:window.Linear.easeNone });
		// 	tl.to(cube.position, 2, {y:-50, ease:window.Linear.easeNone });
		// 	tl.fromTo(cube.position, 2, {y:-50 }, {y:50, ease:window.Linear.easeNone });
		// 	tl.fromTo(cube.position, 7, {z:-200 }, {z:200, ease:window.Linear.easeNone }, 0);
		// }

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

		// Render
		// renderer.render( scene, camera );

		// Render Scenes
		SceneManager.render({
			camera: this.camera,
			scene: this.scene,
			cssScene: null,
			effectController: null,
			composer: null
		});


		if (this.controls !== undefined ) this.controls.update();

	}

	destroy() {
		this.events(false);
	}
}
