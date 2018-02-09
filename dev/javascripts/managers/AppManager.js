import EmitterManager from './EmitterManager';
import RouterManager from './RouterManager';
import { Device } from '../helpers/Device';
import DATA from '../../datas/data.json';
import SceneManager from './SceneManager';
import Menu from '../components/Menu';
import Cursor from '../components/Cursor';
import bean from 'bean';
import PreloadManager from './PreloadManager';
import  '../helpers/handlebarsRegister';
import { loadJSON } from '../helpers/utils-three';
import { isTouch, preventLink } from '../helpers/utils';
import { TextureLoader } from 'three';
import FontFaceObserver from 'fontfaceobserver';
import Glitch from '../components/Glitch';
import { Howl } from 'howler';


class AppManager {

	constructor() {

		this.start = this.start.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.raf = this.raf.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.preload = this.preload.bind(this);
		this.preloadTextures = this.preloadTextures.bind(this);
		this.callbackInit = this.callbackInit.bind(this);

	}

	preload() {

		this.resizeHandler(); // resize once


		PreloadManager.loadFile({ id: 'introTxt', src: `${global.BASE}/images/textures/name-2.png` });


		this.introTexLoad = PreloadManager.on('complete', () => {

			PreloadManager.off('complete', this.introTexLoad);

			// Display Title
			this.glitchEl = document.querySelector('.preload__glitch');
			this.glitch = new Glitch({ // issue link to ui footer here but Css
				el: this.glitchEl,
				type: 'intro'
			});

			this.glitch.isLoading = true;
			this.glitch.ready = true;

			// Loader Animation
			let maxDash = 635;

			const tl = new TimelineMax({repeat: -1});
			TweenMax.killTweensOf(['.preload__symbol .close-up','.preload__symbol .close-down']);

			tl.to('.preload__symbol .close-up', 1, {strokeDashoffset: 0, ease: window.Expo.easeOut}, 0);
			tl.to('.preload__symbol .close-down', 1.2, {strokeDashoffset: maxDash * 5 + 205, ease: window.Expo.easeOut}, 0);
			tl.set(['.preload__symbol .close-up','.preload__symbol .close-down'], {clearProps: 'all'});

			if (Device.touch === true) {
				// const tl2 = new TimelineMax({repeat: -1});
				// tl2.to('.preload__txt', 1, {opacity: 1});
				// tl2.to('.preload__txt', 1, {opacity: 0});
				TweenMax.set('.preload__txt', {opacity: 0});
			}

			TweenMax.to('.preload__wrapper', 0.5, {opacity: 1});

			// Run global events
			this.events(true);
			// video
			if (Device.touch === true) { // Video blob not working with preload.js, using classic xhr
				let req = new XMLHttpRequest();
				req.open('GET', 'videos/destr.mp4', true);
				req.responseType = 'blob';

				req.onload = () => {
					// Onload is triggered even on 404
					// so we need to check the status code
					if (req.status === 200) {
						const videoBlob = req.response;
						const vid = URL.createObjectURL(videoBlob); // IE10+
						this.glitch.video.src = vid;
						this.preloadFonts();
					}
				};

				req.onerror = function() {
				// Error
				};

				req.send();

			} else {
				// start others preload
				// this.glitch.setAlphaVideo('videos/destr.mp4');
				this.preloadFonts();
			}


		}, this, true);

		// Sounds
		global.SOUNDS = {
			'music': new Howl({
				src: [`${global.BASE}/sounds/music.mp3`],
				volume: 2,
				loop: true
			}),
			'glitch': new Howl({
				src: [`${global.BASE}/sounds/glitch-1.mp3`],
				volume: 0.05
			}),
			'switch': new Howl({
				src: [`${global.BASE}/sounds/switch-3.mp3`],
				volume: 0.15
			}),
			'switch_long': new Howl({
				src: [`${global.BASE}/sounds/switch-4.mp3`],
				volume: 0.15
			}),
			'hover': new Howl({
				src: [`${global.BASE}/sounds/hover-3.mp3`],
				volume: 0.15
			}),
			'hover_2': new Howl({
				src: [`${global.BASE}/sounds/glitch-2.mp3`],
				volume: 0.05
			})
		};



	}

