import { WebGLRenderer, Clock } from 'three';
import CSS3DRendererIE from '../vendors/CSS3DRendererIE';
import { Device } from '../helpers/Device';


class SceneManager {

	constructor() {


	}

	start() {

		console.log('startttt');

		// Set unique Renderer

		this.xp = document.querySelector('.xp');

		// Set CssRenderer and WebGLRenderer
		this.cssRenderer = new CSS3DRendererIE();
		// Set the canvas size.
		this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
		this.cssRenderer.domElement.style.position = 'absolute';
		this.cssRenderer.domElement.style.top = 0;
		this.cssRenderer.domElement.style.left = 0;
		this.cssRenderer.domElement.style.zIndex = 1;
		this.cssRenderer.domElement.classList.add('webGl');

		this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
		// this.renderer.setClearColor(0xffffff, 1);
		// this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1); //--> 1.5 au lieu de 2 ?
		// setScissor ??

		this.renderer.setClearColor( 0x000000, 0 );

		this.renderer.domElement.style.position = 'absolute';
		this.renderer.domElement.style.top = 0;
		this.renderer.domElement.style.left = 0;
		// this.renderer.domElement.style.backgroundColor = 'red';

		this.renderer.domElement.classList.add('webGl__canvas');
		this.cssRenderer.domElement.appendChild(this.renderer.domElement);

		this.xp.appendChild(this.cssRenderer.domElement);


		// this.resizeHandler(); // size first time


		this.el = this.renderer.domElement;

		this.resizeHandler({});

		this.clock = new Clock(); // time

	}

	render(opts) {

		// Render different scene throught opts. (ex: render scene Project 1 if opts.scene come from Project 1 etc...)
		if (opts.composer !== undefined && opts.postProc === true) {

			// Render scene composer
			let delta = this.clock.getDelta();
			opts.composer.render(delta);
		} else {
			// Render scene
			this.renderer.render(opts.scene, opts.camera); // { antialias: true } ???
		}

		// Render cssScene
		if (opts.cssScene !== undefined) this.cssRenderer.render(opts.cssScene, opts.camera);

	}

	resizeHandler(opts) {

		// Update camera
		if (opts.camera) opts.camera.aspect = window.innerWidth / window.innerHeight;
		if (opts.camera) opts.camera.updateProjectionMatrix();

		let coef = window.innerWidth > 1920 ? 0.7 : 0.85;

		// if (Device.touch === true ) {
		coef *= window.devicePixelRatio; // good perfs on retina mobile
		// }

		// Update canvas size
		this.renderer.setSize(window.innerWidth * coef, window.innerHeight * coef);
		if (opts.cssScene !== undefined) this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
		TweenMax.set([this.el, this.cssRenderer.domElement], {width: window.innerWidth, height: window.innerHeight});


		if (navigator.userAgent.match('CriOS')) { //orientation change issue on iOs Chrome mobile
			setTimeout(() => {

				// Update camera
				if (opts.camera) opts.camera.aspect = window.innerWidth / window.innerHeight;
				if (opts.camera) opts.camera.updateProjectionMatrix();

				// Update canvas size
				this.renderer.setSize(window.innerWidth * coef, window.innerHeight * coef);
				if (opts.cssScene !== undefined) this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
				TweenMax.set([this.el, this.cssRenderer.domElement], {width: window.innerWidth, height: window.innerHeight});
			}, 400);
		}


	}

	destroy() {
		this.renderer.clear();
	}

}

export default new SceneManager();
