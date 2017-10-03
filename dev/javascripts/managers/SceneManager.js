import { WebGLRenderer, Clock } from 'three';
import CSS3DRendererIE from '../vendors/CSS3DRendererIE';


class SceneManager {

	constructor() {



	}

	start() {
		// Set unique Renderer

		// if (/\/#intro/.test(window.location.href) === true) return false;

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

		this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
		this.renderer.setClearColor(0xffffff, 1);
		// this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1); //--> 1.5 au lieu de 2 ???
		// setScissor ??

		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.renderer.domElement.style.position = 'absolute';
		this.renderer.domElement.style.top = 0;
		this.renderer.domElement.style.left = 0;
		this.renderer.domElement.classList.add('webGl__canvas');
		this.cssRenderer.domElement.appendChild(this.renderer.domElement);

		this.xp.appendChild(this.cssRenderer.domElement);


		this.el = this.renderer.domElement;

		this.clock = new Clock(); // time

	}

	render(opts) {

		// Render different scene throught opts. (ex: render scene Project 1 if opts.scene come from Project 1 etc...)
		if (opts.composer !== undefined && opts.postProc === true) {
			// Render scene composer
			// console.log('comp');
			// opts.composer.render(opts.scene, opts.camera);
			let delta = this.clock.getDelta();
			opts.composer.render(delta);
		} else {
			// Render scene
			// this.renderer.clear();
			this.renderer.render(opts.scene, opts.camera); // { antialias: true } ???
		}

		// Render cssScene
		if (opts.cssScene !== undefined) this.cssRenderer.render(opts.cssScene, opts.camera);

	}

	resizeHandler(opts) {

		// Update camera
		opts.camera.aspect = window.innerWidth / window.innerHeight;
		opts.camera.updateProjectionMatrix();

		// Update canvas size
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		if (opts.cssScene !== undefined) this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
	}

}

export default new SceneManager();
