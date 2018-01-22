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

			const tl2 = new TimelineMax({repeat: -1});
			tl2.to('.preload__txt', 1, {opacity: 1});
			tl2.to('.preload__txt', 1, {opacity: 0});

			TweenMax.to('.preload__wrapper', 0.5, {opacity: 1});

			// Run global events
			this.events(true);

			// start others preload
			this.preloadFonts();

		}, this, true);

		// Sounds
		global.SOUNDS = {
			'glitch': new Howl({
				src: [`${global.BASE}/sounds/glitch-1.mp3`],
				volume: 0.1
			}),
			'switch': new Howl({
				src: [`${global.BASE}/sounds/switch-3.mp3`],
				volume: 0.2
			}),
			'switch_long': new Howl({
				src: [`${global.BASE}/sounds/switch-4.mp3`],
				volume: 0.2
			}),
			'hover': new Howl({
				src: [`${global.BASE}/sounds/hover-3.mp3`],
				volume: 0.3
			}),
			'hover_2': new Howl({
				src: [`${global.BASE}/sounds/glitch-2.mp3`],
				volume: 0.1
			}),
			'music': new Howl({
				src: [`${global.BASE}/sounds/music.mp3`],
				loop: true
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
			loadJSON('datas/models/iceberg-3.json')
		]).then(results => {


			global.MODELS = results;

			this.preloadTextures();


		});
	}

	preloadTextures() {


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
			{ id: 'bkg-0', src: `${global.BASE}/images/textures/project-0.png` },
			{ id: 'bkg-1', src: `${global.BASE}/images/textures/project-1.png` },
			{ id: 'bkg-2', src: `${global.BASE}/images/textures/project-2.png` },
			{ id: 'bkg-3', src: `${global.BASE}/images/textures/project-3.png` }
		]);

		// SkyTex
		global.SKYTEX = new TextureLoader().load( `${global.BASE}/images/textures/intro2_up.jpg` );
		global.BLOBTEX = new TextureLoader().load( `${global.BASE}/images/textures/blob-4.jpg` );

		// Preload all img projects
		for (let i = 0; i < DATA.projects.length; i++) {

			for (let y = 0; y < DATA.projects[i].imgs.length; y++) {
				if (/.mp4$/.test(DATA.projects[i].imgs[y]) === false) { // if not mp4 video
					PreloadManager.loadFile(`${global.BASE}/images/projects/${DATA.projects[i].imgs[y]}`);
				}
			}

		}

		PreloadManager.on('progress', (e) => {

			let percent = `${307 - e.progress * 100 / 100 * 307}%`;
			TweenMax.to('.preload__symbol circle', 0.5, {strokeDashoffset: percent, ease: window.Linear.easeNone});
			// TweenMax.to('.preload__bar', 0.2, {width: percent});


		});
		// TweenMax.set('.preload', {display: 'none'});

		PreloadManager.on('complete', () => {

			PreloadManager.off('progress');

			TweenMax.killTweensOf(['.preload__symbol .close-up','.preload__symbol .close-down', '.preload__txt']);
			TweenMax.set(['.preload__symbol .close-up','.preload__symbol .close-down', '.preload__txt'], {clearProps: 'all'});

			// Clear listener after first call.
			global.SOUNDS['music'].once('load', ()=> {
				const tl = new TimelineMax();
				if (Device.touch === false) {

					tl.add(() => {

						this.start();
					}, 0.6);

				} else {

					let wrapper = document.querySelector('.preload__wrapper');
					let txt = document.querySelector('.preload__txt');
					txt.innerHTML = 'start';
					TweenMax.to(txt, 0.5, {opacity: 1});

					let onWrapperClick = (e) => {


						TweenMax.to(txt, 0.5, {opacity: 0});

						wrapper.removeEventListener('click', onWrapperClick);

						preventLink(e, true);
						this.resizeHandler();
						tl.add(() => {
							this.start();
						}, 0.6);

					};

					wrapper.addEventListener('click', onWrapperClick);
				}

			});

		}, this, true);
	}

	start() {

		// Start main components

		global.MENU = new Menu();
		global.CURSOR = new Cursor();

		// Set up Three.js scene
		SceneManager.start();

		this.ui = {
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
		console.log('ok');

	}

	callbackInit() {

		// start destruction effect
		this.glitch.video.play(); // play video

		const tl = new TimelineMax();

		if (Device.touch === false) {

			this.glitch.isLoading = false; // apply video alpha
			tl.add(() => {
				RouterManager.currentPage.transitionIn(!RouterManager.fromUrl);
			}, 0);

		} else {
			tl.add(() => {
				RouterManager.currentPage.transitionIn(!RouterManager.fromUrl);
				this.glitch.isLoading = false; // apply video alpha
			}, 0.9);
		}

		tl.to('.preload', 1.5, {autoAlpha: 0, ease: window.Linear.easeNone}, '+=0.5');

		tl.add(() => {
			this.glitch.ready = false; // stop raf destr
		});


	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';


		// Global events
		// raf
		TweenMax.ticker[evListener]('tick', this.raf);
		if (Device.touch === false) {
			document[evListener]( 'mousemove', this.onMouseMove, false );
		} else {
			// orientationchange
			window[evListener]('touchmove', this.onTouchMove, false);
		}

		bean[onListener](window, 'resize orientationchange', this.resizeHandler);

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


		Device.touch = isTouch();

		if (Device.touch) document.body.classList.add('is-touch');
		else document.body.classList.remove('is-touch');

		// Device.browser = Detect.browser();

		// if (/Edge/.test(Device.browser) || /IE/.test(Device.browser)) {

		//     document.body.classList.add('ie');
		// }

		Device.size = 'desktop';

		if (window.innerWidth <= 1440) {
			Device.size = 'small-desktop';
		} else if (window.innerWidth <= 1024) {
			Device.size = 'tablet';
		} else if (window.innerWidth <= 768) {
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

	}
}

export default new AppManager();
