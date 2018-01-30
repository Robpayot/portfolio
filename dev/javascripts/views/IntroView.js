import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import {toRadian, getRandom, clamp, round, preventLink } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import Asteroid from '../shapes/Asteroid';
// import SplitText from '../vendors/SplitText.js';
import { Device } from '../helpers/Device';

// import Glitch from '../components/Glitch';
import Handlebars from 'handlebars';
import DATA from '../../datas/data.json';
import PreloadManager from '../managers/PreloadManager';


import { Raycaster, Vector3, Scene, SphereGeometry, BoxGeometry, DoubleSide, DirectionalLight, RepeatWrapping, PlaneGeometry, Mesh, MeshBasicMaterial, Color, MeshPhongMaterial } from 'three';
import OrbitControls from '../vendors/OrbitControls';
import '../shaders/ScreenSpaceShader';
import '../shaders/FFTOceanShader';
import '../shaders/OceanShader';
import '../vendors/MirrorRenderer';
import Ocean from '../vendors/Ocean';
import p2 from 'p2';
// GYRO JS
// import Gyro from '../vendors/gyro.min';
// import DeviceOrientationControls from '../vendors/DeviceOrientationControls';

// console.log(DeviceOrientationControls);


// import dat from 'dat-gui';

export default class IntroView extends AbstractView {

	constructor(obj) {

		super();

		// properties


		this.el = this.ui.webGl;
		this.gravity = obj.gravity;
		this.name = 'intro';
		this.debug = false;

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

		this.ui.debug = document.querySelector('.debug');


		this.models = global.MODELS;

		super.startScene();

		this.events(true);

		this.gyro = Device.touch; // device.gyro ?



		if (this.gyro === true) {
			// Gyro.frequency = 500;
			// Gyro.startTracking((o) => {
			// 	this.o = o;
			// }); // Stop periodic calls
			global.FIRST = true;
		}


		// init

		// this.onClickStart();


	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let listener = method === false ? 'off' : 'on';

		EmitterManager[listener]('resize', this.resizeHandler);
		EmitterManager[listener]('raf', this.raf);

		if (Device.touch === false) {
			// move camera
			EmitterManager.on('mousemove', this.onMouseMove);
			this.ui.button[evListener]('mouseenter', this.onHoverStart);
			this.ui.button[evListener]('mouseleave', this.onLeaveStart);
			document[evListener]( 'click', this.onClick , false );
		} else {

			this.ui.button[evListener]('touchstart', preventLink);
			// document[evListener]( 'touchstart', this.onDocumentTouchStart, false );
			// document[evListener]( 'touchmove', this.onDocumentTouchMove, false );
		}

	}

	init(sceneReady) {

		this.setUiContainer();

		this.scene = new Scene();
		this.scene.background = new Color(0xFFFFFF);

		this.sceneMirror = new Scene(); // scene only for reflect of Ocean
		this.sceneMirror.background = new Color(0x000000);

		// set Camera
		this.setCamera();
		this.setCameraPos();

		// set Light
		this.setLight();

		// Set physics
		if (this.gravity === true) this.initPhysics([0,0]);

		this.nbAst = Device.size === 'mobile' ? 20 : 30;
		this.minZoom = 900;
		this.maxZoom = 1700;
		if (Device.orientation === 'portrait') {
			this.maxZoom = 2700;
			this.minZoom = 1700;
		}
		this.asteroids = [];
		this.asteroidsM = [];
		this.asteroidsMove = false;
		this.maxDash = 635;
		this.maxSubSteps = 60; // for p2
		this.isOcean = !Device.touch; // Ocean issue on mobile and tablette device

		this.raycaster = new Raycaster();

		// Mouse
		this.mouse = { x: 0, y: 0 };
		this.o = { alpha: 0, beta: 0 };
		this.camRotTarget = new Vector3(0, 0, 0);
		this.camRotSmooth = new Vector3(0, 0, 0);

		// Camera controls
		if (this.debug === true) {
			this.controls = new OrbitControls(this.camera, SceneManager.renderer.domElement);
			this.controls.enableZoom = true;
		}

		if (this.isOcean) {
			this.initWater();
		} else {
			let geo = new PlaneGeometry(3000,3000);
			let mat = new MeshBasicMaterial({color: 0xFFFFFF});
			let ground = new Mesh(geo, mat);
			ground.position.y = 2;
			ground.rotation.x = toRadian(-90);
			this.scene.add(ground);
		}

		this.setPhysicBlocks();
		this.setAsteroids();


		// this.resizeHandler(); // size first time
		global.CURSOR.el.classList.add('alt'); // ie 11 issue : ClassList on svg
		global.OVERLAY.classList.add('is-intro');
		global.OVERLAY.classList.remove('is-about');

		sceneReady();


	}

