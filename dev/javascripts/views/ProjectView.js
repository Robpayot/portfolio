import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import { toRadian, clamp, round, getOffsetTop } from '../helpers/utils';
import PreloadManager from '../managers/PreloadManager';
import SceneManager from '../managers/SceneManager';
import { Device } from '../helpers/Device';
import bean from 'bean';
import CssContainer from '../components/CssContainer';
import ScrollManager from '../managers/ScrollManager';
import RouterManager from '../managers/RouterManager';
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
		this.id = obj.id;
		this.data = obj.data;
		this.bkg = obj.bkg;
		this.astd = obj.astd;
		this.gravity = obj.gravity;
		this.pointsLight = obj.pointsLight;
		this.alt = obj.alt;
		this.fromUrl = obj.fromUrl;
		this.dir = obj.dir;

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
		this.checkCssContainer = this.checkCssContainer.bind(this);
		this.setEnvelop = this.setEnvelop.bind(this);
		this.onHoverLink = this.onHoverLink.bind(this);
		this.onLeaveLink = this.onLeaveLink.bind(this);
		this.onClickContainer = this.onClickContainer.bind(this);
		this.killGlitch = this.killGlitch.bind(this);
		this.onHoverTitle = this.onHoverTitle.bind(this);
		this.onLeaveTitle = this.onLeaveTitle.bind(this);
		this.goTo = this.goTo.bind(this);

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
		// this.stopScrollZ = true;

		this.tlGlitch = new TimelineMax({repeat: -1, repeatDelay: 1.5, paused: true});

		this.menu = document.querySelector('.menu');


	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		if (Device.touch === false) {
			// move camera
			EmitterManager[onListener]('mousemove', this.onMouseMove);
			window[evListener]('click', this.onClick);
		} else {
			window[evListener]('touchstart', this.onClick);
		}

		EmitterManager[onListener]('scroll', this.scroll);
		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.raf);
		ScrollManager[onListener]();

		if (method === true) {

			bean.on(document.body, 'click.project', '.project__title', this.showContent);
			// bean.on(document.body, 'click.project', '.project__arrow', this.goTo);
			bean.on(document.body, 'mouseenter.project', '.glitch', this.onHoverTitle);
			bean.on(document.body, 'mouseleave.project', '.glitch', this.onLeaveTitle);
			// bean.on(document.body, 'mouseover.project', '.project__arrow', this.onHoverBtn);
			// bean.on(document.body, 'mouseleave.project', '.project__arrow', this.onLeaveBtn);

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
		this.setCamera(50);
		this.setCameraPos();


		// Set physics
		if (this.gravity === true) this.initPhysics();

		// Set symbol

		// Set asteroid
		this.setAsteroids();

		if (this.pointsLight === true) {
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




		// Camera controls
		if (this.isControls === true) {
			this.controls = new OrbitControls(this.camera, SceneManager.renderer.domElement);
			this.controls.enableZoom = true;
		}

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

		this.start();

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
		this.camera.movingRotX = 0;

		this.pathRadius = this.zoomZ;
		this.camera.position.set(0, 0, 70);
		if (Device.size === 'mobile') {
			this.camera.position.set(0, 0, 200);
		}


	}

	setEnvelop() {
		// Set up the sphere vars
		const width = this.bounceArea;

		const geo = new SphereGeometry(width, 10, 10);
		const mat = new MeshPhongMaterial({color: this.bkg, side: BackSide});
		this.envelop = new Mesh(geo,mat);

		// this.envelops.push(mesh);
		this.scene.add(this.envelop);



	}

	setCssContainers() {

		const data = this.data;

		data.id = this.id;

		// Title
		let template = Handlebars.compile(PreloadManager.getResult('tpl-project-title'));
		let html  = template(data);
		const title = new CssContainer(html, this.cssScene, this.cssObjects);
		title.position.set(40, 0, 10);
		title.scale.multiplyScalar(this.coefText); // Il faudrait ne pas scale ici. Canvas trop gros

		this.prevId = this.id - 1 < 0 ? DATA.projects.length - 1 : this.id - 1;
		this.nextId = this.id + 1 > DATA.projects.length - 1 ? 0 : this.id + 1;

		// Pixel to Units magic FORMULE
		const distZ = -10;
		const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		const wHeight = 2 * Math.tan( vFOV / 2 ) * (this.zoomZ - distZ); // visible height dist = 60 (160 - 100)
		const margePosY = 7;
		const finalPosY = wHeight / 2 - margePosY;

		global.CURSOR.prev.href = `#project-${this.prevId}`;
		global.CURSOR.prev.setAttribute('data-color', DATA.projects[this.prevId].color);

		global.CURSOR.next.href = `#project-${this.nextId}`;
		global.CURSOR.next.setAttribute('data-color', DATA.projects[this.nextId].color);


		// Gallery

		// arrows

		// Context + gallery arrows
		template = Handlebars.compile(PreloadManager.getResult('tpl-project-content'));
		html  = template(data);
		this.ui.uiContent.className = '';
		this.ui.uiContent.classList.add('ui-content', 'is-project');

		this.ui.uiContent.innerHTML = html;

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
				clock: this.clock,
				stop: true
			});

			// Start transition In
			if (this.fromUrl === true) {
				this.transitionIn(true);
				this.fromUrl = false;
			} else {
				this.transitionIn();
			}

			this.initGalleryY = 0;

			// TweenMax.set('.project__next hr', {y: -100});
			// TweenMax.set('.project__prev hr', {y: -120});
		}

	}

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
		TweenMax.set('.project__link circle', {transformOrigin: '50% 50%'});
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
		TweenMax.to('.project__title', 1, { opacity: 0 });
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

		tl.set(['.project__top', this.ui.imgs[0]], { visibility: 'visible' }, 1.7);  // ,1.7
		tl.set(['.project__container'], { visibility: 'visible', display: 'block', opacity: 1 }, 1.7);

		tl.staggerFromTo(['.project__top', this.ui.imgs[0]], 1.2, { // 1.2
			opacity: 0,
			y: 80
		}, {
			opacity: 0.9,
			y: 0,
			ease: window.Expo.easeOut
		}, 0.2, 1.7);

		tl.fromTo(this.ui.imgs[0], 1.2, {
			scaleY: 2
		}, {
			scaleY: 1,
			ease: window.Expo.easeOut
		}, 1.7);

		this.ui.imgs[0].classList.add('is-visible');

		// angle

		tl.to(trigo, 2.1, { // 3
			angle: 0,
			ease: window.Power2.easeInOut,
			onUpdate: () => {
				// Math.PI / 2 start rotation at 90deg
				this.camera.position.x = this.pathRadius * Math.cos(Math.PI / 2 * trigo.angle);
				this.camera.position.z = this.pathRadius * Math.sin(Math.PI / 2 * trigo.angle);

			}
		}, 0);

		tl.to(this.currentRotateY, 2.1, {
			angle: toRadian(90),
			ease: window.Power2.easeInOut
		}, 0);

		tl.add(() => {
			global.CURSOR.interractLeave();
			this.glitch.hover = false;

			// ScrollManager.on(); // start scrollmanager
		}, 0.5);

		if (global.SCROLLED === false) {
			tl.to('.scroll', 0.5, {opacity: 0}, 0);
		}

	}

	backFromContent() {

		bean.off(document.body, '.projectContent'); // off events related state projectContent

		// on events related to init state
		bean.on(document.body, 'click.project', '.project__title', this.showContent);
		// bean.on(document.body, 'click.project', '.project__arrow', this.goTo);
		bean.on(document.body, 'mouseenter.project', '.glitch', this.onHoverTitle);
		bean.on(document.body, 'mouseleave.project', '.glitch', this.onLeaveTitle);
		// bean.on(document.body, 'mouseover.project', '.project__arrow', this.onHoverBtn);
		// bean.on(document.body, 'mouseleave.project', '.project__arrow', this.onLeaveBtn);

		this.cameraRotX = true;
		this.glitch.stop = false;
		// ScrollManager.off(); // stop scrollmanager
		this.contentOpen = false;
		global.CURSOR.interractLeave({back: true});
		TweenMax.set(global.MENU.ui.button, { display: 'block'});

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

		tl.staggerFromTo(['.project__number', '.glitch', '.project__more'], 2, { // 1.2
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

		tl.to(global.MENU.ui.button, 2, {
			opacity: 1
		}, 2.6);

		if (global.SCROLLED === false) {
			tl.to('.scroll', 1, {opacity: 1}, 2.6);
		}

	}

	goTo(e, element) {


		const el = e !== null ? e.currentTarget : element;
		this.goToNoScroll = true;
		if (el.classList.contains('cursor__next')) this.dir = -1;
		else this.dir = 1;

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

		if (this.transitionInComplete !== true) {
			e.deltaY = 0; // prevent inertia
		} else {
			if (global.SCROLLED === false && this.contentOpen !== true) {
				global.SCROLLED = true;
				TweenMax.to('.scroll', 0.5, {opacity: 0, onComplete: () => {
					document.documentElement.classList.add('scrolled');
				}});
			}
		}


		if (this.contentOpen === true) {
			// need profil for each browser
			this.scrollY -= e.deltaY * 0.2;


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

			if (e.deltaY > 30 || e.deltaY < -30 ) { ///!\ depend of Browsers clamp value. Have to make a real scroll
				this.scrollZ += clamp(e.deltaY * 0.04, -6, 6); //reverse
			}

		}


	}

	onClick(e) {

		if (this.contentOpen === true) {
			this.backFromContent();
		}

		if (global.CURSOR.hoverGoTo === true) {

			RouterManager.currentPage.goTo(null, global.CURSOR.currentEl);
			window.location.href = global.CURSOR.currentEl.href;
		}
	}

	onHoverContainer() {
		global.CURSOR.interractLeave({back: true});
	}

	onLeaveContainer() {
		global.CURSOR.interractHover({back: true});
	}

	onHoverTitle() {

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

	onMouseMove(x, y) {

		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		this.mouse.x = x / window.innerWidth * 2 - 1;
		this.mouse.y = -(y / window.innerHeight) * 2 + 1;
		// console.log(this.mouse);

		if (this.contentOpen === true || this.menu.classList.contains('is-open') === true || this.animating === true) return false;


		if (y < window.innerHeight * 0.15) {
			this.goToNoScroll = true;
			this.dir = -1;
			global.CURSOR.interractHover({type: 'next', color: global.CURSOR.next.getAttribute('data-color'), el: global.CURSOR.next});
			this.cursorActive = true;
		} else if (y > window.innerHeight * 0.85) {
			this.goToNoScroll = true;
			this.dir = 1;
			global.CURSOR.interractHover({type: 'prev', color: global.CURSOR.prev.getAttribute('data-color'), el: global.CURSOR.prev});
			this.cursorActive = true;
		} else {
			if (this.cursorActive === true) {
				this.goToNoScroll = false;
				this.cursorActive = false;
				global.CURSOR.interractLeave({type: 'next', color: 'reset'});

			}
		}

	}

	raf() {

		// on scroll Z
		// smooth scroll
		if (round(this.scrollZ, 10) !== round(this.scrollZSmooth, 10))  {
			// console.log(round(this.scrollZ, 10), this.scrollZSmooth);

			// smooth scroll
			this.scrollZSmooth += (this.scrollZ - this.scrollZSmooth) * this.coefScrollZ; // We need a RAF for a smooth like that

			if (this.scrollZSmooth < this.zoomZ ) { // going foward

				// ScrollManager.off();
				if (this.stopScrollZ !== true) {
					this.stopScrollZ = true;
					// this.transitionOutScrolled = true;
					this.goToNoScroll = true;
					this.dir = -1;
					window.location.href = `#project-${this.nextId}`;
					// this.coefScrollZ = 0.006;
					// this.scrollZ = this.maxZoomZ; // final destination
				}

				// this.coefScrollZ += 0.001; // acceleration
				// this.camera.position.z = this.scrollZSmooth;

				// if (this.scrollZSmooth < this.maxZoomZ + 30)  {
				// 	this.transitionOutScrolled = true;
				// 	if (this.hrefChanged === true) this.transitionOut();
				// 	else window.location.href = `#project-${this.nextId}`; // transitionOut + change href if scrolled only
				// }

			} else if (this.scrollZSmooth > this.zoomZ) { // going backward
				if (this.stopScrollZ !== true) {
					// this.transitionOutScrolled = true;
					this.stopScrollZ = true;
					this.goToNoScroll = true;
					this.dir = 1;
					window.location.href = `#project-${this.prevId}`;
					// this.scrollZ = this.minZoomZ; // final destination
					// this.coefScrollZ = 0.027;
				}

				// this.camera.position.z = this.scrollZSmooth;

				// if (this.scrollZSmooth > this.minZoomZ - 30 )  {
				// 	this.transitionOutScrolled = true;
				// 	if (this.hrefChanged === true) this.transitionOut();
				// 	else window.location.href = `#project-${this.prevId}`; // transitionOut + change href if scrolled only
				// }
			}
			// else {
			// 	// this.camera.position.z = this.scrollZSmooth;
			// }

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
		if ( this.isControls === false) { //

			// Specify target we want
			this.camRotTarget.x = toRadian(round(this.mouse.y * 4, 100));
			this.camRotTarget.y = -toRadian(round(this.mouse.x * 8, 100));

			// Smooth it with deceleration
			this.camRotSmooth.x += (this.camRotTarget.x - this.camRotSmooth.x) * 0.08;
			this.camRotSmooth.y += (this.camRotTarget.y - this.camRotSmooth.y) * 0.08;

			// Apply rotation

			if (this.camera.movingRotX && this.lastPage === 'intro') this.camera.rotation.x = this.camera.movingRotX + this.camRotSmooth.x;
			else  this.camera.rotation.x = this.camRotSmooth.x;
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


		// this.lastPage = 'intro';
		fromUrl = false;

		let time = 3;
		let delay = 1.2;

		if (this.lastPage === 'intro') {

			time = 4;
			delay = 1.5;

			let points = {
				'camera': [{
					'x': 0,
					'y': -115,
					'z': 300
				}, {
					'x': 0,
					'y': -65,
					'z': 240
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

			this.dolly = new CameraDolly(this.camera, this.scene, points, null, false);
			// this.dolly = null;

			this.dolly.cameraPosition = 0;
			this.dolly.lookatPosition = 0;
			this.dolly.range = [0, 1];
			this.dolly.both = 0;
		}


		const tl = new TimelineMax({
			onComplete: () => {
				this.camera.position.set(0, 0, this.zoomZ);
				this.clicked = false;
			}
		});

		if (this.lastPage === 'intro') {

			tl.to(this.dolly, time, {
				cameraPosition: 1,
				lookatPosition: 1,
				ease: window.Expo.easeOut,
				onUpdate: () => {
					this.dolly.update();
					this.camera.movingRotX = this.camera.rotation.x;
				}
			});

		} else {

			let start = this.dir === -1 ? 0 : 300;
			tl.fromTo(this.camera.position, 3, {z : start}, {z : this.zoomZ, ease: window.Expo.easeOut}); // 2

		}

		tl.to('.overlay', 0.8, {
			opacity: 0
		}, 0);

		tl.add(() => {
			// remover overlay class
			// this.ui.overlay.classList.remove('black');
			this.transitionInComplete = true;
		}, 0.8);


		tl.staggerFromTo(['.project__number', '.glitch', '.project__more'], 2, { // 1.2
			opacity: 0,
			y: 80
		}, {
			opacity: 0.8,
			y: 0,
			ease: window.Expo.easeOut
		}, 0.1, delay);

		if (global.SCROLLED === false) {
			tl.to('.scroll', 1, {opacity: 1}, 5);
		}


	}

	transitionOut(dir) {

		if (this.animating === true) return false;
		this.animating = true;

		const tl = new TimelineMax();

		if (this.transitionOutScrolled !== true) {

			if (this.goToNoScroll) dir = this.dir; // se baser sur le dir de goTo non de l'url
			// Simulate scroll backWard/foward
			let delay = 0.8;
			if (dir === 1) {
				// this.scrollZ -= 0.2;
				delay = 0.4;
				tl.to(this.camera.position, 1.8, {z : this.minZoomZ , ease: window.Power2.easeOut}); // 2
			} else {
				// this.scrollZ += 0.2;
				tl.to(this.camera.position, 1.2, {z : this.maxZoomZ , ease: window.Expo.ease}); // 2
			}

			tl.to('.overlay', 0.5, {
				opacity: 1
			}, delay);
			tl.add(() => {
				this.animating = false;

				// TweenMax.killAll(); // venere
				EmitterManager.emit('view:transition:out');
			});

			this.hrefChanged = true;

		} else {
			// tl.to(this.camera.position, 3, {z : 0, ease: window.Power4.easeOut});
			tl.to('.overlay', 0.5, {
				opacity: 1
			});
			tl.add(() => {
				this.animating = false;

				// TweenMax.killAll(); // venere
				EmitterManager.emit('view:transition:out');
			}, 0.8);
		}



	}

	reset() {

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

		tl.set(['.project__next'], {
			opacity: 1
		});

	}

	destroy() {
		// ScrollManager.off();
		super.destroy();
	}

}
