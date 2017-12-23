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


class AppManager {

	constructor() {

		this.start = this.start.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.raf = this.raf.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.preload = this.preload.bind(this);

	}

	preload() {

		this.resizeHandler(); // resize once

		this.startLoad = 0;
		this.maxDash = 635;

		// Animation
		const tl = new TimelineMax({repeat: -1});
		TweenMax.killTweensOf(['.preload__symbol .close-up','.preload__symbol .close-down']);

		tl.to('.preload__symbol .close-up', 1, {strokeDashoffset: 0, ease: window.Expo.easeOut}, 0);
		tl.to('.preload__symbol .close-down', 1.2, {strokeDashoffset: this.maxDash * 5 + 205, ease: window.Expo.easeOut}, 0);
		tl.set(['.preload__symbol .close-up','.preload__symbol .close-down'], {clearProps: 'all'});

		const tl2 = new TimelineMax({repeat: -1});
		tl2.to('.preload__txt', 1, {opacity: 1});
		tl2.to('.preload__txt', 1, {opacity: 0});

		let font = new FontFaceObserver('Theinhardt');
		let fontL = new FontFaceObserver('Theinhardt-light', {
			weight: 300
		});
		let fontM = new FontFaceObserver('Theinhardt-medium', {
			weight: 50
		});

		// not working on safari / Firefox
		Promise.all([
			font.load(),
			fontL.load(),
			fontM.load()
		]).then(() => {
			this.preloadModels();
		}).catch(reason => {
			// console.log(reason);
			this.preloadModels();
		});

	}

	preloadModels() {
		// First preload Three.js models
		Promise.all([
			loadJSON('datas/models/triangle.json'),
			loadJSON('datas/models/triangles_y.json'),
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
			{ id: 'introTxt', src: `${global.BASE}/images/textures/name.png` },
			{ id: 'glitchTex', src: `${global.BASE}/images/textures/glitch-1.png` },
			{ id: 'skyTex', src: `${global.BASE}/images/textures/intro2_up.jpg` },
			// bkg projects
			{ id: 'bkg-0', src: `${global.BASE}/images/textures/project-0.jpg` },
			{ id: 'bkg-1', src: `${global.BASE}/images/textures/project-1.jpg` },
			{ id: 'bkg-2', src: `${global.BASE}/images/textures/project-2.jpg` },
			{ id: 'bkg-3', src: `${global.BASE}/images/textures/project-3.jpg` }
		]);

		// SkyTex
		global.SKYTEX = new TextureLoader().load( `${global.BASE}/images/textures/intro2_up.jpg` );
		// global.PROJECTTEX = new TextureLoader().load( `${global.BASE}/images/textures/project-1.png` );

		// Preload all img projects
		for (let i = 0; i < DATA.projects.length; i++) {

			for (let y = 0; y < DATA.projects[i].imgs.length; y++) {
				if (/.mp4$/.test(DATA.projects[i].imgs[y]) === false) { // if not mp4 video
					PreloadManager.loadFile(`${global.BASE}/images/projects/${DATA.projects[i].imgs[y]}`);
				}
			}

		}

		PreloadManager.on('progress', (e) => {

			// console.log(e.progress);
			let percent = `${e.progress * 100}%`;
			TweenMax.to('.preload__bar', 0.2, {width: percent});

			if (this.startLoad === 0) {
				this.startLoad = 1;

			}

		});
		// TweenMax.set('.preload', {display: 'none'});

		PreloadManager.on('complete', () => {
			if (Device.touch === false) this.start();
			PreloadManager.off('progress');
			const tl = new TimelineMax();
			if (Device.touch === false) {
				tl.to('.preload', 1, {autoAlpha: 0}, 2);
			} else {
				tl.to('.preload__wrapper', 1, {opacity: 0}, 2);
			}
			tl.add(() => {

				TweenMax.killTweensOf(['.preload__symbol .close-up','.preload__symbol .close-down', '.preload__txt']);
				if (Device.touch === true) {
					let wrapper = document.querySelector('.preload__wrapper');
					wrapper.innerHTML = 'start';
					wrapper.classList.add('start-fs');
					TweenMax.to(wrapper, 0.5, {opacity: 1});

					wrapper.addEventListener('click', (e) => {
						preventLink(e, true);
						this.resizeHandler();
						TweenMax.to('.preload', 1, {autoAlpha: 0});
						this.start();

					});
				}

			});
		}, this, true);
	}

	start() {

		this.events(true);

		global.MENU = new Menu();
		global.CURSOR = new Cursor();

		// Set up Three.js scene
		SceneManager.start();

		this.ui = {
			preloadSymbol: document.querySelector('.preload__symbol'),
			xp: document.querySelector('.xp'),
			webGl: document.querySelector('.webGl'),
			overlay: document.querySelector('.overlay'),
			uiContent: document.querySelector('.ui-content')
		};

		global.OVERLAY = this.ui.overlay;

		RouterManager.start(); // Init Router and views
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
		console.log('resize !!!!');


		Device.touch = isTouch();

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
