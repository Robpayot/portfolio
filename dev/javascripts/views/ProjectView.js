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
import SplitText from '../vendors/SplitText';


// THREE JS
import { LinearFilter, WebGLRenderTarget, Raycaster, Scene, RGBAFormat, Vector3 } from 'three';
import EffectComposer, { RenderPass } from 'three-effectcomposer-es6';
import OrbitControls from '../vendors/OrbitControls';
import { CameraDolly } from '../vendors/three-camera-dolly-custom';

// POSTPROCESSING
import '../postprocessing/Pass'; // missing in EffectComposer
import { FilmPass } from '../postprocessing/FilmPass';



export default class ProjectView extends AbstractView {

	constructor(obj) {

		super();



		// Update background

		// Get Blob URL bkg
		let arrayBufferView = PreloadManager.getResult(`bkg-${obj.id}`, true);
		let blob = new Blob( [ arrayBufferView ], { type: 'image/jpeg' } );
		let urlCreator = window.URL || window.webkitURL;
		let blobURL = urlCreator.createObjectURL( blob );
		SceneManager.renderer.domElement.style.backgroundImage = `url(${blobURL})`;

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
		this.backFromContent = this.backFromContent.bind(this);
		this.transitionOut = this.transitionOut.bind(this);
		this.scroll = this.scroll.bind(this);
		this.checkCssContainer = this.checkCssContainer.bind(this);
		this.onHoverLink = this.onHoverLink.bind(this);
		this.onLeaveLink = this.onLeaveLink.bind(this);
		this.onClickContainer = this.onClickContainer.bind(this);
		this.killGlitch = this.killGlitch.bind(this);
		this.onHoverTitle = this.onHoverTitle.bind(this);
		this.onLeaveTitle = this.onLeaveTitle.bind(this);
		this.onTouchMoveContainer = this.onTouchMoveContainer.bind(this);
		this.onTouchEndContainer = this.onTouchEndContainer.bind(this);
		this.onTouchStartContainer = this.onTouchStartContainer.bind(this);
		this.animScrollContainer = this.animScrollContainer.bind(this);
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
		if (Device.orientation === 'portrait') {
			this.zoomZ = 200;
			this.scrollZ = this.scrollZSmooth = 200;
			this.minZoomZ = 260;
		}
		this.lastTouchY = 0;
		this.startTouchY = 0;
		this.coefScrollY = Device.touch === true ? 0.1 : 0.6;
		// this.stopScrollZ = true;

		if (Device.touch === true) this.tlGlitch = new TimelineMax({paused: true});
		else this.tlGlitch = new TimelineMax({repeat: -1, repeatDelay: 1.5, paused: true});


		global.OVERLAY.classList.remove('is-intro');


	}

	startScene() {

		super.startScene();
	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let listener = method === false ? 'off' : 'on';

		if (Device.touch === false) {
			// move camera
			EmitterManager[listener]('mousemove', this.onMouseMove);
			window[evListener]('click', this.onClick);
		}

		EmitterManager[listener]('scroll', this.scroll);
		ScrollManager[listener]();
		EmitterManager[listener]('resize', this.resizeHandler);
		EmitterManager[listener]('raf', this.raf);

		if (method !== true) {

			bean[listener](document.body, '.project');
			bean[listener](document.body, '.projectContent');
			this.glitch.hover = false;
			this.tlGlitch.kill();
		}

	}

	init(sceneReady) {

		this.sceneReady = sceneReady;


		this.debug = false;
		this.postProc = this.data.postProc || false;

		this.cssObjects = [];
		this.currentRotateY = { angle: 0};
		this.cameraRotX = true;
		this.composer = null;
		this.pixelToUnits = 8.1;
		this.coefText = 0.04;
		this.coefImage = 0.04;

		// url(PreloadManager.getResult)

		// Set scenes
		this.scene = new Scene();
		this.scene.background = null;
		this.cssScene = new Scene();
		this.cameraTarget = new Vector3(0, 0, 0);

		// Set Camera
		let fov = this.id === 1 ? 45 : 50;
		this.setCamera(fov);
		this.setCameraPos();

		this.resizeHandler(this.scene, this.camera); // resize one time for css scene

		// Set physics
		if (this.gravity === true) this.initPhysics();

		// Set asteroid
		this.setAsteroids();

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
		if (this.debug === true) {
			this.controls = new OrbitControls(this.camera, SceneManager.renderer.domElement);
			this.controls.enableZoom = true;
		}

		////////////////////
		// POST PROCESSING
		////////////////////

		// EFFECT COMPOSER
		// Film effect
		// noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale
		this.effectFilm = new FilmPass( 0.2, 0, 0, false );

		// this.effectVignette.renderToScreen = true;
		this.effectFilm.renderToScreen = true;

		const renderTargetParameters = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat, stencilBuffer: true };
		this.renderTarget = new WebGLRenderTarget(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, renderTargetParameters);