	preloadFonts() {
		let font = new FontFaceObserver('Theinhardt');
		let fontL = new FontFaceObserver('Theinhardt-light', {
			weight: 300
		});
		let fontM = new FontFaceObserver('Theinhardt-medium', {
			weight: 500
		});

		// not working on safari / Firefox
		Promise.all([
			font.load(),
			fontL.load(),
			fontM.load()
		]).then(() => {
			this.preloadModels();


		}).catch(reason => {
			console.log(reason);
			// this.preloadModels();
		});
	}

	preloadModels() {
		// First preload Three.js models
		Promise.all([
			loadJSON('datas/models/triangle.json'),
			loadJSON('datas/models/triangles_y6.json'),
			loadJSON('datas/models/iceberg-1.json'),
			loadJSON('datas/models/iceberg-2.json'),
			loadJSON('datas/models/iceberg-3.json'),
			loadJSON('datas/models/iceberg-4.json')
		]).then(results => {


			global.MODELS = results;

			this.preloadTextures();


		});
	}

	preloadTextures() {

		// console.log('load');


		let mediaPath = Device.size === 'mobile' || Device.size === 'tablet' ? 'mobile/' : '';


		// Preload all assets
		PreloadManager.loadManifest([
			// template hbs
			{ id: 'tpl-project-title', src: `${global.BASE}/templates/projectTitle.hbs` },
			{ id: 'tpl-project-content', src: `${global.BASE}/templates/projectContent.hbs` },
			{ id: 'tpl-menu', src: `${global.BASE}/templates/menu.hbs` },
			{ id: 'tpl-about-content', src: `${global.BASE}/templates/aboutContent.hbs` },
			{ id: 'tpl-intro-content', src: `${global.BASE}/templates/introContent.hbs` },
			// textures
			{ id: 'glitchTex', src: `${global.BASE}/images/textures/glitch-1.png` },
			{ id: 'skyTex', src: `${global.BASE}/images/textures/intro2_up.jpg` },
			// bkg projects
			{ id: 'bkg-0', src: `${global.BASE}/images/${mediaPath}textures/project-0.png` },
			{ id: 'bkg-1', src: `${global.BASE}/images/${mediaPath}textures/project-1.png` },
			{ id: 'bkg-2', src: `${global.BASE}/images/${mediaPath}textures/project-2.png` },
			{ id: 'bkg-3', src: `${global.BASE}/images/${mediaPath}textures/project-3.png` }
		]);

		// SkyTex
		global.SKYTEX = new TextureLoader().load( `${global.BASE}/images/textures/intro2_up.jpg` );
		global.BLOBTEX = new TextureLoader().load( `${global.BASE}/images/textures/blob-7.jpg` );

		// Preload all img projects
		for (let i = 0; i < DATA.projects.length; i++) {

			for (let y = 0; y < DATA.projects[i].imgs.length; y++) {
				if (/.mp4$/.test(DATA.projects[i].imgs[y]) === false) { // if not mp4 video
					PreloadManager.loadFile(`${global.BASE}/images/${mediaPath}projects/${DATA.projects[i].imgs[y]}`);
				}
			}

		}

		PreloadManager.on('progress', (e) => {

			let percent = `${307 - Math.min(0.95, e.progress) * 100 / 100 * 307}%`;
			TweenMax.to('.preload__symbol circle', 0.5, {strokeDashoffset: percent, ease: window.Linear.easeNone});

		});

		PreloadManager.on('complete', () => {

			PreloadManager.off('progress');

			TweenMax.killTweensOf(['.preload__symbol .close-up','.preload__symbol .close-down']);
			TweenMax.set(['.preload__symbol .close-up','.preload__symbol .close-down'], {clearProps: 'all'});

			TweenMax.delayedCall(0.6, this.start); // --> Avoid freeze creating 3D scene during Animation


		}, this, true);
	}

