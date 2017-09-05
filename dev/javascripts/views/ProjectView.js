import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';
import { getRandom, toRadian, clamp, round } from '../helpers/utils';
import Envelop from '../shapes/Envelop';
import Symbol from '../shapes/Symbol';
import Asteroid from '../shapes/Asteroid';
import PreloadManager from '../managers/PreloadManager';
import SceneManager from '../managers/SceneManager';
import { Device } from '../helpers/Device';
import bean from 'bean';
import ease from '../helpers/ease';
import CssContainer from '../components/CssContainer';
import ScrollManager from '../managers/ScrollManager';
import RouterManager from '../managers/RouterManager';
import Ui from '../components/Ui';
import Menu from '../components/Menu';
import Handlebars from 'handlebars';


// THREE JS
import { ShaderMaterial, RGBFormat, LinearFilter, WebGLRenderTarget, Raycaster, PerspectiveCamera, Scene, Mesh, Texture, TorusGeometry, PlaneGeometry, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial, MeshPhongMaterial, Vector3, BoxGeometry, Object3D } from 'three';
import EffectComposer, { RenderPass, ShaderPass } from 'three-effectcomposer-es6';
import OrbitControls from '../vendors/OrbitControls';
import { CameraDolly } from '../vendors/three-camera-dolly-custom';


// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader
import { FXAAShader } from '../shaders/FXAAShader'; // FXAA shader
import { HorizontalTiltShiftShader } from '../shaders/HorizontalTiltShiftShader'; // HorizontalTiltShiftShader shader
import { VerticalTiltShiftShader } from '../shaders/VerticalTiltShiftShader'; // VerticalTiltShiftShader shader
import { BrightnessShader } from '../shaders/BrightnessShader'; // VerticalTiltShiftShader shader


export default class ProjectView extends AbstractView {

	constructor(obj) {

		super();

		// properties
		this.el = this.ui.webGl;
		this.UI = Ui.ui; // Global UI selector
		this.id = obj.id;
		this.data = obj.data;
		this.bkg = obj.bkg;
		this.astd = obj.astd;
		this.gravity = obj.gravity;
		this.pointsLight = obj.pointsLight;
		this.glow = obj.glow;
		this.alt = obj.alt;
		this.fromUrl = obj.fromUrl;
		this.sound = SoundManager;

		this.name = `project-${this.id}`;

		// bind
		this.raf = this.raf.bind(this);
		this.events = this.events.bind(this);
		this.start = this.start.bind(this);
		this.setSymbol = this.setSymbol.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.reset = this.reset.bind(this);
		this.destroy = this.destroy.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onClick = this.onClick.bind(this);
		this.showContent = this.showContent.bind(this);
		this.slideUp = this.slideUp.bind(this);
		this.slideDown = this.slideDown.bind(this);
		this.backFromContent = this.backFromContent.bind(this);
		this.transitionOut = this.transitionOut.bind(this);
		this.goTo = this.goTo.bind(this);
		this.scroll = this.scroll.bind(this);
		this.onMouseWheel = this.onMouseWheel.bind(this);
		this.onChangeGlow = this.onChangeGlow.bind(this);
		this.onChangeBlur = this.onChangeBlur.bind(this);
		this.onChangeBrightness = this.onChangeBrightness.bind(this);
		this.onChangeDolly = this.onChangeDolly.bind(this);
		this.checkCssContainer = this.checkCssContainer.bind(this);


		// init
		this.init();

		console.log('mon id', this.id);

		// ScrollManager.on();


	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		if (Device.touch === false) {
			// move camera
			document[evListener]('mousemove', this.onMouseMove);
			document.body[evListener]('click', this.onClick);
			// document[evListener]('mousewheel', this.onMouseWheel);
			// document[evListener]('MozMousePixelScroll', this.onMouseWheel);
		} else {
			document.body[evListener]('touchstart', this.onClick);
		}

		EmitterManager[onListener]('scroll', this.scroll);
		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.raf);

