import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import {toRadian, getRandom, clamp, round } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import Asteroid from '../shapes/Asteroid';
import Symbol from '../shapes/Symbol';
import SplitText from '../vendors/SplitText.js';
import { Device } from '../helpers/Device';
import Ui from '../components/Ui';
import { loadJSON } from '../helpers/utils-three';


import { Vector2, Raycaster, Vector3, Fog, FaceColors, Scene, DirectionalLight, Texture, BoxGeometry, HemisphereLight, MeshLambertMaterial, PlaneGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color, MeshPhongMaterial } from 'three';
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
		this.isControls = true;

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
			loadJSON('datas/models/iceberg-1.json'),
			loadJSON('datas/models/iceberg-2.json'),
			loadJSON('datas/models/iceberg-3.json')
		]).then((results) => {
			// when all is loaded
			console.log(results);
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
		this.UI.button[evListener]('mouseenter', () => {
			this.startIsHover = true;
			global.CURSOR.interractHover();
		});
		this.UI.button[evListener]('mouseleave', () => {
			this.startIsHover = false;
			global.CURSOR.interractLeave();
		});

	}

	init() {

		// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		this.scene = new Scene();
		this.scene.background = new Color(0x000000);

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

		this.initWater(false, false);

		this.setAsteroids();
		this.setGround();

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

		global.CURSOR.el.classList.add('alt');

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

		// let hemisphere = new HemisphereLight( 0x00FFFF, 0xFF0000, 1 );
		// this.scene.add( hemisphere );

		// FOG
		// this.scene.fog = new Fog( 0xFFFFFF, 1, 200 ); --> dosent affect water

	}

	initWater(destroy = false, bigger = false) {

		this.WIDTH = 62; // Texture width for simulation bits

		// Magic calculs ;)
		const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		const height = 2 * Math.tan( vFOV / 2 ) * 400; // dist between 0 and camerapos.y

		const aspect = window.innerWidth / window.innerHeight;
		let finalBounds;
		if (aspect > 1) {
			// landscape
			finalBounds = height * aspect;
		} else {
			finalBounds = height;
		}

		const extra = bigger === true ? 800 : 100; // for rotation camera left / right
		this.BOUNDS = finalBounds + extra; // Water size
		this.BOUNDSSUP = bigger === true ? 700 : 0; // Bounds supp for TransitionOut, we see the horizon
		this.mouseSize = bigger === true ? 100.0 : 32.0; // wave agitation

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
		this.waterMesh.name = 'water';
		// this.waterMesh.matrixAutoUpdate = false;
		// this.waterMesh.updateMatrix();

		this.scene.add( this.waterMesh );

		if (destroy === false ) { // if not already set
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

	}

	generateTexture() {

		// Use a classic image for better pef

		const size = 512;

		// create canvas
		let canvas = document.createElement( 'canvas' );
		canvas.width = size;
		canvas.height = size;

		// get context
		const context = canvas.getContext( '2d' );

		// draw gradient
		context.rect( 0, 0, size, size );
		const gradient = context.createRadialGradient(size / 2,size / 2,size,size / 2,size / 2,100);
		gradient.addColorStop(1, '#e9ebee');
		gradient.addColorStop(0.98, '#e9ebee');
		gradient.addColorStop(0.8, '#000000');
		gradient.addColorStop(0, '#000000'); // dark blue
		context.fillStyle = gradient;
		context.fill();


		const image = new Image();
		image.id = 'pic';
		image.src = canvas.toDataURL();
		document.documentElement.appendChild(image);

		return image;

	}

	setGround() {

		// Generate gradient
		this.generateTexture();
		const img = document.querySelector('#pic');
		const texture = new Texture( img );
		texture.needsUpdate = true;



		const geometry = new PlaneGeometry(3000,4000);
		const mat = new MeshPhongMaterial({color: 0xFFFFFF});

		const ground = new Mesh(geometry, mat);

		ground.rotation.x = toRadian(-90);
		ground.position.y = -15;

		this.scene.add(ground);

		const geometry2 = new PlaneGeometry(3000,3000);

		// material
		const mat2 = new MeshBasicMaterial( { map: texture, transparent: true } );
		// const mat2 = new MeshBasicMaterial({color: 0x00FFFF});
		const blackGround = new Mesh(geometry2, mat2);
		blackGround.rotation.z = toRadian(90);
		blackGround.position.y = -300;
		blackGround.position.z = -2000;

		this.scene.add(blackGround);
	}

	setAsteroids() {
		// ADD Iceberg
		this.astXMin = -180;
		this.astXMax = 180;
		this.ipRadius = 50; // intra perimeter Radius

		console.log(this.models[0]);

		for (let i = 0; i < this.nbAst; i++) {

			const model = Math.round(getRandom(0, 2));

			let finalMat = new MeshPhongMaterial( {
				color: 0xffffff,
				flatShading: true
			} );
			// console.log(finalMat);

			// finalMat.shininess = 1;

			const rot = {
				x: 0,
				y: getRandom(-180, 180),
				z: 90,
			};


			let pos = {
				x: getRandom(this.astXMin, this.astXMax),
				y: 4,
				z: getRandom(-550, 50),
			};

			// check if ast already in other ast position
			for (let y = 0; y < this.asteroidsM.length; y++) {
				if (pos.x < this.ipRadius + this.asteroidsM[y].position.x && pos.x > -this.ipRadius + this.asteroidsM[y].position.x && pos.z < this.ipRadius + this.asteroidsM[y].position.z && pos.z > -this.ipRadius + this.asteroidsM[y].position.z) {
					// console.log(i, ' dans le périmetre !');
					pos.x += this.ipRadius;
					pos.z += this.ipRadius;

				}
			}


			//  force impulsion
			const force = {
				x: 0,
				y: 0,
				z: getRandom(40, 50)
			};

			const scale = getRandom(0.05, 0.06);
			const speed = getRandom(500, 600); // more is slower
			const range = getRandom(2, 5);
			const timeRotate = getRandom(14000, 16000);
			const offsetScale = 1.6;

			const asteroid = new Asteroid({
				type: 'sphere',
				width: this.models[model].size.x,
				height: this.models[model].size.y,
				depth: this.models[model].size.z,
				geometry: this.models[model],
				material: finalMat,
				pos,
				rot,
				force,
				scale,
				offsetScale,
				range,
				speed,
				timeRotate
			});

			asteroid.mesh.index = i;
			asteroid.speedZ = getRandom(0.3, 0.8);
			asteroid.pos = pos;

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

			global.CURSOR.interractLeave();

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

	onClickStart(e) {

		// e.preventDefault();

		if (this.clicked === true) return false;
		this.clicked = true;



		// const tl = new TimelineMax({delay: 2});
		const tl = new TimelineMax();

		tl.add(() => {
			console.log('switch water');
			// Clean water and replace it !
			const obj = this.scene.getObjectByName('water');
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
			this.scene.remove( obj );
			this.initWater(true, true);
		}, '+=1.8');

		// tl.to(this.symbol.mesh.position, 10, {y: this.symbol.endPointY, z: this.symbol.endPointZ, ease: window.Expo.easeOut }, '+=0.2');
		// tl.to(this.symbol.mesh.material, 0.5, {opacity: 0 }, 1.5);

		tl.to(this.UI.button, 0.5, {opacity: 0}, 0);
		tl.set(this.UI.button, {opacity: 0, display: 'none'}, 0.5);


	}

	raf() {

		// Manual simulation of infinite waves
		let pointX = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.x : Math.sin(this.clock.getElapsedTime() * 7 ) * (this.BOUNDS - this.BOUNDSSUP) / 4;
		let pointZ = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.z : -(this.BOUNDS - this.BOUNDSSUP) / 2;

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
		this.waterMesh.position.y -= 0.0015;

		// console.log(this.waterMesh.position);


		if (this.gravity === true && this.startMove === true) this.world.step();

		// Moving Icebergs
		this.asteroids.forEach((el) => {

			// el.mesh.position.z -= 1 * el.speedZ;
			// if (el.mesh.position.z >= 200) el.mesh.position.z = -300;

			// Move top and bottom --> Float effect
			// Start Number + Math.sin(this.time*2*Math.PI/PERIOD)*(SCALE/2) + (SCALE/2)
			if (el.animated === false) {
				el.mesh.position.y = el.body.position.y = 4; // constraint pos y
			}

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
					// el.mesh.position.z = el.body.position.z =
					// el.body.position.x = el.mesh.position.x = getRandom(this.astXMin, this.astXMax);

					let z = el.mesh.index % 2 === 0 ? getRandom(0, -300) : -300;
					let x = getRandom(this.astXMin, this.astXMax);
					el.mesh.position.z = el.body.position.z = z;
					el.body.position.x = el.mesh.position.x = x;

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
			this.camera.rotation.y = clamp(this.camRotSmooth.y, -0.13, 0.13); // --> radian

		}

		if (this.startIsHover !== true) {
			if (this.clickAsteroid === true) global.CURSOR.interractHover();
			else global.CURSOR.interractLeave();
		}



		this.render();


	}

	transitionIn() {

		this.el.classList.add('intro');
		this.el.classList.remove('project');
		this.el.classList.remove('about');
		// set ui
		this.UI.intro.style.display = 'block';
		global.MENU.el.classList.remove('is-active');

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
		}, 1);
		tl.to([this.UI.title1,this.UI.title2], 2, {autoAlpha: 0}, '+=3');
		tl.set(this.UI.button, {opacity: 0, display: 'block'}, '+=1.5');
		tl.to(this.UI.button, 3, {opacity: 1});

		tl.add(() => {
			// start move Ast
			this.startMove = true;
		},0);


		tl.to('.overlay', 1, {
			opacity: 0
		}, 0);
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

		// const tl2 = new TimelineMax();

		// tl2.to(this.camera.position, 2, {y: 100, ease: window.Expo.easeOut});
		// tl2.to(this.camera.rotation, 3, {x: toRadian(0), ease: window.Expo.easeOut}, 0);
		// // tl2.to(this.camera.position, 2, {z: 0}, 2);
		// tl2.to(this.camera.rotation, 2, {x: toRadian(45), ease: window.Expo.easeOut}, '-=1');
		// tl2.to(this.camera.position, 4, {z: -5000, y: 2000}, '-=2');
		// // tl2.to(this.camera.rotation, 2, {x: toRadian(90)})

		// return false;

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
				'y': 100,
				'z': -100
			}, {
				'x': 0,
				'y': 300,
				'z': -3000
			}],
			'lookat': [{
				'x': 0,
				'y': 0,
				'z': -1
			}, {
				'x': 0,
				'y': 100, // symbol.endPointY = 2000;
				'z': -200 // symbol.endPointZ = 5000;
			}, {
				'x': 0,
				'y': 300, // symbol.endPointY = 2000;
				'z': -3000 // symbol.endPointZ = 5000;
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

				// EmitterManager.emit('router:switch', '/project-0', 0);
				EmitterManager.emit('view:transition:out');
			}
		});

		tl.to(this.dolly, 4, {
			cameraPosition: 1,
			lookatPosition: 1,
			ease: window.Power4.easeIn,
			onUpdate: () => {
				this.dolly.update();
			}
		});

		tl.to('.overlay', 0.5, {
			opacity: 1
		}, 2.9);

	}

	resizeHandler() {
		super.resizeHandler();
		const obj = this.scene.getObjectByName('water');
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
		this.scene.remove( obj );

		this.initWater(true);
	}


}
