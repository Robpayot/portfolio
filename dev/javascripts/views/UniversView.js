import { WebGLRenderer, SpotLight, Raycaster, PerspectiveCamera, Scene, Mesh, Texture, PlaneGeometry, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial, MeshPhongMaterial, ConeBufferGeometry, Vector3, BoxGeometry, Object3D, CSS } from 'three';
import { CSS3DObject } from '../vendors/CSS3DRenderer';
import CSS3DRendererIE from '../vendors/CSS3DRendererIE';
import OrbitControls from '../vendors/OrbitControls';
import { World } from 'oimo';
import { getRandom, toRadian } from '../helpers/utils';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';
import Symbol from '../shapes/Symbol';
import Asteroid from '../shapes/Asteroid';
import PreloadManager from '../managers/PreloadManager';


export default class UniversView {

    constructor() {

        this.raf = this.raf.bind(this);
        this.events = this.events.bind(this);
        this.setSymbol = this.setSymbol.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);
        this.reset = this.reset.bind(this);
        this.destroy = this.destroy.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);

        this.sound = SoundManager;

        this.start();


    }

    start() {

        // set ui
        this.ui = {
            el: document.querySelector('.graphic3D'),
            body: document.getElementsByTagName('body')[0]
        };

        // Set the canvas size.
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Set Camera.
        this.setCamera();

        // Set scenes
        this.scene = new Scene();
        this.cssScene = new Scene();

        // Set physics
        this.initPhysics();


        // Set symbol
        this.setSymbol();

        // Set asteroid
        this.setAsteroids();

        // Set Context
        this.setContext();

        // for (let i = 0; i < this.numbElements; i++) {
        //     this.setSpheres();
        // }

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

        // Raycaster
        this.raycaster = new Raycaster();

        // Mouse
        this.mouse = { x: 0, y: 0 };


        // Set CssRenderer and WebGLRenderer 

        this.cssRenderer = new CSS3DRendererIE();
        this.cssRenderer.setSize(this.width, this.height);
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = 0;
        this.cssRenderer.domElement.style.left = 0;
        this.cssRenderer.domElement.style.zIndex = 1;
        this.cssRenderer.domElement.classList.add('container3D');

        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0x000000, 0.0);

        this.renderer.setSize(this.width, this.height);

        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = 0;
        this.renderer.domElement.style.left = 0;
        this.renderer.domElement.classList.add('webGl');
        this.cssRenderer.domElement.appendChild(this.renderer.domElement);

        this.ui.el.appendChild(this.cssRenderer.domElement);

        // Camera controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = true;

        // GUI
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

    setCamera() {

        this.fov = 45;
        this.aspect = this.width / this.height;
        this.near = 0.1;
        this.far = 10000;

        this.camera = new PerspectiveCamera(
            this.fov,
            this.aspect,
            this.near,
            this.far
        );

        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 200;
    }


    setContext() {

        // Text

        let div = document.createElement('div');
        div.classList.add('css-container');

        div.innerHTML = `<div class='project__context'><h1>BMW Paris Motorshow 2016</h1><br><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sagittis erat sit amet enim pulvinar, et cursus diam fermentum. Sed dictum ligula semper sem volutpat ornare. Integer id enim vitae turpis accumsan ultrices at at urna. Fusce sit amet vestibulum turpis, sit amet interdum neque.</p></div>`;

        this.text = new CSS3DObject(div);
        this.text.position.set(45, 5, 20);
        this.text.rotation.set(0, toRadian(-35), 0);

        this.cssScene.add(this.text);

        this.text.scale.multiplyScalar(1 / 6);

        let div2 = document.createElement('div');
        div2.classList.add('css-container');

        div2.innerHTML = `<div class='project__image'><img src="images/bmw.jpg" alt="project image" /></div>`;

        const div23d = new CSS3DObject(div2);
        div23d.position.set(-45, 5, 20);
        div23d.rotation.set(0, toRadian(35), 0);

        this.cssScene.add(div23d);

        div23d.scale.multiplyScalar(1 / 6);
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

        this.world.gravity.y = 0;


    }

    setSymbol() {

        // Set up the sphere vars
        const RADIUS = 10;
        const SEGMENTS = 32;
        const RINGS = 32;

        const geometry = new SphereGeometry(RADIUS, SEGMENTS, RINGS);
        const material = new MeshLambertMaterial({ color: 0xff6347 });
        const pos = {
            x: 0,
            y: 0,
            z: 0,
        };

        const symbol = new Symbol(geometry, material, pos);

        // add physic body to world
        symbol.body = this.world.add(symbol.physics);
        this.symbols = [symbol];

        // add mesh to the scene
        this.scene.add(symbol);

    }

    setAsteroids() {

        this.asteroids = [];

        // Set up the sphere vars
        const RADIUS = 5;
        const SEGMENTS = 32;
        const RINGS = 32;

        const geometry = new SphereGeometry(RADIUS, SEGMENTS, RINGS);
        // const material = new MeshLambertMaterial({ color: 0x4682b4 });
        const img = PreloadManager.getResult('texture-asteroid');

        const tex = new Texture(img);
        tex.needsUpdate = true;

        const matPhongParams = {
            // specular: 0xFFFFFF,
            shininess: 100000,
            // color: 0x4682b4,
            map: tex
        };
        const material = new MeshPhongMaterial(matPhongParams);
        const nb = 20;

        for (let i = 0; i < nb; i++) {

            // random position

            // const pos = {
            //     x: (i + 1) * 30 - ((nb / 2 + 1) * 30) / 2,
            //     y: 0,
            //     z: -50,
            // };
            // if (i > 9) {
            //     pos.x = (i - 10) * 30 - ((nb / 2 + 1) * 30) / 2,
            //         pos.y = 30;
            // }

            const pos = {
                x: getRandom(-100, 100),
                y: getRandom(-100, 100),
                z: getRandom(-100, 100),
            };

            // Sphere perimeter :
            // x: -15 à 15
            // y : -15 to 15
            // z : -15 to 15

            // Intra perimeter radius
            const ipRadius = 50;

            if (pos.x < ipRadius && pos.x > -ipRadius && pos.y < ipRadius && pos.y > -ipRadius && pos.z < ipRadius && pos.z > -ipRadius) {
                console.log(i, ' dans le périmetre !');
                pos.x += ipRadius;
                pos.y += ipRadius;
                pos.z += ipRadius;

            }




            //  force impulsion
            let randomForceX;

            randomForceX = getRandom(-200, 200);


            const force = {
                x: getRandom(-10, 10),
                y: getRandom(-10, 10),
                z: getRandom(-10, 10)
            };

            const asteroid = new Asteroid(geometry, material, pos, force);

            // add physic body to world
            asteroid.body = this.world.add(asteroid.physics);
            this.asteroids.push(asteroid);

            // add mesh to the scene
            this.scene.add(asteroid);

        }


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
            this.onClickSymbol();

        }

    }

    onClickSymbol() {

        const tl = new TimelineMax();

        if (this.toggle !== true) {



            tl.to(this.symbols[0].scale, 0.7, {
                x: 1.5,
                y: 1.5,
                z: 1.5,
                ease: window.Power4.easeInOut
            });

            tl.staggerFromTo(['.project__image', '.project__context'], 0.8, {
                opacity: 0,
                y: 30
            }, {
                opacity: 1,
                y: 0,
                ease: window.Power4.easeOut
            }, 0.1, 0.4);

            this.toggle = true;

        } else {

            tl.to(['.project__context', '.project__image'], 0.8, {
                opacity: 0,
                ease: window.Power4.easeInOut
            });


            tl.to(this.symbols[0].scale, 0.5, {
                x: 1,
                y: 1,
                z: 1,
                ease: window.Power4.easeInOut
            }, 0.1);

            this.toggle = false;
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

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);

    }

    raf() {



        //////////////////
        // Raycasters
        //////////////////

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.symbols);

        if (intersects.length > 0) {
            this.ui.body.style.cursor = 'pointer';
            this.clickSymbol = true;

        } else {
            this.ui.body.style.cursor = 'auto';
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

        for (let i = 0; i < this.symbols.length; i++) {
            this.symbols[i].position.copy(this.symbols[i].body.getPosition());
            this.symbols[i].quaternion.copy(this.symbols[i].body.getQuaternion());
        }
        for (let i = 0; i < this.asteroids.length; i++) {


            // Add force impulsion on a 0 Gravity to move asteroids
            this.asteroids[i].body.applyImpulse({ x: 0, y: 400, z: 0 }, this.asteroids[i].force);
            
            this.asteroids[i].body.rot = [0,0,0];

            this.asteroids[i].position.copy(this.asteroids[i].body.getPosition());
            // --> For Rotation
            // this.asteroids[i].quaternion.copy(this.asteroids[i].body.getQuaternion());

        }
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

            console.log('gravity down');
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
