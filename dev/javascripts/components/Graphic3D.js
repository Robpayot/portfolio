import { WebGLRenderer, PerspectiveCamera, Scene, Mesh, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial, ConeBufferGeometry, Vector3, BoxGeometry } from 'three';
import { World } from 'oimo';
import { getRandom } from '../helpers/utils';
import OrbitControls from '../vendors/OrbitControls';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';

console.log(World);


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
        this.height = window.innerHeight - 100;


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
        // Start the renderer.
        this.renderer.setSize(this.width, this.height);

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


        this.initScene();

        this.initPhysics();

        this.events(true);



    }

    events(method) {

        let listen = method === false ? 'removeEventListener' : 'addEventListener';
        listen = method === false ? 'off' : 'on';

        EmitterManager[listen]('resize', this.resizeHandler);
        EmitterManager[listen]('raf', this.raf);

    }

    initScene() {

        this.scene = new Scene();
        this.scene.background = new Color(0xffffff);
        console.log(this.scene);

        // Add the camera to the scene.
        this.scene.add(this.camera);



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
    }

    initPhysics() {

        console.log('oui');

        const world = new World({
            timestep: 1 / 60,
            iterations: 8,
            broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
            worldscale: 1, // scale full world 
            random: true, // randomize sample
            info: false, // calculate statistic or not
            gravity: [0, -9.8, 0]
        });

        let body = world.add({
            type: 'sphere', // type of shape : sphere, box, cylinder 
            size: [1, 1, 1], // size of shape
            pos: [0, 0, 0], // start position in degree
            rot: [0, 0, 90], // start rotation in degree
            move: true, // dynamic or statique
            density: 1,
            friction: 0.2,
            restitution: 0.2,
            belongsTo: 1, // The bits of the collision groups to which the shape belongs.
            collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        });

        // let body = world.add({
        // 	type: 'jointHinge', // type of joint : jointDistance, jointHinge, jointPrisme, jointSlide, jointWheel
        // 	body1: "b1", // name or id of attach rigidbody
        // 	body2: "b1", // name or id of attach rigidbody
        // });


        // update world
        world.step();

        // and copy position and rotation to three mesh
        for (let i = 0; i < this.spheres.length; i++) {
            this.spheres[i].position.copy(body.getPosition());
            this.spheres[i].quaternion.copy(body.getQuaternion());
        }

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

        const geometry = new ConeBufferGeometry(5, 20, 32);
        geometry.radiusSegments = 4;
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        const mesh = new Mesh(geometry, material);

        mesh.position.set(getRandom(-250, 250), getRandom(-250, 250), getRandom(-250, 250));
        mesh.lookAt(new Vector3(0, 0, -300));

        this.scene.add(mesh);

        this.pyramides.push(mesh);
    }

    setCubes() {

        // // Set up the sphere vars
        const RADIUS = 10;
        const SEGMENTS = 32;
        const RINGS = 32;

        const geometry = new BoxGeometry(20, 20, 20);

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

        this.renderer.setSize(window.innerWidth, window.innerHeight - 100);

    }

    raf() {


        // Update meth size

        ////////////
        // hight
        ///////////

        let coefAttenuate = 0.01;
        const hightAvg = this.sound.hightAvg * coefAttenuate + 0.5;

        for (let i = 0; i < this.spheres.length; i++) {
            this.spheres[i].scale.x = hightAvg;
            this.spheres[i].scale.y = hightAvg;
            this.spheres[i].scale.z = hightAvg;
        }

        ////////////
        // medium
        ///////////

        const mediumAvg = this.sound.mediumAvg * coefAttenuate + 0.5;

        for (let i = 0; i < this.pyramides.length; i++) {
            this.pyramides[i].scale.x = mediumAvg;
            this.pyramides[i].scale.y = mediumAvg;
            this.pyramides[i].scale.z = mediumAvg;
        }

        ////////////
        // low
        ///////////

        const lowAvg = this.sound.lowAvg * coefAttenuate + 0.5;

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
