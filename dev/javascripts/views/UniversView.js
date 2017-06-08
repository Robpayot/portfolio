import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';
import { getRandom, toRadian, clamp, round } from '../helpers/utils';
import Envelop from '../shapes/Envelop';
import Symbol from '../shapes/Symbol';
import Asteroid from '../shapes/Asteroid';
import PreloadManager from '../managers/PreloadManager';
import SceneManager from '../managers/SceneManager';
import { Device } from '../helpers/Device';
import bean from 'bean';



// THREE JS
import { DirectionalLight, ShaderMaterial, OrthographicCamera, MeshDepthMaterial, RGBFormat, NearestFilter, LinearFilter, RGBAFormat, WebGLRenderTarget, NoBlending, SpotLight, ShaderChunk, Raycaster, UniformsUtils, ShaderLib, PerspectiveCamera, Scene, Mesh, Texture, TorusGeometry, PlaneGeometry, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial, MeshPhongMaterial, ConeBufferGeometry, Vector3, BoxGeometry, Object3D, CSS, Sprite, SpriteCanvasMaterial } from 'three';
import EffectComposer, { RenderPass, ShaderPass, CopyShader } from 'three-effectcomposer-es6';
import { CSS3DObject } from '../vendors/CSS3DRenderer';
import OrbitControls from '../vendors/OrbitControls';
import { CameraDolly } from '../vendors/three-camera-dolly-custom';
import { World } from 'oimo';


