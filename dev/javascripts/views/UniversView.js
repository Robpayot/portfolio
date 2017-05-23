import { WebGLRenderer, DirectionalLight, ShaderMaterial, OrthographicCamera, MeshDepthMaterial, RGBFormat, NearestFilter, LinearFilter, RGBAFormat, WebGLRenderTarget, NoBlending, SpotLight, ShaderChunk, Raycaster, UniformsUtils, ShaderLib, PerspectiveCamera, Scene, Mesh, Texture, TorusGeometry, PlaneGeometry, SphereGeometry, MeshLambertMaterial, PointLight, Color, MeshBasicMaterial, MeshPhongMaterial, ConeBufferGeometry, Vector3, BoxGeometry, Object3D, CSS, Sprite, SpriteCanvasMaterial } from 'three';
import EffectComposer, { RenderPass, ShaderPass, CopyShader } from 'three-effectcomposer-es6';
import { CSS3DObject } from '../vendors/CSS3DRenderer';
import CSS3DRendererIE from '../vendors/CSS3DRendererIE';
import OrbitControls from '../vendors/OrbitControls';
import { World } from 'oimo';
import { getRandom, toRadian, clamp } from '../helpers/utils';
import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';
import Envelop from '../shapes/Envelop';
import Symbol from '../shapes/Symbol';
import Asteroid from '../shapes/Asteroid';
import PreloadManager from '../managers/PreloadManager';