		const renderModel = new RenderPass(this.scene, this.camera);

		this.composer = new EffectComposer(SceneManager.renderer, this.renderTarget);

		this.composer.addPass(renderModel);
		this.composer.addPass(this.effectFilm);

		this.start();

	}

	start() {

		PreloadManager.off('complete', this.preloadCb);

		this.lastPage = RouterManager.lastPage;
		this.el.classList.remove('intro');
		this.el.classList.remove('about');
		this.el.classList.add('project');

		// set UI
		global.MENU.el.classList.add('is-active');
		global.MENU.el.classList.remove('is-open');
		if (!Device.touch) global.CURSOR.interractLeave();
		if (!Device.touch) global.CURSOR.el.classList.remove('alt');

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

		this.camera.lookAt(this.cameraTarget);
		this.camera.movingRotX = 0;

		this.pathRadius = this.zoomZ;
		this.camera.position.set(0, 0, 70);

	}

	setCssContainers() {

		const data = this.data;

		data.id = this.id;

		// Title
		let template = Handlebars.compile(PreloadManager.getResult('tpl-project-title'));
		let html  = template(data);
		const title = new CssContainer(html, this.cssScene, this.cssObjects);
		if (Device.orientation === 'portrait' ) {
			this.coefText = 0.05;
			// Magic calculs ;)
			const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
			const height = 2 * Math.tan( vFOV / 2 ) * this.zoomZ; // dist between 0 and camerapos.y
			const width = height * window.innerWidth / window.innerHeight;

			const offset = width * 0.07;

			title.position.set(-width / 2 + offset, 0, 0);
		} else {
			title.position.set(40, 0, 10);
		}

		title.scale.multiplyScalar(this.coefText); // Il faudrait ne pas scale ici. Canvas trop gros

		this.prevId = this.id - 1 < 0 ? DATA.projects.length - 1 : this.id - 1;
		this.nextId = this.id + 1 > DATA.projects.length - 1 ? 0 : this.id + 1;

		if (!Device.touch) {

			if (this.id !== 0) {
				global.CURSOR.prev.href = `#${DATA.projects[this.prevId].slug}`;
				global.CURSOR.prev.setAttribute('data-color', DATA.projects[this.prevId].color);
			} else {
				global.CURSOR.prev.href = '';
			}

			if (this.id !== DATA.projects.length - 1) {
				global.CURSOR.next.href = `#${DATA.projects[this.nextId].slug}`;
				global.CURSOR.next.setAttribute('data-color', DATA.projects[this.nextId].color);
			} else {
				global.CURSOR.next.href = '#about';
				global.CURSOR.next.setAttribute('data-color', '#000000');
			}

		}

		// Gallery

		// Context + gallery arrows
		data.scrollContent = Device.touch ? 'scroll up to navigate' : 'scroll or click top to navigate';
		template = Handlebars.compile(PreloadManager.getResult('tpl-project-content'), {noEscape: true});
		html = template(data);
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
			this.ui.imgs = document.querySelectorAll('.project__item');
			this.ui.videos = document.querySelectorAll('.project__video video');
			this.ui.footer = document.querySelector('.project__footer');
			this.ui.linkSvg = document.querySelector('.project__link svg');

			this.splitTitle = new SplitText('.project__header .title--4', {type:'chars'});

			this.glitch = new Glitch({ // issue link to ui footer here but Css
				el: this.glitchEl,
				sndColor: this.data.color,
				color: 'white',
				txt: this.data.title,
				clock: this.clock,
				stop: true
			});

			////////////////////
			// EVENTS WHEN PROJECT IS CLOSED
			////////////////////

			if (Device.touch === false) {
				bean.on(document.body, 'click.project', '.project__title', this.showContent);
				bean.on(document.body, 'mouseenter.project', '.glitch', this.onHoverTitle);
				bean.on(document.body, 'mouseleave.project', '.glitch', this.onLeaveTitle);
			} else {
				bean.on(document.body, 'touchstart.project', '.project__title', this.showContent); // touchstart and not click du to issues on Safari iOs
			}

			// Start transition In
			this.sceneReady();

		}

	}

	////////////
	// EVENTS
	////////////

	killGlitch() {
		this.glitch.hover = false;
	}

	onClickContainer(e) {
		e.stopPropagation();
	}

	onHoverLink(e) {

		global.CURSOR.interractHover({magnet: true, el: this.ui.linkSvg});

		this.animLink = true;
		this.hoverLink = true;

		TweenMax.to('.project__link circle', 0, {opacity: 0});

		TweenMax.killTweensOf('.project__link .close-up');
		TweenMax.killTweensOf('.project__link .close-down');
		TweenMax.killTweensOf('.project__link .close-down-2');

		const tl = new TimelineMax();
		tl.set(['.project__link .close-up','.project__link .close-down','.project__link .close-down-2','.project__link .open-up','.project__link .open-down'], {clearProps: 'all'});
		tl.to('.project__link .close-down-2', 0.8, {strokeDashoffset: this.maxDash * 7 - 100, ease: window.Expo.easeOut });
		tl.to('.project__link .close-down', 0.9, {strokeDashoffset: this.maxDash * 6 - 180, ease: window.Expo.easeOut }, 0.1);
		tl.to('.project__link .close-up', 1, {strokeDashoffset: this.maxDash - 205, ease: window.Expo.easeOut }, 0.2);
		tl.set(['.project__link .close-up','.project__link .close-down','.project__link .close-down-2','.project__link .open-up','.project__link .open-down'], {clearProps: 'all'});
		tl.add(()=> {
			this.animLink = false;
		});

		// sound
		global.SOUNDS['hover'].play();

	}

	onLeaveLink() {
		this.hoverLink = false;
		global.CURSOR.interractLeave({magnet: true, el: this.ui.linkSvg});
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

		if (Device.touch === false) {
			bean.on(document.body, 'click.projectContent', '.project__container', this.onClickContainer);
			bean.on(document.body, 'mouseenter.projectContent', '.project__container', this.onHoverContainer);
			bean.on(document.body, 'mouseleave.projectContent', '.project__container', this.onLeaveContainer);
			bean.on(document.body, 'mouseenter.projectContent', '.project__link svg', this.onHoverLink);
			bean.on(document.body, 'mouseleave.projectContent', '.project__link svg', this.onLeaveLink);
			bean.on(document.body, 'click.projectContent', '.sound', this.onClickContainer);
			bean.on(document.body, 'mouseenter.projectContent', '.sound', this.onHoverContainer);
			bean.on(document.body, 'mouseleave.projectContent', '.sound', this.onLeaveContainer);
		} else {

			bean.on(document.body, 'touchstart.projectContent', '.project__container', this.onTouchStartContainer);
			bean.on(document.body, 'touchmove.projectContent', '.project__container', this.onTouchMoveContainer);
			bean.on(document.body, 'touchend.projectContent', '.project__container', this.onTouchEndContainer);
			bean.on(document.body, 'touchstart.projectContent', '.project__back p', this.onClick);
		}


		this.animating = true;
		this.contentOpen = true;
		this.camera.rotation.order = 'YXZ'; // need to change order to rotate correclty X

		TweenMax.to(global.MENU.ui.button, 1, { opacity: 0});
		TweenMax.set(global.MENU.ui.button, { display: 'none', delay: 1});
		TweenMax.to('.plus', 1, { opacity: 0});
		TweenMax.set('.plus', { visibility: 'hidden', delay: 1});
		TweenMax.to('.project__title', 1, { opacity: 0 });
		// Turn around the perimeter of a circle
		const trigo = { angle: 1 };
		this.currentRotateY = { angle: 0};
		const tl = new TimelineMax({
			onComplete: () => {
				// this.cameraRotX = true;
				this.animating = false;
				this.glitch.stop = true;

				if (this.id === 0) this.lightZ = true;
			},
		});

		tl.to(this.camera.rotation, 0, {
			x: 0,
			ease: Power2.easeOut
		});
		tl.add(() => {
			for (let i = 0; i < this.ui.videos.length; i++) {
				this.ui.videos[i].play();
			}
		}, 1.4);
		tl.set('.project__gallery', { opacity: 1 }, 0);  // ,1.7, '.project__gallery'
		tl.set(['.project__top', '.project__back', ...this.ui.imgs], { visibility: 'visible' }, 0);  // ,1.7
		tl.set(['.project__container'], { visibility: 'visible', display: 'block', opacity: 1 }, 1.3);

		// Gallery animation
		tl.add(() => {
			document.querySelector('.project__top').classList.add('is-anim');
			document.querySelector('.project__back').classList.add('is-anim');

			const tlGallery = new TimelineMax();
			let delay = 0;
			for (let i = 0; i < this.splitTitle.chars.length; i++) {

				tlGallery.add(() => {
					this.splitTitle.chars[i].classList.add('is-anim');
				}, delay);

				delay += 0.07;
			}
			tlGallery.add(() => {
				document.querySelector('.project__date').classList.add('is-anim');
			}, 0.3);
			tlGallery.add(() => {
				document.querySelector('.project__descr').classList.add('is-anim');
			}, 0.3);
			tlGallery.add(() => {
				document.querySelector('.project__subHeader').classList.add('is-anim');
			}, 0.55);

			let subHeaderChildren = document.querySelector('.project__subHeader').children;
			delay = 0;
			for (let i = 0; i < subHeaderChildren.length; i++) {
				tlGallery.add(() => {
					subHeaderChildren[i].classList.add('is-anim');
				}, 0.55 + delay); // 1.5

				if (Device.orientation === 'portrait') delay += 0.1;

			}

			tlGallery.add(() => {
				this.ui.imgs[0].classList.add('is-anim');
			}, 0.8);

		}, 1.4);



		tl.add(() => {
			document.querySelector('.footer').classList.add('content-open');
		}, 2);

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
			if (!Device.touch) global.CURSOR.interractLeave();
			this.glitch.hover = false;

			// sound
			global.SOUNDS['switch_long'].play();
			// global.SOUNDS['switch_long'].fade(0, 0.8, 1000);


		}, 0.5);

		// if (global.SCROLLED === false) {
		TweenMax.killTweensOf('.scroll');
		TweenMax.to('.scroll', 0.5, {opacity: 0});
		// }

		if (Device.touch === true) {
			tl.add(() => {
				this.glitch.hover = true;
			}, 0);
			tl.add(() => {
				this.glitch.hover = false;

				// manual repeat
			}, 0.4);
			tl.add(() => {
				global.SOUNDS['glitch'].play();
			}, 0.2);

		}

	}

	backFromContent() {

		this.animating = true;

		bean.off(document.body, '.projectContent'); // off events related state projectContent

		// on events related to init state
		if (Device.touch === false) {
			bean.on(document.body, 'click.project', '.project__title', this.showContent);
			bean.on(document.body, 'mouseenter.project', '.glitch', this.onHoverTitle);
			bean.on(document.body, 'mouseleave.project', '.glitch', this.onLeaveTitle);
		} else {
			bean.on(document.body, 'touchstart.project', '.project__title', this.showContent);
		}

		this.cameraRotX = true;
		this.glitch.stop = false;
		if (!Device.touch) global.CURSOR.interractLeave({back: true});

		document.querySelector('.footer').classList.remove('content-open');


		this.lastTouchY = this.scrollY = this.scrollYSmooth = 0;

		const trigo = { angle: 0 };
		this.currentRotateY = { angle: toRadian(90)};
		const tl = new TimelineMax({ onComplete: () => {
			// this.initTopContentY = this.topContentTargetY = this.topContentSmoothY = this.topContentY = 5;
			TweenMax.set(this.ui.container, { y: -this.scrollY});
			this.camera.rotation.order = 'XYZ';

		} });

		tl.set('.project__back', {
			transition: 'none'
		}, 0);

		tl.to(['.project__container','.project__back'], 0.7, {
			opacity: 0,
			ease: window.Linear.easeNone
		}, 0);

		tl.set('.project__container', { display: 'none' });
		tl.set('.project__back', { clearProps: 'all' });


		tl.to(trigo, 3, { // 3.5
			angle: 1,
			ease: window.Power3.easeInOut,
			onUpdate: () => {
				// Math.PI / 2 start rotation at 90deg
				this.camera.position.x = this.pathRadius * Math.cos(Math.PI / 2 * trigo.angle);
				this.camera.position.z = this.pathRadius * Math.sin(Math.PI / 2 * trigo.angle);
				// this.camera.lookAt(this.cameraTarget);
			}
		}, 0);

		tl.to(this.currentRotateY, 3, {
			angle: toRadian(0),
			ease: window.Power3.easeInOut
		}, 0);

		tl.staggerFromTo(['.project__number', '.glitch', '.project__more'], 2, { // 1.2
			opacity: 0,
			y: 80
		}, {
			opacity: 0.8,
			y: 0,
			ease: window.Expo.easeOut
		}, 0.1, 2.1);

		tl.set(['.project__title'], {
			opacity: 1
		}, 2.1);

		tl.to([global.MENU.ui.button, '.plus'], 2, {
			opacity: 1
		}, 2.1);

		tl.add(() => {
			this.animating = false;
			this.contentOpen = false;

			const isAnims = this.ui.container.querySelectorAll('.is-anim');
			for (let i = 0; i < isAnims.length; i++) {
				isAnims[i].classList.remove('is-anim');
			}

			document.querySelector('.project__back').classList.remove('is-anim');

		}, 2.1);

		tl.add(() => {
			TweenMax.set(global.MENU.ui.button, { display: 'block'});
			TweenMax.set( '.plus', { visibility: 'visible'});
			// sound
			global.SOUNDS['switch_long'].play();
		}, 1);

		if (global.SCROLLED === false) {
			tl.to('.scroll', 1, {opacity: 1}, 2.1);
		}

		if (this.id === 0) this.lightZ = false;


	}

	goTo(e, element) {

		let el;

		if (e === null && element) {
			el = element;
		} else {
			el = e.currentTarget;
		}

		this.goToNoScroll = true;
		if (el.classList.contains('cursor__next')) this.dir = -1;
		else this.dir = 1;

	}

	animScrollContainer() {
		let coefIsVisible = Device.touch ? 50 : 80;

		for (let i = 1; i < this.ui.imgs.length; i++) {

			if (this.ui.imgs[i].classList.contains('is-anim') === false) {

				if (getOffsetTop(this.ui.imgs[i]) - this.scrollY <= document.body.offsetHeight - coefIsVisible) {

					const tl = new TimelineMax();
					tl.set(this.ui.imgs[i], {visibility: 'visible'});

					this.ui.imgs[i].classList.add('is-anim');

				}
			}
		}

		if (this.ui.footer.classList.contains('is-anim') === false) {

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
				this.ui.footer.classList.add('is-anim');

			}
		}
	}

	scroll(e) {

		if (this.animating === true) return false;

		if (this.transitionInComplete !== true) {
			e.deltaY = 0; // prevent inertia
		}

		if (this.contentOpen === true) {

			if (Device.touch === false) {
				// need profil for each browser
				let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

				if (isFirefox) {
					this.scrollY -= e.deltaY * 0.9;
				} else {
					this.scrollY -= e.deltaY * 0.17;
				}

				this.animScrollContainer();
			}

		} else {
			if (this.stopScrollZ === true) return false;

			if (e.deltaY > 30 || e.deltaY < -30 ) { ///!\ depend of Browsers clamp value.
				this.scrollZ += clamp(e.deltaY * 0.04, -6, 6); //reverse

				if (this.id === 0) this.scrollZ = Math.min(this.zoomZ, this.scrollZ); // cannot scroll supp zoomZ

			}

		}


	}

	onTouchStartContainer(e) {
		e.stopPropagation();

		let touchobj = e.changedTouches[0];
		this.startTouchY = parseInt(touchobj.clientY);
	}

	onTouchMoveContainer(e) {
		// e.preventDefault();
		let touchobj = e.changedTouches[0];// reference first touch point for this event
		let y = parseInt(touchobj.clientY) - this.startTouchY + this.lastTouchY;

		this.scrollY = -y * 1.5;

		this.animScrollContainer();

	}

	onTouchEndContainer(e) {
		let touchobj = e.changedTouches[0];// reference first touch point for this event

		this.lastTouchY = parseInt(touchobj.clientY) - this.startTouchY + this.lastTouchY;
	}

	onClick(e) {

		if (this.animating === true) return false;

		if (this.contentOpen === true) {
			this.backFromContent();
		}

		if (global.CURSOR.hoverGoTo === true && global.CURSOR.currentEl !== '') {

			RouterManager.currentPage.goTo(null, global.CURSOR.currentEl);
			window.location.href = global.CURSOR.currentEl.href;
		}
	}

	onHoverContainer() {
		global.CURSOR.interractLeave({back: true}); // reverse effect
	}

	onLeaveContainer() {
		global.CURSOR.interractHover({back: true});
	}

	onHoverTitle() {

		this.tlGlitch.restart();
		this.tlGlitch.repeatDelay(1.3);
		this.tlGlitch.add(() => {
			this.glitch.hover = true;
		});
		this.tlGlitch.add(() => {
			this.glitch.hover = false;
			// manual repeat
		}, 0.6);


		global.CURSOR.interractHover();

		// sound
		global.SOUNDS['glitch'].play();
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

		if (this.contentOpen === true || global.MENU.el.classList.contains('is-open') === true || this.animating === true) return false;

		if (y < window.innerHeight * 0.2 && x > window.innerWidth * 0.3 && x < window.innerWidth * 0.7 ) {
			this.goToNoScroll = true;
			this.dir = -1;
			global.CURSOR.interractHover({type: 'next', color: global.CURSOR.next.getAttribute('data-color'), el: global.CURSOR.next});
			this.cursorActive = true;
		} else if (y > window.innerHeight * 0.80 && x > window.innerWidth * 0.3 && x < window.innerWidth * 0.7) {

			if (this.id !== 0) {
				this.goToNoScroll = true;
				this.dir = 1;
				global.CURSOR.interractHover({type: 'prev', color: global.CURSOR.prev.getAttribute('data-color'), el: global.CURSOR.prev});
				this.cursorActive = true;
			}

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
		if (this.scrollZ !== 160 || this.scrollY !== 0) {

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

						if (this.id !== DATA.projects.length - 1) {
							window.location.href = `#${DATA.projects[this.nextId].slug}`;
						} else {
							window.location.href = '#about';
						}

					}

				} else if (this.scrollZSmooth > this.zoomZ) { // going backward

					if (this.stopScrollZ !== true) {
						// this.transitionOutScrolled = true;
						this.stopScrollZ = true;
						this.goToNoScroll = true;
						this.dir = 1;
						window.location.href = `#${DATA.projects[this.prevId].slug}`;

					}
				}

			}

			// on scroll Content
			if (round(this.scrollY, 10) !== round(this.scrollYSmooth, 10))  {

				// smooth scroll
				this.scrollYSmooth += (this.scrollY - this.scrollYSmooth) * this.coefScrollY; // We need a RAF for a smooth like that

				if (this.scrollYSmooth >= this.ui.container.offsetHeight - window.innerHeight / 4) { // end
					this.scrollY = this.scrollYSmooth = this.ui.container.offsetHeight - window.innerHeight / 4;
					TweenMax.to(this.ui.container, 1.4, { y: -this.scrollYSmooth}); // smooth it
				} else if (this.scrollYSmooth < 0) { // top
					this.scrollY = this.scrollYSmooth = 0;
					TweenMax.to(this.ui.container, 1.4, { y: -this.scrollYSmooth}); // smooth it
				} else {
					TweenMax.set(this.ui.container, { y: -this.scrollYSmooth});
				}

			}
		}


		// On mouse Move Camera movement

		// deceleration
		if ( this.debug === false) { //

			// Specify target we want
			this.camRotTarget.x = toRadian(this.mouse.y * 4, 100);
			this.camRotTarget.y = -toRadian(this.mouse.x * 8, 100);

			// Smooth it with deceleration
			this.camRotSmooth.x += (this.camRotTarget.x - this.camRotSmooth.x) * 0.08;
			this.camRotSmooth.y += (this.camRotTarget.y - this.camRotSmooth.y) * 0.08;

			// Apply rotation

			if (this.camera.movingRotX && this.lastPage === 'intro') this.camera.rotation.x = this.camera.movingRotX + this.camRotSmooth.x;
			else  this.camera.rotation.x = this.camRotSmooth.x;
			this.camera.rotation.y = this.camRotSmooth.y + this.currentRotateY.angle;

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
					'z': this.zoomZ + 140
				}, {
					'x': 0,
					'y': -65,
					'z': this.zoomZ + 80
				}, {
					'x': 0,
					'y': 0,
					'z': this.zoomZ
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
				global.OVERLAY.classList.remove('is-about');
			}
		});

		if (this.lastPage === 'intro') {
			// sound
			global.SOUNDS['switch_long'].play();

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
			// sound
			global.SOUNDS['switch_long'].play();

			let start = this.dir === -1 ? 0 : 300;
			tl.fromTo(this.camera.position, 3, {z : start}, {z : this.zoomZ, ease: window.Expo.easeOut}); // 2

		}

		// tl.to('.overlay', 0.8, {
		// 	opacity: 0
		// }, 0.1);

		tl.add(() => {
			global.OVERLAY.classList.remove('visible');
		}, 0.1);

		tl.add(() => {
			// remover overlay class
			this.transitionInComplete = true;
			if (global.MENU.el.classList.contains('is-anim') === false && Device.orientation !== 'portrait') {
				global.MENU.el.classList.add('is-anim');
				TweenMax.set('.navigate', {display: 'block', delay: 2});
			}
		}, 0.8);


		tl.staggerFromTo(['.project__number', '.glitch', '.project__more'], 2, { // 1.2
			opacity: 0,
			y: 150
		}, {
			opacity: 0.8,
			y: 0,
			ease: window.Expo.easeOut
		}, 0.1, delay);

		if (global.SCROLLED === false) {
			TweenMax.to('.scroll', 1, {opacity: 1, delay: 5});
		}


	}

	transitionOut(dir) {

		if (this.animating === true) return false;
		this.animating = true;

		if (global.SCROLLED === false && this.contentOpen !== true) {
			global.SCROLLED = true;
			TweenMax.to('.scroll', 0.5, {opacity: 0, onComplete: () => {
				document.documentElement.classList.add('scrolled');
			}});
		}

		const tl = new TimelineMax();

		if (this.transitionOutScrolled !== true) {

			if (this.goToNoScroll) dir = this.dir; // se baser sur le dir de goTo non de l'url
			// Simulate scroll backWard/foward
			let delay = 0.4;
			if (dir === 1) {
				// this.scrollZ -= 0.2;
				delay = 0.4;
				tl.to(this.camera.position, 1.8, {z : this.minZoomZ , ease: window.Power2.easeOut}); // 2
			} else {
				delay = 0.5;
				tl.to(this.camera.position, 1, {z : this.maxZoomZ , ease: window.Expo.ease}); // 2
			}

			tl.add(() => {
				global.OVERLAY.classList.add('visible');
			}, delay);

			tl.add(() => {
				this.animating = false;

				EmitterManager.emit('view:transition:out');
			}, delay + 0.4); // + time

			this.hrefChanged = true;

			// sound
			global.SOUNDS['switch_long'].play();
			// global.SOUNDS['switch_long'].fade(1, 0, 1000);

			if (Device.touch === true && Device.orientation === 'portrait' && dir !== 1) {
				tl.to(['.project__number', '.glitch', '.project__more'], 0.7, { // 1.2
					opacity: 0,
					ease: window.Expo.easeOut
				}, 0);
			}

		} else {
			// tl.to(this.camera.position, 3, {z : 0, ease: window.Power4.easeOut});
			tl.add(() => {
				global.OVERLAY.classList.add('visible');
			});
			tl.add(() => {
				this.animating = false;


				EmitterManager.emit('view:transition:out');
			}, 0.4);
		}





	}

	reset() {

		this.cameraRotX = true;
		this.glitch.stop = false;

		const tl = new TimelineMax({ onComplete: () => {
			this.camera.rotation.order = 'XYZ';
		} });

		tl.set(['.project__container', this.ui.footer ], {
			opacity: 0,
			ease: window.Power4.easeOut
		});

		tl.set(['.project__item', this.ui.footer, '.project__container'], { visibility: 'hidden' });

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
		super.destroy();

	}

}