// POSTPROCESSING
import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader
import { FXAAShader } from '../shaders/FXAAShader'; // FXAA shader
import { HorizontalTiltShiftShader } from '../shaders/HorizontalTiltShiftShader'; // HorizontalTiltShiftShader shader
import { VerticalTiltShiftShader } from '../shaders/VerticalTiltShiftShader'; // VerticalTiltShiftShader shader
import { BrightnessShader } from '../shaders/BrightnessShader'; // VerticalTiltShiftShader shader




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
        this.showGallery = this.showGallery.bind(this);
        this.showDescription = this.showDescription.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);
        this.onChangeGlow = this.onChangeGlow.bind(this);
        this.onChangeBlur = this.onChangeBlur.bind(this);
        this.onChangeBrightness = this.onChangeBrightness.bind(this);
        this.onChangeDolly = this.onChangeDolly.bind(this);



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
        this.glow = 1;
        this.nbAst = 1;
        this.finalFov = 45;

        // retina screen size
        this.width = window.innerWidth * window.devicePixelRatio;
        this.height = window.innerHeight * window.devicePixelRatio;

        // Set scenes
        this.scene = new Scene();
        this.cssScene = new Scene();

        // Set Camera.
        this.setCamera();

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
        this.cameraRot = new Vector3(0, 0, 0);
        this.cameraPos = new Vector3(0, 0, 0);

        this.cameraTarget = new Vector3(0, 0, 0);

        this.camera.lookAt(this.cameraTarget);




        // Camera controls
        // this.controls = new OrbitControls(this.camera, SceneManager.renderer.domElement);
        // this.controls.enableZoom = true;

        /////////////////
        // GUI
        /////////////////

        this.effectController = {
            // blur
            blur: 4.0,
            horizontalBlur: 0.5,
            enabled: false,
            // glow
            coeficient: 1,
            power: 2,
            glowColor: 0xffffff,
            coeficientOut: 1,
            powerOut: 2,
            glowColorOut: 0xffffff,
            // brightness
            brightness: 0,
            contrast: 0,
            // Camera dolly
            position: 0,
            lookAt: 0

        };

        // Blur
        const blurFolder = this.sound.gui.addFolder('Blur');
        blurFolder.add(this.effectController, 'blur', 0.0, 20.0, 0.001).listen().onChange(this.onChangeBlur);
        blurFolder.add(this.effectController, 'horizontalBlur', 0.0, 1.0, 0.001).listen().onChange(this.onChangeBlur);
        blurFolder.add(this.effectController, 'enabled').onChange(this.onChangeBlur);
        // blurFolder.open();

        // Glow
        const glowFolder = this.sound.gui.addFolder('Glow');
        glowFolder.add(this.effectController, 'coeficient', 0.0, 2).listen().onChange(this.onChangeGlow);
        glowFolder.add(this.effectController, 'power', 0.0, 5).listen().onChange(this.onChangeGlow);
        glowFolder.addColor(this.effectController, 'glowColor').listen().onChange(this.onChangeGlow);
        glowFolder.add(this.effectController, 'coeficientOut', 0.0, 2).listen().onChange(this.onChangeGlow);
        glowFolder.add(this.effectController, 'powerOut', 0.0, 20).listen().onChange(this.onChangeGlow);
        glowFolder.addColor(this.effectController, 'glowColorOut').listen().onChange(this.onChangeGlow);

        // Brightness
        const brightnessFolder = this.sound.gui.addFolder('Brightness');
        brightnessFolder.add(this.effectController, 'brightness', 0.0, 1).listen().onChange(this.onChangeBrightness);
        brightnessFolder.add(this.effectController, 'contrast', 0.0, 30).listen().onChange(this.onChangeBrightness);
        // brightnessFolder.open();

        // Camera Dolly
        // const dollyFolder = this.sound.gui.addFolder('Camera Dolly');
        // dollyFolder.add(this.effectController, 'position', 0.0, 1).listen().onChange(this.onChangeDolly);
        // dollyFolder.add(this.effectController, 'lookAt', 0.0, 1).listen().onChange(this.onChangeDolly);
        // dollyFolder.open();


        ////////////////////
        // POST PROCESSING
        ////////////////////

        // Set BLUR EFFECT
        this.setBlur();



        ////////////////////
        // EVENTS
        ////////////////////

        this.events(true);

    }

    onChangeBlur() {
        this.hblur.uniforms['h'].value = this.effectController.blur / this.width;
        this.vblur.uniforms['v'].value = this.effectController.blur / this.height;

        this.vblur.uniforms['r'].value = this.hblur.uniforms['r'].value = this.effectController.horizontalBlur;
    }

    onChangeGlow() {
        this.symbols[0].glowMesh.insideMesh.material.uniforms['coeficient'].value = this.effectController.coeficient;
        this.symbols[0].glowMesh.insideMesh.material.uniforms['power'].value = this.effectController.power;
        this.symbols[0].glowMesh.insideMesh.material.uniforms.glowColor.value.set(this.effectController.glowColor);

        this.symbols[0].glowMesh.outsideMesh.material.uniforms['coeficient'].value = this.effectController.coeficientOut;
        this.symbols[0].glowMesh.outsideMesh.material.uniforms['power'].value = this.effectController.powerOut;
        this.symbols[0].glowMesh.outsideMesh.material.uniforms.glowColor.value.set(this.effectController.glowColorOut);
    }

    onChangeBrightness() {
        this.brightness.uniforms['brightness'].value = this.effectController.brightness;
        this.brightness.uniforms['contrast'].value = this.effectController.contrast;
    }

    onChangeDolly() {
        this.dolly.cameraPosition = this.effectController.position;
        this.dolly.lookatPosition = this.effectController.lookAt;
        this.dolly.update();
    }

    events(method) {

        let listen = method === false ? 'removeEventListener' : 'addEventListener';

        if (Device.touch === false) {
            // move camera
            document[listen]('mousemove', this.onMouseMove);
            document.body[listen]('click', this.onClick);
            document[listen]('mousewheel', this.onMouseWheel);
            document[listen]('MozMousePixelScroll', this.onMouseWheel);
        } else {
            document.body[listen]('touchstart', this.onClick);
        }

        // When context is ready 
        setTimeout(() => {
            console.log(listen);
            this.ui.btn = document.querySelector('.project__btn');
            this.ui.arrowL = document.querySelector('.project__arrow-l');
            this.ui.arrowR = document.querySelector('.project__arrow-r');
            // console.log(this.ui.arrowL);
            this.ui.arrowL[listen]('click', this.showGallery);
            this.ui.arrowR[listen]('click', this.showDescription);

        }, 1000);




        let listenO = method === false ? 'off' : 'on';
        EmitterManager[listenO]('resize', this.resizeHandler);
        EmitterManager[listenO]('raf', this.raf);



    }

    setCamera() {

        this.camera = new PerspectiveCamera(
            45, // fov
            window.innerWidth / window.innerHeight, // aspect
            1, // near
            3000 // far
        );

        const initPos = {
            'x': 0,
            'y': 0,
            'z': 160
        }

        this.pathRadius = 160;
        this.camera.position.set(0, 0, 160);
        if (Device.size === 'mobile') {
            this.camera.position.set(0, 0, 200);
        }

        // Formules coordonnée d'un cercle
        // x = x0 + r * cos(t)
        // y = y0 + r * sin(t)

        // // Set camera Dolly
        // const points = {
        //     'camera': [{
        //         'x': radius * Math.cos(Math.PI / 2),
        //         'y': 0,
        //         'z': radius * Math.sin(Math.PI / 2)
        //     }, {
        //         'x': radius * Math.cos(3 * Math.PI / 4),
        //         'y': 0,
        //         'z': radius * Math.sin(3 * Math.PI / 4)
        //     }, {
        //         'x': radius * Math.cos(Math.PI),
        //         'y': 0,
        //         'z': radius * Math.sin(Math.PI)
        //     }],
        //     'lookat': [{
        //         'x': 0,
        //         'y': 0,
        //         'z': 0
        //     }, {
        //         'x': 180,
        //         'y': -87,
        //         'z': -66
        //     }, {
        //         'x': 280,
        //         'y': -87,
        //         'z': -66
        //     }, {
        //         'x': 280,
        //         'y': -87,
        //         'z': 36
        //     }]
        // };

        // this.dolly = new CameraDolly(this.camera, this.scene, points, null, true);

        // this.dolly.cameraPosition = 0;
        // this.dolly.lookatPosition = 0;
        // this.dolly.range = [0, 1];
        // this.dolly.both = 0;

        // TweenMax.to(this.dolly, 10, {
        // 	cameraPosition: 1,
        // 	onUpdate: () => {
        // 		this.dolly.update();
        // 	}
        // })


    }

    initPhysics() {

        this.world = new World({
            timestep: 1 / 60,
            iterations: 8,
            broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
            worldscale: 1, // scale full world 
            random: true, // randomize sample
            info: false, // calculate statistic or not
            gravity: [0, 0, 0] // 0 gravity
        });

        // this.world.gravity.y = 0;

    }

    setEnvelop() {
        // Set up the sphere vars
        const width = 400;
        const height = 400;
        const depth = 2;

        this.envelopSize = width;


        const geometry = new BoxGeometry(width, height, depth);
        // 0x0101010,
        const img = PreloadManager.getResult('damier');
        const tex = new Texture(img);
        tex.needsUpdate = true;
        const material = new MeshPhongMaterial({ color: 0x010101, transparent: true, opacity: 1 });
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

        // const geometry = new SphereGeometry(RADIUS, SEGMENTS, RINGS);
        const geometry = new TorusGeometry(6, 1, 16, 100);
        const img = PreloadManager.getResult('texture-asteroid');
        const tex = new Texture(img);
        tex.needsUpdate = true;
        const material = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, map: null });
        const pos = {
            x: 0,
            y: 0,
            z: 0,
        };

        const symbol = new Symbol(geometry, material, pos);

        // add physic body to world
        symbol.body = this.world.add(symbol.physics);


        // create a glowMesh
        symbol.glowMesh = new THREEx.GeometricGlowMesh(symbol.mesh);
        symbol.mesh.add(symbol.glowMesh.object3d);

        // example of customization of the default glowMesh
        // Inside
        symbol.glowMesh.insideMesh.material.uniforms.glowColor.value.set('white')
        symbol.glowMesh.insideMesh.material.uniforms['coeficient'].value = 1;
        symbol.glowMesh.insideMesh.material.uniforms['power'].value = 2;

        // Outside
        symbol.glowMesh.outsideMesh.material.uniforms.glowColor.value.set('white')
        symbol.glowMesh.outsideMesh.material.uniforms['coeficient'].value = 0;
        symbol.glowMesh.outsideMesh.material.uniforms['power'].value = 10;

        this.symbols = [symbol];
        this.symbolsM = [symbol.mesh];

        // add mesh to the scene
        this.scene.add(symbol.mesh);

    }

    setAsteroids() {

        this.asteroids = [];
        this.asteroidsM = [];

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
            // shininess: 3000,
            // color: 0x4682b4,
            transparent: true,
            opacity: 1,
            map: tex,
            // alphaMap: tex,
            // lightmap: tex
            // emissive: new Color('rgb(255, 255, 255)'),
            // specular: new Color('rgb(255, 255, 255)')
        };
        // const material = new MeshLambertMaterial(matPhongParams);
        this.brightness = new BrightnessShader();

        this.brightness2 = new BrightnessShader();

        this.brightness.uniforms.tInput.value = tex;
        this.brightness2.uniforms.tInput.value = tex;


        this.materialAst1 = new ShaderMaterial({
            uniforms: this.brightness.uniforms,
            vertexShader: this.brightness.vertexShader,
            fragmentShader: this.brightness.fragmentShader,
            transparent: true,
            opacity: 0.5
        });

        this.materialAst2 = new ShaderMaterial({
            uniforms: this.brightness2.uniforms,
            vertexShader: this.brightness2.vertexShader,
            fragmentShader: this.brightness2.fragmentShader,
            transparent: true,
            opacity: 0.5
        });

        for (let i = 0; i < this.nbAst; i++) {

            const rot = {
                x: getRandom(-180, 180),
                y: getRandom(-180, 180),
                z: getRandom(-180, 180),
            }

            const pos = {
                x: getRandom(-100, 100),
                y: getRandom(-100, 100),
                z: getRandom(-100, 100),
            };
            // const pos = {
            //     x: 0,
            //     y: 0,
            //     z: 0,
            // };

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

            let finalMat;

            if (i % 2 == 0) {
                finalMat = this.materialAst1;
                // console.log(i);
            } else {
                // console.log(i);
                finalMat = this.materialAst2;
            }




            const asteroid = new Asteroid(geometry, finalMat, pos, rot, force);

            // add physic body to world
            asteroid.body = this.world.add(asteroid.physics);
            asteroid.mesh.index = i;

            // Set rotation impulsion
            asteroid.body.angularVelocity.x = getRandom(-0.3, 0.3);
            asteroid.body.angularVelocity.y = getRandom(-0.3, 0.3);
            asteroid.body.angularVelocity.z = getRandom(-0.3, 0.3);

            this.asteroids.push(asteroid);
            this.asteroidsM.push(asteroid.mesh);

            // add mesh to the scene
            this.scene.add(asteroid.mesh);

        }


    }

    setLight() {


        let paramsLight = [
            // { x: 70, y: 70, z: 0 },
            { x: -100, y: 0, z: 0 },
            { x: 100, y: 0, z: 0 },
            { x: 0, y: 0, z: 100 },
            { x: 0, y: -0, z: 0 }
        ];

        // Check Ambient Light
        // scene.add( new THREE.AmbientLight( 0x00020 ) );

        for (var i = 0; i < paramsLight.length; i++) {

            // create a point light
            let pointLight = new PointLight(0xFFFFFF, 0.8, 600, 2);
            // set its position
            pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
            // pointLight.power = 20;
            pointLight.visible = true;

            // add to the scene
            this.scene.add(pointLight);
        }

        // white spotlight shining from the side, casting a shadow

        // var spotLight = new SpotLight(0xffffff);
        // spotLight.position.set(0, 0, -100);
        // spotLight.angle = toRadian(180);

        // spotLight.castShadow = false;

        // spotLight.shadow.mapSize.width = 1024;
        // spotLight.shadow.mapSize.height = 1024;

        // spotLight.shadow.camera.near = 500;
        // spotLight.shadow.camera.far = 4;
        // spotLight.shadow.camera.fov = 120;

        // this.scene.add(spotLight);

        // var directionalLight = new DirectionalLight(0xffffff, 0.5);
        // this.scene.add(directionalLight);


    }

    setContext() {

        console.log('createText');

        // Text

        let div = document.createElement('div');
        div.classList.add('css-container');
        div.innerHTML = `<div class='project__context'><h1>BMW Paris Motorshow 2016</h1><br><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sagittis erat sit amet enim pulvinar, et cursus diam fermentum. Sed dictum ligula semper sem volutpat ornare. Integer id enim vitae turpis accumsan ultrices at at urna. Fusce sit amet vestibulum turpis, sit amet interdum neque.</p></div>`;

        this.text = new CSS3DObject(div);
        this.text.position.set(40, 0, 0);
        this.text.rotation.set(0, toRadian(90), 0);
        this.text.scale.multiplyScalar(1 / 14);

        this.cssScene.add(this.text);
        this.cssObjects.push(this.text);

        // Title
        div = document.createElement('div');
        div.classList.add('css-container');
        div.innerHTML = `<div class='project__title'>BMW Paris Motorshow 2016 <a class="link" href="http://mondialautomobile.bmw.fr/" target="_blank"><img src="images/icons/link.svg" alt="link"></a></div>`;

        const title = new CSS3DObject(div);
        title.position.set(0, 20, 0);
        title.scale.multiplyScalar(1 / 14);

        this.cssScene.add(title);
        this.cssObjects.push(title);

        // Arrows
        div = document.createElement('div');
        div.classList.add('css-container');
        div.innerHTML = `<div class='project__arrow project__arrow-l'><img src="images/icons/chevron.svg" alt="link"></div>`;

        const arrowL = new CSS3DObject(div);
        arrowL.position.set(-25, 0, 0);
        arrowL.scale.multiplyScalar(1 / 14);

        this.cssScene.add(arrowL);
        this.cssObjects.push(arrowL);

        div = document.createElement('div');
        div.classList.add('css-container');
        div.innerHTML = `<div class='project__arrow project__arrow-r'><img src="images/icons/chevron.svg" alt="link"></div>`;

        const arrowR = new CSS3DObject(div);
        arrowR.position.set(25, 0, 0);
        arrowR.scale.multiplyScalar(1 / 14);

        this.cssScene.add(arrowR);
        this.cssObjects.push(arrowR);


        // Gallery
        this.gallery = new Object3D(); // DESTROY CONTAINER ????
        this.gallery.position.set(-40, 0, 0);
        this.gallery.rotation.set(0, toRadian(-90), 0);
        this.cssScene.add(this.gallery);
        
        // image 1
        div = document.createElement('div');
        div.classList.add('css-container');
        div.innerHTML = `<div class='project__image'><img src="images/bmw-1.jpg" alt="project image" /></div>`;

        const image1 = new CSS3DObject(div);
        // image1.position.set(-40, 0, 0);
        // image1.rotation.set(0, toRadian(-90), 0);
        image1.scale.multiplyScalar(1 / 14);

        this.gallery.add(image1);
        this.cssObjects.push(image1);

        // image 2
        div = document.createElement('div');
        div.classList.add('css-container');
        div.innerHTML = `<div class='project__image'><img src="images/bmw-2.jpg" alt="project image" /></div>`;

        const image2 = new CSS3DObject(div);
        image2.position.set(0, 40, 0);
        image2.rotation.set(toRadian(-45), 0, 0);
        image2.scale.multiplyScalar(1 / 14);

        this.gallery.add(image2);
        this.cssObjects.push(image2);
    }

    setBlur() {

        // COMPOSER
        // IMPORTANT CAREFUL HERE (when changing scene)
        // SceneManager.renderer.autoClear = false;

        var renderTargetParameters = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat, stencilBuffer: false };
        this.renderTarget = new WebGLRenderTarget(this.width, this.height, renderTargetParameters);

        this.effectFXAA = new ShaderPass(FXAAShader);
        this.hblur = new ShaderPass(HorizontalTiltShiftShader);
        this.vblur = new ShaderPass(VerticalTiltShiftShader);


        this.hblur.uniforms['h'].value = this.effectController.blur / this.width;
        this.vblur.uniforms['v'].value = this.effectController.blur / this.height;

        this.hblur.uniforms['r'].value = this.vblur.uniforms['r'].value = this.effectController.horizontalBlur;

        this.effectFXAA.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);

        var renderModel = new RenderPass(this.scene, this.camera);

        this.vblur.renderToScreen = true;
        this.hblur.renderToScreen = true;
        this.effectFXAA.renderToScreen = true;

        this.composer = new EffectComposer(SceneManager.renderer, this.renderTarget);

        this.composer.addPass(renderModel);
        this.composer.addPass(this.effectFXAA);
        this.composer.addPass(this.hblur);
        this.composer.addPass(this.vblur);

    }

    ////////////
    // EVENTS
    ////////////

    showGallery() {
        console.log('show gallery');

        // Turn around the perimeter of a circle

        const trigo = { angle: 1 };
        const tl = new TimelineMax();

        tl.to(trigo, 0.5, { // 3.5
            angle: 2,
            ease: window.Power3.easeInOut,
            onUpdate: () => {
                // Math.PI / 2 start rotation at 90deg
                this.camera.position.x = this.pathRadius * Math.cos(Math.PI / 2 * trigo.angle);
                this.camera.position.z = this.pathRadius * Math.sin(Math.PI / 2 * trigo.angle);
                this.camera.lookAt(this.cameraTarget);

                this.camera.updateProjectionMatrix();
            }
        });

        tl.fromTo('.project__image', 0.5, { // 1.2
            opacity: 0,
            y: 40
        }, {
            opacity: 0.8,
            y: 0,
            ease: window.Power4.easeOut
        });

        tl.to(this.gallery.position, 4, {
        	y: -40,
        	ease: window.Power4.easeOut
        });

        // tl.to(this.gallery.rotation, 4, {
        // 	z: toRadian(-45),
        // 	ease: window.Power4.easeOut
        // },'-=4');
        tl.add(()=> {
        	this.gallery.rotateOnAxis ( new Vector3(1,0,0), toRadian(45) );
        });
        
    }

    slide(dir) {

    }

    showDescription() {
        console.log('show gallery');

        // Turn around the perimeter of a circle

        const trigo = { angle: 1 };
        const tl = new TimelineMax();

        tl.to(trigo, 3.5, {
            angle: 0,
            ease: window.Power3.easeInOut,
            onUpdate: () => {
                // Math.PI / 2 start rotation at 90deg
                this.camera.position.x = this.pathRadius * Math.cos(Math.PI / 2 * trigo.angle);
                this.camera.position.z = this.pathRadius * Math.sin(Math.PI / 2 * trigo.angle);
                this.camera.lookAt(this.cameraTarget);

                this.camera.updateProjectionMatrix();
            }
        });

        tl.fromTo('.project__context', 1.2, {
            opacity: 0,
            y: 40
        }, {
            opacity: 0.8,
            y: 0,
            ease: window.Power4.easeOut
        });

    }
    onClick(e) {

        // update Mouse position for touch devices
        if (Device.touch === true) {
            const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
            const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

            this.mouse.x = (eventX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(eventY / window.innerHeight) * 2 + 1;

            // U/!\ Important / dangerous
            // update raf for trigger intersect on mobile
            this.raf();
        }

        if (this.clickSymbol === true) {
            this.onClickSymbol();
        }

        if (this.clickAsteroid === true) {
            this.currentAstClicked.impulse();
        }

    }

    onClickSymbol() {

        const tl = new TimelineMax();

        // this.reset();

        if (this.toggle !== true) {



            tl.to(this.symbols[0].mesh.scale, 0.7, {
                x: 1.5,
                y: 1.5,
                z: 1.5,
                ease: window.Power4.easeInOut
            });

            this.toggle = true;

        } else {

            tl.to(['.project__context', '.project__image'], 0.8, {
                opacity: 0,
                ease: window.Power4.easeInOut
            });


            tl.to(this.symbols[0].mesh.scale, 0.5, {
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
        this.mouse.x = (eventX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(eventY / window.innerHeight) * 2 + 1;
        // console.log(this.mouse);

        // Update camera

        // this.camera.position.x = round(this.mouse.x * 30 , 100); // decimal 2
        // this.camera.position.y = round(this.mouse.y * 10 , 100);

        // this.cameraTarget.x = round(this.mouse.x * 30 , 100); 
        // this.cameraTarget.y = round(this.mouse.y * 10 , 100);

        // this.camera.lookAt(this.cameraTarget);
        // this.camera.updateProjectionMatrix();

        // Camera move
        // TweenMax.to(this.camera.rotation, 2, {
        //     x: toRadian(round(this.mouse.y * 4, 100)),
        //     y: -toRadian(round(this.mouse.x * 8, 100)),
        //     ease: Expo.easeOut,
        //     onUpdate: () => {
        //         // recall cssRenderer to update the cssRender camera matrix
        //         SceneManager.cssRenderer.render(this.cssScene, this.camera);
        //     }
        // });

        // this.camera.updateProjectionMatrix();

    }

    onMouseWheel(event) {

        event.preventDefault();



        if (event.wheelDeltaY) {

            this.finalFov -= event.wheelDeltaY * 0.05;
        } else if (event.wheelDelta) {

            this.finalFov -= event.wheelDelta * 0.05;
        } else if (event.detail) {

            this.finalFov += event.detail * 1;
        }

        this.finalFov = clamp(this.finalFov, 35, 70);

    }

    resizeHandler() {

        this.width = window.innerWidth * window.devicePixelRatio;
        this.height = window.innerHeight * window.devicePixelRatio;

        SceneManager.resizeHandler({
            camera: this.camera
        });

        // this.composer.setSize(window.innerWidth, window.innerHeight);

        this.hblur.uniforms['h'].value = this.effectController.blur / this.width;
        this.vblur.uniforms['v'].value = this.effectController.blur / this.height;

        this.effectFXAA.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);

    }

    raf() {
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

        //////////////////
        // Raycasters
        //////////////////

        this.ui.body.style.cursor = 'auto';

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.symbolsM);

        if (intersects.length > 0) {
            this.ui.body.style.cursor = 'pointer';
            this.clickSymbol = true;

        } else {

            this.clickSymbol = false;
        }

        const intersectsAst = this.raycaster.intersectObjects(this.asteroidsM);

        if (intersectsAst.length > 0) {
            this.ui.body.style.cursor = 'pointer';
            this.clickAsteroid = true;
            this.currentAstClicked = this.asteroids[intersectsAst[0].object.index];
        } else {
            // this.ui.body.style.cursor = 'auto';
            this.clickAsteroid = false;
        }

        // update world 
        this.world.step();

        // Envelop body
        for (let i = 0; i < this.envelops.length; i++) {
            this.envelops[i].position.copy(this.envelops[i].body.getPosition());
            this.envelops[i].quaternion.copy(this.envelops[i].body.getQuaternion());
        }
        // Symbol body
        for (let i = 0; i < this.symbols.length; i++) {
            this.symbols[i].mesh.position.copy(this.symbols[i].body.getPosition());
            this.symbols[i].mesh.quaternion.copy(this.symbols[i].body.getQuaternion());
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

                // console.log(this.asteroids[i].body.angularVelocity);
                // angular Velocity always inferior to 1 (or too much rotations)

                this.asteroids[i].body.angularVelocity.x = clamp(this.asteroids[i].body.angularVelocity.x, -1, 1);
                this.asteroids[i].body.angularVelocity.y = clamp(this.asteroids[i].body.angularVelocity.y, -1, 1);
                this.asteroids[i].body.angularVelocity.z = clamp(this.asteroids[i].body.angularVelocity.z, -1, 1);
                // if (i === 0) {
                //   console.log(this.asteroids[i].body.angularVelocity.x);
                // }


                this.asteroids[i].mesh.position.copy(this.asteroids[i].body.getPosition());
                this.asteroids[i].mesh.quaternion.copy(this.asteroids[i].body.getQuaternion());


            }


        }

        // Glow continuously 
        this.symbols[0].glowMesh.outsideMesh.material.uniforms['coeficient'].value = (Math.sin(this.glow / 30) + 1) / 5;

        // console.log(this.symbols[0].glowMesh.outsideMesh.material.uniforms['coeficient'].value);
        // Glow arrows
        if (this.ui.arrowL !== undefined && this.ui.arrowL !== null ) {
            this.ui.arrowL.style.opacity = 0.4 + (Math.sin(this.glow / 30) + 1) / 5;
            this.ui.arrowR.style.opacity = 0.4 + (Math.sin(this.glow / 30) + 1) / 5;
            // console.log(5 + (Math.sin(this.glow / 30) + 1) / 5);
        }


        // console.log(this.symbols[0].glowMesh.insideMesh.material.uniforms['power'].value);
        // Glow brightness material
        this.brightness.uniforms['contrast'].value = (Math.sin(this.glow / 40) + 1.2) * 3;
        this.brightness2.uniforms['contrast'].value = (Math.cos(this.glow / 40) + 1.2) * 3;
        // console.log(this.brightness.uniforms['contrast'].value);


        this.glow++;

        // Zoom ??

        const delta = (this.finalFov - this.camera.fov) * 0.25;

        if (Math.abs(delta) > 0.01) {

            this.camera.fov += delta;
            this.camera.updateProjectionMatrix();

            // console.log(this.camera.fov);

            // FOV : 70 : zoom middle
            // FOV : 60 : zoom max
        }

        // Camera Dolly
        // if (_.get(this).moveIn === true) {

        // 	if (_.get(this).dolly.cameraPosition <= 0.239) {

        // 		_.get(this).coefMoveIn = _.get(this).coefMoveIn * 0.96;
        // 		_.get(this).dolly.cameraPosition += _.get(this).coefMoveIn;
        // 		_.get(this).dolly.lookatPosition += _.get(this).coefMoveIn;
        // 		_.get(this).dolly.update();

        // 	} else {

        // 		_.get(this).finalCoord.cam = _.get(this).dolly.cameraPosition;
        // 		_.get(this).finalCoord.look = _.get(this).dolly.lookatPosition;
        // 		_.get(this).moveIn = false;
        // 		_.get(this).canDrag = true;
        // 	}
        // }

        // const deltaCam = (_.get(this).finalCoord.cam - _.get(this).dolly.cameraPosition) * 0.05;
        // const deltaLook = (_.get(this).finalCoord.look - _.get(this).dolly.lookatPosition) * 0.05;

        // if (Math.abs(deltaCam) > 0.0001) _.get(this).dolly.cameraPosition += (_.get(this).finalCoord.cam - _.get(this).dolly.cameraPosition) * 0.05;
        // if (Math.abs(deltaLook) > 0.0001) _.get(this).dolly.lookatPosition += (_.get(this).finalCoord.look - _.get(this).dolly.lookatPosition) * 0.05;

        // if (_.get(this).finalCoord.cam >= 0 && _.get(this).finalCoord.cam <= 1) {
        // 	if (Math.abs(deltaCam) > 0.0001 || Math.abs(deltaLook) > 0.0001) _.get(this).dolly.update();
        // }
        // Render Scenes 
        SceneManager.render({
            camera: this.camera,
            scene: this.scene,
            cssScene: this.cssScene,
            effectController: this.effectController,
            composer: this.composer
        });

        // this.controls.update();

    }

    reset() {

        this.destroy();

        // // Set symbol
        // this.setSymbol();

        // // Set asteroid
        // this.setAsteroids();

        // // Set envelop
        // this.setEnvelop();

        // // Set Context
        // this.setContext();

        // // set Light
        // this.setLight();

        // // Raycaster
        // this.raycaster = new Raycaster();

        // // Mouse
        // this.mouse = { x: 0, y: 0 };
        // this.initPhysics();

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

        // Wait destroy scene before stop js events
        setTimeout(() => {
            this.events(false);
        }, 500);

    }


}
