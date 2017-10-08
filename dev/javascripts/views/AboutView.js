import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import {toRadian, getRandom, clamp, round } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import CssContainer from '../components/CssContainer';
import PreloadManager from '../managers/PreloadManager';
import Asteroid from '../shapes/Asteroid';
import SplitText from '../vendors/SplitText.js';
import { Device } from '../helpers/Device';
import Ui from '../components/Ui';
import { loadJSON } from '../helpers/utils-three';
import Handlebars from 'handlebars';
import DATA from '../../datas/data.json';


import { Vector2, Raycaster, Vector3, Fog, Scene, DirectionalLight, Texture, BoxGeometry, HemisphereLight, MeshLambertMaterial, PlaneGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color, MeshPhongMaterial } from 'three';
import { CameraDolly } from '../vendors/three-camera-dolly-custom';
import OrbitControls from '../vendors/OrbitControls';

export default class AboutView extends AbstractView {

	constructor(obj) {

		super();

		// properties


		this.el = this.ui.webGl;
		this.gravity = obj.gravity;
		this.UI = Ui.ui; // Global UI selector
		this.name = 'about';
		this.isControls = false;

		// bind

		this.init = this.init.bind(this);
		this.raf = this.raf.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.setLight = this.setLight.bind(this);
		this.transitionIn = this.transitionIn.bind(this);
		this.transitionOut = this.transitionOut.bind(this);
		this.onClick = this.onClick.bind(this);
		this.setCssContainers = this.setCssContainers.bind(this);
		this.checkCssContainer = this.checkCssContainer.bind(this);

		// preload Models
		Promise.all([
			loadJSON('datas/models/iceberg-1.json'),
			loadJSON('datas/models/iceberg-2.json'),
			loadJSON('datas/models/iceberg-3.json')
		]).then((results) => {
			// when all is loaded
			this.models = results;
			this.init();

			this.events(true);
			// this.ui.overlay.classList.add('black');

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
		}

		document[evListener]( 'click', this.onClick , false );

	}

	init() {

		// set ui
		this.UI.intro.style.display = 'none';
		global.MENU.el.classList.add('is-active');
		global.MENU.el.classList.add('alt');
		global.MENU.el.classList.remove('is-open');

		// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		this.scene = new Scene();
		this.scene.background = new Color(0xFFFFFF);
		this.cssScene = new Scene();
		this.cameraTarget = new Vector3(0, 0, 0);

		// SceneManager.renderer.setPixelRatio( clamp(window.devicePixelRatio, 1, 1.5)); // passer à 1.5 si rétina
		// console.log(clamp(window.devicePixelRatio, 1, 1.5));

		// set Camera
		this.setCamera();
		this.setCameraPos();

		// set Light
		this.setLight();

		// Set physics
		if (this.gravity === true) this.initPhysics();

		this.nbAst = 16;
		this.asteroids = [];
		this.asteroidsM = [];
		this.asteroidsMove = false;
		this.cssObjects = [];
		this.pixelToUnits = 8.1;
		this.coefText = 0.04;

		this.mouseMoved = false;
		this.mouseCoords = new Vector2();
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

		this.setAsteroids();

		// Set CssContainers
		this.setCssContainers();

		// Wait for cssContainer to be add in DOM
		this.refreshIntervalId = setInterval(this.checkCssContainer, 500);

		global.CURSOR.el.classList.add('alt');


		// reset Water bits to 64
		// setInterval(() => {
		// 	this.resetWater();
		// }, 10000);


	}

	////////////////////
	// SET SCENE
	////////////////////

	setCameraPos() {

		console.log('setCamera');
		this.camera.lookAt(this.cameraTarget);

		this.pathRadius = 160;
		this.camera.position.set(0, 0, -240);
		if (Device.size === 'mobile') {
			this.camera.position.set(0, 0,-240);
		}


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

	setAsteroids() {
		// ADD Iceberg
		// this.astXMin = -180;
		// this.astXMax = 180;
		// this.ipRadius = 50; // intra perimeter Radius

		// for (let i = 0; i < this.nbAst; i++) {
		// 	let finalMat = new MeshLambertMaterial( {color: 0xFFFFFF, transparent: true} );
		// 	finalMat.shininess = 1;

		// 	const rot = {
		// 		x: 0,
		// 		y: getRandom(-180, 180),
		// 		z: 90,
		// 	};


		// 	let pos = {
		// 		x: getRandom(this.astXMin, this.astXMax),
		// 		y: 4,
		// 		z: getRandom(-550, 50),
		// 	};

		// 	// check if ast already in other ast position
		// 	for (let y = 0; y < this.asteroidsM.length; y++) {
		// 		if (pos.x < this.ipRadius + this.asteroidsM[y].position.x && pos.x > -this.ipRadius + this.asteroidsM[y].position.x && pos.z < this.ipRadius + this.asteroidsM[y].position.z && pos.z > -this.ipRadius + this.asteroidsM[y].position.z) {
		// 			// console.log(i, ' dans le périmetre !');
		// 			pos.x += this.ipRadius;
		// 			pos.z += this.ipRadius;

		// 		}
		// 	}


		// 	//  force impulsion
		// 	const force = {
		// 		x: 0,
		// 		y: 0,
		// 		z: getRandom(40, 50)
		// 	};

		// 	const scale = getRandom(3, 8);
		// 	const speed = getRandom(500, 600); // more is slower
		// 	const range = getRandom(2, 5);
		// 	const timeRotate = getRandom(14000, 16000);
		// 	const offsetScale = 1.6;

		// 	const model = Math.round(getRandom(0, 2));

		// 	const asteroid = new Asteroid({
		// 		type: 'sphere',
		// 		width: this.models[model].size.x,
		// 		height: this.models[model].size.y,
		// 		depth: this.models[model].size.z,
		// 		geometry: this.models[model],
		// 		material: finalMat,
		// 		pos,
		// 		rot,
		// 		force,
		// 		scale,
		// 		offsetScale,
		// 		range,
		// 		speed,
		// 		timeRotate
		// 	});

		// 	asteroid.mesh.index = i;
		// 	asteroid.speedZ = getRandom(0.3, 0.8);
		// 	asteroid.pos = pos;

		// 	if (this.gravity === true) {
		// 		// add physic body to world
		// 		asteroid.body = this.world.add(asteroid.physics);
		// 		// Set rotation impulsion
		// 		asteroid.body.angularVelocity.x = getRandom(-0.2, 0.2);
		// 		asteroid.body.angularVelocity.y = getRandom(-0.5, 0.5);
		// 		asteroid.body.angularVelocity.z = getRandom(-0.2, 0.2);
		// 	}

		// 	this.asteroids.push(asteroid);
		// 	this.asteroidsM.push(asteroid.mesh);

		// 	// add mesh to the scene
		// 	this.scene.add(asteroid.mesh);

		// }
	}

	setCssContainers() {

		const data = DATA;
		console.log(data, PreloadManager.getResult('tpl-about-content'));

		// Context + gallery arrows
		let template = Handlebars.compile(PreloadManager.getResult('tpl-about-content'));
		let html  = template(data);
		this.topContent = new CssContainer(html, this.cssScene, this.cssObjects);
		// Rename context to container or projectContainer
		// Rename Details in Content
		this.topContent.position.set(0, 0, 0);
		this.topContent.rotation.set(0, 0, 0);
		this.topContent.scale.multiplyScalar(this.coefText);

		this.initTopContentY = this.topContentTargetY = this.topContentSmoothY = this.topContentY = 5;

	}

	checkCssContainer() {

		this.ui.aboutContent = this.el.querySelector('.about');

		if (this.ui.aboutContent === null) {
			//ok
		} else {
			// cssContainer Ready
			clearInterval(this.refreshIntervalId);

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

	raf() {

		if (this.gravity === true && this.startMove === true) this.world.step();

		// Moving Icebergs
		this.asteroids.forEach((el) => {

		});

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

		this.render();


	}

	transitionIn() {

		this.el.classList.add('about');
		this.el.classList.remove('project');
		this.el.classList.remove('intro');

		// set ui
		// this.UI.intro.style.display = 'block';
		// global.MENU.el.classList.remove('is-active');

		// Ui.el.style.display = 'block';


		if (this.animating === true) return false;
		this.animating = true;

		const tl = new TimelineMax({
			onComplete: () => {
				this.cameraMove = false;
				this.currentCameraRotX = this.camera.rotation.x;

			}
		});
		tl.to('.overlay', 1, {
			opacity: 0
		}, 0);
		tl.fromTo(this.camera.position, 2, {z : 240}, {z : 160, ease: window.Power4.easeOut}); // 2
		tl.add(() => {

			this.asteroidsMove = true;
		}, 0);

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