import { THREEx } from '../vendors/threex/threex.js'; // glow shader
import { DoFShader } from '../vendors/DoFShader.js'; // DOF shader
import { BokehShader } from '../vendors/BokehShader2.js'; // DOF2 shader
import { FXAAShader } from '../vendors/FXAAShader.js'; // FXAA shader
import { HorizontalTiltShiftShader } from '../vendors/HorizontalTiltShiftShader.js'; // HorizontalTiltShiftShader shader
import { VerticalTiltShiftShader } from '../vendors/VerticalTiltShiftShader.js'; // VerticalTiltShiftShader shader





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
        this.onChangeGlow = this.onChangeGlow.bind(this);
        this.updateCamera = this.updateCamera.bind(this);
        this.shaderUpdate = this.shaderUpdate.bind(this);




        this.sound = SoundManager;

        this.start();

        console.log(window.devicePixelRatio);


    }

    start() {

        // set ui
        this.ui = {
            el: document.querySelector('.graphic3D'),
            body: document.getElementsByTagName('body')[0]
        };

        this.cssObjects = [];
        this.glow = 1;
        this.nbAst = 20;

        
        this.width = window.innerWidth * window.devicePixelRatio;
        this.height = window.innerHeight * window.devicePixelRatio;

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
        // Set the canvas size.
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = 0;
        this.cssRenderer.domElement.style.left = 0;
        this.cssRenderer.domElement.style.zIndex = 1;
        this.cssRenderer.domElement.classList.add('container3D');

        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0xffffff, 1);

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = 0;
        this.renderer.domElement.style.left = 0;
        this.renderer.domElement.classList.add('webGl');
        this.cssRenderer.domElement.appendChild(this.renderer.domElement);

        this.ui.el.appendChild(this.cssRenderer.domElement);

        // Camera controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = true;

        ////////////////////
        // POST PROCESSING
        ////////////////////

        // set Depth of Field
        // this.setDOF();
        // set Depth of Field 2
        // this.setDOF2();
        // Set BLUR EFFECT
        this.setBlur();

        /////////////////
        // GUI
        /////////////////

        this.guiParams = {
            gravity: false,
            coeficient: 1,
            power: 2,
            glowColor: 0xffffff,
            coeficientOut: 1,
            powerOut: 2,
            glowColorOut: 0xffffff
        };
        // this.sound.gui.add(this.guiParams, 'gravity').onChange(this.reset);
        // this.sound.gui.add(this.guiParams, 'coeficient', 0.0, 2).listen().onChange(this.onChangeGlow)
        // this.sound.gui.add(this.guiParams, 'power', 0.0, 5).listen().onChange(this.onChangeGlow)
        // this.sound.gui.addColor(this.guiParams, 'glowColor').listen().onChange(this.onChangeGlow)
        // this.sound.gui.add(this.guiParams, 'coeficientOut', 0.0, 2).listen().onChange(this.onChangeGlow)
        // this.sound.gui.add(this.guiParams, 'powerOut', 0.0, 20).listen().onChange(this.onChangeGlow)
        // this.sound.gui.addColor(this.guiParams, 'glowColorOut').listen().onChange(this.onChangeGlow)

        this.renderer.autoClear = false;

        // this.effectController = {

        //     enabled: true,
        //     jsDepthCalculation: false,
        //     shaderFocus: false,

        //     fstop: 0.02,
        //     maxblur: 0.8,

        //     showFocus: false,
        //     focalDepth: 125.0,
        //     manualdof: false,
        //     vignetting: false,
        //     depthblur: false,

        //     threshold: 0.5,
        //     gain: 0.0,
        //     bias: 3.0,
        //     fringe: 0.8,

        //     focalLength: 18,
        //     noise: false,
        //     pentagon: false,

        //     dithering: 0.0001

        // };

        // var matChanger = function() {


        //     for (var e in this.effectController) {
        //         if (e in this.postprocessing.bokeh_uniforms)
        //             this.postprocessing.bokeh_uniforms[e].value = this.effectController[e];
        //     }

        //     this.postprocessing.enabled = this.effectController.enabled;
        //     this.postprocessing.bokeh_uniforms['znear'].value = this.camera.near;
        //     this.postprocessing.bokeh_uniforms['zfar'].value = this.camera.far;
        //     this.camera.setFocalLength(this.effectController.focalLength);

        // }.bind(this);

        // this.sound.gui.add(this.effectController, "enabled").onChange(matChanger);
        // this.sound.gui.add(this.effectController, "jsDepthCalculation").onChange(matChanger);
        // this.sound.gui.add(this.effectController, "shaderFocus").onChange(matChanger);
        // this.sound.gui.add(this.effectController, "focalDepth", 0.0, 500.0, 0.001).listen().onChange(matChanger);

        // this.sound.gui.add(this.effectController, "fstop", -5, 12, 0.001).onChange(matChanger);
        // this.sound.gui.add(this.effectController, "maxblur", 0.0, 10.0, 0.025).onChange(matChanger);

        // this.sound.gui.add(this.effectController, "showFocus").onChange(matChanger);
        // // this.sound.gui.add(this.effectController, "manualdof").onChange(matChanger);
        // // this.sound.gui.add(this.effectController, "vignetting").onChange(matChanger);

        // this.sound.gui.add(this.effectController, "depthblur").onChange(matChanger);

        // this.sound.gui.add(this.effectController, "threshold", 0, 1, 0.001).onChange(matChanger);
        // this.sound.gui.add(this.effectController, "gain", 0, 100, 0.001).onChange(matChanger);
        // this.sound.gui.add(this.effectController, "bias", 0, 3, 0.001).onChange(matChanger);
        // this.sound.gui.add(this.effectController, "fringe", 0, 5, 0.001).onChange(matChanger);

        // this.sound.gui.add(this.effectController, "focalLength", -5, 80, 0.001).onChange(matChanger)

        // // this.sound.gui.add(this.effectController, "noise").onChange(matChanger);

        // // this.sound.gui.add(this.effectController, "dithering", 0, 0.001, 0.0001).onChange(matChanger);

        // // this.sound.gui.add(this.effectController, "pentagon").onChange(matChanger);

        // this.sound.gui.add(this.shaderSettings, "rings", 1, 8).step(1).onChange(this.shaderUpdate);
        // this.sound.gui.add(this.shaderSettings, "samples", 1, 13).step(1).onChange(this.shaderUpdate);

        // matChanger();

        // var gui,
        //     cameraFolder,
        //     cameraFocalLength,
        //     _last;

        // cameraFolder = this.sound.gui.addFolder('Camera');
        // cameraFocalLength = cameraFolder.add(this.camera, 'focalLength', 28, 200).name('Focal Length');
        // cameraFocalLength.onChange(this.updateCamera);
        // cameraFolder.open();

        // const dofFolder = this.sound.gui.addFolder('Depth of Field');
        // dofFolder.add(this.dof.uniforms.focalDepth, 'value', 0, 500).name('Focal Depth');
        // dofFolder.add(this.dof.uniforms.fstop, 'value', 0, 500).name('F Stop');
        // dofFolder.add(this.dof.uniforms.maxblur, 'value', 0, 5).name('max blur');

        // dofFolder.add(this.dof.uniforms.showFocus, 'value').name('Show Focal Range');

        // dofFolder.add(this.dof.uniforms.manualdof, 'value').name('Manual DoF');
        // dofFolder.add(this.dof.uniforms.ndofstart, 'value', 0, 200).name('near start');
        // dofFolder.add(this.dof.uniforms.ndofdist, 'value', 0, 200).name('near falloff');
        // dofFolder.add(this.dof.uniforms.fdofstart, 'value', 0, 200).name('far start');
        // dofFolder.add(this.dof.uniforms.fdofdist, 'value', 0, 200).name('far falloff');

        // dofFolder.add(this.dof.uniforms.CoC, 'value', 0, 0.1).step(0.001).name('circle of confusion');

        // dofFolder.add(this.dof.uniforms.vignetting, 'value').name('Vignetting');
        // dofFolder.add(this.dof.uniforms.vignout, 'value', 0, 2).name('outer border');
        // dofFolder.add(this.dof.uniforms.vignin, 'value', 0, 1).step(0.01).name('inner border');
        // dofFolder.add(this.dof.uniforms.vignfade, 'value', 0, 22).name('fade at');

        // dofFolder.add(this.dof.uniforms.autofocus, 'value').name('Autofocus');
        // dofFolder.add(this.dof.uniforms.focus.value, 'x', 0, 1).name('focus x');
        // dofFolder.add(this.dof.uniforms.focus.value, 'y', 0, 1).name('focus y');

        // dofFolder.add(this.dof.uniforms.threshold, 'value', 0, 1).step(0.01).name('threshold');
        // dofFolder.add(this.dof.uniforms.gain, 'value', 0, 100).name('gain');

        // dofFolder.add(this.dof.uniforms.bias, 'value', 0, 4).step(0.01).name('bias');
        // dofFolder.add(this.dof.uniforms.fringe, 'value', 0, 5).step(0.01).name('fringe');

        // dofFolder.add(this.dof.uniforms.noise, 'value').name('Use Noise');
        // dofFolder.add(this.dof.uniforms.namount, 'value', 0, 0.001).step(0.0001).name('dither');

        // dofFolder.add(this.dof.uniforms.depthblur, 'value').name('Blur Depth');
        // dofFolder.add(this.dof.uniforms.dbsize, 'value', 0, 5).name('blur size');

        // dofFolder.open();

        var matChanger = (e) => {

            this.hblur.uniforms['h'].value = this.effectController.blur / this.width;
            this.vblur.uniforms['v'].value = this.effectController.blur / this.height;

            this.vblur.uniforms['r'].value = this.hblur.uniforms['r'].value = this.effectController.horizontalBlur;

            // this.hblur.uniforms['tDiffuse'].value = this.vblur.uniforms['tDiffuse'].value = this.effectController.diffuse;

        }

        this.effectController = {

            blur: 4.0,
            horizontalBlur: 0.5,
            enabled: true
            // diffuse: 0.0
            // verticalBlurR: 0.5,
            // horizontalBlurR: 0.5

        };

        this.sound.gui.add(this.effectController, "blur", 0.0, 20.0, 0.001).listen().onChange(matChanger);
        this.sound.gui.add(this.effectController, "horizontalBlur", 0.0, 1.0, 0.001).listen().onChange(matChanger);
        this.sound.gui.add(this.effectController, "enabled").onChange(matChanger);
        // this.sound.gui.add(this.effectController, "verticalBlurR", -1.0, 1.0, 0.001).listen().onChange(matChanger);
        // this.sound.gui.add(this.effectController, "horizontalBlurR", -1.0, 1.0, 0.001).listen().onChange(matChanger);

        this.events(true);



    }

    shaderUpdate() {
        this.postprocessing.materialBokeh.defines.RINGS = this.shaderSettings.rings;
        this.postprocessing.materialBokeh.defines.SAMPLES = this.shaderSettings.samples;

        this.postprocessing.materialBokeh.needsUpdate = true;
    }

    onChangeGlow() {
        this.symbols[0].glowMesh.insideMesh.material.uniforms['coeficient'].value = this.guiParams.coeficient;
        this.symbols[0].glowMesh.insideMesh.material.uniforms['power'].value = this.guiParams.power;
        this.symbols[0].glowMesh.insideMesh.material.uniforms.glowColor.value.set(this.guiParams.glowColor);

        this.symbols[0].glowMesh.outsideMesh.material.uniforms['coeficient'].value = this.guiParams.coeficientOut;
        this.symbols[0].glowMesh.outsideMesh.material.uniforms['power'].value = this.guiParams.powerOut;
        this.symbols[0].glowMesh.outsideMesh.material.uniforms.glowColor.value.set(this.guiParams.glowColorOut);
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
        this.aspect = window.innerWidth / window.innerHeight;
        this.near = 1;
        this.far = 3000;

        this.camera = new PerspectiveCamera(
            this.fov,
            this.aspect,
            this.near,
            this.far
        );

        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 200;

        // this.camera.focalLength = 45;
        // this.camera.frameSize = 32;
        // this.camera.setFocalLength(this.camera.focalLength, this.camera.frameSize);
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
        // 0x0101010,
        const img = PreloadManager.getResult('damier');
        console.log(img);
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
            shininess: 3000,
            // color: 0x4682b4,
            transparent: true,
            opacity: 1,
            map: tex,
            // alphaMap: tex,
            // lightmap: tex
            // emissive: new Color('rgb(255, 255, 255)'),
            // specular: new Color('rgb(255, 255, 255)')
        };
        const material = new MeshLambertMaterial(matPhongParams);

        let initZ = 100;

        for (let i = 0; i < this.nbAst; i++) {

            const pos = {
                x: getRandom(-100, 100),
                y: getRandom(-100, 100),
                z: getRandom(-100, 100),
            };

            // let pos;

            // if (i === 0) {
            //     pos = {
            //         x: 0,
            //         y: 0,
            //         z: 0,
            //     };

            // } else {
            //     pos = {
            //         x: Math.cos(i) * 100,
            //         y: 0,
            //         z: Math.sin(i) * 100,
            //     };

            // }


            initZ -= 40;

            // Intra perimeter radius
            const ipRadius = 50;

            // if (pos.x < ipRadius && pos.x > -ipRadius && pos.y < ipRadius && pos.y > -ipRadius && pos.z < ipRadius && pos.z > -ipRadius) {
            //     console.log(i, ' dans le périmetre !');
            //     pos.x += ipRadius;
            //     pos.y += ipRadius;
            //     pos.z += ipRadius;

            // }

            //  force impulsion
            const force = {
                x: getRandom(-10, 10),
                y: getRandom(-10, 10),
                z: getRandom(-10, 10)
            };

            const asteroid = new Asteroid(geometry, material, pos, force);

            // add physic body to world
            asteroid.body = this.world.add(asteroid.physics);
            asteroid.mesh.index = i;

            this.asteroids.push(asteroid);
            this.asteroidsM.push(asteroid.mesh);

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

        // Check Ambient Light
        // scene.add( new THREE.AmbientLight( 0x00020 ) );

        for (var i = 0; i < paramsLight.length; i++) {

            // create a point light
            let pointLight = new PointLight(0xFFFFFF, 1.5, 600, 2);
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

    setDOF() {

        // depth RGBA
        ShaderLib.depthRGBA = {
            uniforms: {},

            vertexShader: [

                ShaderChunk["morphtarget_pars_vertex"],
                ShaderChunk["skinning_pars_vertex"],

                "void main() {",

                ShaderChunk["skinbase_vertex"],
                ShaderChunk["morphtarget_vertex"],
                ShaderChunk["skinning_vertex"],
                ShaderChunk["default_vertex"],

                "}"

            ].join("\n"),

            fragmentShader: [

                "vec4 pack_depth( const in float depth ) {",

                "const vec4 bit_shift = vec4( 256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0 );",
                "const vec4 bit_mask  = vec4( 0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0 );",
                "vec4 res = fract( depth * bit_shift );",
                "res -= res.xxyz * bit_mask;",
                "return res;",

                "}",

                "void main() {",

                "gl_FragData[ 0 ] = pack_depth( gl_FragCoord.z );",

                //"gl_FragData[ 0 ] = pack_depth( gl_FragCoord.z / gl_FragCoord.w );",
                //"float z = ( ( gl_FragCoord.z / gl_FragCoord.w ) - 3.0 ) / ( 4000.0 - 3.0 );",
                //"gl_FragData[ 0 ] = pack_depth( z );",
                //"gl_FragData[ 0 ] = vec4( z, z, z, 1.0 );",

                "}"

            ].join("\n")
        };

        // Set depth RGBA
        const depthShader = ShaderLib['depthRGBA'];
        // Set uniforms
        const depthUniforms = UniformsUtils.clone(depthShader.uniforms);
        this.depthMaterial = new ShaderMaterial({ fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms });
        this.depthMaterial.blending = NoBlending;

        this.depthTarget = new WebGLRenderTarget(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, { minFilter: NearestFilter, magFilter: NearestFilter, format: RGBAFormat });

        // postprocessing
        // console.log(EffectComposer);
        this.composer = new EffectComposer(this.renderer);
        // console.log(this.composer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        // depth of field
        this.dof = new ShaderPass(DoFShader);
        this.dof.uniforms['tDepth'].value = this.depthTarget;
        this.dof.uniforms['size'].value.set(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
        this.dof.uniforms['textel'].value.set(1.0 / window.innerWidth * window.devicePixelRatio, 1.0 / window.innerHeight) * window.devicePixelRatio;

        //make sure that these two values are the same for your camera, otherwise distances will be wrong.
        this.dof.uniforms['znear'].value = this.camera.near; //this.camera clipping start
        this.dof.uniforms['zfar'].value = this.camera.far; //this.camera clipping end

        this.dof.uniforms['focalDepth'].value = 200; //focal distance value in meters, but you may use autofocus option below
        this.dof.uniforms['focalLength'].value = this.camera.focalLength; //focal length in mm
        this.dof.uniforms['fstop'].value = 1.8; //f-stop value
        this.dof.uniforms['showFocus'].value = false; //show debug focus point and focal range (orange = focal point, blue = focal range)

        this.dof.uniforms['manualdof'].value = false; //manual dof calculation
        this.dof.uniforms['ndofstart'].value = 1.0; //near dof blur start
        this.dof.uniforms['ndofdist'].value = 2.0; //near dof blur falloff distance 
        this.dof.uniforms['fdofstart'].value = 2.0; //far dof blur start
        this.dof.uniforms['fdofdist'].value = 3.0; //far dof blur falloff distance  

        this.dof.uniforms['CoC'].value = 0.03; //circle of confusion size in mm (35mm film = 0.03mm)    

        this.dof.uniforms['vignetting'].value = true; //use optical lens vignetting?
        this.dof.uniforms['vignout'].value = 1.3; //vignetting outer border
        this.dof.uniforms['vignin'].value = 0.1; //vignetting inner border
        this.dof.uniforms['vignfade'].value = 22.0; //f-stops till vignete fades    

        this.dof.uniforms['autofocus'].value = false; //use autofocus in shader? disable if you use external focalDepth value
        this.dof.uniforms['focus'].value.set(0.5, 0.5); // autofocus point on screen (0.0,0.0 - left lower corner, 1.0,1.0 - upper right) 
        this.dof.uniforms['maxblur'].value = 4.3; //clamp value of max blur (0.0 = no blur,1.0 default) 

        this.dof.uniforms['threshold'].value = 0.5; //highlight threshold;
        this.dof.uniforms['gain'].value = 2.0; //highlight gain;

        this.dof.uniforms['bias'].value = 0.5; //bokeh edge bias        
        this.dof.uniforms['fringe'].value = 3.7; //bokeh chromatic aberration/fringing

        this.dof.uniforms['noise'].value = true; //use noise instead of pattern for sample dithering
        this.dof.uniforms['namount'].value = 0.0001; //dither amount

        this.dof.uniforms['depthblur'].value = false; //blur the depth buffer?
        this.dof.uniforms['dbsize'].value = 1.25; //depthblursize

        this.composer.addPass(this.dof);
        this.dof.renderToScreen = true;

    }

    setDOF2() {
        console.log('dof2');
        let height = window.innerHeight;

        this.shaderSettings = {
            rings: 2,
            samples: 1
        };

        this.renderer.sortObjects = false;

        this.material_depth = new MeshDepthMaterial();

        // initPostProcessing
        this.postprocessing = { enabled: true };
        this.postprocessing.scene = new Scene();

        this.postprocessing.camera = new OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);
        this.postprocessing.camera.position.z = 100;

        this.postprocessing.scene.add(this.postprocessing.camera);

        var pars = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat };
        this.postprocessing.rtTextureDepth = new WebGLRenderTarget(window.innerWidth, height, pars);
        this.postprocessing.rtTextureColor = new WebGLRenderTarget(window.innerWidth, height, pars);



        var bokeh_shader = BokehShader;

        this.postprocessing.bokeh_uniforms = UniformsUtils.clone(bokeh_shader.uniforms);

        this.postprocessing.bokeh_uniforms["tColor"].value = this.postprocessing.rtTextureColor;
        this.postprocessing.bokeh_uniforms["tDepth"].value = this.postprocessing.rtTextureDepth;

        this.postprocessing.bokeh_uniforms["textureWidth"].value = window.innerWidth;

        this.postprocessing.bokeh_uniforms["textureHeight"].value = height;

        this.postprocessing.materialBokeh = new ShaderMaterial({

            uniforms: this.postprocessing.bokeh_uniforms,
            vertexShader: bokeh_shader.vertexShader,
            fragmentShader: bokeh_shader.fragmentShader,
            defines: {
                RINGS: this.shaderSettings.rings,
                SAMPLES: this.shaderSettings.samples
            }

        });

        this.postprocessing.quad = new Mesh(new PlaneGeometry(window.innerWidth, window.innerHeight), this.postprocessing.materialBokeh);
        this.postprocessing.quad.position.z = -500;
        this.postprocessing.scene.add(this.postprocessing.quad);

        console.log(this.postprocessing);
    }

    setBlur() {

        // COMPOSER

        this.renderer.autoClear = false;

        var renderTargetParameters = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat, stencilBuffer: false };
        this.renderTarget = new WebGLRenderTarget(this.width, this.height, renderTargetParameters);

        this.effectFXAA = new ShaderPass(FXAAShader);

        this.hblur = new ShaderPass(HorizontalTiltShiftShader);
        this.vblur = new ShaderPass(VerticalTiltShiftShader);

        var bluriness = 8;

        this.hblur.uniforms['h'].value = bluriness / this.width;
        this.vblur.uniforms['v'].value = bluriness / this.height;

        this.hblur.uniforms['r'].value = this.vblur.uniforms['r'].value = 0.5;

        this.effectFXAA.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);

        this.composer = new EffectComposer(this.renderer, this.renderTarget);

        var renderModel = new RenderPass(this.scene, this.camera);

        this.vblur.renderToScreen = true;
        this.hblur.renderToScreen = true;
        // this.effectFXAA.renderToScreen = true;

        this.composer = new EffectComposer(this.renderer, this.renderTarget);

        this.composer.addPass(renderModel);

        this.composer.addPass(this.effectFXAA);

        this.composer.addPass(this.hblur);
        this.composer.addPass(this.vblur);
    }

    onClick(e) {

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
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
        this.glow++;
        // console.log(this.symbols[0].glowMesh.insideMesh.material.uniforms['power'].value);


        // Render cssScene
        this.cssRenderer.render(this.cssScene, this.camera);
        // Render scene
        // this.scene.overrideMaterial = this.depthMaterial;
        // this.renderer.render(this.scene, this.camera); //  this.depthTarget
        // this.scene.overrideMaterial = null;

        // this.composer.render();
        // if (this.postprocessing.enabled === true) {

        //     this.renderer.clear();

        //     // Render scene into texture

        //     this.scene.overrideMaterial = null;
        //     this.renderer.render(this.scene, this.camera, this.postprocessing.rtTextureColor, true);

        //     // Render depth into texture

        //     this.scene.overrideMaterial = this.material_depth;
        //     this.renderer.render(this.scene, this.camera, this.postprocessing.rtTextureDepth, true);

        //     // Render bokeh composite

        //     this.renderer.render(this.postprocessing.scene, this.postprocessing.camera);


        // } else {

        // this.scene.overrideMaterial = null;

        // this.renderer.clear();
        // this.renderer.render(this.scene, this.camera);

        if (this.effectController.enabled === true) {
            this.composer.render(this.scene, this.camera);
        } else {
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);

        }



        // }

        this.controls.update();

    }

    updateCamera() {
        console.log();
        this.camera.setFocalLength(this.camera.focalLength, this.camera.frameSize);
        this.camera.updateProjectionMatrix();
        this.dof.uniforms['focalLength'].value = this.camera.focalLength;
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
