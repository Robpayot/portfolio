import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import {toRadian, getRandom, clamp, round } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import Asteroid from '../shapes/Asteroid';
// import SplitText from '../vendors/SplitText.js';
import { Device } from '../helpers/Device';
import Ui from '../components/Ui';
import { loadJSON } from '../helpers/utils-three';
import Glitch from '../components/Glitch';
import Handlebars from 'handlebars';
import DATA from '../../datas/data.json';
import PreloadManager from '../managers/PreloadManager';


import { Vector2, Raycaster, Vector3, Scene, SphereGeometry, BoxGeometry, DoubleSide, DirectionalLight, PointLight, RepeatWrapping, TextureLoader, PlaneGeometry, Mesh, MeshBasicMaterial, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color, MeshPhongMaterial, RGBFormat, LinearFilter } from 'three';
import OrbitControls from '../vendors/OrbitControls';
import '../shaders/ScreenSpaceShader';
import '../shaders/FFTOceanShader';
import '../shaders/OceanShader';
import '../vendors/MirrorRenderer';
import Ocean from '../vendors/Ocean';
import p2 from 'p2';
// import GPUComputationRenderer from '../vendors/GPUComputationRenderer';
// import HeightmapFragmentShader from '../shaders/HeightmapFragmentShader';
// import SmoothFragmentShader from '../shaders/SmoothFragmentShader';
// import WaterVertexShader from '../shaders/WaterVertexShader';

