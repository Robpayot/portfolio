import { WebGLRenderer, SpotLight, Raycaster, PerspectiveCamera, Scene, Mesh, PlaneGeometry, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial, ConeBufferGeometry, Vector3, BoxGeometry, Object3D, CSS } from 'three';
import { CSS3DObject } from '../vendors/CSS3DRenderer';
import CSS3DRendererIE from '../vendors/CSS3DRendererIE';
import OrbitControls from '../vendors/OrbitControls';
import { World } from 'oimo';
import { getRandom, toRadian } from '../helpers/utils';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';


export default class Graphic3D {

    constructor() {

        this.raf = this.raf.bind(this);
        this.events = this.events.bind(this);
        this.setSpheres = this.setSpheres.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);
        this.reset = this.reset.bind(this);
        this.destroy = this.destroy.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);

        this.sound = SoundManager;

        this.start();


    }

    start() {

        // Set the scene size.
        this.width = window.innerWidth;
        this.height = window.innerHeight - 100;

        // body element
        this.body = document.getElementsByTagName('body')[0];


        // Set some camera attributes.
        this.fov = 45;
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

        // Css Renderer
        this.cssRenderer = new CSS3DRendererIE();
        this.cssRenderer.setSize(this.width, this.height);

        // Set up 3D-container
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = 0;
        this.cssRenderer.domElement.style.left = 0;
        this.cssRenderer.domElement.style.zIndex = 1;
        this.cssRenderer.domElement.classList.add('container3D');

        this.el.appendChild(this.cssRenderer.domElement);


        this.camera = new PerspectiveCamera(
            this.fov,
            this.aspect,
            this.near,
            this.far
        );

        this.camera.position.x = 75;
        this.camera.position.y = 75;
        this.camera.position.z = 75;


        // Raycaster
        this.raycaster = new Raycaster();

        // Mouse
        this.mouse = { x: 0, y: 0 };


        // Camera controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = true;



        this.initPhysics();
        this.initScene();
        this.initCssScene();

        this.guiParams = {
            gravity: false
        };

        this.sound.gui.add(this.guiParams, 'gravity').onChange(this.reset);

        this.events(true);



    }

    events(method) {

        let listen = method === false ? 'removeEventListener' : 'addEventListener';

        document[listen]('mousemove', this.onMouseMove);
        document[listen]('click', this.onClick);

        listen = method === false ? 'off' : 'on';

        EmitterManager[listen]('resize', this.resizeHandler);
        EmitterManager[listen]('raf', this.raf);

    }

    initScene() {

        this.scene = new Scene();
        this.scene.background = new Color(0xffffff);

        // Add the camera to the scene.
        this.scene.add(this.camera);


        // Attach the renderer-supplied
        // DOM element.
        this.el.appendChild(this.renderer.domElement);

        // spheres
        this.spheres = [];
        this.numbElements = 1;

        for (let i = 0; i < this.numbElements; i++) {
            this.setSpheres();
        }

        // // pyramides
        // this.pyramides = [];
        // this.numbElements = 0;

        // for (let i = 0; i < this.numbElements; i++) {
        //     this.setPyramides();
        // }

        // // cubes
        // this.cubes = [];
        // this.numbElements = 0;

        // for (let i = 0; i < this.numbElements; i++) {
        //     this.setCubes();
        // }

        // Set ground
        // this.setGround();

        // set Light
        this.setLight();

    }

    initCssScene() {


        // CSS Scene
        this.cssScene = new Scene();
        this.cssScene.add(this.camera);

        // ContainerMeshCss
        this.containerMeshCSS = new Object3D();
        // Add css3D Mesh container

        this.cssScene.add(this.containerMeshCSS);

        this.setText();


        this.containerMeshCSS.add(this.text);

    }

    setText() {

        // const staticWording = PreloadManager.getResult('wordingG').map;

        // const material = new MeshBasicMaterial({
        //     visible: true,
        //     color: 0xff6347
        // });

        // const mesh = new Mesh(new PlaneGeometry(1, 1), material);

        // // First rectangle
        // mesh.position.set(0, 0, 0);

        // mesh.rotation.set(0, toRadian(-90), 0);

        const span = document.createElement('span');
        span.classList.add('project__context');

        span.innerHTML = `<h1>BMW Paris Motorshow 2016</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sagittis erat sit amet enim pulvinar, et cursus diam fermentum. Sed dictum ligula semper sem volutpat ornare. Integer id enim vitae turpis accumsan ultrices at at urna. Fusce sit amet vestibulum turpis, sit amet interdum neque.</p>`;


        this.text = new CSS3DObject(span);
        console.log(this.text);

        // this.text.position.copy(mesh.position);
        // this.text.rotation.copy(mesh.rotation);


        this.text.position.set(0, 0, 0);
        this.text.rotation.set(0, 0, 0);

        // this.cssObject.scale.multiplyScalar(1 / 5);

    }

    initPhysics() {

        this.world = new World({
            timestep: 1 / 60,
            iterations: 8,
            broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
            worldscale: 1, // scale full world 
            random: true, // randomize sample
            info: false, // calculate statistic or not
            gravity: [0, 0, 0]
        });


    }

    setSpheres() {

        // // Set up the sphere vars
        const RADIUS = 10;
        const SEGMENTS = 32;
        const RINGS = 32;

        const geometry = new SphereGeometry(RADIUS, SEGMENTS, RINGS);
        const material = new MeshLambertMaterial({ color: 0xff6347 });
        const mesh = new Mesh(geometry, material);

        // mesh.position.set(getRandom(-300, 300), getRandom(-300, 300), getRandom(-300, 300));
        mesh.position.set(0, 0, 0);

        this.scene.add(mesh);

        // mesh.body = this.world.add({
        //     type: 'sphere', // type of shape : sphere, box, cylinder 
        //     size: [10, 10, 10], // size of shape
        //     pos: [getRandom(-300, 300), getRandom(-300, 300), getRandom(-300, 300)], // start position in degree
        //     rot: [0, 0, 90], // start rotation in degree
        //     move: true, // dynamic or statique
        //     density: 1,
        //     friction: 0.2,
        //     restitution: 0.2,
        //     belongsTo: 1, // The bits of the collision groups to which the shape belongs.
        //     collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        // });

        this.spheres.push(mesh);
    }

    setPyramides() {

        const geometry = new ConeBufferGeometry(5, 20, 32);
        geometry.radiusSegments = 4;
        const material = new MeshLambertMaterial({ color: 0x00ff00 });
        const mesh = new Mesh(geometry, material);

        mesh.position.set(getRandom(-250, 250), getRandom(-250, 250), getRandom(-250, 250));
        mesh.lookAt(new Vector3(0, 0, -300));

        this.scene.add(mesh);

        mesh.body = this.world.add({
            type: 'box', // type of shape : sphere, box, cylinder 
            size: [10, 10, 10], // size of shape
            pos: [getRandom(-250, 250), getRandom(-250, 250), getRandom(-250, 250)], // start position in degree
            rot: [0, 0, 90], // start rotation in degree
            move: true, // dynamic or statique
            density: 1,
            friction: 0.2,
            restitution: 0.2,
            belongsTo: 1, // The bits of the collision groups to which the shape belongs.
            collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        });

        this.pyramides.push(mesh);
    }

    setCubes() {

        // // Set up the sphere vars
        const RADIUS = 10;
        const SEGMENTS = 32;
        const RINGS = 32;

        const geometry = new BoxGeometry(20, 20, 20);

        const material = new MeshLambertMaterial({ color: 0x4682b4 });
        const mesh = new Mesh(geometry, material);

        mesh.position.set(getRandom(-150, 150), getRandom(-150, 150), getRandom(-150, 150));

        this.scene.add(mesh);

        mesh.body = this.world.add({
            type: 'box', // type of shape : sphere, box, cylinder 
            size: [10, 10, 10], // size of shape
            pos: [getRandom(-150, 150), getRandom(-150, 150), getRandom(-150, 150)], // start position in degree
            rot: [0, 0, 90], // start rotation in degree
            move: true, // dynamic or statique
            density: 1,
            friction: 0.2,
            restitution: 0.2,
            belongsTo: 1, // The bits of the collision groups to which the shape belongs.
            collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        });

        this.cubes.push(mesh);
    }

    setGround() {

        // physics
        this.ground0 = this.world.add({ size: [2, 600, 600], pos: [0, -50, 0], rot: [0, 90, 60], world: this.world });

        const geometry = new BoxGeometry(2, 600, 600);

        const material = new MeshLambertMaterial({ color: 0x000000, transparent: true, opacity: 0.8 });

        const mesh = new Mesh(geometry, material);

        mesh.position.copy(this.ground0.getPosition());
        mesh.quaternion.copy(this.ground0.getQuaternion());

        this.scene.add(mesh);
    }

    setLight() {


        let paramsLight = [
            { x: 70, y: 70, z: 0 },
            { x: -70, y: -70, z: -90 },
            // { x: 70, y: -70, z: -90 }
        ];

        for (var i = 0; i < paramsLight.length; i++) {

            // create a point light
            let pointLight = new PointLight(0xFFFFFF);
            // set its position
            pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
            // pointLight.power = 20;
            pointLight.distance = 1000;
            pointLight.decay = 2;
            pointLight.intensity = 1;

            // add to the scene
            this.scene.add(pointLight);
        }

        // white spotlight shining from the side, casting a shadow

        // var spotLight = new SpotLight(0xffffff);
        // spotLight.position.set(100, 1000, 100);

        // spotLight.castShadow = true;

        // spotLight.shadow.mapSize.width = 1024;
        // spotLight.shadow.mapSize.height = 1024;

        // spotLight.shadow.camera.near = 500;
        // spotLight.shadow.camera.far = 4000;
        // spotLight.shadow.camera.fov = 30;

        // this.scene.add(spotLight);


    }

    onClick(e) {

        if (this.clickSymbol === true) {
            // console.log('click Symbol', this.too);

            if (this.toggle !== true) {

                TweenMax.to(this.spheres[0].scale, 0.5, {
                    x: 1.5,
                    y: 1.5,
                    z: 1.5,
                    ease: window.Power4.easeInOut
                });
                this.toggle = true;

            } else {

                TweenMax.to(this.spheres[0].scale, 0.5, {
                    x: 1,
                    y: 1,
                    z: 1,
                    ease: window.Power4.easeInOut
                });

                this.toggle = false;
            }




        }

    }

    onMouseMove(e) {

        const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
        const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        this.mouse.x = (event.clientX / this.width) * 2 - 1;
        this.mouse.y = -(event.clientY / this.height) * 2 + 1;
        // console.log(this.mouse);
    }

    resizeHandler() {

        this.renderer.setSize(window.innerWidth, window.innerHeight - 100);
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight - 100);

    }

    raf() {



        //////////////////
        // Raycasters
        //////////////////

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.spheres);

        if (intersects.length > 0) {
            this.body.style.cursor = 'pointer';
            this.clickSymbol = true;

        } else {
            this.body.style.cursor = 'auto';
            this.clickSymbol = false;
        }



        // // Update meth size

        // ////////////
        // // hight
        // ///////////

        // let coefAttenuate = 0.01;
        // const hightAvg = this.sound.hightAvg * coefAttenuate + 0.5;

        // for (let i = 0; i < this.spheres.length; i++) {
        //     this.spheres[i].scale.x = hightAvg;
        //     this.spheres[i].scale.y = hightAvg;
        //     this.spheres[i].scale.z = hightAvg;
        // }

        // ////////////
        // // medium
        // ///////////

        // const mediumAvg = this.sound.mediumAvg * coefAttenuate + 0.5;

        // for (let i = 0; i < this.pyramides.length; i++) {
        //     this.pyramides[i].scale.x = mediumAvg;
        //     this.pyramides[i].scale.y = mediumAvg;
        //     this.pyramides[i].scale.z = mediumAvg;
        // }

        // ////////////
        // // low
        // ///////////

        // const lowAvg = this.sound.lowAvg * coefAttenuate + 0.5;

        // for (let i = 0; i < this.cubes.length; i++) {
        //     this.cubes[i].scale.x = lowAvg;
        //     this.cubes[i].scale.y = lowAvg;
        //     this.cubes[i].scale.z = lowAvg;
        // }


        // update world
        this.world.step();

        // and copy position and rotation to three mesh
        // for (let i = 0; i < this.spheres.length; i++) {
        //     this.spheres[i].position.copy(this.spheres[i].body.getPosition());
        //     this.spheres[i].quaternion.copy(this.spheres[i].body.getQuaternion());
        // }
        // for (let i = 0; i < this.cubes.length; i++) {
        //     this.cubes[i].position.copy(this.cubes[i].body.getPosition());
        //     this.cubes[i].quaternion.copy(this.cubes[i].body.getQuaternion());
        // }
        // for (let i = 0; i < this.pyramides.length; i++) {
        //     this.pyramides[i].position.copy(this.pyramides[i].body.getPosition());
        //     this.pyramides[i].quaternion.copy(this.pyramides[i].body.getQuaternion());
        // }

        // Render cssScene
        this.cssRenderer.render(this.cssScene, this.camera);
        // Render scene
        this.renderer.render(this.scene, this.camera);

        this.controls.update();

    }

    reset(e) {

        this.destroy();
        this.initScene();
        // this.initPhysics();

        if (this.guiParams.gravity === true) {
            this.world.gravity.y = -90;

            console.log('graivty down');
        } else {
            this.world.gravity.y = 0;
        }

    }

    destroy() {


        this.scene.traverse((obj) => {

            // remove physics
            if (obj.body) obj.body.remove();

            if (obj.geometry) obj.geometry.dispose();

            if (obj.material) {

                if (obj.material.materials) {

                    for (const mat of obj.material.materials) {

                        if (mat.map) mat.map.dispose();

                        mat.dispose();
                    }
                } else {

                    if (obj.material.map) obj.material.map.dispose();

                    obj.material.dispose();
                }
            }

        });

        for (let i = this.scene.children.length - 1; i >= 0; i--) {

            this.scene.remove(this.scene.children[i]);
        }



    }


}