		if (method === true) {
			bean.on(document.body, 'click.project', '.project__title', this.showContent);
			bean.on(document.body, 'click.project', '.gallery__arrow-r', this.slideUp);
			bean.on(document.body, 'click.project', '.gallery__arrow-l', this.slideDown);
			bean.on(document.body, 'click.project', '.project__back', this.backFromContent);
			bean.on(document.body, 'click.project', '.project__next', this.goTo);
		} else {
			bean.off(document.body, 'click.project');
		}


	}

	init() {


		this.isControls = false;

		this.cssObjects = [];
		this.time = 1;
		this.nbAst = 10;
		this.finalFov = 45;
		this.composer = null;
		this.bounceArea = 480;
		this.pixelToUnits = 8.1;

		// retina screen size
		this.width = window.innerWidth * window.devicePixelRatio;
		this.height = window.innerHeight * window.devicePixelRatio;

		// Set scenes
		this.scene = new Scene();
		this.scene.background = new Color(this.bkg);
		this.cssScene = new Scene();

		// Set Camera
		this.setCamera();
		this.setCameraPos();


		// Set physics
		if (this.gravity === true) this.initPhysics();

		// Set symbol
		this.setSymbol();

		// Set asteroid
		this.setAsteroids();

		console.log(this.pointsLight);
		if (this.pointsLight === true) {
			console.log('trueeee');
			// Set envelop
			this.setEnvelop();
		}
		// set Light
		this.setLight();


		// Raycaster
		this.raycaster = new Raycaster();

		// Mouse
		this.mouse = { x: 0, y: 0 };
		this.cameraRot = new Vector3(0, 0, 0);
		this.cameraPos = new Vector3(0, 0, 0);

		this.cameraTarget = new Vector3(0, 0, 0);
		this.camRotTarget = new Vector3(0, 0, 0);
		this.camRotSmooth = new Vector3(0, 0, 0);

		this.camera.lookAt(this.cameraTarget);




		// Camera controls
		if (this.isControls === true) {
			this.controls = new OrbitControls(this.camera, SceneManager.renderer.domElement);
			this.controls.enableZoom = true;
		}


		/////////////////
		// GUI
		/////////////////

		this.effectController = {
			// blur
			blur: 4.0,
			horizontalBlur: 0.5,
			enabled: false,
			// glow
			coeficient: 1,
			power: 2,
			glowColor: 0xffffff,
			coeficientOut: 1,
			powerOut: 2,
			glowColorOut: 0xffffff,
			// brightness
			brightness: 0,
			contrast: 0,
			// Camera dolly
			position: 0,
			lookAt: 0

		};

		if (this.sound.gui.init === false) {
			// Blur
			const blurFolder = this.sound.gui.addFolder('Blur');
			blurFolder.add(this.effectController, 'blur', 0.0, 20.0, 0.001).listen().onChange(this.onChangeBlur);
			blurFolder.add(this.effectController, 'horizontalBlur', 0.0, 1.0, 0.001).listen().onChange(this.onChangeBlur);
			blurFolder.add(this.effectController, 'enabled').onChange(this.onChangeBlur);
			// blurFolder.open();

			// Glow
			const glowFolder = this.sound.gui.addFolder('Glow');
			glowFolder.add(this.effectController, 'coeficient', 0.0, 2).listen().onChange(this.onChangeGlow);
			glowFolder.add(this.effectController, 'power', 0.0, 5).listen().onChange(this.onChangeGlow);
			glowFolder.addColor(this.effectController, 'glowColor').listen().onChange(this.onChangeGlow);
			glowFolder.add(this.effectController, 'coeficientOut', 0.0, 2).listen().onChange(this.onChangeGlow);
			glowFolder.add(this.effectController, 'powerOut', 0.0, 20).listen().onChange(this.onChangeGlow);
			glowFolder.addColor(this.effectController, 'glowColorOut').listen().onChange(this.onChangeGlow);

			// Brightness
			const brightnessFolder = this.sound.gui.addFolder('Brightness');
			brightnessFolder.add(this.effectController, 'brightness', 0.0, 1).listen().onChange(this.onChangeBrightness);
			brightnessFolder.add(this.effectController, 'contrast', 0.0, 30).listen().onChange(this.onChangeBrightness);
			// brightnessFolder.open();

			this.sound.gui.init = true;
		}

		// Camera Dolly
		// const dollyFolder = this.sound.gui.addFolder('Camera Dolly');
		// dollyFolder.add(this.effectController, 'position', 0.0, 1).listen().onChange(this.onChangeDolly);
		// dollyFolder.add(this.effectController, 'lookAt', 0.0, 1).listen().onChange(this.onChangeDolly);
		// dollyFolder.open();


		////////////////////
		// POST PROCESSING
		////////////////////

		// Set BLUR EFFECT
		this.setBlur();

		// Load data

		// Preloader
		this.preloadCb = PreloadManager.on('complete', this.start, this, true);

		let prod;

		if (window.location.host === 'robpayot.github.io') {
			prod = true;

		}

		let base = prod === true ? 'https://robpayot.github.io/xp-son/dist' : '';

		PreloadManager.loadManifest([
			{ id: 'template-title', src: `${base}/templates/projectTitle.hbs`},
			{ id: 'template-content', src: `${base}/templates/projectContent.hbs` },
			{ id: 'template-footer', src: `${base}/templates/projectFooter.hbs` },
		]);

		PreloadManager.load();

		// this.start();

		// const p = new VirtualScroll();

		// console.log(p);


		// p.on(function(e) {
		// 	console.log(e);
		//     // e is an object that holds scroll values, including:
		//     e.deltaY; // <- amount of pixels scrolled vertically since last call
		//     e.deltaX; // <- amount of pixels scrolled horizontally since last call
		// });





	}

	start() {

		PreloadManager.off('complete', this.preloadCb);

		this.lastPage = RouterManager.lastPage;
		this.el.classList.remove('intro');
		this.el.classList.add('project');

		// set ui
		this.UI.intro.style.display = 'none';
		Menu.el.classList.add('is-active');
		Menu.el.classList.remove('is-open');

		if (this.alt === true) {
			this.el.classList.add('alt');
			Menu.el.classList.add('alt');
		} else {
			this.el.classList.remove('alt');
			Menu.el.classList.remove('alt');
		}

		// Set CssContainers
		this.setCssContainers();

		////////////////////
		// EVENTS
		////////////////////

		this.events(true);

		// Wait for cssContainer to be add in DOM
		this.refreshIntervalId = setInterval(this.checkCssContainer, 500);


	}

	checkCssContainer() {

		this.ui.projectFooter = this.el.querySelector('.project__footer');

		if (this.ui.projectFooter === null) {
			//ok
		} else {
			// cssContainer Ready
			clearInterval(this.refreshIntervalId);

			this.ui.projectContainer = this.el.querySelector('.project__container');
			this.ui.projectImg = this.el.querySelectorAll('.project__image img')[0];

			// Start transition In
			if (this.fromUrl === true) {
				this.transitionIn(true);
				this.fromUrl = false;
			} else {
				this.transitionIn();
			}

			// Position Gallery
			// Pixel to Units magic
			const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
			const wHeight = 2 * Math.tan( vFOV / 2 ) * 60; // visible height dist = 60 (160 - 100)
			// wHeight === window.innerHeight in Units equivalent
			// let aspect = window.width / window.height;
			// let width = height * aspect;                  // visible width
			const margeTop = 4;

			let percent = this.ui.projectContainer.offsetHeight / 2 / window.innerHeight; // half because centered
			let finalHeight = wHeight * percent;
			this.gallery.position.y = this.initGalleryY = -finalHeight - margeTop;

			// Position Footer
			percent = this.ui.projectImg.offsetHeight / window.innerHeight; // half because centered
			let finalHeightFooter = wHeight * percent;
			this.footer.position.y = this.initFooterY = this.initGalleryY - finalHeightFooter - margeTop - 2;

			let globalMargeScrollBot = 5;


			percent = (this.ui.projectContainer.offsetHeight + this.ui.projectImg.offsetHeight + this.ui.projectFooter.offsetHeight) / window.innerHeight;
			this.maxHeightUnits = wHeight * percent - globalMargeScrollBot;

		}

	}

	////////////////////
	// SET SCENE
	////////////////////

	setCameraPos() {

		this.pathRadius = 160;
		this.camera.position.set(-60, 170, 70);
		if (Device.size === 'mobile') {
			this.camera.position.set(0, 0, 200);
		}


	}

	setEnvelop() {
		// Set up the sphere vars
		const width = this.bounceArea;
		const height = this.bounceArea;
		const depth = 2;

		const geometry = new BoxGeometry(width, height, depth);
		// 0x0101010,
		// const img = PreloadManager.getResult('damier');
		// const tex = new Texture(img);
		// tex.needsUpdate = true;
		const material = new MeshPhongMaterial({ color: this.bkg, transparent: true, opacity: 1 });
		this.envelops = [];

		const configs = [{
			pos: { x: -width / 2, y: 0, z: 0 },
			rot: { x: 0, y: toRadian(-90), z: 0 }
		}, {
			pos: { x: width / 2, y: 0, z: 0 },
			rot: { x: 0, y: toRadian(-90), z: 0 }
		}, {
			pos: { x: 0, y: 0, z: -width / 2 },
			rot: { x: 0, y: 0, z: 0 }
		}, {
			pos: { x: 0, y: 0, z: width / 2 },
			rot: { x: 0, y: 0, z: 0 }
		}, {
			pos: { x: 0, y: -width / 2, z: 0 },
			rot: { x: toRadian(-90), y: 0, z: 0 }
		}, {
			pos: { x: 0, y: width / 2, z: 0 },
			rot: { x: toRadian(-90), y: 0, z: 0 }
		}];

		for (let i = 0; i < configs.length; i++) {

			const envelop = new Envelop(geometry, material, configs[i].pos, configs[i].rot);

			this.envelops.push(envelop);

			// add mesh to the scene
			this.scene.add(envelop);
		}



	}

	setSymbol() {

		// const geometry = new TorusGeometry(6, 1, 16, 100);
		// const img = PreloadManager.getResult('texture-asteroid');
		// const tex = new Texture(img);
		// tex.needsUpdate = true;
		// const material = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, map: null });
		// const pos = {
		// 	x: 0,
		// 	y: 0,
		// 	z: 0,
		// };

		// const symbol = new Symbol({
		// 	geometry: geometry,
		// 	material: material,
		// 	pos: pos
		// });

		// if (this.gravity === true) {
		// 	// add physic body to world
		// 	symbol.body = this.world.add(symbol.physics);
		// }



		// // create a glowMesh
		// symbol.glowMesh = new THREEx.GeometricGlowMesh(symbol.mesh);
		// symbol.mesh.add(symbol.glowMesh.object3d);

		// // example of customization of the default glowMesh
		// // Inside
		// symbol.glowMesh.insideMesh.material.uniforms.glowColor.value.set('white');
		// symbol.glowMesh.insideMesh.material.uniforms['coeficient'].value = 1;
		// symbol.glowMesh.insideMesh.material.uniforms['power'].value = 2;

		// // Outside
		// symbol.glowMesh.outsideMesh.material.uniforms.glowColor.value.set('white');
		// symbol.glowMesh.outsideMesh.material.uniforms['coeficient'].value = 0;
		// symbol.glowMesh.outsideMesh.material.uniforms['power'].value = 10;

		const geometry = new BoxGeometry(12, 12, 12);
		// const img = PreloadManager.getResult('texture-asteroid');
		// const tex = new Texture(img);
		// tex.needsUpdate = true;
		// #4682b4
		const material = new MeshPhongMaterial({ color: 0x4682b4, transparent: false, opacity: 1, map: null });
		const pos = {
			x: 0,
			y: -100, // 60 end point
			z: 200,
		};
		const timeRotate = 7000;

		const symbol = new Symbol({
			geometry,
			material,
			pos,
			timeRotate
		});

		symbol.initPointY = 0;
		symbol.endPointY = 2000;
		symbol.endPointZ = 5000;

		this.symbol = symbol;

		// add mesh to the scene
		this.scene.add(symbol.mesh);

	}

	setAsteroids() {

		this.asteroids = [];
		this.asteroidsM = [];

		// Set up the sphere vars
		const props = {
			RADIUS: 5,
			SEGMENTS: 32,
			RINGS: 32,
			geometry: null,
			glow: this.glow
		};


		let geometry;

		switch (this.astd) {
			case 'spheres':
				geometry = new SphereGeometry(props.RADIUS, props.SEGMENTS, props.RINGS);
				break;
			case 'cubes':
				geometry = new BoxGeometry(props.RADIUS, props.RADIUS, props.RADIUS);
				break;
		}

		// const material = new MeshLambertMaterial({ color: 0x4682b4 });
		const img = PreloadManager.getResult('texture-asteroid');

		const tex = new Texture(img);
		tex.needsUpdate = true;

		const matPhongParams = {
			// specular: 0xFFFFFF,
			// shininess: 3000,
			// color: 0x4682b4,
			transparent: true,
			opacity: 1,
			map: tex,
			// alphaMap: tex,
			// lightmap: tex
			// emissive: new Color('rgb(255, 255, 255)'),
			// specular: new Color('rgb(255, 255, 255)')
		};
		// const material = new MeshLambertMaterial(matPhongParams);

		if (this.glow === true) {
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

		} else {
			this.materialAst1 = new MeshLambertMaterial({
				color: 0xffb732,
				transparent: true,
				opacity: 0.9
			});

			this.materialAst2 = new MeshLambertMaterial({
				color: 0xfee4c0,
				transparent: true,
				opacity: 0.9
			});
		}

		let pos;
		let posFixed;
		if (this.astd !== 'spheres') {
			// get positions from a json
			// /! nu;brer of astd needed
			posFixed = [
				{ x: -40, y: -10, z: 80 },
				{ x: -50, y: 5, z: 10 },
				{ x: -30, y: -60, z: -20 },
				{ x: -10, y: 40, z: -40 },
				{ x: -60, y: 10, z: -40 },
				{ x: 0, y: -40, z: -60 },
				{ x: 30, y: 20, z: 60 },
				{ x: 20, y: -20, z: -30 },
				{ x: 50, y: -40, z: 30 },
				{ x: 40, y: 20, z: -80 }
			];

		}


		for (let i = 0; i < this.nbAst; i++) {

			const rot = {
				x: getRandom(-180, 180),
				y: getRandom(-180, 180),
				z: getRandom(-180, 180),
			};
			// Intra perimeter radius
			const ipRadius = 50;

			if (this.astd === 'spheres') {
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
			} else {
				pos = posFixed[i];
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

		// white spotlight shining from the side, casting a shadow

		// var spotLight = new SpotLight(0xffffff);
		// spotLight.position.set(0, 0, -100);
		// spotLight.angle = toRadian(180);

		// spotLight.castShadow = false;

		// spotLight.shadow.mapSize.width = 1024;
		// spotLight.shadow.mapSize.height = 1024;

		// spotLight.shadow.camera.near = 500;
		// spotLight.shadow.camera.far = 4;
		// spotLight.shadow.camera.fov = 120;

		// this.scene.add(spotLight);

		// var directionalLight = new DirectionalLight(0xffffff, 0.5);
		// this.scene.add(directionalLight);


	}

	setCssContainers() {

		const data = this.data;

		// Title
		let template = Handlebars.compile(PreloadManager.getResult('template-title'));
		let html  = template(data);
		const title = new CssContainer(html, this.cssScene, this.cssObjects);
		title.position.set(20, 0, 10);
		title.scale.multiplyScalar(1 / 14);

		// Next project
		const nextProject = new CssContainer('<div class="project__next transi">Next</div>', this.cssScene, this.cssObjects);
		nextProject.position.set(0, -15, 10);
		nextProject.scale.multiplyScalar(1 / 14);

		// Gallery
		const radius = 100; // radius circonference of gallery circle
		this.galleryAngle = Math.PI / 6; // Space of 30 degree PI / 6
		this.gallery = new Object3D(); // DESTROY CONTAINER ????
		this.gallery.position.set(0, -15, 0);
		this.gallery.rotation.set(0, toRadian(90), 0);
		this.cssScene.add(this.gallery);
		this.currentSlide = 0;
		this.nbSlides = data.imgs.length;

		this.initGalleryY = this.targetGalleryY = 0;

		// Formules coordonnée d'un cercle
		// x = x0 + r * cos(t)
		// y = y0 + r * sin(t)

		for (let i = 0; i < this.nbSlides; i++) {
			// image 1
			const image = new CssContainer(`<div class="project__image"><img src="images/projects/${data.imgs[i]}" alt="project image" /></div>`, this.gallery, this.cssObjects);
			image.position.set(radius * Math.sin(this.galleryAngle * i), 0, radius * Math.cos(this.galleryAngle * i));
			image.rotation.set(0, this.galleryAngle * i, 0);
			image.scale.multiplyScalar(1 / 14);
		}

		this.galleryPivot = new Object3D();
		this.galleryPivot.add(this.gallery);

		this.cssScene.add(this.galleryPivot);

		// arrows

		// Context + gallery arrows
		template = Handlebars.compile(PreloadManager.getResult('template-content'));
		html  = template(data);
		this.topContent = new CssContainer(html, this.cssScene, this.cssObjects);
		// Rename context to container or projectContainer
		// Rename Details in Content
		this.topContent.position.set(radius, 0, 0);
		this.topContent.rotation.set(0, toRadian(90), 0);
		this.topContent.scale.multiplyScalar(1 / 14);

		this.initTopContentY = this.topContentTargetY = this.topContentSmoothY = this.topContentY = 0;

		// Top Content + gallery arrows
		template = Handlebars.compile(PreloadManager.getResult('template-footer'));
		html  = template(data);
		this.footer = new CssContainer(html, this.cssScene, this.cssObjects);
		this.footer.position.set(radius, 0, 0);
		this.footer.rotation.set(0, toRadian(90), 0);
		this.footer.scale.multiplyScalar(1 / 14);

		// this.initTopContentY = this.topContentTargetY = this.topContentSmoothY = this.topContentY = 0;
	}

	setBlur() {

		// COMPOSER
		// IMPORTANT CAREFUL HERE (when changing scene)
		// SceneManager.renderer.autoClear = false;

		const renderTargetParameters = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat, stencilBuffer: false };
		this.renderTarget = new WebGLRenderTarget(this.width, this.height, renderTargetParameters);

		this.effectFXAA = new ShaderPass(FXAAShader);
		this.hblur = new ShaderPass(HorizontalTiltShiftShader);
		this.vblur = new ShaderPass(VerticalTiltShiftShader);


		this.hblur.uniforms['h'].value = this.effectController.blur / this.width;
		this.vblur.uniforms['v'].value = this.effectController.blur / this.height;

		this.hblur.uniforms['r'].value = this.vblur.uniforms['r'].value = this.effectController.horizontalBlur;

		this.effectFXAA.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);

		const renderModel = new RenderPass(this.scene, this.camera);

		this.vblur.renderToScreen = true;
		this.hblur.renderToScreen = true;
		this.effectFXAA.renderToScreen = true;

		this.composer = new EffectComposer(SceneManager.renderer, this.renderTarget);

		this.composer.addPass(renderModel);
		this.composer.addPass(this.effectFXAA);
		this.composer.addPass(this.hblur);
		this.composer.addPass(this.vblur);

	}

	////////////
	// EVENTS
	////////////

	showContent() {

		if (this.animating === true) return false;
		this.animating = true;

		// Turn around the perimeter of a circle
		this.cameraMove = true;

		const trigo = { angle: 1 };
		const tl = new TimelineMax({
			onComplete: () => {
				this.cameraMove = true;
				this.animating = false;
				ScrollManager.on(); // start scrollmanager
			},
		});

		tl.to(this.camera.rotation, 0.8, {
			x: 0,
			y: 0,
			ease: Power2.easeOut
		});

		tl.to(trigo, 3, { // 3.5
			angle: 0,
			ease: window.Power3.easeInOut,
			onUpdate: () => {
				// Math.PI / 2 start rotation at 90deg
				this.camera.position.x = this.pathRadius * Math.cos(Math.PI / 2 * trigo.angle);
				this.camera.position.z = this.pathRadius * Math.sin(Math.PI / 2 * trigo.angle);
				this.camera.lookAt(this.cameraTarget);
			}
		});

		tl.set(['.project__footer', '.gallery__arrow', '.project__image', '.project__container'], { visibility: 'visible' }, 3);


		tl.staggerFromTo(['.project__footer', '.gallery__arrow', '.project__container', '.project__image' ], 1.2, { // 1.2
			opacity: 0,
			y: 80
		}, {
			opacity: 0.9,
			y: 0,
			ease: window.Power4.easeOut
		}, 0.2, 2.8);

		tl.staggerTo(['.project__next','.project__title'], 0.6, {
			opacity: 0,
			ease: window.Power4.easeOut
		},0.2,2.2);

	}

	backFromContent() {

		this.cameraMove = true;
		ScrollManager.off(); // stop scrollmanager

		const trigo = { angle: 0 };
		const tl = new TimelineMax({ onComplete: () => { this.cameraMove = false; } });


		tl.staggerTo(['.project__container', '.project__image', '.gallery__arrow', '.project__footer' ], 1.2, {
			opacity: 0,
			ease: window.Power4.easeOut
		}, 0.1);

		tl.set(['.project__image', '.gallery__arrow', '.project__footer', '.project__container'], { visibility: 'hidden' });


		tl.to(trigo, 3, { // 3.5
			angle: 1,
			ease: window.Power3.easeInOut,
			onUpdate: () => {
				// Math.PI / 2 start rotation at 90deg
				this.camera.position.x = this.pathRadius * Math.cos(Math.PI / 2 * trigo.angle);
				this.camera.position.z = this.pathRadius * Math.sin(Math.PI / 2 * trigo.angle);
				this.camera.lookAt(this.cameraTarget);
			}
		}, 0.5);

		tl.staggerTo(['.project__next','.project__title'], 0.6, {
			opacity: 1,
			ease: window.Power4.easeOut
		},0.2,1.5);

	}

	slide(dir) {

	}

	slideUp() {

		if (this.isSliding === true || this.currentSlide === this.nbSlides - 1) return false;

		this.isSliding = true;
		TweenMax.set(['.gallery__arrow-l', '.gallery__arrow-r'], { opacity: 1 });

		if (this.currentSlide === this.nbSlides - 2) TweenMax.to('.gallery__arrow-r', 1.5, { opacity: 0.2 });

		TweenMax.to(this.galleryPivot.rotation, 1.5, {
			y: -this.galleryAngle * (this.currentSlide + 1),
			ease: window.Expo.easeInOut,
			onComplete: () => {
				this.currentSlide++;
				this.isSliding = false;
			}
		});

	}

	slideDown() {

		if (this.isSliding === true || this.currentSlide === 0) return false;

		this.isSliding = true;
		TweenMax.set(['.gallery__arrow-l', '.gallery__arrow-r'], { opacity: 1 });

		if (this.currentSlide === 1) TweenMax.to('.gallery__arrow-l', 1.5, { opacity: 0.2 });

		TweenMax.to(this.galleryPivot.rotation, 1.5, {
			y: -this.galleryAngle * (this.currentSlide - 1),
			ease: window.Expo.easeInOut,
			onComplete: () => {
				this.currentSlide--;
				this.isSliding = false;
			}
		});
	}

	scroll(e) {


		this.topContentTargetY -= e.deltaY * 0.01;

		// Smooth it with deceleration
		// this.topContentSmoothY += (this.topContentTargetY - this.topContentSmoothY) * 0.15;

		this.topContentY = this.topContentTargetY;

		// console.log(this.topContentY, this.topContent);
		// this.ui.context.offsetHeight --> Get Threejs Unit !!!
		if (this.topContentY <= this.initTopContentY) this.topContentY = this.topContentTargetY = this.topContentSmoothY = this.initTopContentY;
		if (this.topContentY >= this.maxHeightUnits) this.topContentY = this.topContentTargetY = this.topContentSmoothY = this.maxHeightUnits;

		// this.topContent.position.y = this.topContentY;
		// this.gallery.position.y = this.topContentY - this.initTopContentY;
		// console.log(this.topContent.position.y);

	}

	onClick(e) {

		// update Mouse position for touch devices
		if (Device.touch === true) {
			const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
			const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

			this.mouse.x = eventX / window.innerWidth * 2 - 1;
			this.mouse.y = -(eventY / window.innerHeight) * 2 + 1;

			// U/!\ Important / dangerous
			// update raf for trigger intersect on mobile
			this.raf();
		}

		if (this.clickSymbol === true) {
			this.onClickSymbol();
		}

		if (this.clickAsteroid === true) {
			this.currentAstClicked.impulse();
		}

	}

	onClickSymbol() {

		// const tl = new TimelineMax();

		// // this.reset();

		// if (this.toggle !== true) {



		// 	tl.to(this.symbols[0].mesh.scale, 0.7, {
		// 		x: 1.5,
		// 		y: 1.5,
		// 		z: 1.5,
		// 		ease: window.Power4.easeInOut
		// 	});

		// 	this.toggle = true;

		// } else {

		// 	tl.to(['.project__container', '.project__image'], 0.8, {
		// 		opacity: 0,
		// 		ease: window.Power4.easeInOut
		// 	});


		// 	tl.to(this.symbols[0].mesh.scale, 0.5, {
		// 		x: 1,
		// 		y: 1,
		// 		z: 1,
		// 		ease: window.Power4.easeInOut
		// 	}, 0.1);

		// 	this.toggle = false;
		// }
	}

	onMouseMove(e) {

		const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		this.mouse.x = eventX / window.innerWidth * 2 - 1;
		this.mouse.y = -(eventY / window.innerHeight) * 2 + 1;
		// console.log(this.mouse);

		// Update camera

		// this.camera.position.x = round(this.mouse.x * 30 , 100); // decimal 2
		// this.camera.position.y = round(this.mouse.y * 10 , 100);

		// this.cameraTarget.x = round(this.mouse.x * 30 , 100);
		// this.cameraTarget.y = round(this.mouse.y * 10 , 100);

		// this.camera.lookAt(this.cameraTarget);
		// this.camera.updateProjectionMatrix();

		// this.camera.updateProjectionMatrix();

	}

	onMouseWheel(event) {

		event.preventDefault();



		if (event.wheelDeltaY) {

			this.finalFov -= event.wheelDeltaY * 0.05;
		} else if (event.wheelDelta) {

			this.finalFov -= event.wheelDelta * 0.05;
		} else if (event.detail) {

			this.finalFov += event.detail * 1;
		}

		this.finalFov = clamp(this.finalFov, 35, 70);

	}

	goTo() {

		console.log('go To');
		const dest = this.id === 0 ? 1 : 0;

		if (this.clicked === true) return false;
		this.clicked = true;

		// const tl = new TimelineMax({delay: 2});
		const tl = new TimelineMax();

		// glitch
		tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY + 3, x: 0});
		tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 1, x: 1}, 0.01);
		tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY + 1, x: 1}, 0.03);
		tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 2, x: -1}, 0.05);
		tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY - 1, x: 2}, 0.07);
		tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY + 3, x: 1}, 0.09);
		tl.set(this.symbol.mesh.position, {y: this.symbol.initPointY, x: 0}, 0.12);

		tl.add(() => {
			console.log('add called');

			this.transitionOut(dest);

		}, '+=0.5');

		tl.to(this.symbol.mesh.position, 10, {y: 0, z: -300, ease: window.Expo.easeOut }, '+=0.2');

		tl.staggerTo(['.project__next', '.project__title'], 0.5, {opacity: 0}, 0.2, 0);

		// issue if come back to this timeline and 10 times end

	}

	// resizeHandler() {

	// 	// this.hblur.uniforms['h'].value = this.effectController.blur / this.width;
	// 	// this.vblur.uniforms['v'].value = this.effectController.blur / this.height;

	// 	// this.effectFXAA.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);

	// }

	raf() {
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

		const intersects = this.raycaster.intersectObjects([this.symbol.mesh]);

		if (intersects.length > 0) {
			this.ui.body.style.cursor = 'pointer';
			this.clickSymbol = true;

		} else {

			this.clickSymbol = false;
		}

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
			this.symbol.mesh.position.copy(this.symbol.body.getPosition());
			this.symbol.mesh.quaternion.copy(this.symbol.body.getQuaternion());
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

			this.symbol.mesh.rotation.y = toRadian(this.symbol.initRotateY + Math.sin(this.time * 2 * Math.PI / this.symbol.timeRotate) * (360 / 2) + 360 / 2);
			this.symbol.mesh.rotation.x = toRadian(this.symbol.initRotateY + Math.cos(this.time * 2 * Math.PI / this.symbol.timeRotate) * (360 / 2) + 360 / 2);
			this.symbol.mesh.rotation.z = toRadian(this.symbol.initRotateY + Math.sin(this.time * 2 * Math.PI / this.symbol.timeRotate) * (360 / 2) + 360 / 2);

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

	}

	////////////////////
	// TRANSITIONS
	////////////////////

	transitionIn(fromUrl = false) {


		fromUrl = false;

		let symbolY = 0;
		let symbolZ = 160;
		let time = 3;
		let ease = window.Power3.easeOut;
		let delay = 1.2;
		let noDolly = true;

		// Set camera Dolly
		let points = {
			'camera': [{
				'x': 0,
				'y': 0,
				'z': 240
			}, {
				'x': 0,
				'y': 0,
				'z': 180
			}, {
				'x': 0,
				'y': 0,
				'z': 160
			}],
			'lookat': [{
				'x': 0,
				'y': 0,
				'z': 0
			}, {
				'x': 0,
				'y': 0,
				'z': 0
			}, {
				'x': 0,
				'y': 0,
				'z': 0
			}]
		};

		if (this.lastPage === 'intro') {

			noDolly = false;

			symbolY = -160;
			symbolZ = 160;

			time = 5;
			delay = 3;
			ease = window.Expo.easeOut;

			points = {
				'camera': [{
					'x': 0,
					'y': -240,
					'z': 240
				}, {
					'x': 0,
					'y': -160,
					'z': 160
				}, {
					'x': 0,
					'y': 0,
					'z': 160
				}],
				'lookat': [{
					'x': 0,
					'y': 0,
					'z': 0
				}, {
					'x': 0,
					'y': 0,
					'z': 0
				}, {
					'x': 0,
					'y': 0,
					'z': 0
				}]
			};
		}

		if (fromUrl === true) {

			noDolly = false;

			time = 4;
			ease = window.Power3.easeInOut;
			delay = 2.5;

			points = {
				'camera': [{
					'x': -60,
					'y': 170,
					'z': 70
				}, {
					'x': -40,
					'y': 100,
					'z': 100
				}, {
					'x': -20,
					'y': 50,
					'z': 130
				}, {
					'x': 0,
					'y': 0,
					'z': 160
				}],
				'lookat': [{
					'x': 0,
					'y': 0,
					'z': 0
				}, {
					'x': 0,
					'y': -3,
					'z': 3
				}, {
					'x': 0,
					'y': -3,
					'z': 3
				}, {
					'x': 0,
					'y': 0,
					'z': 0
				}]
			};
		}

		this.cameraMove = !noDolly;

		this.dolly = new CameraDolly(this.camera, this.scene, points, null, false);

		this.dolly.cameraPosition = 0;
		this.dolly.lookatPosition = 0;
		this.dolly.range = [0, 1];
		this.dolly.both = 0;


		const tl = new TimelineMax({
			onComplete: () => {
				this.camera.position.set(0, 0, 160);
				if (noDolly === false) this.cameraMove = false;
				this.clicked = false;
			}
		});

		if (noDolly === false) {
			tl.to(this.dolly, time, {
				cameraPosition: 1,
				lookatPosition: 1,
				ease: window.Power4.easeOut,
				onUpdate: () => {
					this.dolly.update();
				}
			});

		} else {
			tl.fromTo(this.camera.position, 2, {z : 240}, {z : 160, ease: window.Power4.easeOut});
		}



		tl.to('.overlay', 1, {
			opacity: 0
		}, 0);

		tl.add(() => {
			// remover overlay class
			this.ui.overlay.classList.remove('black');
		});

		tl.fromTo(this.symbol.mesh.position, time, { y: symbolY, z: symbolZ}, { y: 0, z: 0, ease: ease}, 0); // window.Power3.easeInOut

		tl.staggerFromTo(['.project__title span', '.project__arrow-r', '.project__next'], 1.2, { // 1.2
			opacity: 0,
			y: 40
		}, {
			opacity: 0.8,
			y: 0,
			ease: window.Power4.easeOut
		}, 0.1, delay);

		// tl.add( () => { // add transition hover css ????
		// 	const title = document.querySelector('.project__title svg');
		// 	const next = document.querySelector('.project__next');
		// 	title.classList.add('transi');
		// 	next.classList.add('transi');
		// }, 0.1);
	}

	transitionOut(dest) {

		if (this.animating === true) return false;
		this.animating = true;

		// this.cameraMove = true;
		// Set camera Dolly
		// const points = {
		// 	'camera': [{
		// 		'x': 0,
		// 		'y': 0,
		// 		'z': 160
		// 	}, {
		// 		'x': 0,
		// 		'y': 0,
		// 		'z': 80
		// 	}, {
		// 		'x': 0,
		// 		'y': 0,
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

		const tl = new TimelineMax({
			onComplete: () => {
				// this.cameraMove = false;
				this.animating = false;

				TweenMax.killAll();
				// TweenMax.killTweensOf(this.symbol.mesh.position);

				EmitterManager.emit('router:switch', `/project-${dest}`, dest);
				EmitterManager.emit('view:transition:out');
				// console.log('transition out', this.id);
			}
		});

		tl.to(this.camera.position, 2, {z : 0, ease: window.Power2.easeIn});

		// tl.to(this.dolly, 2, {
		// 	cameraPosition: 1,
		// 	// lookatPosition: 1,
		// 	ease: window.Power2.easeIn,
		// 	onUpdate: () => {
		// 		this.dolly.update();
		// 	}
		// });

		tl.to('.overlay', 0.5, {
			opacity: 1
		}, 1.7);

		// setTimeout(()=>{

		// },200);

	}

	reset() {

		this.destroy();

		// // Set symbol
		// this.setSymbol();

		// // Set asteroid
		// this.setAsteroids();

		// // Set envelop
		// this.setEnvelop();

		// // Set Context
		// this.setCssContainers();

		// // set Light
		// this.setLight();

		// // Raycaster
		// this.raycaster = new Raycaster();

		// // Mouse
		// this.mouse = { x: 0, y: 0 };
		// this.initPhysics();

		// if (this.guiParams.gravity === true) {
		//     this.world.gravity.y = -90;

		//     console.log('gravity down');
		// } else {
		//     this.world.gravity.y = 0;
		// }

	}

	////////////////////
	// GUI
	////////////////////

	onChangeBlur() {
		this.hblur.uniforms['h'].value = this.effectController.blur / this.width;
		this.vblur.uniforms['v'].value = this.effectController.blur / this.height;

		this.vblur.uniforms['r'].value = this.hblur.uniforms['r'].value = this.effectController.horizontalBlur;
	}

	onChangeGlow() {
		// this.symbol.glowMesh.insideMesh.material.uniforms['coeficient'].value = this.effectController.coeficient;
		// this.symbol.glowMesh.insideMesh.material.uniforms['power'].value = this.effectController.power;
		// this.symbol.glowMesh.insideMesh.material.uniforms.glowColor.value.set(this.effectController.glowColor);

		// this.symbol.glowMesh.outsideMesh.material.uniforms['coeficient'].value = this.effectController.coeficientOut;
		// this.symbol.glowMesh.outsideMesh.material.uniforms['power'].value = this.effectController.powerOut;
		// this.symbol.glowMesh.outsideMesh.material.uniforms.glowColor.value.set(this.effectController.glowColorOut);
	}

	onChangeBrightness() {
		this.brightness.uniforms['brightness'].value = this.effectController.brightness;
		this.brightness.uniforms['contrast'].value = this.effectController.contrast;
	}

	onChangeDolly() {
		this.dolly.cameraPosition = this.effectController.position;
		this.dolly.lookatPosition = this.effectController.lookAt;
		this.dolly.update();
	}

}