console.log(p2);


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
		this.initWater = this.initWater.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.setLight = this.setLight.bind(this);
		this.moveCameraIn = this.moveCameraIn.bind(this);
		this.transitionIn = this.transitionIn.bind(this);
		this.transitionOut = this.transitionOut.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onHoverStart = this.onHoverStart.bind(this);
		this.onLeaveStart = this.onLeaveStart.bind(this);

		// preload Models
		Promise.all([
			loadJSON('datas/models/triangle.json'),
			loadJSON('datas/models/triangles_y.json'),
			loadJSON('datas/models/triangles_y6.json')
		]).then((results) => {
			// when all is loaded
			this.models = results;
			this.init();

			this.events(true);
			// this.ui.overlay.classList.add('black');

			this.transitionIn(!obj.fromUrl);

		}, (err) => {
			console.log(err);
			// error here
		});

		// init
		console.log(this.ui);

		// this.onClickStart();

	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.raf);

		if (Device.touch === false) {
			// move camera
			EmitterManager.on('mousemove', this.onMouseMove);
		} else {
			document[evListener]( 'touchstart', this.onDocumentTouchStart, false );
			document[evListener]( 'touchmove', this.onDocumentTouchMove, false );
		}

		document[evListener]( 'keydown', this.onW , false );
		document[evListener]( 'click', this.onClick , false );

		this.ui.button[evListener]('mouseenter', this.onHoverStart);
		this.ui.button[evListener]('mouseleave', this.onLeaveStart);

	}

	init() {

		this.setUiContainer();
		// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		this.scene = new Scene();
		this.scene.background = new Color(0x000000);

		this.sceneMirror = new Scene(); // scene only for reflect of Ocean
		this.sceneMirror.background = new Color(0x000000);

		this.sceneTest = new Scene(); // scene only for reflect of Ocean
		this.sceneTest.background = new Color(0x000000);

		// SceneManager.renderer.setPixelRatio( clamp(window.devicePixelRatio, 1, 1.5)); // passer à 1.5 si rétina
		// console.log(clamp(window.devicePixelRatio, 1, 1.5));

		// set Camera
		this.setCamera();
		this.setCameraPos();

		// set Light
		this.setLight();

		// Set physics
		if (this.gravity === true) this.initPhysics([0,0]);

		this.nbAst = 25;
		this.minZoom = 400;
		this.maxZoom = 700;
		this.asteroids = [];
		this.asteroidsM = [];
		this.asteroidsMove = false;
		this.maxDash = 635;
		this.maxSubSteps = 60; // for p2

		this.raycaster = new Raycaster();

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

		this.mouseSize = 40.0;
		this.mouseSizeClick = 30.0;
		this.viscosity = 0.015;
		this.viscosityClick = 0.015;

		this.effectController = {
			mouseSize: this.mouseSize,
			viscosity: this.viscosity
		};

		this.initWater(false, false);
		this.setPhysicBlocks();
		this.setAsteroids();

		this.resizeHandler(); // size first time


		global.CURSOR.el.classList.add('alt');

	}

	setUiContainer() {

		const data = DATA;

		// Intro content
		let template = Handlebars.compile(PreloadManager.getResult('tpl-intro-content'));
		let html  = template(data);

		this.UI.content.className = '';
		this.UI.content.classList.add('ui-content', 'is-intro');
		this.UI.content.innerHTML = html;

		this.ui.button = document.querySelector('.start');
		this.ui.overlay = document.querySelector('.intro__overlay');

	}

	////////////////////
	// SET SCENE
	////////////////////

	setCameraPos() {

		this.camera.position.set(0, 70, 0);
		this.camera.rotation.x = toRadian(-90);
	}

	initWater() {

		// SceneManager.renderer.setPixelRatio( window.devicePixelRatio );
		SceneManager.renderer.context.getExtension('OES_texture_float');
		SceneManager.renderer.context.getExtension('OES_texture_float_linear');

		// Get size Three unit to pixel window
		const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		this.heightCamera = 2 * Math.tan( vFOV / 2 ) * (this.maxZoom + 200); // dist between 0 and camerapos.y

		this.aspect = window.innerWidth / window.innerHeight;

		if (this.aspect > 1) {
			// landscape
			this.finalBounds = this.heightCamera * this.aspect;
		} else {
			this.finalBounds = this.heightCamera;
		}

		// this.ms_MainDirectionalLight = new DirectionalLight( 0xffffff, 1.5 );
		// this.ms_MainDirectionalLight.position.set( -0.2, -0.5, 1 );
		// this.scene.add( this.ms_MainDirectionalLight );

		let gsize = 256; // size of a square which is repeated
		let res = 256; // 512 :'(
		let gres = gsize / 2;
		// let origx = -gsize / 2;
		// let origz = -gsize / 2;
		this.ms_Ocean = new Ocean( SceneManager.renderer, this.camera, this.scene,{
			INITIAL_SIZE : 200.0,
			INITIAL_WIND : [ 10.0, 10.0 ],
			INITIAL_CHOPPINESS : 3.6,
			CLEAR_COLOR : [ 1.0, 1.0, 1.0, 0.0 ],
			// SUN_DIRECTION : this.ms_MainDirectionalLight.position.clone(), // affect reflects colors (not mirrored)
			OCEAN_COLOR: new Vector3( 2, 2, 2 ), // affect reflects colors (not mirrored)
			SKY_COLOR: new Vector3( 1, 1, 1 ), // affect reflects colors (not mirrored)
			EXPOSURE : 0.40,
			GEOMETRY_RESOLUTION: gres,
			GEOMETRY_SIZE : gsize,
			RESOLUTION : res,
			SCENEMIRROR : this.sceneMirror
		} );

		// Simple top Plane for Mirror
		this.skyTex = new TextureLoader().load( `${global.BASE}/images/textures/intro2_up.jpg` );
		this.skyTex.wrapS = this.skyTex.wrapT = RepeatWrapping;
		this.skyTex.offset.x = 0.5;
		this.skyTex.repeat.set( 1, 1 );
		this.plane = new Mesh(
			new PlaneGeometry(this.finalBounds * 2, this.finalBounds * 2),
			new MeshBasicMaterial({map: this.skyTex, side: DoubleSide})
		);

		this.plane.position.y = this.maxZoom - 400;
		this.plane.rotation.x = toRadian(-90);

		this.sceneMirror.add( this.plane );

		this.ms_Ocean.materialOcean.uniforms.u_projectionMatrix = { value: this.camera.projectionMatrix };
		this.ms_Ocean.materialOcean.uniforms.u_viewMatrix = { value: this.camera.matrixWorldInverse };
		this.ms_Ocean.materialOcean.uniforms.u_cameraPosition = { value: this.camera.position };
		this.scene.add(this.ms_Ocean.oceanMesh);

		let gui = new dat.GUI();
		let c1 = gui.add(this.ms_Ocean, 'size',100, 5000);
		c1.onChange(function(v) {
			this.object.size = v;
			this.object.changed = true;
		});
		let c2 = gui.add(this.ms_Ocean, 'choppiness', 0.1, 4);
		c2.onChange(function(v) {
			this.object.choppiness = v;
			this.object.changed = true;
		});
		let c3 = gui.add(this.ms_Ocean, 'windX',-15, 15);
		c3.onChange(function(v) {
			this.object.windX = v;
			this.object.changed = true;
		});
		let c4 = gui.add(this.ms_Ocean, 'windY', -15, 15);
		c4.onChange(function(v) {
			this.object.windY = v;
			this.object.changed = true;
		});
		let c8 = gui.add(this.ms_Ocean, 'exposure', 0.0, 6);
		c8.onChange(function(v) {
			this.object.exposure = v;
			this.object.changed = true;
		});
	}

	setLight() {
		let sun = new DirectionalLight( 0xFFFFFF, 1.2 );
		sun.position.set( 600, 1000, 0 );
		this.scene.add( sun );

		let sun2 = new DirectionalLight( 0xFFFFFF, 1 );
		sun.position.set( -300, 1000, 100 );
		this.scene.add( sun2 );

		// let light = new PointLight( 0xFFFFFF, 0.5, 1000 );
		// light.position.set( 0, 100, 0 );
		// this.scene.add( light );

		// light = new PointLight( 0xFFFFFF, 0.5, 1000 );
		// light.position.set( -40, 100, 0 );
		// this.scene.add( light );

	}

	setPhysicBlocks() {

		// Create a physics world, where bodies and constraints live

		// // Add a circle
		// this.circleShape = new p2.Circle({ radius: 10 });
		// this.circleBody = new p2.Body({ mass:180, position:[0,200] });
		// this.circleBody.addShape(this.circleShape);
		// this.world.addBody(this.circleBody);

		// // Add 2nd circle
		// this.circleShape2 = new p2.Circle({ radius: 10 });
		// this.circleBody2 = new p2.Body({ mass:180, position:[2,250], angularVelocity: 0, velocity:[0,0], force: [0,0] }); // angularVelocity == accélération de rotation de départ
		// this.circleBody2.addShape(this.circleShape2);
		// this.world.addBody(this.circleBody2);


		let mat, mesh;

		// mat = new MeshBasicMaterial( {
		// 	color: 0xffff00,
		// 	transparent: true,
		// 	opacity: 0.8
		// } );

		// this.perimeter = 10;

		// this.circleMesh = new Mesh(new SphereGeometry(this.circleShape.radius, this.circleShape.radius, this.circleShape.radius), mat);
		// this.circleMesh.position.x = this.circleBody.position[0];
		// this.circleMesh.position.z = -this.circleBody.position[1];

		// this.scene.add(this.circleMesh);

		// mat = new MeshBasicMaterial( {
		// 	color: 0xffff00,
		// 	transparent: true,
		// 	opacity: 0.8
		// } );

		// this.perimeter = 10;

		// this.circleMesh2 = new Mesh(new SphereGeometry(this.circleShape2.radius, this.circleShape2.radius, this.circleShape2.radius), mat);
		// this.circleMesh2.position.x = this.circleBody2.position[0];
		// this.circleMesh2.position.z = -this.circleBody2.position[1];

		// this.scene.add(this.circleMesh2);

		// Island
		mat = new MeshPhongMaterial( {
			color: 0xffffff,
			flatShading: true
		} );
		mesh = new Mesh(this.models[2], mat);
		mesh.position.y = 0;
		mesh.position.x = 0;
		mesh.rotation.y = toRadian(-180);
		mesh.scale.set(33, 33, 33);
		// mesh.scale.set(0.075, 0.075, 0.075); // old iceberg


		this.scene.add(mesh);

		// invisble perimeter
		mat = new MeshBasicMaterial( {
			color: 0xffff00,
			transparent: true,
			opacity: 0.4
		} );

		this.perimeter = 220;

		mesh = new Mesh(new SphereGeometry(this.perimeter, this.perimeter, this.perimeter), mat);
		mesh.visible = this.isControls;

		// this.scene.add(mesh);

		// Invisible blocks

		mat = new MeshBasicMaterial( {
			color: 0x0000ff,
			transparent: true,
			opacity: 0.2
		} );

		this.fZone = 25; // Zone where asteroids can't appear. Or physic conflicts

		let blocksParams = [{
			size: {w: this.fZone * 2, h: 120, d: 160},
			pos: {x: 0, y: 0, z: 70},
			rot: {x: 0, y: 0, z: 0}
		}, {
			size: {w: 42, h: 160, d: 160},
			pos: {x: -45, y: 0, z: -40},
			rot: {x: 0, y: -45, z: 0}
		}, {
			size: {w: 44, h: 95, d: 160},
			pos: {x: 58, y: 0, z: -73},
			rot: {x: 0, y: 40, z: 0}
		},{
			size: {w: 40, h: 40, d: 60},
			pos: {x: 0, y: 0, z: 130},
			rot: {x: 0, y: -40, z: 0}
		}];

		this.blocks = [];


		blocksParams.forEach((el) => {

			// Add a Shape
			let boxShape = new p2.Box({ width: el.size.w, height: el.size.h});
			// create mesh related
			let mesh = new Mesh(new BoxGeometry(boxShape.width, boxShape.width, boxShape.height), mat);
			mesh.visible = this.isControls;

			// Add a physic Body
			mesh.body = new p2.Body({
				mass: 0, // mass 0 = static
				position: [el.pos.x, el.pos.z],
				angle: toRadian(el.rot.y)
			});
			mesh.body.addShape(boxShape);

			if (this.gravity === true) {
				// add physic body to world
				this.world.addBody(mesh.body);
			}

			// copy positions and rotation
			mesh.position.x = mesh.body.position[0];
			mesh.position.z = -mesh.body.position[1];
			mesh.rotation.y = mesh.body.angle;

			this.scene.add(mesh);

			this.blocks.push(mesh);
		});

	}

	// generateGradient() {

	// 	// Use a classic image for better pef

	// 	const size = 512;

	// 	// create canvas
	// 	let canvas = document.createElement( 'canvas' );
	// 	canvas.width = size;
	// 	canvas.height = size;

	// 	// get context
	// 	const context = canvas.getContext( '2d' );

	// 	// draw gradient
	// 	context.rect( 0, 0, size, size );
	// 	const gradient = context.createRadialGradient(size / 2,size / 2,size,size / 2,size / 2,100);
	// 	gradient.addColorStop(1, '#e9ebee'); // white-grey
	// 	gradient.addColorStop(0.98, '#e9ebee');
	// 	gradient.addColorStop(0.9, '#000000');
	// 	gradient.addColorStop(0, '#000000'); // dark
	// 	context.fillStyle = gradient;
	// 	context.fill();


	// 	const image = new Image();
	// 	image.id = 'pic';
	// 	image.src = canvas.toDataURL();
	// 	document.documentElement.appendChild(image);

	// 	return image;

	// }

	setAsteroids() {

		// ADD Iceberg
		this.astXMin = -this.perimeter;
		this.astXMax = this.perimeter;
		this.startZ = -600;
		this.reappearZ = -300;
		this.endZ = 200;

		for (let i = 0; i < this.nbAst; i++) {

			// const model = Math.round(getRandom(0, 2));
			const model = 0;

			let finalMat = new MeshPhongMaterial( {
				color: 0xffffff,
				flatShading: true
			} );
			// console.log(finalMat);

			// finalMat.shininess = 1;

			const rot = {
				x: 0,
				y: getRandom(-180, 180),
				z: 0,
			};


			let pos = {
				x: getRandom(this.astXMin, this.astXMax),
				y: 0,
				z: getRandom(this.startZ, this.endZ),
			};
			if (pos.x > -this.fZone && pos.x < this.fZone ) {
				pos.x = i % 2 === 0 ? pos.x + this.fZone * 2 : pos.x - this.fZone * 2;
			}

			// check if ast already in other ast position
			for (let y = 0; y < this.asteroidsM.length; y++) {
				if (pos.x < this.fZone + this.asteroidsM[y].position.x && pos.x > -this.fZone + this.asteroidsM[y].position.x && pos.z < this.fZone + this.asteroidsM[y].position.z && pos.z > -this.fZone + this.asteroidsM[y].position.z) {
					// console.log(i, ' dans le périmetre !');
					pos.x += this.fZone;
					pos.z += this.fZone;

				}
			}

			//  force impulsion
			const force = {
				x: 0,
				y: 0,
				z: getRandom(-20, -25)
			};

			const scale = getRandom(8, 12);
			// const speed = getRandom(500, 600); // more is slower
			// const range = getRandom(2, 5);
			const range = 0;
			const timeRotate = getRandom(14000, 16000);
			const offsetScale = -10;

			const asteroid = new Asteroid({
				type: 'circle',
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
				// speed,
				timeRotate,
				physics: true,
				angularVelocity: getRandom(-1,1)
			});

			asteroid.mesh.index = i;
			asteroid.pos = pos;

			if (this.gravity === true) {
				// add physic body to world
				this.world.addBody(asteroid.body);
			}

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);

		}
	}

	onMouseMove( x, y ) {

		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		this.mouse.x = x / window.innerWidth * 2 - 1;
		this.mouse.y = -(y / window.innerHeight) * 2 + 1;

	}

	onHoverStart() {

		this.startIsHover = true;
		global.CURSOR.interractHover();
		if (this.animBtn === true) return false;

		const tl = new TimelineMax();
		TweenMax.killTweensOf(['.start .close-up','.start .close-down','.start .open-up','.start .open-down']);
		TweenMax.to('.start circle', 0, {opacity: 0});

		tl.to('.start .close-up', 1, {strokeDashoffset: -this.maxDash * 2, ease: window.Expo.easeOut}, 0);
		tl.to('.start .close-down', 1.2, {strokeDashoffset: this.maxDash * 3 + 205, ease: window.Expo.easeOut}, 0);
		tl.set(['.start .close-up','.start .close-down','.start .open-up','.start .open-down'], {clearProps: 'all'});
		tl.add(()=> {
			this.animBtn = false;
		});

		tl.fromTo('.start p', 1, {y: 20}, {y: 0, ease: window.Expo.easeOut}, 0);
		tl.fromTo('.start p', 0.2, {opacity: 0}, {opacity:1, ease: window.Linear.easeNone}, 0);
	}

	onLeaveStart() {
		global.CURSOR.interractLeave();
		this.startIsHover = false;
		TweenMax.fromTo('.start circle', 0.2, {opacity: 0}, {opacity: 1});
		TweenMax.fromTo('.start circle', 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});

		TweenMax.to('.start p', 1, {y: 20, ease: window.Expo.easeOut});
		TweenMax.to('.start p', 0.2, {opacity: 0, ease: window.Linear.easeNone});
	}

	onClick() {
		if (this.clickAsteroid === true) {

			global.CURSOR.interractLeave();

			this.currentAstClicked = this.currentAstHover;
			this.currentAstClicked.clicked = true;
			// this.onAsteroidAnim = true;
			// const dest = this.currentAstClicked.height * this.currentAstClicked.scale * 2;

			// const tl = new TimelineMax();

			// tl.to([this.currentAstClicked.mesh.position, this.currentAstClicked.body.position], 2.5, {y: -dest, ease: window.Expo.easeOut});

			// tl.add(()=> {
			// 	this.onAsteroidAnim = false;
			// }, 0.5);

		}
	}

	raf() {

		// Ocean
		this.ms_Ocean.deltaTime = this.clock.getDelta();
		this.ms_Ocean.render();

		// if (this.gravity === true && this.startMove === true) this.world.step( 1 / 60);
		if (this.gravity === true) this.world.step( 1 / 60);
		// Move physics bodies forward in time

		// this.circleBody.velocity[1] = -50; // --> garder la meme accélération pour flux constant
		// this.circleMesh.position.x = this.circleBody.position[0];
		// this.circleMesh.position.z = -this.circleBody.position[1]; // reverse axes
		// this.circleMesh.rotation.y = this.circleBody.angle;

		// console.log(this.circleBody.force[1], this.circleBody.velocity[1]);


		// this.circleBody2.velocity[1] = -50; // --> garder la meme accélération pour flux constant
		// this.circleMesh2.position.x = this.circleBody2.position[0];
		// this.circleMesh2.position.z = -this.circleBody2.position[1]; // reverse axes
		// this.circleMesh2.rotation.y = this.circleBody2.angle;


		// Moving Icebergs
		this.asteroids.forEach((el) => {

			if (el.body !== undefined ) {
				// el.mesh.position.copy(el.body.getPosition());
				// el.mesh.quaternion.copy(el.body.getQuaternion());
				el.mesh.position.x = el.body.position[0]; // copy positions
				el.mesh.position.z = -el.body.position[1]; // reverse axes
				el.mesh.rotation.y = el.body.angle;

				if (this.asteroidsMove === true) {
					// Apply IMPULSE
					// el.body.linearVelocity.x = el.force.x;
					// el.body.linearVelocity.x = clamp(el.body.linearVelocity.x, -el.force.z, el.force.z);
					// el.body.linearVelocity.y = el.force.y;
					// el.body.linearVelocity.z = el.force.z; // --> force perpetuelle
					// console.log(el.body.velocity[1]);
					// el.body.velocity[0] = clamp(el.body.velocity[0], -el.force.z, el.force.z); // x
					el.body.velocity[1] = clamp(el.force.z, -25, 0); // --> garder la meme accélération pour flux constant // "y"
					el.body.velocity[0] = clamp(el.body.velocity[0], -20, 20);

					// Clamp rotation

					// el.body.angularVelocity.x = 0;
					// el.body.angularVelocity.y = clamp(el.body.angularVelocity.y, -0.5, 0.5);
					// // el.body.angularVelocity.y = 0;
					// el.body.angularVelocity.z = 0;
				}

				if (el.animated === false) { // if no plonge, constant Y
					// el.mesh.position.y = el.body.position.y = 0; // constraint pos y
					el.mesh.position.y = 0; // constraint pos y
				}

				if ( el.reappear === true) {
					// refait surface
					el.mesh.position.y = el.mesh.position.y + 1;
					if (el.mesh.position.y >= el.endY) {
						el.reappear = false;
						el.animated = false;
					}
				}

				// if out of Perimeter, reset
				if ( Math.sqrt( Math.pow(Math.abs(el.mesh.position.x), 2) + Math.pow(Math.abs(el.mesh.position.z), 2) ) > this.perimeter || el.clicked === true) { // Théorème de Pythagore <3 . Calcule de la distance entre le point et le centre du cercle


					el.animated = true;
					// Plonge
					el.mesh.position.y = el.mesh.position.y - 1;

					if (el.mesh.position.y <= -20) {

						// reset position
						let z = el.mesh.index % 2 === 0 ? getRandom(-150, this.reappearZ) : this.reappearZ;
						let x = getRandom(this.astXMin, this.astXMax);
						if (x > -this.fZone && x < this.fZone ) {
							x = el.mesh.index % 2 === 0 ? x + this.fZone * 2 : x - this.fZone * 2;
						}

						// el.mesh.position.z = el.body.position.z = z;
						// el.body.position.x = el.mesh.position.x = x;
						el.mesh.position.x = el.body.position[0] = x; // copy positions
						el.mesh.position.z = z;
						el.body.position[1] = -z; // reverse axes
						el.body.angularVelocity = getRandom(-1,1);

						el.reappear = true;
						el.clicked = false;

						// const dest = el.height * el.scale;
						// console.log(el.endY);
					}

					// reboot
				}

			}
		});

		// Raycaster
		this.raycaster.setFromCamera(this.mouse, this.camera);

		// on Click asteroids
		const intersectsAst = this.raycaster.intersectObjects(this.asteroidsM);

		if (intersectsAst.length > 0) {
			this.clickAsteroid = true;
			this.currentAstHover = this.asteroids[intersectsAst[0].object.index];
		} else {
			this.clickAsteroid = false;
		}

		if (this.startIsHover !== true) {
			if (this.clickAsteroid === true) global.CURSOR.interractHover();
			else global.CURSOR.interractLeave();
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

		// glitch title
		// if (this.glitch) {

		// 	if (this.glitch.start === true) {
		// 		this.glitch.render();
		// 	} else {
		// 		if (this.glitch.stop !== true) {
		// 			this.glitch.render();
		// 			this.glitch.stop = true;
		// 		}
		// 	}
		// }

		// move sky
		// this.skyTex.offset.x = this.clock.getElapsedTime() * 0.05;


		// console.log(this.circleBody2.angle);
		this.render();

		// console.log(this.circleBody.position, this.planeBody.position);


	}

	transitionIn(fromProject = false) {

		this.el.classList.add('intro');
		this.el.classList.remove('project');
		this.el.classList.remove('about');
		// set ui
		this.UI.content.style.display = 'block';
		global.MENU.el.classList.remove('is-active');

		Ui.el.style.display = 'block';
		// const title1Arr = new SplitText(this.UI.title1, { type: 'chars' });
		// const title2Arr = new SplitText(this.UI.title2, { type: 'words' });

		if (fromProject === false) {
			this.glitchEl = document.querySelector('.intro__glitch');

			this.glitch = new Glitch({ // issue link to ui footer here but Css
				el: this.glitchEl,
				type: 'intro',
				clock: this.clock
			});

			const canvas = this.glitchEl.querySelector('.glitch__canvas');

			const tl = new TimelineMax();

			tl.set(this.ui.overlay, {opacity: 1});
			tl.set(canvas, {opacity: 0, visibility: 'visible', display: 'block'});

			tl.fromTo(canvas, 2, { // 3
				opacity: 0
			}, {
				opacity: 1,
				ease: window.Linear.easeNone
			}, 2);
			// tl.set([title1Arr.chars, title2Arr.words], {opacity: 0});
			// tl.set(this.asteroidsM.material, {opacity: 0});
			tl.add(() => {
				this.glitch.start = true;
			}, 0);
			tl.add(() => {
				// start move Ast
				this.startMove = true;
			});
			tl.to(this.ui.overlay, 1.5, {opacity: 0}, 4); // 1.5 ,, 4
			tl.add(() => {
				this.moveCameraIn(fromProject);
			}, 2); // 2
			tl.to(this.glitchEl, 1, {autoAlpha: 0, onComplete:()=> {
				this.glitch.start = false;
				console.log('stop');
			}}, '+=1');

			tl.set(this.ui.button, {opacity: 0, display: 'block'}, '+=1.5');
			tl.to(this.ui.button, 3, {opacity: 1});
			// tl.to('.overlay', 1, {
			// 	opacity: 0
			// }, 0);

		} else {

			const tl = new TimelineMax();
			// this.UI.title1.style.display = 'none';
			// this.UI.title2.style.display = 'none';

			this.camera.position.set(0, this.maxZoom, 0);
			this.camera.rotation.x = toRadian(-90);
			tl.add(() => {
				this.moveCameraIn(fromProject);
			}, 1.5);
			tl.set(this.ui.button, {opacity: 0, display: 'block'}, '+=1.5');
			tl.to(this.ui.button, 3, {opacity: 1});
			tl.to('.overlay', 1, {
				opacity: 0
			}, 1.6);

			tl.add(() => {
				// start move Ast
				this.startMove = true;
			},0);
		}

	}

	moveCameraIn(fromProject = false) {


		if (this.animating === true) return false;
		this.animating = true;

		const tl = new TimelineMax({
			onComplete: () => {
				this.cameraMove = false;
				this.currentCameraRotX = this.camera.rotation.x;

			}
		});

		if (fromProject === true) {
			tl.fromTo(this.camera.position, 5, {y: this.maxZoom }, {y: this.minZoom, ease: window.Expo.easeOut}, 0); // 5
		} else {
			tl.to(this.camera.position, 7, {y: this.minZoom, ease: window.Expo.easeInOut}); // 7
		}


		tl.add(() => {

			this.asteroidsMove = true;
		}, 0);

	}

	transitionOut(dest) {


		const tl = new TimelineMax({delay: 0});

		tl.to(this.ui.button, 0.5, {opacity: 0}, 0);
		tl.set(this.ui.button, {opacity: 0, display: 'none'}, 0.5);

		tl.fromTo(this.camera.position, 4, {y: this.minZoom }, {y: this.maxZoom + 200, ease: window.Expo.easeOut}, 0);
		tl.fromTo('.overlay', 1, {
			opacity: 0
		}, {
			opacity: 1,
			ease: window.Linear.easeNone
		}, 0);
		tl.add(() => {
			EmitterManager.emit('view:transition:out');
		},2);


		this.animating = true;
		this.cameraMove = true;


	}


}
