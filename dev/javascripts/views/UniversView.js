import { WebGLRenderer, SpotLight, Raycaster, PerspectiveCamera, Scene, Mesh, Texture, PlaneGeometry, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial, MeshPhongMaterial, ConeBufferGeometry, Vector3, BoxGeometry, Object3D, CSS } from 'three';
import { CSS3DObject } from '../vendors/CSS3DRenderer';
import CSS3DRendererIE from '../vendors/CSS3DRendererIE';
import OrbitControls from '../vendors/OrbitControls';
import { World } from 'oimo';
import { getRandom, toRadian } from '../helpers/utils';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';
import Envelop from '../shapes/Envelop';
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

        this.cssObjects = [];

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

        // Set envelop
        this.setEnvelop();

        // Set Context
        this.setContext();

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
        this.renderer.setClearColor(0x000000, 1);

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

    setEnvelop() {
        // Set up the sphere vars
        const width = 400;
        const height = 400;
        const depth = 2;

        this.envelopSize = width;


        const geometry = new BoxGeometry(width, height, depth);
        const material = new MeshBasicMaterial({ color: 0x0101010, transparent: true, opacity: 1 });
        this.envelops = [];

        const configs = [{
            pos: { x: -width / 2, y: 0, z: 0 },
            rot: { x: 0, y: toRadian(-90), z: 0 }
        }, {
            pos: { x: width / 2, y: 0, z: 0 },
            rot: { x: 0, y: toRadian(-90), z: 0 }
        }, {
            pos: { x: 0, y: 0, z: -width / 2 },
            rot: { x: 0, y: 0, z: 0 }
        }, {
            pos: { x: 0, y: 0, z: width / 2 },
            rot: { x: 0, y: 0, z: 0 }
        }, {
            pos: { x: 0, y: -width / 2, z: 0 },
            rot: { x: toRadian(-90), y: 0, z: 0 }
        }, {
            pos: { x: 0, y: width / 2, z: 0 },
            rot: { x: toRadian(-90), y: 0, z: 0 }
        }];

        for (let i = 0; i < configs.length; i++) {

            const envelop = new Envelop(geometry, material, configs[i].pos, configs[i].rot);

            // add physic body to world
            envelop.body = this.world.add(envelop.physics);
            this.envelops.push(envelop);

            // add mesh to the scene
            this.scene.add(envelop);
        }



    }

    setSymbol() {

        // Set up the sphere vars
        const RADIUS = 10;
        const SEGMENTS = 32;
        const RINGS = 32;

        const geometry = new SphereGeometry(RADIUS, SEGMENTS, RINGS);
        const material = new MeshPhongMaterial({ color: 0xff6347, shininess: 1 });
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
            shininess: 300,
            // color: 0x4682b4,
            transparent : true,
            opacity: 0.9,
            map: tex
        };
        const material = new MeshPhongMaterial(matPhongParams);
        const nb = 20;

        for (let i = 0; i < nb; i++) {

            const pos = {
                x: getRandom(-100, 100),
                y: getRandom(-100, 100),
                z: getRandom(-100, 100),
            };

            // Intra perimeter radius
            const ipRadius = 50;

            if (pos.x < ipRadius && pos.x > -ipRadius && pos.y < ipRadius && pos.y > -ipRadius && pos.z < ipRadius && pos.z > -ipRadius) {
                console.log(i, ' dans le périmetre !');
                pos.x += ipRadius;
                pos.y += ipRadius;
                pos.z += ipRadius;

            }

            //  force impulsion
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
            this.scene.add(asteroid.mesh);

        }


    }

    setLight() {


        let paramsLight = [
            // { x: 70, y: 70, z: 0 },
            { x: -50, y: -50, z: 100 },
            { x: 0, y: -0, z: 0 }
        ];

        for (var i = 0; i < paramsLight.length; i++) {

            // create a point light
            let pointLight = new PointLight(0xFFFFFF);
            // set its position
            pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
            // pointLight.power = 20;
            pointLight.distance = 600;
            pointLight.decay = 2;
            pointLight.intensity = 1.5;

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

    setContext() {

        console.log('createText');

        // Text

        let div = document.createElement('div');
        div.classList.add('css-container');

        div.innerHTML = `<div class='project__context'><h1>BMW Paris Motorshow 2016</h1><br><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sagittis erat sit amet enim pulvinar, et cursus diam fermentum. Sed dictum ligula semper sem volutpat ornare. Integer id enim vitae turpis accumsan ultrices at at urna. Fusce sit amet vestibulum turpis, sit amet interdum neque.</p></div>`;

        this.text = new CSS3DObject(div);
        this.text.position.set(50, 5, 20);
        this.text.rotation.set(0, toRadian(-35), 0);
        this.text.scale.multiplyScalar(1 / 14);

        this.cssScene.add(this.text);
        this.cssObjects.push(this.text);



        let div2 = document.createElement('div');
        div2.classList.add('css-container');

        div2.innerHTML = `<div class='project__image'><img src="images/bmw.jpg" alt="project image" /></div>`;

        const div23d = new CSS3DObject(div2);
        div23d.position.set(-50, 5, 20);
        div23d.rotation.set(0, toRadian(35), 0);
        div23d.scale.multiplyScalar(1 / 14);

        this.cssScene.add(div23d);

        this.cssObjects.push(div23d);

    }

    onClick(e) {

        if (this.clickSymbol === true) {
            this.onClickSymbol();

        }

    }

    onClickSymbol() {

        const tl = new TimelineMax();

        this.reset();

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

        // Update camera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Update canvas size
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

        // Envelop body
        for (let i = 0; i < this.envelops.length; i++) {
            this.envelops[i].position.copy(this.envelops[i].body.getPosition());
            this.envelops[i].quaternion.copy(this.envelops[i].body.getQuaternion());
        }
        // Symbol body
        for (let i = 0; i < this.symbols.length; i++) {
            this.symbols[i].position.copy(this.symbols[i].body.getPosition());
            this.symbols[i].quaternion.copy(this.symbols[i].body.getQuaternion());
        }
        // Asteroids bodies
        for (let i = 0; i < this.asteroids.length; i++) {

            if (this.asteroids[i].mesh.position.x > this.envelopSize / 2 - 50 || this.asteroids[i].mesh.position.x < -this.envelopSize / 2 + 50 || this.asteroids[i].mesh.position.y > this.envelopSize / 2 - 50 || this.asteroids[i].mesh.position.y < -this.envelopSize / 2 + 50 || this.asteroids[i].mesh.position.z > this.envelopSize / 2 - 50 || this.asteroids[i].mesh.position.z < -this.envelopSize / 2 + 50) {
                // Reverse Force Vector
                if (this.asteroids[i].annilled !== true) {

                    this.asteroids[i].changeDirection();
                    this.asteroids[i].annilled = true;
                }
            }

            if (this.asteroids[i].body !== undefined) {

                // APPLY IMPULSE
                this.asteroids[i].body.linearVelocity.x = this.asteroids[i].force.x;
                this.asteroids[i].body.linearVelocity.y = this.asteroids[i].force.y;
                this.asteroids[i].body.linearVelocity.z = this.asteroids[i].force.z;

                this.asteroids[i].mesh.position.copy(this.asteroids[i].body.getPosition());
                this.asteroids[i].mesh.quaternion.copy(this.asteroids[i].body.getQuaternion());


            }


        }

        // Render cssScene
        this.cssRenderer.render(this.cssScene, this.camera);
        // Render scene
        this.renderer.render(this.scene, this.camera);

        this.controls.update();

    }

    reset(e) {

        this.destroy();

        // Set symbol
        this.setSymbol();

        // Set asteroid
        this.setAsteroids();

        // Set envelop
        this.setEnvelop();

        // Set Context
        this.setContext();

        // set Light
        this.setLight();

        // Raycaster
        this.raycaster = new Raycaster();

        // Mouse
        this.mouse = { x: 0, y: 0 };
        this.initPhysics();

        // if (this.guiParams.gravity === true) {
        //     this.world.gravity.y = -90;

        //     console.log('gravity down');
        // } else {
        //     this.world.gravity.y = 0;
        // }

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

        // Destroy css scene
        this.cssScene.traverse((obj) => {

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

            this.cssScene.remove(this.scene.children[i]);
        }
        
        let cssContainers = document.querySelectorAll('.css-container');
        for (var i = 0; i < cssContainers.length; i++) {

        	this.cssObjects[i].element = null;
        	cssContainers[i].remove();
        }

        this.cssObjects = [];
    }


}
