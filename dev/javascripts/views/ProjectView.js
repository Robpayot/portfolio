import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';
import { getRandom, toRadian, clamp, round, getOffsetTop } from '../helpers/utils';
import PreloadManager from '../managers/PreloadManager';
import SceneManager from '../managers/SceneManager';
import { Device } from '../helpers/Device';
import bean from 'bean';
import ease from '../helpers/ease';
import CssContainer from '../components/CssContainer';
import ScrollManager from '../managers/ScrollManager';
import RouterManager from '../managers/RouterManager';
import Ui from '../components/Ui';
import Handlebars from 'handlebars';
import DATA from '../../datas/data.json';
import Glitch from '../components/Glitch';


// THREE JS
import { RGBFormat, LinearFilter, WebGLRenderTarget, Raycaster, BackSide, Mesh, Scene, Color, MeshPhongMaterial, SphereGeometry, Vector3 } from 'three';
import EffectComposer, { RenderPass, ShaderPass } from 'three-effectcomposer-es6';
import OrbitControls from '../vendors/OrbitControls';
import { CameraDolly } from '../vendors/three-camera-dolly-custom';


// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader
import { VignetteShader } from '../shaders/VignetteShader';
import '../postprocessing/Pass'; // missing in EffectComposer
import { FilmPass } from '../postprocessing/FilmPass';



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
		this.alt = obj.alt;
		this.fromUrl = obj.fromUrl;
		this.dir = obj.dir;
		this.sound = SoundManager;

		this.name = `project-${this.id}`;

		// bind
		this.raf = this.raf.bind(this);
		this.events = this.events.bind(this);
		this.start = this.start.bind(this);
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
		this.scroll = this.scroll.bind(this);
		this.onMouseWheel = this.onMouseWheel.bind(this);
		this.onChangeGlow = this.onChangeGlow.bind(this);
		this.onChangeBlur = this.onChangeBlur.bind(this);
		this.onChangeBrightness = this.onChangeBrightness.bind(this);
		this.onChangeDolly = this.onChangeDolly.bind(this);
		this.onChangeCameraRot = this.onChangeCameraRot.bind(this);
		this.checkCssContainer = this.checkCssContainer.bind(this);
		this.setEnvelop = this.setEnvelop.bind(this);
		this.onHoverLink = this.onHoverLink.bind(this);
		this.onLeaveLink = this.onLeaveLink.bind(this);
		this.onHoverBtn = this.onHoverBtn.bind(this);
		this.onLeaveBtn = this.onLeaveBtn.bind(this);
		this.onClickContainer = this.onClickContainer.bind(this);
		this.killGlitch = this.killGlitch.bind(this);
		this.onHoverTitle = this.onHoverTitle.bind(this);
		this.onLeaveTitle = this.onLeaveTitle.bind(this);

		this.bounceArea = 200; // default bounceArea
		this.animLink = false;
		this.hoverLink = false;
		this.maxDash = 635;
		this.animBtn = false;
		this.hoverBtn = false;
		this.scrollY = this.scrollYSmooth = 0;
		this.scrollZ = this.scrollZSmooth = 160;
		this.coefScrollZ = 0.15;
		this.zoomZ = 160;
		this.minZoomZ = 210;
		this.maxZoomZ = 0;
		console.log('mon id', this.id);
		// this.stopScrollZ = true;

		this.tlGlitch = new TimelineMax({repeat: -1, repeatDelay: 1.5, paused: true});


	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		if (Device.touch === false) {
			// move camera
			EmitterManager[onListener]('mousemove', this.onMouseMove);
			window[evListener]('click', this.onClick);
			// document[evListener]('mousewheel', this.onMouseWheel);
			// document[evListener]('MozMousePixelScroll', this.onMouseWheel);
		} else {
			window[evListener]('touchstart', this.onClick);
		}

		EmitterManager[onListener]('scroll', this.scroll);
		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.raf);

		if (method === true) {

			bean.on(document.body, 'click.project', '.project__title', this.showContent);
			bean.on(document.body, 'click.project', '.project__container', this.onClickContainer);
			bean.on(document.body, 'mouseenter.project', '.glitch', this.onHoverTitle);
			bean.on(document.body, 'mouseleave.project', '.glitch', this.onLeaveTitle);
			bean.on(document.body, 'mouseover.project', '.project__arrow', this.onHoverBtn);
			bean.on(document.body, 'mouseleave.project', '.project__arrow', this.onLeaveBtn);

		} else {
			bean.off(document.body, '.project');
			bean.off(document.body, '.projectContent');
			this.glitch.hover = false;
			this.tlGlitch.kill();
		}


	}

	init() {


		this.isControls = false;
		this.postProc = true;

		this.cssObjects = [];
		this.finalFov = 45;
		this.currentRotateY = { angle: 0};
		this.cameraRotX = true;
		this.composer = null;
		this.pixelToUnits = 8.1;
		this.coefText = 0.04;
		this.coefImage = 0.04;

		// retina screen size
		this.width = window.innerWidth * window.devicePixelRatio;
		this.height = window.innerHeight * window.devicePixelRatio;

		// Set scenes
		this.scene = new Scene();
		this.scene.background = new Color(0x000000);
		this.cssScene = new Scene();
		this.cameraTarget = new Vector3(0, 0, 0);

		// Set Camera
		this.setCamera();
		this.setCameraPos();


		// Set physics
		if (this.gravity === true) this.initPhysics();

		// Set symbol

		// Set asteroid
		this.setAsteroids();

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

		this.camRotTarget = new Vector3(0, 0, 0);
		this.camRotSmooth = new Vector3(0, 0, 0);

		// this.camera.lookAt(this.cameraTarget);




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
			lookAt: 0,
			astColor: 0xffffff,
			rotX: 0,
			rotY: 0,
			rotZ: 0,

		};

		if (this.sound.gui.init === false) {
			// Blur
			const blurFolder = this.sound.gui.addFolder('Blur');
			blurFolder.add(this.effectController, 'blur', 0.0, 20.0, 0.001).listen().onChange(this.onChangeBlur);
			blurFolder.add(this.effectController, 'horizontalBlur', 0.0, 1.0, 0.001).listen().onChange(this.onChangeBlur);
			blurFolder.add(this.effectController, 'enabled').onChange(this.onChangeBlur);
			blurFolder.open();

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

			// Cam
			this.sound.gui.add(this.effectController, 'rotX', -90, 90).listen().onChange(this.onChangeCameraRot);
			this.sound.gui.add(this.effectController, 'rotY', -90, 90).listen().onChange(this.onChangeCameraRot);
			this.sound.gui.add(this.effectController, 'rotZ', -90, 90).listen().onChange(this.onChangeCameraRot);

			this.sound.gui.init = true;
			this.sound.gui.addColor(this.effectController, 'astColor').listen().onChange(this.onChangeAst);
		}


		// Camera Dolly
		// const dollyFolder = this.sound.gui.addFolder('Camera Dolly');
		// dollyFolder.add(this.effectController, 'position', 0.0, 1).listen().onChange(this.onChangeDolly);
		// dollyFolder.add(this.effectController, 'lookAt', 0.0, 1).listen().onChange(this.onChangeDolly);
		// dollyFolder.open();


		////////////////////
		// POST PROCESSING
		////////////////////

		// IMPORTANT CAREFUL HERE (when changing scene)
		// SceneManager.renderer.autoClear = false;

		// EFFECT COMPOSER
		// Vignette
		this.effectVignette = new ShaderPass( VignetteShader );
		this.effectVignette.uniforms[ 'offset' ].value = 0.95;
		this.effectVignette.uniforms[ 'darkness' ].value = 1.6;

		// Film effect
		// noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale
		this.effectFilm = new FilmPass( 0.45, 0, 648, false );

		// this.effectVignette.renderToScreen = true;
		this.effectFilm.renderToScreen = true;

		const renderTargetParameters = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat, stencilBuffer: true };
		this.renderTarget = new WebGLRenderTarget(this.width, this.height, renderTargetParameters);

		const renderModel = new RenderPass(this.scene, this.camera);

		this.composer = new EffectComposer(SceneManager.renderer, this.renderTarget);

		this.composer.addPass(renderModel);
		// this.composer.addPass(this.effectVignette);
		this.composer.addPass(this.effectFilm);
		// Set BLUR EFFECT
		// this.setBlur();

		this.start();

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
		this.el.classList.remove('about');
		this.el.classList.add('project');

		// set ui
		// this.UI.intro.style.display = 'none';
		global.MENU.el.classList.add('is-active');
		global.MENU.el.classList.remove('is-open');
		global.CURSOR.interractLeave();
		global.CURSOR.el.classList.remove('alt');

		if (this.alt === true) {
			this.el.classList.add('alt');
			global.MENU.el.classList.add('alt');
		} else {
			this.el.classList.remove('alt');
			global.MENU.el.classList.remove('alt');
		}

		// Set CssContainers
		this.setCssContainers();

		////////////////////
		// EVENTS
		////////////////////
		console.log(ScrollManager);
		ScrollManager.on();

		this.events(true);

		// Wait for cssContainer to be add in DOM
		this.refreshIntervalId = setInterval(this.checkCssContainer, 500);


	}

	////////////////////
	// SET SCENE
	////////////////////

	setCameraPos() {
		// this.camera.useTarget = false;
		this.camera.lookAt(this.cameraTarget);

		this.pathRadius = this.zoomZ;
		this.camera.position.set(-60, 170, 70);
		if (Device.size === 'mobile') {
			this.camera.position.set(0, 0, 200);
		}


	}

	setEnvelop() {
		// Set up the sphere vars
		const width = this.bounceArea;
		// const height = this.bounceArea;
		// const depth = 2;

		// const geometry = new BoxGeometry(width, height, depth);
		// const geometry = new SphereGeometry(100, 100, 60);

		// // 0x0101010,
		// // const img = PreloadManager.getResult('damier');
		// // const tex = new Texture(img);
		// // tex.needsUpdate = true;
		// const material = new MeshBasicMaterial({ opacity: 1 });
		// this.envelops = [];

		// // const configs = [{
		// // 	pos: { x: -width / 2, y: 0, z: 0 },
		// // 	rot: { x: 0, y: toRadian(-90), z: 0 }
		// // }, {
		// // 	pos: { x: width / 2, y: 0, z: 0 },
		// // 	rot: { x: 0, y: toRadian(-90), z: 0 }
		// // }, {
		// // 	pos: { x: 0, y: 0, z: -width / 2 },
		// // 	rot: { x: 0, y: 0, z: 0 }
		// // }, {
		// // 	pos: { x: 0, y: 0, z: width / 2 },
		// // 	rot: { x: 0, y: 0, z: 0 }
		// // }, {
		// // 	pos: { x: 0, y: -width / 2, z: 0 },
		// // 	rot: { x: toRadian(-90), y: 0, z: 0 }
		// // }, {
		// // 	pos: { x: 0, y: width / 2, z: 0 },
		// // 	rot: { x: toRadian(-90), y: 0, z: 0 }
		// // }];

		// // // for (let i = 0; i < configs.length; i++) {

		// // // 	const envelop = new Envelop(geometry, material, configs[i].pos, configs[i].rot);

		// // // 	this.envelops.push(envelop);

		// // // 	// add mesh to the scene
		// // // 	this.scene.add(envelop);
		// // // }
		// const envelop = new Envelop(geometry, material, 0, 0);

		const geo = new SphereGeometry(width, 10, 10);
		const mat = new MeshPhongMaterial({color: this.bkg, side: BackSide});
		this.envelop = new Mesh(geo,mat);

		// this.envelops.push(mesh);
		this.scene.add(this.envelop);



	}

	setAsteroids() {

	}

	setLight() {


	}

	setCssContainers() {

		const data = this.data;

		data.id = this.id;

		// Title
		let template = Handlebars.compile(PreloadManager.getResult('tpl-project-title'));
		let html  = template(data);
		const title = new CssContainer(html, this.cssScene, this.cssObjects);
		title.position.set(20, 0, 10);
		title.scale.multiplyScalar(this.coefText); // Il faudrait ne pas scale ici. Canvas trop gros

		this.prevId = this.id - 1 < 0 ? DATA.projects.length - 1 : this.id - 1;
		this.nextId = this.id + 1 > DATA.projects.length - 1 ? 0 : this.id + 1;

		// Pixel to Units magic FORMULE
		const distZ = -10;
		const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		const wHeight = 2 * Math.tan( vFOV / 2 ) * (this.zoomZ - distZ); // visible height dist = 60 (160 - 100)
		const margePosY = 7;
		const finalPosY = wHeight / 2 - margePosY;
		// console.log(finalPosY);
		// wHeight === window.innerHeight in Units equivalent
		// let aspect = window.width / window.height;


		// Prev project
		template = Handlebars.compile(PreloadManager.getResult('tpl-project-prev'));
		html  = template({id: this.prevId, color: DATA.projects[this.prevId].color });
		this.prevProject = new CssContainer(html, this.cssScene, this.cssObjects);
		this.prevProject.position.set(0, -finalPosY, -distZ);
		this.prevProject.scale.multiplyScalar(this.coefText);


		// Next project
		template = Handlebars.compile(PreloadManager.getResult('tpl-project-next'));
		html  = template({id: this.nextId, color: DATA.projects[this.nextId].color});
		this.nextProject = new CssContainer(html, this.cssScene, this.cssObjects);
		this.nextProject.position.set(0, finalPosY, -distZ);
		this.nextProject.scale.multiplyScalar(this.coefText);


		// // Gallery
		const radius = 100; // radius circonference of gallery circle
		// this.galleryAngle = Math.PI / 6; // Space of 30 degree PI / 6
		// this.gallery = new Object3D(); // DESTROY CONTAINER ????
		// this.gallery.position.set(0, -15, 0);
		// this.gallery.rotation.set(0, toRadian(90), 0);
		// this.cssScene.add(this.gallery);
		// this.currentSlide = 0;
		// this.nbSlides = data.imgs.length;

		// this.initGalleryY = this.targetGalleryY = 0;

		// // Formules coordonnée d'un cercle
		// // x = x0 + r * cos(t)
		// // y = y0 + r * sin(t)

		// for (let i = 0; i < this.nbSlides; i++) {
		// 	// image 1
		// 	const image = new CssContainer(`<div class="project__image"><img src="images/projects/${data.imgs[i]}" alt="project image" /></div>`, this.gallery, this.cssObjects);
		// 	image.position.set(radius * Math.sin(this.galleryAngle * i), 0, radius * Math.cos(this.galleryAngle * i));
		// 	image.rotation.set(0, this.galleryAngle * i, 0);
		// 	image.scale.multiplyScalar(this.coefImage);
		// }

		// this.galleryPivot = new Object3D();
		// this.galleryPivot.add(this.gallery);

		// this.cssScene.add(this.galleryPivot);

		// arrows

		// Context + gallery arrows
		template = Handlebars.compile(PreloadManager.getResult('tpl-project-content'));
		html  = template(data);
		this.UI.content.className = '';
		this.UI.content.classList.add('ui-content', 'is-project');

		this.UI.content.innerHTML = html;

		// this.topContent = {new CssContainer(html, this.cssScene, this.cssObjects)};
		// // Rename context to container or container
		// // Rename Details in Content
		// this.topContent.position.set(radius, 0, 0);
		// this.topContent.rotation.set(0, toRadian(90), 0);
		// this.topContent.scale.multiplyScalar(this.coefText);

		// this.initTopContentY = this.topContentTargetY = this.topContentSmoothY = this.topContentY = 5;

		// Top Content + gallery arrows
		// template = Handlebars.compile(PreloadManager.getResult('template-footer'));
		// html  = template(data);
		// this.footer = new CssContainer(html, this.cssScene, this.cssObjects);
		// this.footer.position.set(radius, 0, 0);
		// this.footer.rotation.set(0, toRadian(90), 0);
		// this.footer.scale.multiplyScalar(this.coefText);

		// this.initTopContentY = this.topContentTargetY = this.topContentSmoothY = this.topContentY = 0;
	}

	checkCssContainer() {

		this.glitchEl = this.el.querySelector('.glitch');

		if (this.glitchEl === null) {
			//ok
		} else {
			// cssContainer Ready
			clearInterval(this.refreshIntervalId);

			this.ui.container = document.querySelector('.project__container');
			this.ui.imgs = document.querySelectorAll('.project__image');
			this.ui.footer = document.querySelector('.project__footer');

			this.glitch = new Glitch({ // issue link to ui footer here but Css
				el: this.glitchEl,
				sndColor: this.data.color,
				color: 'white',
				txt: this.data.title,
				clock: this.clock
			});

			// Start transition In
			if (this.fromUrl === true) {
				this.transitionIn(true);
				this.fromUrl = false;
			} else {
				this.transitionIn();
			}

			// Position Gallery
			// Pixel to Units magic FORMULE
			const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
			const wHeight = 2 * Math.tan( vFOV / 2 ) * 60; // visible height dist = 60 (160 - 100)
			// wHeight === window.innerHeight in Units equivalent
			// let aspect = window.width / window.height;
			// let width = height * aspect;                  // visible width
			// const margeTop = 2; // test getBoundingRectClient is not giving the right height !!!

			this.initGalleryY = 0;

			// Position Footer
			// percent = this.ui.projectImg.offsetHeight / window.innerHeight; // half because centered
			// let finalHeightFooter = wHeight * percent;
			// this.footer.position.y = this.initFooterY = this.initGalleryY - finalHeightFooter - margeTop + 6;

			let globalMargeScrollBot = 7;


			// let percent = this.ui.container.offsetHeight / 2 / window.innerHeight;
			// this.maxHeightUnits = wHeight * percent + globalMargeScrollBot;

			TweenMax.set('.project__next hr', {y: -100});
			TweenMax.set('.project__prev hr', {y: -120});
		}

	}

	// setBlur() {

	// 	// COMPOSER
	// 	// IMPORTANT CAREFUL HERE (when changing scene)
	// 	// SceneManager.renderer.autoClear = false;

	// 	const renderTargetParameters = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat, stencilBuffer: false };
	// 	this.renderTarget = new WebGLRenderTarget(this.width, this.height, renderTargetParameters);

	// 	this.effectFXAA = new ShaderPass(FXAAShader);
	// 	this.hblur = new ShaderPass(HorizontalTiltShiftShader);
	// 	this.vblur = new ShaderPass(VerticalTiltShiftShader);


	// 	this.hblur.uniforms['h'].value = this.effectController.blur / this.width;
	// 	this.vblur.uniforms['v'].value = this.effectController.blur / this.height;

	// 	this.hblur.uniforms['r'].value = this.vblur.uniforms['r'].value = this.effectController.horizontalBlur;

	// 	this.effectFXAA.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);

	// 	const renderModel = new RenderPass(this.scene, this.camera);

	// 	this.vblur.renderToScreen = true;
	// 	this.hblur.renderToScreen = true;
	// 	this.effectFXAA.renderToScreen = true;

	// 	this.composer = new EffectComposer(SceneManager.renderer, this.renderTarget);

	// 	this.composer.addPass(renderModel);
	// 	this.composer.addPass(this.effectFXAA);
	// 	this.composer.addPass(this.hblur);
	// 	this.composer.addPass(this.vblur);

	// }

	////////////
	// EVENTS
	////////////

	killGlitch() {
		this.glitch.hover = false;
	}

	onClickContainer(e) {
		console.log('click container');
		e.stopPropagation();
	}

	onHoverLink(e) {

		global.CURSOR.interractHover();
		// if (this.hoverLink === true) return false;
		// if (this.animLink === true) return false;

		this.animLink = true;
		this.hoverLink = true;

		TweenMax.to('.project__link circle', 0, {opacity: 0});

		TweenMax.killTweensOf('.project__link .close-up');
		TweenMax.killTweensOf('.project__link .close-down');
		TweenMax.killTweensOf('.project__link .close-down-2');

		const tl = new TimelineMax();
		tl.set(['.project__link .close-up','.project__link .close-down','.project__link .close-down-2','.project__link .open-up','.project__link .open-down'], {clearProps: 'all'});
		tl.to('.project__link .close-down-2', 0.8, {strokeDashoffset: this.maxDash * 3 - 100, ease: window.Expo.easeOut });
		tl.to('.project__link .close-down', 0.9, {strokeDashoffset: this.maxDash * 2 - 180, ease: window.Expo.easeOut }, 0.1);
		tl.to('.project__link .close-up', 1, {strokeDashoffset: -this.maxDash * 3 - 205, ease: window.Expo.easeOut }, 0.2);
		tl.set(['.project__link .close-up','.project__link .close-down','.project__link .close-down-2','.project__link .open-up','.project__link .open-down'], {clearProps: 'all'});
		tl.add(()=> {
			this.animLink = false;
		});

	}

	onLeaveLink() {
		this.hoverLink = false;
		global.CURSOR.interractLeave();
		TweenMax.fromTo('.project__link circle', 0.2, {opacity: 0}, {opacity: 1});
		TweenMax.fromTo('.project__link circle', 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});
	}

	showContent(e) {
		e.stopPropagation();

		if (this.animating === true) return false;

		this.glitch.hover = false; // kill Glitch
		this.tlGlitch.kill();
		bean.off(document.body, '.project'); // off events related to init state

		// on events related to projectContent state
		bean.on(document.body, 'click.projectContent', '.project__container', this.onClickContainer);
		bean.on(document.body, 'mouseenter.projectContent', '.project__container', this.onHoverContainer);
		bean.on(document.body, 'mouseleave.projectContent', '.project__container', this.onLeaveContainer);
		bean.on(document.body, 'mouseenter.projectContent', '.project__link svg', this.onHoverLink);
		bean.on(document.body, 'mouseleave.projectContent', '.project__link svg', this.onLeaveLink);

		this.animating = true;
		this.contentOpen = true;
		// this.cameraRotX = true;
		this.camera.rotation.order = 'YXZ'; // need to change order to rotate correclty X

		TweenMax.to(global.MENU.ui.button, 1, { opacity: 0});
		TweenMax.set(global.MENU.ui.button, { display: 'none', delay: 1});

		// Turn around the perimeter of a circle
		const trigo = { angle: 1 };
		this.currentRotateY = { angle: 0};
		const tl = new TimelineMax({
			onComplete: () => {
				// this.cameraRotX = true;
				this.animating = false;
				this.glitch.stop = true;
			},
		});

		tl.to(this.camera.rotation, 0, {
			x: 0,
			ease: Power2.easeOut
		});

		tl.set(['.project__top', this.ui.imgs[0]], { visibility: 'visible' }, 2.4);  // ,2.4
		tl.set(['.project__container'], { visibility: 'visible', display: 'block', opacity: 1 }, 2.4);

		tl.staggerFromTo(['.project__top', this.ui.imgs[0]], 1.2, { // 1.2
			opacity: 0,
			y: 80
		}, {
			opacity: 0.9,
			y: 0,
			ease: window.Expo.easeOut
		}, 0.2, 2.4);

		tl.fromTo(this.ui.imgs[0], 1.2, {
			scaleY: 2
		}, {
			scaleY: 1,
			ease: window.Expo.easeOut
		}, 2.4);

		this.ui.imgs[0].classList.add('is-visible');

		tl.staggerTo(['.project__prev','.project__next','.project__title'], 0.6, { // 0.6
			opacity: 0,
			ease: window.Power4.easeOut
		},0.2,1.6);

		// angle

		tl.to(trigo, 3, { // 3
			angle: 0,
			ease: window.Power3.easeInOut,
			onUpdate: () => {
				// Math.PI / 2 start rotation at 90deg
				this.camera.position.x = this.pathRadius * Math.cos(Math.PI / 2 * trigo.angle);
				this.camera.position.z = this.pathRadius * Math.sin(Math.PI / 2 * trigo.angle);

			}
		}, 0);

		tl.to(this.currentRotateY, 3, {
			angle: toRadian(90),
			ease: window.Power3.easeInOut
		}, 0);

		tl.add(() => {
			global.CURSOR.interractLeave();
			this.glitch.hover = false;

			// ScrollManager.on(); // start scrollmanager
		}, 0.5);

	}

	backFromContent() {

		bean.off(document.body, '.projectContent'); // off events related state projectContent

		// on events related to init state
		bean.on(document.body, 'click.project', '.project__title', this.showContent);
		bean.on(document.body, 'click.project', '.project__container', this.onClickContainer);
		bean.on(document.body, 'mouseenter.project', '.glitch', this.onHoverTitle);
		bean.on(document.body, 'mouseleave.project', '.glitch', this.onLeaveTitle);
		bean.on(document.body, 'mouseover.project', '.project__arrow', this.onHoverBtn);
		bean.on(document.body, 'mouseleave.project', '.project__arrow', this.onLeaveBtn);

		this.cameraRotX = true;
		this.glitch.stop = false;
		// ScrollManager.off(); // stop scrollmanager
		this.contentOpen = false;
		global.CURSOR.interractLeave({back: true});

		TweenMax.set(global.MENU.ui.button, { display: 'block'});
		TweenMax.to(global.MENU.ui.button, 1, { opacity: 1});

		for (let i = 0; i < this.ui.imgs.length; i++) {
			this.ui.imgs[i].classList.remove('is-visible');
		}
		this.ui.footer.classList.remove('is-visible');

		const trigo = { angle: 0 };
		this.currentRotateY = { angle: toRadian(90)};
		const tl = new TimelineMax({ onComplete: () => {
			// this.initTopContentY = this.topContentTargetY = this.topContentSmoothY = this.topContentY = 5;
			this.scrollY = this.scrollYSmooth = 0;
			TweenMax.set(this.ui.container, { y: -this.scrollY});
			this.cameraMove = false;
			this.camera.rotation.order = 'XYZ';
			// this.contentOpen = false;
		} });

		tl.staggerTo(['.project__top', '.project__image', '.project__footer' ], 1.2, {
			opacity: 0,
			ease: window.Power4.easeOut
		}, 0.1);

		tl.set('.project__container', { display: 'none' });


		tl.to(trigo, 3, { // 3.5
			angle: 1,
			ease: window.Power3.easeInOut,
			onUpdate: () => {
				// Math.PI / 2 start rotation at 90deg
				this.camera.position.x = this.pathRadius * Math.cos(Math.PI / 2 * trigo.angle);
				this.camera.position.z = this.pathRadius * Math.sin(Math.PI / 2 * trigo.angle);
				// this.camera.lookAt(this.cameraTarget);
			}
		}, 0.5);

		tl.to(this.currentRotateY, 3, {
			angle: toRadian(0),
			ease: window.Power3.easeInOut
		}, 0.5);

		tl.staggerFromTo(['.project__number', '.glitch', '.project__more', '.project__prev', '.project__next'], 2, { // 1.2
			opacity: 0,
			y: 80
		}, {
			opacity: 0.8,
			y: 0,
			ease: window.Expo.easeOut
		}, 0.1, 2.6);

		tl.set(['.project__title'], {
			opacity: 1
		}, 2.6);

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
		console.log(this.transitionInComplete);

		if (this.transitionInComplete !== true) e.deltaY = 0; // prevent inertia


		if (this.contentOpen === true) {
			// this.topContentTargetY -= e.deltaY * 0.01;
			// need profil for each browser
			this.scrollY -= e.deltaY * 0.2;

			// if (this.scrollY >= this.ui.container.offsetHeight - window.innerHeight / 3) {
			// 	this.scrollY = this.scrollYSmooth = this.ui.container.offsetHeight - window.innerHeight / 3;
			// }

			// if (this.scrollY < 0) {
			// 	this.scrollY = this.scrollYSmooth = 0;
			// }


			for (let i = 1; i < this.ui.imgs.length; i++) {

				if (this.ui.imgs[i].classList.contains('is-visible') === false) {

					if (getOffsetTop(this.ui.imgs[i]) - this.scrollY <= window.innerHeight * 0.7) {

						const tl = new TimelineMax();
						tl.set(this.ui.imgs[i], {visibility: 'visible'});
						tl.fromTo(this.ui.imgs[i], 1.2, { // 1.2
							opacity: 0,
							y: 80
						}, {
							opacity: 0.9,
							y: 0,
							ease: window.Expo.easeOut
						});

						tl.fromTo(this.ui.imgs[i], 1.2, {
							scaleY: 2
						}, {
							scaleY: 1,
							ease: window.Expo.easeOut
						}, 0);
						this.ui.imgs[i].classList.add('is-visible');



					}
				}
			}

			if (this.ui.footer.classList.contains('is-visible') === false) {

				if (getOffsetTop(this.ui.footer) - this.scrollY <= window.innerHeight * 0.7) {

					const tl = new TimelineMax();
					tl.set(this.ui.footer, {visibility: 'visible'});
					tl.fromTo(this.ui.footer, 1.2, { // 1.2
						opacity: 0,
						y: 80
					}, {
						opacity: 0.9,
						y: 0,
						ease: window.Expo.easeOut
					});
					this.ui.footer.classList.add('is-visible');

				}
			}
		} else {
			if (this.stopScrollZ === true) return false;

			this.scrollZ += clamp(e.deltaY * 0.04, -6, 6); //reverse

			console.log( clamp(e.deltaY * 0.04, -4, 4));

			// console.log(this.scrollZSmooth);
			// TweenMax.set(this.camera.position, {z: this.scrollZSmooth});
			// console.log(this.camera.position.z);
			// TweenMax.set(this.ui.container, { y: -this.scrollY});
		}


	}

	onClick(e) {
		console.log('click 1');
		if (this.contentOpen === true) {
			console.log('click 2');
			this.backFromContent();
		}

		// update Mouse position for touch devices
		// if (Device.touch === true) {
		// 	const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		// 	const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		// 	this.mouse.x = eventX / window.innerWidth * 2 - 1;
		// 	this.mouse.y = -(eventY / window.innerHeight) * 2 + 1;

		// 	// U/!\ Important / dangerous
		// 	// update raf for trigger intersect on mobile
		// 	// this.raf();
		// }

		// if (this.clickAsteroid === true) {
		// 	this.currentAstClicked.impulse();
		// }

	}

	onHoverContainer() {
		global.CURSOR.interractLeave({back: true});
	}

	onLeaveContainer() {
		global.CURSOR.interractHover({back: true});
	}

	onHoverTitle() {

		console.log('hover glitch');
		this.tlGlitch.restart();
		// this.tlGlitch.play();
		this.tlGlitch.repeatDelay(1.3);
		this.tlGlitch.add(() => {
			this.glitch.hover = true;
		});
		this.tlGlitch.add(() => {
			this.glitch.hover = false;
			// manual repeat
			// this.onHoverTitle(); //
		}, 0.6);


		global.CURSOR.interractHover();
	}

	onLeaveTitle() {
		this.glitch.hover = false;
		this.tlGlitch.kill();
		global.CURSOR.interractLeave();
	}

	onHoverBtn(e) {
		const el = e.currentTarget;
		global.CURSOR.interractHover({color: el.getAttribute('data-color'), href: el.href});
		if (this.hoverBtn === true) return false;
		if (this.animLink === true) return false;

		// this.animLink = true;
		this.hoverBtn = true;
		const tl = new TimelineMax();
		// TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
		// TweenMax.killTweensOf(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down']);

		if (el.classList.contains('project__prev')) {

			tl.to('.down-2', 1.15, {strokeDashoffset: '-236%', ease: window.Expo.easeOut }, 0);
			tl.to('.down-1', 1, {strokeDashoffset: '-130%', ease: window.Expo.easeOut }, 0.1);
			tl.set(['.down-1', '.down-2'], {clearProps: 'all'});
			tl.fromTo('.project__prev span', 1, {opacity: 0, y: '100%'}, {opacity: 1, y: '0%', ease: window.Expo.easeOut}, 0);
			tl.fromTo('.project__prev hr', 1, {y: -120}, {y: -220, ease: window.Expo.easeOut}, 0);
			tl.add(()=> {
				this.animLink = false;
			});

			TweenMax.to('.project__prev circle', 0, {opacity: 0});

		} else if (el.classList.contains('project__next')) {

			tl.to('.up-1', 0.9, {strokeDashoffset: '292%', ease: window.Expo.easeOut }, 0.1);
			tl.to('.up-2', 1, {strokeDashoffset: '186%', ease: window.Expo.easeOut }, 0.1);
			tl.set(['.up-1', '.up-2'], {clearProps: 'all'});
			tl.fromTo('.project__next span', 1, {opacity: 0, y: '-100%'}, {opacity: 1, y: '0%', ease: window.Expo.easeOut}, 0);
			tl.fromTo('.project__next hr', 1, {y: -100}, {y: 0, ease: window.Expo.easeOut}, 0);
			tl.add(()=> {
				this.animLink = false;
			});

			TweenMax.to('.project__next circle', 0, {opacity: 0});
		}
	}

	onLeaveBtn(e) {
		const el = e.currentTarget;

		global.CURSOR.interractLeave({color: el.getAttribute('data-color'), href: el.href});
		this.hoverBtn = false;
		if (el.classList.contains('project__prev')) {
			TweenMax.fromTo('.project__prev circle', 0.2, {opacity: 0}, {opacity: 1});
			TweenMax.fromTo('.project__prev circle', 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});
			TweenMax.to('.project__prev span', 1, {opacity: 0, y: '100%', ease: window.Expo.easeOut}, 0);
			TweenMax.to('.project__prev hr', 1, {y: -120, ease: window.Expo.easeOut}, 0);

		} else {
			TweenMax.fromTo('.project__next circle', 0.2, {opacity: 0}, {opacity: 1});
			TweenMax.fromTo('.project__next circle', 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});
			TweenMax.to('.project__next span', 1, {opacity: 0, y: '-100%', ease: window.Expo.easeOut}, 0);
			TweenMax.to('.project__next hr', 1, {y: -100, ease: window.Expo.easeOut}, 0);
		}
	}

	onMouseMove(x, y) {

		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		this.mouse.x = x / window.innerWidth * 2 - 1;
		this.mouse.y = -(y / window.innerHeight) * 2 + 1;
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

		// event.preventDefault();

		// if (event.wheelDeltaY) {

		// 	this.finalFov -= event.wheelDeltaY * 0.05;
		// } else if (event.wheelDelta) {

		// 	this.finalFov -= event.wheelDelta * 0.05;
		// } else if (event.detail) {

		// 	this.finalFov += event.detail * 1;
		// }

		// this.finalFov = clamp(this.finalFov, 35, 70);

	}

	resizeHandler() {
		super.resizeHandler();
		// update project title pos
		// Pixel to Units magic FORMULE
		// const distZ = -10;
		// const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		// const wHeight = 2 * Math.tan( vFOV / 2 ) * (160 - distZ); // visible height dist = 60 (160 - 100)
		// const margePosY = 0;
		// const finalPosY = wHeight / 2 - margePosY;
		// console.log(finalPosY);
		// // wHeight === window.innerHeight in Units equivalent
		// // let aspect = window.width / window.height;
		// // Prev project
		// this.prevProject.position.set(0, -finalPosY, -distZ);
		// // Next project
		// this.nextProject.position.set(0, finalPosY, -distZ);
		// this.hblur.uniforms['h'].value = this.effectController.blur / this.width;
		// this.vblur.uniforms['v'].value = this.effectController.blur / this.height;

		// this.effectFXAA.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);

	}

	raf() {


		//////////////////
		// Raycasters
		//////////////////

		// if (this.ui.body.style.cursor !== 'auto') this.ui.body.style.cursor = 'auto';

		// this.raycaster.setFromCamera(this.mouse, this.camera);

		// const intersectsAst = this.raycaster.intersectObjects(this.asteroidsM);

		// if (intersectsAst.length > 0) {
		// 	this.ui.body.style.cursor = 'pointer';
		// 	this.clickAsteroid = true;
		// 	this.currentAstClicked = this.asteroids[intersectsAst[0].object.index];
		// } else {
		// 	// this.ui.body.style.cursor = 'auto';
		// 	this.clickAsteroid = false;
		// }
		// on scroll Z
		// smooth scroll
		if (round(this.scrollZ, 10) !== round(this.scrollZSmooth, 10))  {
			// console.log(round(this.scrollZ, 10), this.scrollZSmooth);

			// smooth scroll
			this.scrollZSmooth += (this.scrollZ - this.scrollZSmooth) * this.coefScrollZ; // We need a RAF for a smooth like that

			// if (this.scrollZSmooth >= this.minZoomZ) { // end
			// 	this.scrollZ = this.scrollZSmooth = this.minZoomZ;
			// 	// TweenMax.to(this.ui.container, 0.7, { y: -this.scrollZSmooth}); // smooth it
			// } else if (this.scrollZSmooth < this.maxZoomZ) { // top
			// 	this.scrollZ = this.scrollZSmooth = this.maxZoomZ;
			// 	// TweenMax.to(this.ui.container, 0.7, { y: -this.scrollZSmooth}); // smooth it
			// }

			if (this.scrollZSmooth < this.zoomZ ) { // top
				// ScrollManager.off();
				this.transitionOutFast = true;
				this.stopScrollZ = true;
				this.scrollZ = this.maxZoomZ; // final destination
				this.coefScrollZ = 0.027;
				TweenMax.set(this.camera.position, {z: this.scrollZSmooth});
				if (this.scrollZSmooth < this.maxZoomZ + 30)  {
					window.location.href = `#project-${this.nextId}`; // transitionOut
				}
			} else if (this.scrollZSmooth > this.zoomZ) { // top
				this.transitionOutFast = true;
				this.stopScrollZ = true;
				this.scrollZ = this.minZoomZ; // final destination
				this.coefScrollZ = 0.027;
				TweenMax.set(this.camera.position, {z: this.scrollZSmooth});
				if (this.scrollZSmooth > this.minZoomZ - 30 )  {
					window.location.href = `#project-${this.prevId}`; // transitionOut
				}
			} else {
				TweenMax.set(this.camera.position, {z: this.scrollZSmooth});
			}

		}

		// on scroll Content
		if (round(this.scrollY, 10) !== round(this.scrollYSmooth, 10))  {
			// console.log(round(this.scrollY, 10), this.scrollYSmooth);

			// smooth scroll
			this.scrollYSmooth += (this.scrollY - this.scrollYSmooth) * 0.1; // We need a RAF for a smooth like that

			if (this.scrollYSmooth >= this.ui.container.offsetHeight - window.innerHeight / 4) { // end
				this.scrollY = this.scrollYSmooth = this.ui.container.offsetHeight - window.innerHeight / 4;
				TweenMax.to(this.ui.container, 0.7, { y: -this.scrollYSmooth}); // smooth it
			} else if (this.scrollYSmooth < 0) { // top
				this.scrollY = this.scrollYSmooth = 0;
				TweenMax.to(this.ui.container, 0.7, { y: -this.scrollYSmooth}); // smooth it
			} else {
				TweenMax.set(this.ui.container, { y: -this.scrollYSmooth});
			}

		}

		// On mouse Move Camera movement

		// deceleration
		if (this.cameraMove === false && this.isControls === false) { //

			// Specify target we want
			this.camRotTarget.x = toRadian(round(this.mouse.y * 4, 100));
			this.camRotTarget.y = -toRadian(round(this.mouse.x * 8, 100));

			// Smooth it with deceleration
			this.camRotSmooth.x += (this.camRotTarget.x - this.camRotSmooth.x) * 0.08;
			this.camRotSmooth.y += (this.camRotTarget.y - this.camRotSmooth.y) * 0.08;

			// Apply rotation

			if (this.cameraRotX) this.camera.rotation.x = this.camRotSmooth.x;
			this.camera.rotation.y = this.camRotSmooth.y + this.currentRotateY.angle;
			// if (this.cameraRotX) this.camera.rotation.x = toRadian(round(this.mouse.y * 4, 100));
			// this.camera.rotation.y = -toRadian(round(this.mouse.x * 8, 100)) + this.currentRotateY.angle;

		}

		this.render();

		// glitch title
		if (this.glitch) {

			if (this.glitch.hover === true ) {
				this.glitch.render();
				this.glitch.stop = false;
			} else {
				if (this.glitch.stop !== true) {
					this.glitch.stop = true;
					this.glitch.render();
				}
			}
		}

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

			// noDolly = false;

			// time = 4;
			// ease = window.Power3.easeInOut;
			// delay = 2.5;

			// points = {
			// 	'camera': [{
			// 		'x': -60,
			// 		'y': 170,
			// 		'z': 70
			// 	}, {
			// 		'x': -40,
			// 		'y': 100,
			// 		'z': 100
			// 	}, {
			// 		'x': -20,
			// 		'y': 50,
			// 		'z': 130
			// 	}, {
			// 		'x': 0,
			// 		'y': 0,
			// 		'z': 160
			// 	}],
			// 	'lookat': [{
			// 		'x': 0,
			// 		'y': 0,
			// 		'z': 0
			// 	}, {
			// 		'x': 0,
			// 		'y': -3,
			// 		'z': 3
			// 	}, {
			// 		'x': 0,
			// 		'y': -3,
			// 		'z': 3
			// 	}, {
			// 		'x': 0,
			// 		'y': 0,
			// 		'z': 0
			// 	}]
			// };
		}

		this.cameraMove = !noDolly;

		this.dolly = new CameraDolly(this.camera, this.scene, points, null, false);
		// this.dolly = null;

		this.dolly.cameraPosition = 0;
		this.dolly.lookatPosition = 0;
		this.dolly.range = [0, 1];
		this.dolly.both = 0;


		const tl = new TimelineMax({
			onComplete: () => {
				this.camera.position.set(0, 0, this.zoomZ);
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
			console.log(this.dir);
			let start = this.dir === -1 ? 0 : 260;
			tl.fromTo(this.camera.position, 3, {z : start}, {z : this.zoomZ, ease: window.Expo.easeOut}); // 2

		}



		tl.to('.overlay', 0.8, {
			opacity: 0
		}, 0);

		tl.add(() => {
			// remover overlay class
			// this.ui.overlay.classList.remove('black');
			console.log('yes');
			this.transitionInComplete = true;
		}, 0.8);

		// tl.fromTo(this.symbol.mesh.position, time, { y: symbolY, z: symbolZ}, { y: 0, z: 0, ease: ease}, 0); // window.Power3.easeInOut

		tl.staggerFromTo(['.project__number', '.glitch', '.project__more', '.project__prev', '.project__next'], 2, { // 1.2
			opacity: 0,
			y: 80
		}, {
			opacity: 0.8,
			y: 0,
			ease: window.Expo.easeOut
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

		const tl = new TimelineMax();

		if (this.transitionOutFast !== true) {
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
			tl.add(() => {
				this.animating = false;

				TweenMax.killAll(); // venere
				// TweenMax.killTweensOf(this.symbol.mesh.position);

				// EmitterManager.emit('router:switch', `/project-${dest}`, dest);
				EmitterManager.emit('view:transition:out');
				// console.log('transition out', this.id);
			});
		} else {
			// tl.to(this.camera.position, 3, {z : 0, ease: window.Power4.easeOut});
			tl.to('.overlay', 0.5, {
				opacity: 1
			});
			tl.add(() => {
				this.animating = false;

				TweenMax.killAll(); // venere
				// TweenMax.killTweensOf(this.symbol.mesh.position);

				// EmitterManager.emit('router:switch', `/project-${dest}`, dest);
				EmitterManager.emit('view:transition:out');
				// console.log('transition out', this.id);
			}, 0.8);
		}



	}

	reset() {
		console.log('reset');

		this.cameraRotX = true;
		this.glitch.stop = false;
		// ScrollManager.off(); // stop scrollmanager

		const tl = new TimelineMax({ onComplete: () => {
			// this.initTopContentY = this.topContentTargetY = this.topContentSmoothY = this.topContentY = 5;
			this.cameraMove = false;
			this.camera.rotation.order = 'XYZ';
		} });

		tl.set(['.project__container', '.project__image', '.gallery__arrow', '.project__footer' ], {
			opacity: 0,
			ease: window.Power4.easeOut
		});

		tl.set(['.project__image', '.gallery__arrow', '.project__footer', '.project__container'], { visibility: 'hidden' });

		this.camera.position.x = this.pathRadius * Math.cos(Math.PI / 2 * 1);
		this.camera.position.z = this.pathRadius * Math.sin(Math.PI / 2 * 1);

		tl.set(this.currentRotateY, {
			angle: toRadian(0)
		});

		tl.set(['.project__next','.project__prev','.project__title'], {
			opacity: 1
		});

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

	onChangeCameraRot() {
		this.camera.rotation.x = toRadian(this.effectController.rotX);
		this.camera.rotation.y = toRadian(this.effectController.rotY);
		this.camera.rotation.z = toRadian(this.effectController.rotZ);
		// this.camera.updateProjectionMatrix();
	}

	destroy() {
		console.log('destroy ?');
		ScrollManager.off();
		super.destroy();
	}

}
