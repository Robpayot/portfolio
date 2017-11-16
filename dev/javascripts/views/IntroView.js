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


import { Vector2, Raycaster, Vector3, Scene, MeshLambertMaterial, BoxGeometry, DoubleSide, DirectionalLight, PointLight, RepeatWrapping, TextureLoader, PlaneGeometry, Mesh, MeshBasicMaterial, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color, MeshPhongMaterial, RGBFormat, LinearFilter } from 'three';
import OrbitControls from '../vendors/OrbitControls';
import '../shaders/ScreenSpaceShader';
import '../shaders/FFTOceanShader';
import '../shaders/OceanShader';
import '../vendors/MirrorRenderer';
import Ocean from '../vendors/Ocean';
console.log(Ocean);
// import GPUComputationRenderer from '../vendors/GPUComputationRenderer';
// import HeightmapFragmentShader from '../shaders/HeightmapFragmentShader';
// import SmoothFragmentShader from '../shaders/SmoothFragmentShader';
// import WaterVertexShader from '../shaders/WaterVertexShader';


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
			loadJSON('datas/models/iceberg-1.json'),
			loadJSON('datas/models/iceberg-2.json'),
			loadJSON('datas/models/iceberg-3.json'),
			loadJSON('datas/models/triangle.json'),
			loadJSON('datas/models/triangles.json'),
			loadJSON('datas/models/triangles_circle.json')
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

		// SceneManager.renderer.setPixelRatio( clamp(window.devicePixelRatio, 1, 1.5)); // passer à 1.5 si rétina
		// console.log(clamp(window.devicePixelRatio, 1, 1.5));

		// set Camera
		this.setCamera();
		this.setCameraPos();

		// set Light
		this.setLight();

		// Set physics
		if (this.gravity === true) this.initPhysics();

		this.nbAst = 20;
		this.minZoom = 400;
		this.maxZoom = 700;
		this.asteroids = [];
		this.asteroidsM = [];
		this.asteroidsMove = false;
		this.maxDash = 635;

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

		this.setAsteroids();
		this.setPhysicPath();


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

		console.log('setCamera');

		// this.camera.position.set(0, 30, 0);
		// this.camera.rotation.x = toRadian(-90);
		// debug add this.controls
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

		let gsize = 512; // size of a square which is repeated
		let res = 512;
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

		this.plane.position.y = this.maxZoom;
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
		let sun = new DirectionalLight( 0xFFFFFF, 1 );
		sun.position.set( 600, 1000, 0 );
		this.scene.add( sun );

		let sun2 = new DirectionalLight( 0xFFFFFF, 0.65 );
		sun.position.set( -300, 1000, 100 );
		this.scene.add( sun2 );

		// let light = new PointLight( 0xFFFFFF, 0.5, 1000 );
		// light.position.set( 0, 100, 0 );
		// this.scene.add( light );

		// light = new PointLight( 0xFFFFFF, 0.5, 1000 );
		// light.position.set( -40, 100, 0 );
		// this.scene.add( light );

		let mat, mesh;

		mat = new MeshPhongMaterial( {
			color: 0xffffff,
			flatShading: true
		} );
		mesh = new Mesh(this.models[0], mat);
		mesh.position.y = 20;
		mesh.position.x = -20;
		mesh.scale.set(0.075, 0.075, 0.075); // old iceberg


		// this.scene.add(mesh);

		mat = new MeshPhongMaterial( {
			color: 0xffffff,
			flatShading: true
		} );
		mesh = new Mesh(this.models[3], mat);
		mesh.position.y = 20;
		mesh.position.x = 20;
		mesh.scale.set(15, 15, 15);
		// mesh.scale.set(0.075, 0.075, 0.075); // old iceberg


		// this.scene.add(mesh);

		mat = new MeshPhongMaterial( {
			color: 0xffffff,
			flatShading: true
		} );
		mesh = new Mesh(this.models[4], mat);
		mesh.position.y = 0;
		mesh.position.x = 0;
		mesh.scale.set(25, 25, 25);
		// mesh.scale.set(0.075, 0.075, 0.075); // old iceberg


		this.scene.add(mesh);

	}

	setPhysicPath() {

		let mat;

		mat = new MeshBasicMaterial( {
			color: 0x0000ff,
			side: DoubleSide,
			transparent: true,
			opacity: 0.2
		} );

		let blocksParams = [{
			size: {w: 150, h: 150, d: 150},
			pos: {x: 10, y: 0, z: -120},
			rot: {x: 0, y: -40, z: 0}
		}, {
			size: {w: 180, h: 180, d: 180},
			pos: {x: -180, y: 0, z: 100},
			rot: {x: 0, y: 0, z: 0}
		}, {
			size: {w: 180, h: 180, d: 180},
			pos: {x: -220, y: 0, z: 0},
			rot: {x: 0, y: 40, z: 0}
		}, {
			size: {w: 50, h: 50, d: 50},
			pos: {x: 130, y: 0, z: 50},
			rot: {x: 0, y: 40, z: 0}
		}, {
			size: {w: 40, h: 40, d: 40},
			pos: {x: 180, y: 0, z: -60},
			rot: {x: 0, y: 45, z: 0}
		}];

		this.blocks = [];


		blocksParams.forEach((el) => {
			let mesh = new Mesh(new BoxGeometry(el.size.w, el.size.h, el.size.d), mat);
			mesh.visible = this.isControls;

			this.scene.add(mesh);

			// physic body
			mesh.physics = {
				type: 'box', // type of shape : sphere, box, cylinder
				// size: [geometry.parameters.radius, geometry.parameters.radius, geometry.parameters.radius], // size of shape
				size: [el.size.w, el.size.h, el.size.d],
				pos: [el.pos.x, el.pos.y, el.pos.z], // start position in degree
				rot: [el.rot.x, el.rot.y, el.rot.z], // start rotation in degree
				move: false, // dynamic or statique
				density: 1,
				friction: 0.2,
				restitution: 0.2,
				belongsTo: 1, // The bits of the collision groups to which the shape belongs.
				collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
			};

			if (this.gravity === true) {
				// add physic body to world
				mesh.body = this.world.add(mesh.physics);
			}

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
		this.astXMin = -380;
		this.astXMax = 380;
		this.ipRadius = 50; // intra perimeter Radius
		this.startZ = -600;
		this.reappearZ = -300;
		this.endZ = 200;

		for (let i = 0; i < this.nbAst; i++) {

			// const model = Math.round(getRandom(0, 2));
			const model = 3;

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
				z: getRandom(30, 40)
			};

			const scale = getRandom(10, 17);
			// const speed = getRandom(500, 600); // more is slower
			const range = getRandom(2, 5);
			const timeRotate = getRandom(14000, 16000);
			const offsetScale = -10;

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
				// speed,
				timeRotate
			});

			asteroid.mesh.index = i;
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

	onMouseMove( e ) {

		const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		this.mouse.x = eventX / window.innerWidth * 2 - 1;
		this.mouse.y = -(eventY / window.innerHeight) * 2 + 1;

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

		tl.fromTo('.start p', 1, {y: 20}, {y:0, ease: window.Expo.easeOut}, 0);
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
			this.currentAstClicked.animated = true;
			this.onAsteroidAnim = true;
			const dest = this.currentAstClicked.height * this.currentAstClicked.scale * 2;

			const tl = new TimelineMax();

			tl.to([this.currentAstClicked.mesh.position, this.currentAstClicked.body.position], 2.5, {y: -dest, ease: window.Expo.easeOut});

			tl.add(()=> {
				this.onAsteroidAnim = false;
			}, 0.5);

		}
	}

	raf() {

		// Ocean
		this.ms_Ocean.deltaTime = this.clock.getDelta();
		this.ms_Ocean.render();

		if (this.gravity === true && this.startMove === true) this.world.step();

		// physics Path
		this.blocks.forEach((el) => {
			el.position.copy(el.body.getPosition());
			el.quaternion.copy(el.body.getQuaternion());
		});

		// Moving Icebergs
		this.asteroids.forEach((el) => {

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
					// el.body.angularVelocity.y = clamp(el.body.angularVelocity.y, -0.5, 0.5);
					el.body.angularVelocity.y = 0;
					el.body.angularVelocity.z = 0;
				}


				el.mesh.position.copy(el.body.getPosition());
				el.mesh.quaternion.copy(el.body.getQuaternion());
				if (el.mesh.position.z >= 200) {
					// el.mesh.position.z = el.body.position.z =
					// el.body.position.x = el.mesh.position.x = getRandom(this.astXMin, this.astXMax);

					let z = el.mesh.index % 2 === 0 ? getRandom(0, this.reappearZ) : this.reappearZ;
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

		// glitch title
		if (this.glitch) {

			if (this.glitch.start === true) {
				this.glitch.render({type: 'intro'});
			} else {
				if (this.glitch.stop !== true) {
					this.glitch.render({stop: true});
					this.glitch.stop = true;
				}
			}
		}

		// move sky
		this.skyTex.offset.x = this.clock.getElapsedTime() * 0.05;

		this.render();


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
				textSize: 50,
				sndColor: 'red',
				color: 'black',
				txt: 'R O B I N   P A Y O T',
				sndTxt: 'I N T E R A C T I V E   D E V E L O P E R',
				clock: this.clock
			});

			const canvas = this.glitchEl.querySelector('.glitch__canvas');

			const tl = new TimelineMax();

			tl.set(this.ui.overlay, {opacity: 1});
			tl.set(canvas, {opacity: 0, visibility: 'visible', display: 'block'});

			tl.fromTo(canvas, 0, { // 3
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
			tl.to(this.ui.overlay, 1.5, {opacity: 0}, 4);
			tl.add(() => {
				this.moveCameraIn(fromProject);
			}, 2);
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
			tl.fromTo(this.camera.position, 5, {y: this.maxZoom }, {y: this.minZoom, ease: window.Expo.easeOut}, 0);
		} else {
			tl.to(this.camera.position, 7, {y: this.minZoom, ease: window.Expo.easeInOut});
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
	}


}