	start() {

		// Start main components

		global.MENU = new Menu();
		global.CURSOR = new Cursor();

		// Set up Three.js scene
		SceneManager.start();

		this.ui = {
			preloadWrapper: document.querySelector('.preload__wrapper'),
			preloadSymbol: document.querySelector('.preload__symbol'),
			xp: document.querySelector('.xp'),
			webGl: document.querySelector('.webGL'),
			overlay: document.querySelector('.overlay'),
			uiContent: document.querySelector('.ui-content')
		};

		global.OVERLAY = this.ui.overlay;

		RouterManager.start(); // Init Router and views

		//start sound
		global.SOUNDS['music'].play();

		// Complete loader 100%
		TweenMax.to('.preload__symbol circle', 0.5, {strokeDashoffset: 0, ease: window.Linear.easeNone});


	}

	callbackInit() {

		if (this.initiated === true) {

			TweenMax.delayedCall(0.1, () => {
				RouterManager.currentPage.transitionIn(!RouterManager.fromUrl); // GL issues ???
			});

		} else {

			this.initiated = true;
			document.body.classList.add('is-init');

			if (Device.touch === true) {

				let wrapper = document.querySelector('.preload__wrapper');
				let txt = document.querySelector('.preload__txt');
				txt.innerHTML = 'start';
				const tl1 = new TimelineMax();
				// tl1.to(txt, 0.5, {opacity: 0});
				// tl1.add(() => {
				// 	txt.innerHTML = 'start';
				// });
				tl1.to(txt, 1, {opacity: 1});

				let onWrapperClick = (e) => {

					// start destruction effect

					this.glitch.video.play(); // play video


					TweenMax.to(txt, 0.5, {opacity: 0});

					wrapper.removeEventListener('click', onWrapperClick);

					preventLink(e, true);
					this.resizeHandler();

					const tl = new TimelineMax();
					tl.add(() => {
						RouterManager.currentPage.transitionIn(!RouterManager.fromUrl);
						this.glitch.isLoading = false; // apply video alpha
					}, 1);
					// tl.to('.preload', 1, {autoAlpha: 0, ease: window.Linear.easeNone}, '+=0.5');
					if (RouterManager.currentPage.name === 'intro') {
						tl.to(this.ui.preloadSymbol, 2, {x: this.ui.preloadWrapper.offsetWidth / 2 - this.ui.preloadSymbol.offsetWidth / 2, ease: window.Expo.easeInOut}, 2);
						tl.to('.preload', 1, {backgroundColor: 'transparent', ease: window.Linear.easeNone}, 4);
					} else {

						tl.to(this.ui.preloadSymbol, 1.5, {opacity: 0, ease: window.Linear.easeNone}, 0.5);
						tl.to('.preload', 1, {backgroundColor: 'transparent', ease: window.Linear.easeNone}, 1);
						tl.set(this.ui.preloadSymbol, {x: this.ui.preloadWrapper.offsetWidth / 2 - this.ui.preloadSymbol.offsetWidth / 2, ease: window.Expo.easeInOut}, 2.1);
					}

					tl.add(() => {
						this.ui.preloadSymbol.classList.add('is-center');
					}, 1.5);
					tl.set(['.preload__glitch', '.preload .glitch__canvas'], {display: 'none'}, 3);
					tl.add(() => {
						this.ui.preloadSymbol.href = `#${DATA.projects[0].slug}`;
					}, 3);

					// tl.add(() => {
					// 	this.glitch.ready = false; // stop raf destr
					// });

				};

				wrapper.addEventListener('click', onWrapperClick);

			} else {

				// start destruction effect
				this.glitch.video.play(); // play video

				const tl = new TimelineMax();
				tl.add(() => {
					RouterManager.currentPage.transitionIn(!RouterManager.fromUrl);
					this.glitch.isLoading = false; // apply video alpha
				}, 0);
				// tl.to('.preload', 1, {autoAlpha: 0, ease: window.Linear.easeNone}, '+=0.5');
				if (RouterManager.currentPage === null && /\/#about/.test(window.location.href) === false) {
					tl.to(this.ui.preloadSymbol, 2, {x: this.ui.preloadWrapper.offsetWidth / 2 - this.ui.preloadSymbol.offsetWidth / 2, ease: window.Expo.easeInOut}, 2);
					tl.to('.preload', 1, {backgroundColor: 'transparent', ease: window.Linear.easeNone}, 4);
				} else {

					tl.to(this.ui.preloadSymbol, 1.5, {opacity: 0, ease: window.Linear.easeNone}, 0.5);
					tl.to('.preload', 1, {backgroundColor: 'transparent', ease: window.Linear.easeNone}, 1);
					tl.set(this.ui.preloadSymbol, {x: this.ui.preloadWrapper.offsetWidth / 2 - this.ui.preloadSymbol.offsetWidth / 2, ease: window.Expo.easeInOut}, 2.1);
				}

				tl.add(() => {
					this.ui.preloadSymbol.classList.add('is-center');
				}, 1.5);
				tl.set(['.preload__glitch', '.preload .glitch__canvas'], {display: 'none'}, 3);
				tl.add(() => {
					this.ui.preloadSymbol.href = `#${DATA.projects[0].slug}`;
				}, 3);

				tl.add(() => {
					this.glitch.ready = false; // stop raf destr
				});
			}
		}

	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let listener = method === false ? 'off' : 'on';


		// Global events
		// raf
		TweenMax.ticker[evListener]('tick', this.raf);
		if (Device.touch === false) {
			document[evListener]( 'mousemove', this.onMouseMove, false );
		} else {
			// orientationchange
			window[evListener]('touchmove', this.onTouchMove, false);
		}

		bean[listener](window, 'resize orientationchange', this.resizeHandler);

	}