	setUiContainer() {

		// Intro content
		let template = Handlebars.compile(PreloadManager.getResult('tpl-intro-content'));
		let html  = template(DATA.projects[0]);

		this.ui.uiContent.className = '';
		this.ui.uiContent.classList.add('ui-content', 'is-intro');
		this.ui.uiContent.innerHTML = html;

		this.ui.button = document.querySelector('.start');
		this.ui.buttonSvg = document.querySelector('.start svg');
		this.ui.overlay = document.querySelector('.intro__overlay');

	}

	////////////////////
	// SET SCENE
	////////////////////

	setCameraPos() {

		this.camera.position.set(0, 200, 0);
		this.currentCameraRotX = this.camera.rotation.x = toRadian(-90);
	}

	initWater() {

		// SceneManager.renderer.setPixelRatio( window.devicePixelRatio );
		// SceneManager.renderer.context.getExtension('OES_texture_float');
		// SceneManager.renderer.context.getExtension('OES_texture_float_linear');

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

		let gsize = 256; // size of a square which is repeated
		let res = 512; // 512 :'(
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
		this.skyTex = global.SKYTEX;

		this.skyTex.wrapS = this.skyTex.wrapT = RepeatWrapping;
		this.skyTex.offset.x = 0.5;
		this.skyTex.repeat.set( 1, 1 );
		this.plane = new Mesh(
			new PlaneGeometry(this.finalBounds * 2, this.finalBounds * 2),
			new MeshBasicMaterial({map: this.skyTex, side: DoubleSide}) // map: this.skyTex, color: white
		);

		this.plane.position.y = this.maxZoom - 400;
		this.plane.rotation.x = toRadian(-90);

		this.sceneMirror.add( this.plane );

		this.ms_Ocean.materialOcean.uniforms.u_projectionMatrix = { value: this.camera.projectionMatrix };
		this.ms_Ocean.materialOcean.uniforms.u_viewMatrix = { value: this.camera.matrixWorldInverse };
		this.ms_Ocean.materialOcean.uniforms.u_cameraPosition = { value: this.camera.position };
		this.scene.add(this.ms_Ocean.oceanMesh);

	}

	setLight() {
		let sun = new DirectionalLight( 0xFFFFFF, 0.9 );
		sun.position.set( 600, 1000, 0 );
		this.scene.add( sun );

		let sun2 = new DirectionalLight( 0xFFFFFF, 1.4 );
		sun.position.set( -300, 1000, 100 );
		this.scene.add( sun2 );

	}

