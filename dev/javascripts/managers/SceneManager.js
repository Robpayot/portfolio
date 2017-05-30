import { WebGLRenderer } from 'three';
import CSS3DRendererIE from '../vendors/CSS3DRendererIE';


class SceneManager {

    constructor() {



    }

    start() {
        // Set unique Renderer

        this.el = document.querySelector('.graphic3D');



        // Set CssRenderer and WebGLRenderer 
        this.cssRenderer = new CSS3DRendererIE();
        // Set the canvas size.
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = 0;
        this.cssRenderer.domElement.style.left = 0;
        this.cssRenderer.domElement.style.zIndex = 1;
        this.cssRenderer.domElement.classList.add('container3D');

        this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setClearColor(0xffffff, 1);
        // this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
        // setScissor ??

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = 0;
        this.renderer.domElement.style.left = 0;
        this.renderer.domElement.classList.add('webGl');
        this.cssRenderer.domElement.appendChild(this.renderer.domElement);

        this.el.appendChild(this.cssRenderer.domElement);

    }

    render(opts) {

        // Render different scene throught opts. (ex: render scene Univers 1 if opts.scene come from Univers 1 etc...)

        // Render cssScene
        // this.cssRenderer.clear();
        this.cssRenderer.render(opts.cssScene, opts.camera);

        if (opts.effectController !== null && opts.effectController.enabled === true) {
            // Render scene composer
            opts.composer.render(opts.scene, opts.camera);
        } else {
            // Render scene
            // this.renderer.clear();
            this.renderer.render(opts.scene, opts.camera);

        }

    }

    resizeHandler(opts) {

        // Update camera
        opts.camera.aspect = window.innerWidth / window.innerHeight;
        opts.camera.updateProjectionMatrix();

        // Update canvas size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }
    
}

export default new SceneManager();
