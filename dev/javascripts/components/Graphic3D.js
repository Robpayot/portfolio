import { WebGLRenderer, PerspectiveCamera, Scene, Mesh, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial } from 'three';
import OrbitControls from '../vendors/OrbitControls';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';

console.log(OrbitControls);


export default class Graphic3D {

    constructor(SoundManager) {

        this.raf = this.raf.bind(this);
        this.events = this.events.bind(this);
        this.setElements = this.setElements.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);

        this.start();


    }

    start() {

        console.log('test 2', SoundManager);

        // Set the scene size.
        this.width = window.innerWidth;
        this.height = 500;


        // Set some camera attributes.
        this.viewAngle = 45;
        this.aspect = this.width / this.height;
        this.near = 0.1;
        this.far = 10000;

        // Get the DOM element to attach to
        this.el = document.querySelector('.graphic3D');

        // Create a WebGL renderer, camera
        // and a scene
        this.renderer = new WebGLRenderer({
            antialias: true,
        });
        this.camera =
            new PerspectiveCamera(
                this.viewAngle,
                this.aspect,
                this.near,
                this.far
            );

        this.camera.position.z = 500;
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        console.log(OrbitControls);
        // this.controls.addEventListener('change', this.raf); // remove when using animation loop
        // enable animation loop when using damping or autorotation
        //controls.enableDamping = true;
        //controls.dampingFactor = 0.25;
        this.controls.enableZoom = false;

        this.scene = new Scene();
        this.scene.background = new Color(0xffffff);
        console.log(this.scene);

        // Add the camera to the scene.
        this.scene.add(this.camera);

        // Start the renderer.
        this.renderer.setSize(this.width, this.height);

        // Attach the renderer-supplied
        // DOM element.
        this.el.appendChild(this.renderer.domElement);

        this.elements = [];

        this.setElements();
        this.setLight();

        this.events(true);



    }

    events(method) {

        let listen = method === false ? 'removeEventListener' : 'addEventListener';
        listen = method === false ? 'off' : 'on';

        EmitterManager[listen]('resize', this.resizeHandler);
        EmitterManager[listen]('raf', this.raf);

    }

    setElements() {

        // // Set up the sphere vars
        const RADIUS = 50;
        const SEGMENTS = 32;
        const RINGS = 32;

        const geometry = new SphereGeometry(RADIUS, SEGMENTS, RINGS);
        const material = new MeshLambertMaterial({ color: 0xCC0000 });
        const sphere = new Mesh(geometry, material);
        sphere.position.z = -300;
        this.scene.add(sphere);
    }

    setLight() {
        // create a point light
        const pointLight = new PointLight(0xFFFFFF);

        // set its position
        pointLight.position.x = 100;
        pointLight.position.y = 150;
        pointLight.position.z = 130;

        // Light shadow
        // pointLight.shadow.radius = 0.5;
        // pointLight.shadow.bias = 0.5;
        console.log(pointLight.shadow);

        // add to the scene
        this.scene.add(pointLight);
    }

    resizeHandler() {
        this.canvas.width = window.innerWidth;
    }

    raf() {

    	this.controls.update();
        // Draw!
        this.renderer.render(this.scene, this.camera);


    }


}