	setPhysicBlocks() {

		let mat, mesh;

		// Island
		mat = new MeshPhongMaterial( {
			color: 0xffffff,
			flatShading: true
		} );
		mesh = new Mesh(this.models[1], mat);
		mesh.position.y = 5;
		mesh.position.x = 0;
		mesh.rotation.y = toRadian(-180);
		mesh.scale.set(60, 60, 60);
		// mesh.scale.set(0.075, 0.075, 0.075); // old iceberg


		this.scene.add(mesh);

		// invisble perimeter
		mat = new MeshBasicMaterial( {
			color: 0xffff00,
			transparent: true,
			opacity: 0.4
		} );

		this.perimeter = 490;

		mesh = new Mesh(new SphereGeometry(this.perimeter, this.perimeter, this.perimeter), mat);
		mesh.visible = this.debug;

		// this.scene.add(mesh);

		// Invisible blocks

		mat = new MeshBasicMaterial( {
			color: 0x0000ff,
			transparent: true,
			opacity: 0.2
		} );

		this.fZone = 49; // Zone where asteroids can't appear. Or physic conflicts

		let blocksParams = [{
			size: {w: this.fZone * 2, h: 245, d: 160},
			pos: {x: -4, y: 0, z: 100},
			rot: {x: 0, y: 0, z: 0}
		}, {
			size: {w: 85, h: 250, d: 160},
			pos: {x: -90, y: 0, z: -85},
			rot: {x: 0, y: -45, z: 0}
		}, {
			size: {w: 75, h: 185, d: 160},
			pos: {x: 115, y: 0, z: -130},
			rot: {x: 0, y: 40, z: 0}
		},{
			size: {w: 70, h: 70, d: 160},
			pos: {x: -4, y: 0, z: 227},
			rot: {x: 0, y: -40, z: 0}
		}];

		this.blocks = [];


		blocksParams.forEach((el) => {

			// Add a Shape
			let boxShape = new p2.Box({ width: el.size.w, height: el.size.h});
			// create mesh related
			let mesh = new Mesh(new BoxGeometry(boxShape.width, boxShape.width, boxShape.height), mat);
			mesh.visible = this.debug;

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

	setAsteroids() {

		// ADD Iceberg
		this.astXMin = -this.perimeter;
		this.astXMax = this.perimeter;
		this.startZ = -this.perimeter;
		this.reappearZ = -400;
		this.endZ = this.perimeter;

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
				z: getRandom(-25, -30)
			};

			const scale = getRandom(14, 16);
			// const speed = getRandom(500, 600); // more is slower
			// const range = getRandom(2, 5);
			const range = 0;
			const timeRotate = getRandom(14000, 16000);

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
		if (this.animBtn === true) return false;
		global.CURSOR.interractHover({magnet: true, el: this.ui.buttonSvg});

		const tl = new TimelineMax();
		TweenMax.killTweensOf(['.start .close-up','.start .close-down']);
		TweenMax.to('.start circle', 0, {opacity: 0});

		tl.to('.start .close-up', 1, {strokeDashoffset: -this.maxDash * 2, ease: window.Expo.easeOut}, 0);
		tl.to('.start .close-down', 1.2, {strokeDashoffset: this.maxDash * 3 + 205, ease: window.Expo.easeOut}, 0);
		tl.set(['.start .close-up','.start .close-down'], {clearProps: 'all'});
		tl.add(()=> {
			this.animBtn = false;
		});

		tl.fromTo('.start p', 1, {y: 20}, {y: 0, ease: window.Expo.easeOut}, 0);
		tl.fromTo('.start p', 0.2, {opacity: 0}, {opacity:1, ease: window.Linear.easeNone}, 0);

		// sound
		global.SOUNDS['hover'].play();
	}

	onLeaveStart() {

		global.CURSOR.interractLeave({magnet: true, el: this.ui.buttonSvg});
		this.startIsHover = false;
		TweenMax.fromTo('.start circle', 0.2, {opacity: 0}, {opacity: 1});
		TweenMax.set('.start circle', {transformOrigin: '50% 50%'});
		TweenMax.fromTo('.start circle', 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});

		TweenMax.to('.start p', 1, {y: 20, ease: window.Expo.easeOut});
		TweenMax.to('.start p', 0.2, {opacity: 0, ease: window.Linear.easeNone});
	}

	onClick() {
		if (this.clickAsteroid === true) {

			global.CURSOR.interractLeave();

			this.currentAstClicked = this.currentAstHover;
			this.currentAstClicked.clicked = true;
		}
	}

	raf() {

		// Ocean

		if (this.isOcean) {
			this.ms_Ocean.deltaTime = this.clock.getDelta();
			this.ms_Ocean.render();
		}


		if (this.gravity === true) this.world.step( 1 / 60); // p2.js gravity


		// Moving Icebergs

		for (let i = 0; i < this.nbAst; i++) {
			if (this.asteroids[i].body !== undefined ) {

				this.asteroids[i].mesh.position.x = this.asteroids[i].body.position[0]; // copy positions
				this.asteroids[i].mesh.position.z = -this.asteroids[i].body.position[1]; // reverse axes
				this.asteroids[i].mesh.rotation.y = this.asteroids[i].body.angle;

				if (this.asteroidsMove === true) {
					// Apply IMPULSE

					this.asteroids[i].body.velocity[1] = clamp(this.asteroids[i].force.z, -30, 0); // --> garder la meme accélération pour flux constant // "y"
					this.asteroids[i].body.velocity[0] = clamp(this.asteroids[i].body.velocity[0], -20, 20);

					// Clamp rotation

					// this.asteroids[i].body.angularVelocity.x = 0;
					// this.asteroids[i].body.angularVelocity.y = clamp(this.asteroids[i].body.angularVelocity.y, -0.5, 0.5);
					// // this.asteroids[i].body.angularVelocity.y = 0;
					// this.asteroids[i].body.angularVelocity.z = 0;
				}

				if (this.asteroids[i].animated === false) { // if no under water, constant Y
					this.asteroids[i].mesh.position.y = 0; // constraint pos y
				}

				if ( this.asteroids[i].reappear === true) {
					// refait surface
					this.asteroids[i].mesh.position.y = this.asteroids[i].mesh.position.y + 1;
					if (this.asteroids[i].mesh.position.y >= this.asteroids[i].endY) {
						this.asteroids[i].reappear = false;
						this.asteroids[i].animated = false;
					}
				}

				// if out of Perimeter, reset
				if ( Math.sqrt( Math.pow(Math.abs(this.asteroids[i].mesh.position.x), 2) + Math.pow(Math.abs(this.asteroids[i].mesh.position.z), 2) ) > this.perimeter || this.asteroids[i].clicked === true) { // Théorème de Pythagore <3 . Calcule de la distance entre le point et le centre du cercle


					this.asteroids[i].animated = true;
					// Plonge
					this.asteroids[i].mesh.position.y = this.asteroids[i].mesh.position.y - 2;

					if (this.asteroids[i].mesh.position.y <= -20) {

						// reset position
						let z = this.asteroids[i].mesh.index % 2 === 0 ? getRandom(-150, this.reappearZ) : this.reappearZ;
						let x = getRandom(this.astXMin, this.astXMax);
						if (x > -this.fZone && x < this.fZone ) {
							x = this.asteroids[i].mesh.index % 2 === 0 ? x + this.fZone * 2 : x - this.fZone * 2;
						}

						this.asteroids[i].mesh.position.x = this.asteroids[i].body.position[0] = x; // copy positions
						this.asteroids[i].mesh.position.z = z;
						this.asteroids[i].body.position[1] = -z; // reverse axes
						this.asteroids[i].body.angularVelocity = getRandom(-1,1);

						this.asteroids[i].reappear = true;
						this.asteroids[i].clicked = false;

					}

					// reboot
				}

			}
		}

		if (Device.touch === false) {
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

		}

		// // deceleration
		if ( this.debug === false) {


			// this.ui.debug.innerHTML = this.camera.rotation.y;


			if (this.gyro === true ) {
				// this.camera.rotation.x = clamp(toRadian(clamp(this.o.gamma, -20, 20)), -0.25, 0.25) + this.currentCameraRotX; // Gauche / droite --> radian
				// this.camera.rotation.y = clamp(-toRadian(clamp(-this.o.alpha, -20, 20)), -0.25, 0.25); // Gauche / droite --> radian
				// Apply rotation
				if (this.isCalibrate === true) {
					// this.controls.update();
					// // this.camera.rotation.order = 'XYZ';

					// this.camera.rotation.x = this.camera.rotation.x + this.currentCameraRotX;
					// this.camera.rotation.y = this.camera.rotation.y + toRadian(-90);
					// this.camera.rotation.z = this.camera.rotation.z + toRadian(-90);
					// this.camera.rotation.y = 0;
					// this.camera.rotation.z = 0;
					// this.camera.rotation.x = clamp(this.camera.rotation.x + this.currentCameraRotX, -1.8, -1.3);
					// this.camera.rotation.y = clamp(this.camera.rotation.y, -0.2, 0.2);
					// this.camera.rotation.y = this.camera.rotation.z;
					// this.camera.rotation.z = this.camera.rotation.y;
					// this.camera.rotation.y = 0;
				}

			} else {
				// Specify target we want
				this.camRotTarget.x = toRadian(round(this.mouse.y * 4, 100));
				this.camRotTarget.y = -toRadian(round(this.mouse.x * 4, 100));

				// Smooth it with deceleration
				this.camRotSmooth.x += (this.camRotTarget.x - this.camRotSmooth.x) * 0.08;
				this.camRotSmooth.y += (this.camRotTarget.y - this.camRotSmooth.y) * 0.08;

				this.camera.rotation.x = this.camRotSmooth.x + this.currentCameraRotX; // Haut / Bas
				this.camera.rotation.y = clamp(this.camRotSmooth.y, -0.13, 0.13); // Gauche / droite --> radian
			}

		}


		// move sky
		// this.skyTex.offset.x = this.clock.getElapsedTime() * 0.05;


		this.render();

	}

	transitionIn(fromProject = false) {

		this.el.classList.add('intro');
		this.el.classList.remove('project');
		this.el.classList.remove('about');
		// set ui
		this.ui.uiContent.style.display = 'block';
		global.MENU.el.classList.remove('is-active');
		if (Device.touch === true) {
			let p = document.querySelector('.start p');
			p.innerHTML = 'touch';
		}

		const tl = new TimelineMax();

		if (fromProject === false) {

			tl.add(() => {

				this.moveCameraIn(fromProject);
			}, 0 );
			tl.add(() => {
				// start move Ast
				this.startMove = true;
			}, 1 );

			tl.fromTo(this.ui.button, 3, {opacity: 0, display: 'block'}, {opacity: 1, display: 'block'}, 4); // display buttons

			if (Device.touch === true) {

				tl.fromTo('.start p', 1, {y: 20}, {y: 0, ease: window.Expo.easeOut}, 3);
				tl.fromTo('.start p', 0.2, {opacity: 0}, {opacity:1, ease: window.Linear.easeNone}, 3);
			}

		} else {

			this.camera.position.set(0, this.maxZoom, 0);
			this.camera.rotation.x = toRadian(-90);
			tl.add(() => {
				this.moveCameraIn(fromProject);
			}, 0);
			tl.set(this.ui.button, {opacity: 0, display: 'block'}, '+=1.5');
			tl.to(this.ui.button, 3, {opacity: 1});
			tl.add(() => {
				global.OVERLAY.classList.remove('visible');
			}, 0);

			tl.add(() => {
				// start move Ast
				this.startMove = true;
			}, 1);

			if (Device.touch === true) {

				tl.fromTo('.start p', 1, {y: 20}, {y: 0, ease: window.Expo.easeOut}, 3);
				tl.fromTo('.start p', 0.2, {opacity: 0}, {opacity:1, ease: window.Linear.easeNone}, 3);
			}
		}

	}

	moveCameraIn(fromProject = false) {


		if (this.animating === true) return false;
		this.animating = true;

		const tl = new TimelineMax({
			onComplete: () => {
				if (this.gyro === true) { // if device gyro ?
					// Set up Gyroscope
					// this.controls = new DeviceOrientationControls(this.camera);
					// this.controls.disconnect();
					// setTimeout(() => {
					// 	this.isCalibrate = true;
					// }, 100);

				}
			}
		});

		if (fromProject === true) {
			tl.fromTo(this.camera.position, 5, {y: this.maxZoom }, {y: this.minZoom, ease: window.Expo.easeOut}, 0); // 5
			// sound
			global.SOUNDS['switch_long'].play();
		} else {
			let time = Device.touch === true ? 4.5 : 4.5;
			tl.to(this.camera.position, time, {y: this.minZoom, ease: window.Expo.easeInOut}, 0); // 7

			tl.add(() => {
				// sound
				global.SOUNDS['switch_long'].play();
			}, 1.6);
		}


		tl.add(() => {

			this.asteroidsMove = true;
		}, 0);

	}

	transitionOut(dest) {

		const tl = new TimelineMax();

		tl.to(this.ui.button, 0.5, {opacity: 0}, 0);
		tl.set(this.ui.button, {opacity: 0, visibility: 'hidden'}, 0.5);

		tl.fromTo(this.camera.position, 4, {y: this.minZoom }, {y: this.maxZoom + 100, ease: window.Expo.easeOut}, 0);
		tl.add(() => {
			global.OVERLAY.classList.add('visible');
		}, 0);
		tl.add(() => {
			EmitterManager.emit('view:transition:out');

		}, 1.2);


		this.animating = true;
		this.cameraMove = true;

		// sound
		global.SOUNDS['switch_long'].play();

	}

	resizeHandler() {
		// if (this.controls) this.controls.updateAlphaOffsetAngle(90);
		if (this.gyro === true) { // if device gyro ?

			// this.controls.updateAlphaOffsetAngle(90);
			// Set up Gyroscope
			// setTimeout(() => {
			// 	this.mouse.x = this.mouse.y = 0;
			// 	// Gyro.stopTracking(); // Stop periodic calls
			// 	Gyro.calibrate(); // Calibrate measurement during the page loading
			// 	this.mouse.x = this.mouse.y = 0;
			// }, 500);
			// Gyro.calibrate();

		}
		super.resizeHandler();
	}

	destroy() {
		if (this.gyro === true) { // if device gyro ?

			// this.controls.disconnect();
		}
		super.destroy();
	}


}