	raf() {

		EmitterManager.emit('raf');
		// glitch title
		if (this.glitch) {

			if (this.glitch.ready === true) {
				this.glitch.render();
			}
		}
	}

	onMouseMove(e) {
		const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		EmitterManager.emit('mousemove', eventX, eventY);
	}

	onTouchMove(e) {
		e.preventDefault();
		// console.log('test');

		EmitterManager.emit('touchmove', e);
	}

	resizeHandler() {

		// console.log('resize');


		Device.touch = isTouch();

		if (Device.touch) document.body.classList.add('is-touch');
		else document.body.classList.remove('is-touch');

		// Device.browser = Detect.browser();

		// if (/Edge/.test(Device.browser) || /IE/.test(Device.browser)) {

		//     document.body.classList.add('ie');
		// }

		// console.log(window.orientation);

		Device.size = 'desktop';

		if (window.innerHeight > window.innerWidth && Device.touch === true) {
			Device.orientation = 'portrait';
		} else {
			Device.orientation = 'landscape';
		}

		if (window.innerWidth <= 1440) {
			Device.size = 'small-desktop';
		}

		if (window.innerWidth <= 1024) {
			Device.size = 'tablet';
		}

		if (window.innerWidth <= 768) {
			Device.size = 'mobile';
		}

		EmitterManager.emit('resize', window.innerWidth, window.innerHeight);

		// Resize perfect width & height 100% for mobile :
		TweenMax.set(document.body, {width: window.innerWidth, height: window.innerHeight});

		if (navigator.userAgent.match('CriOS')) { //orientation change issue on iOs Chrome mobile
			setTimeout(() => {

				TweenMax.set(document.body, {width: window.innerWidth, height: window.innerHeight});
			}, 100);
		}

		const ua = navigator.userAgent.toLowerCase();
		const isAndroid = ua.indexOf('android') > -1; //&& ua.indexOf("mobile");
		if (isAndroid) {
			document.body.classList.add('android');
		}

		const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
		if (isFirefox) {
			document.body.classList.add('ff');
		}

	}
}

export default new AppManager();
