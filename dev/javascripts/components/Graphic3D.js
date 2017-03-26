import { WebGLRenderer, PerspectiveCamera, Scene, Mesh, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial, ConeBufferGeometry, Vector3, BoxGeometry } from 'three';
import { getRandom } from '../helpers/utils';
import OrbitControls from '../vendors/OrbitControls';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';

console.log(OrbitControls);


export default class Graphic3D {

    constructor() {

        this.raf = this.raf.bind(this);
        this.events = this.events.bind(this);
        this.setSpheres = this.setSpheres.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);

        this.sound = SoundManager;

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

        // controls
        this.camera.position.x = 300;
        this.camera.position.y = 300;
        this.camera.position.z = 300;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = true;

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

        // spheres
        this.spheres = [];
        this.numbElements = 50;

        for (let i = 0; i < this.numbElements; i++) {
            this.setSpheres();
        }

        // pyramides
        this.pyramides = [];
        this.numbElements = 40;

        for (let i = 0; i < this.numbElements; i++) {
            this.setPyramides();
        }

        // cubes
        this.cubes = [];
        this.numbElements = 30;

        for (let i = 0; i < this.numbElements; i++) {
            this.setCubes();
        }


        this.setLight();

        this.events(true);



    }

    events(method) {

        let listen = method === false ? 'removeEventListener' : 'addEventListener';
        listen = method === false ? 'off' : 'on';

        EmitterManager[listen]('resize', this.resizeHandler);
        EmitterManager[listen]('raf', this.raf);

    }

    setSpheres() {

        // // Set up the sphere vars
        const RADIUS = 10;
        const SEGMENTS = 32;
        const RINGS = 32;

        const geometry = new SphereGeometry(RADIUS, SEGMENTS, RINGS);
        const material = new MeshBasicMaterial({ color: 0xff6347 });
        const mesh = new Mesh(geometry, material);

        mesh.position.set(getRandom(-300, 300), getRandom(-300, 300), getRandom(-300, 300));

        this.scene.add(mesh);

        this.spheres.push(mesh);
    }

    setPyramides() {

        const geometry = new ConeBufferGeometry( 5, 20, 32 );
        geometry.radiusSegments = 4;
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        const mesh = new Mesh(geometry, material);

        mesh.position.set(getRandom(-250, 250), getRandom(-250, 250), getRandom(-250, 250));
        mesh.lookAt(new Vector3( 0, 0, -300 ));

        this.scene.add(mesh);

        this.pyramides.push(mesh);
    }

    setCubes() {

        // // Set up the sphere vars
        const RADIUS = 10;
        const SEGMENTS = 32;
        const RINGS = 32;

        const geometry = new BoxGeometry( 20, 20, 20 );

        const material = new MeshBasicMaterial({ color: 0x4682b4 });
        const mesh = new Mesh(geometry, material);

        mesh.position.set(getRandom(-150, 150), getRandom(-150, 150), getRandom(-150, 150));

        this.scene.add(mesh);

        this.cubes.push(mesh);
    }

    setLight() {
        // create a point light
        const pointLight = new PointLight(0xFFFFFF);

        // set its position
        pointLight.position.set(0, 0, 0);
        pointLight.power = 40;
        pointLight.distance = 600;
        pointLight.decay = 2;
        console.log(pointLight);

        // add to the scene
        this.scene.add(pointLight);
    }

    resizeHandler() {
        this.canvas.width = window.innerWidth;
    }

    raf() {

        this.sound.analyser.getByteFrequencyData(this.sound.dataArray);

        ////////////
        // hight
        ///////////

        let hightVals = 0;
        let hightLimit = Math.round(this.sound.bufferLength / 5);

        for (let i = 0; i < hightLimit; i++) {

            hightVals += this.sound.dataArray[i];

        }
        let coefAttenuate = 0.01;
        const hightAvg = (hightVals / hightLimit) * coefAttenuate;

        for (let i = 0; i < this.spheres.length; i++) {
            this.spheres[i].scale.x = hightAvg;
            this.spheres[i].scale.y = hightAvg;
            this.spheres[i].scale.z = hightAvg;
        }

        ////////////
        // medium
        ///////////

        let mediumVals = 0;
        let mediumLimit = Math.round((this.sound.bufferLength / 5) * 2);

        for (let i = hightLimit; i < mediumLimit; i++) {

            mediumVals += this.sound.dataArray[i];

        }

        coefAttenuate = 0.03;
        const mediumAvg = (mediumVals / mediumLimit) * coefAttenuate;

        for (let i = 0; i < this.pyramides.length; i++) {
            this.pyramides[i].scale.x = mediumAvg;
            this.pyramides[i].scale.y = mediumAvg;
            this.pyramides[i].scale.z = mediumAvg;
        }

        ////////////
        // low
        ///////////

        let lowVals = 0;
        let lowLimit = Math.round((this.sound.bufferLength / 5) * 3);

        for (let i = mediumLimit; i < lowLimit; i++) {

            lowVals += this.sound.dataArray[i];

        }

        coefAttenuate = 0.03;
        const lowAvg = (lowVals / lowLimit) * coefAttenuate;

        for (let i = 0; i < this.cubes.length; i++) {
            this.cubes[i].scale.x = lowAvg;
            this.cubes[i].scale.y = lowAvg;
            this.cubes[i].scale.z = lowAvg;
        }



        this.controls.update();
        // Draw!
        this.renderer.render(this.scene, this.camera);


    }


}
