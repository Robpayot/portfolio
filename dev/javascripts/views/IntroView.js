import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import {toRadian, getRandom, clamp, round } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import Asteroid from '../shapes/Asteroid';
// import SplitText from '../vendors/SplitText.js';
import { Device } from '../helpers/Device';
import Ui from '../components/Ui';
import { loadJSON } from '../helpers/utils-three';
import Glitch from '../components/Glitch';
import Handlebars from 'handlebars';
import DATA from '../../datas/data.json';
import PreloadManager from '../managers/PreloadManager';


import { Vector2, Raycaster, Vector3, Scene, BackSide, LoadingManager, BoxGeometry, CubeTexture, DirectionalLight, PointLight, Texture, PlaneGeometry, Mesh, MeshBasicMaterial, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color, MeshPhongMaterial, RGBFormat, LinearFilter } from 'three';
import OrbitControls from '../vendors/OrbitControls';
import SimplexNoise from '../vendors/SimplexNoise';
import '../shaders/ScreenSpaceShader';
import '../shaders/FFTOceanShader';
import '../shaders/OceanShader';
import '../vendors/MirrorRenderer';
import Ocean from '../vendors/Ocean';
console.log(Ocean);
import GPUComputationRenderer from '../vendors/GPUComputationRenderer';
import HeightmapFragmentShader from '../shaders/HeightmapFragmentShader';
// import SmoothFragmentShader from '../shaders/SmoothFragmentShader';
import WaterVertexShader from '../shaders/WaterVertexShader';


import dat from 'dat-gui';

export default class IntroView extends AbstractView {

	constructor(obj) {

		super();

		// properties


		this.el = this.ui.webGl;
		this.gravity = obj.gravity;
		this.UI = Ui.ui; // Global UI selector
		this.name = 'intro';
		this.isControls = true;

		// bind

		this.init = this.init.bind(this);
		this.raf = this.raf.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.valuesChanger = this.valuesChanger.bind(this);
		this.initWater = this.initWater.bind(this);
		this.fillTexture = this.fillTexture.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onDocumentTouchStart = this.onDocumentTouchStart.bind(this);
		this.onDocumentTouchMove = this.onDocumentTouchMove.bind(this);
		this.smoothWater = this.smoothWater.bind(this);
		this.setMouseCoords = this.setMouseCoords.bind(this);
		this.setLight = this.setLight.bind(this);
		this.resetWater = this.resetWater.bind(this);
		this.onW = this.onW.bind(this);
		this.moveCameraIn = this.moveCameraIn.bind(this);
		this.transitionIn = this.transitionIn.bind(this);
		this.transitionOut = this.transitionOut.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onHoverStart = this.onHoverStart.bind(this);
		this.onLeaveStart = this.onLeaveStart.bind(this);

		// preload Models
		Promise.all([
			loadJSON('datas/models/iceberg-1.json'),
			loadJSON('datas/models/iceberg-2.json'),
			loadJSON('datas/models/iceberg-3.json')
		]).then((results) => {
			// when all is loaded
			this.models = results;
			this.init();

			this.events(true);
			// this.ui.overlay.classList.add('black');

			this.transitionIn(!obj.fromUrl);

		}, (err) => {
			console.log(err);
			// error here
		});

		// init

		// this.onClickStart();

	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.raf);

		if (Device.touch === false) {
			// move camera
			document[evListener]( 'mousemove', this.onMouseMove, false );
		} else {
			document[evListener]( 'touchstart', this.onDocumentTouchStart, false );
			document[evListener]( 'touchmove', this.onDocumentTouchMove, false );
		}

		document[evListener]( 'keydown', this.onW , false );
		document[evListener]( 'click', this.onClick , false );

		this.ui.button[evListener]('mouseenter', this.onHoverStart);
		this.ui.button[evListener]('mouseleave', this.onLeaveStart);

	}

	init() {

		this.setUiContainer();
		// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		this.scene = new Scene();
		this.scene.background = new Color(0x000000);

		// SceneManager.renderer.setPixelRatio( clamp(window.devicePixelRatio, 1, 1.5)); // passer à 1.5 si rétina
		// console.log(clamp(window.devicePixelRatio, 1, 1.5));

		// set Camera
		this.setCamera();
		this.setCameraPos();

		// set Light
		this.setLight();

		// Set physics
		if (this.gravity === true) this.initPhysics();

		this.nbAst = 0;
		this.minZoom = 400;
		this.maxZoom = 700;
		this.asteroids = [];
		this.asteroidsM = [];
		this.asteroidsMove = false;
		this.maxDash = 635;

		this.mouseMoved = false;
		this.mouseCoords = new Vector2();
		this.raycaster = new Raycaster();

		this.simplex = new SimplexNoise();

		// Mouse
		this.mouse = { x: 0, y: 0 };
		this.camRotTarget = new Vector3(0, 0, 0);
		this.camRotSmooth = new Vector3(0, 0, 0);

		this.cameraMove = true;

		// Camera controls
		if (this.isControls === true) {
			this.controls = new OrbitControls(this.camera, SceneManager.renderer.domElement);
			this.controls.enableZoom = true;
		}

		this.mouseSize = 40.0;
		this.mouseSizeClick = 30.0;
		this.viscosity = 0.015;
		this.viscosityClick = 0.015;

		this.effectController = {
			mouseSize: this.mouseSize,
			viscosity: this.viscosity
		};

		this.initWater(false, false);

		this.setAsteroids();
		this.setGround();

		// reset Water bits to 64
		// setInterval(() => {
		// 	this.resetWater();
		// }, 10000);

		let gui = new dat.GUI();
		gui.add( this.effectController, 'mouseSize', 1.0, 100.0, 1.0 ).onChange( this.valuesChanger );
		gui.add( this.effectController, 'viscosity', 0.0, 0.1, 0.001 ).onChange( this.valuesChanger );
		this.valuesChanger();
		let buttonSmooth = {
			smoothWater: () => {
				this.smoothWater();
			}
		};
		gui.add( buttonSmooth, 'smoothWater' );
		gui.close();

		global.CURSOR.el.classList.add('alt');

	}

	setUiContainer() {

		const data = DATA;
		// console.log(data, PreloadManager.getResult('tpl-about-content'));

		// Context + gallery arrows
		let template = Handlebars.compile(PreloadManager.getResult('tpl-intro-content'));
		let html  = template(data);

		this.UI.content.className = '';
		this.UI.content.classList.add('ui-content', 'is-intro');
		this.UI.content.innerHTML = html;

		this.ui.button = document.querySelector('.start');
		this.ui.overlay = document.querySelector('.intro__overlay');

	}

	////////////////////
	// SET SCENE
	////////////////////

	setCameraPos() {

		console.log('setCamera');

		// this.camera.position.set(0, 30, 0);
		// this.camera.rotation.x = toRadian(-90);
		// debug add this.controls
		this.camera.position.set(0, 70, 0);
		this.camera.rotation.x = toRadian(-90);


	}

	setLight() {
		// let sun = new DirectionalLight( 0xFFFFFF, 1 );
		// sun.position.set( 300, 400, -500 );
		// this.scene.add( sun );

		// let sun2 = new DirectionalLight( 0xB6C5DB, 0.5 );
		// sun2.position.set( 300, 400, 500 );
		// this.scene.add( sun2 );

		let light = new PointLight( 0xFFFFFF, 1, 1000 );
		light.position.set( 0, 50, 0 );
		this.scene.add( light );

		// let hemisphere = new HemisphereLight( 0x00FFFF, 0xFF0000, 1 );
		// this.scene.add( hemisphere );

		// FOG
		// this.scene.fog = new Fog( 0xFFFFFF, 1, 200 ); --> dosent affect water

	}

	initWater() {


		this.lastTime =  (new Date()).getTime();

		SceneManager.renderer.setPixelRatio( window.devicePixelRatio );
		SceneManager.renderer.context.getExtension('OES_texture_float');
		SceneManager.renderer.context.getExtension('OES_texture_float_linear');

		// good size
		const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		this.heightCamera = 2 * Math.tan( vFOV / 2 ) * (this.maxZoom + 200); // dist between 0 and camerapos.y

		this.aspect = window.innerWidth / window.innerHeight;

		if (this.aspect > 1) {
			// landscape
			this.finalBounds = this.heightCamera * this.aspect;
		} else {
			this.finalBounds = this.heightCamera;
		}

		let gsize = 512;
		let res = 512;
		let gres = gsize / 2;
		// let origx = -gsize / 2;
		// let origz = -gsize / 2;
		this.ms_Ocean = new Ocean( SceneManager.renderer, this.camera, this.scene, {
			INITIAL_SIZE : 200.0,
			INITIAL_WIND : [ 10.0, 10.0 ],
			INITIAL_CHOPPINESS : 3.6,
			CLEAR_COLOR : [ 1.0, 1.0, 1.0, 0.0 ],
			SUN_DIRECTION : [-1.0, 1.0, 1.0],
			OCEAN_COLOR: new Vector3( 2, 2, 2 ),
			SKY_COLOR: new Vector3( 1, 1, 1 ),
			EXPOSURE : 2,
			GEOMETRY_RESOLUTION: gres,
			GEOMETRY_SIZE : gsize,
			RESOLUTION : res
		} );

		this.loadSkybox();

		this.ms_Ocean.materialOcean.uniforms.u_projectionMatrix = { value: this.camera.projectionMatrix };
		this.ms_Ocean.materialOcean.uniforms.u_viewMatrix = { value: this.camera.matrixWorldInverse };
		this.ms_Ocean.materialOcean.uniforms.u_cameraPosition = { value: this.camera.position };
		this.scene.add(this.ms_Ocean.oceanMesh);



		let gui = new dat.GUI();
		let c1 = gui.add(this.ms_Ocean, 'size',100, 5000);
		c1.onChange(function(v) {
			this.object.size = v;
			this.object.changed = true;
		});
		let c2 = gui.add(this.ms_Ocean, 'choppiness', 0.1, 4);
		c2.onChange(function(v) {
			this.object.choppiness = v;
			this.object.changed = true;
		});
		let c3 = gui.add(this.ms_Ocean, 'windX',-15, 15);
		c3.onChange(function(v) {
			this.object.windX = v;
			this.object.changed = true;
		});
		let c4 = gui.add(this.ms_Ocean, 'windY', -15, 15);
		c4.onChange(function(v) {
			this.object.windY = v;
			this.object.changed = true;
		});
		// let c5 = gui.add(this.ms_Ocean, 'sunDirection', -1.0, 1.0);
		// c5.onChange(function(v) {
		// 	this.object.sunDirection = v;
		// 	this.object.changed = true;
		// });
		// let c6 = gui.add(this.ms_Ocean, 'sunDirectionY', -1.0, 1.0);
		// c6.onChange(function(v) {
		// 	this.object.sunDirectionY = v;
		// 	this.object.changed = true;
		// });
		// let c7 = gui.add(this.ms_Ocean, 'sunDirectionZ', -1.0, 1.0);
		// c7.onChange(function(v) {
		// 	this.object.sunDirectionZ = v;
		// 	this.object.changed = true;
		// });
		let c8 = gui.add(this.ms_Ocean, 'exposure', 0.0, 6);
		c8.onChange(function(v) {
			this.object.exposure = v;
			this.object.changed = true;
		});
	}

	loadSkybox() {
		var cubeShader = ShaderLib['cube'];

		var skyBoxMaterial = new ShaderMaterial( {
			fragmentShader: cubeShader.fragmentShader,
			vertexShader: cubeShader.vertexShader,
			uniforms: cubeShader.uniforms,
			side: BackSide
		} );

		// skyBoxMaterial = new MeshBasicMaterial( { color: "0xffffff", side: BackSide } )

		this.ms_SkyBox = new Mesh(
			new BoxGeometry( 450000, 450000, 450000 ),
			skyBoxMaterial
		);

		this.scene.add( this.ms_SkyBox );

		var textureName = '';
		var textureExt = ".jpg";
		var directionalLightPosition = null;
		var directionalLightColor = null;
		var raining = false;
		textureName = 'interstellar';

		var sources = [
			`${global.BASE}/images/textures/intro_west.jpg`,
			`${global.BASE}/images/textures/intro_east.jpg`,
			`${global.BASE}/images/textures/intro_up.jpg`,
			`${global.BASE}/images/textures/intro_down.jpg`,
			`${global.BASE}/images/textures/intro_south.jpg`,
			`${global.BASE}/images/textures/intro_north.jpg`
		];
		var images = [];

		var cubeMap = new CubeTexture( images );
		cubeMap.flipY = false;

		var imageLoader = new LoadingManager();
		console.log(imageLoader);
		var loaded = 0;

		for ( var i = 0, il = sources.length; i < il; ++ i ) {

			cubeMap.images[ i ] = sources[i];
			loaded++;
			if ( loaded === 6 ) {
			  cubeMap.needsUpdate = true;
			}
		}
		
		cubeMap.format = RGBFormat;
		cubeMap.generateMipmaps = false;
		cubeMap.magFilter = LinearFilter;
		cubeMap.minFilter = LinearFilter;

		this.ms_SkyBox.material.uniforms['tCube'].value = cubeMap;
	}

	generateGradient() {

		// Use a classic image for better pef

		const size = 512;

		// create canvas
		let canvas = document.createElement( 'canvas' );
		canvas.width = size;
		canvas.height = size;

		// get context
		const context = canvas.getContext( '2d' );

		// draw gradient
		context.rect( 0, 0, size, size );
		const gradient = context.createRadialGradient(size / 2,size / 2,size,size / 2,size / 2,100);
		gradient.addColorStop(1, '#e9ebee'); // white-grey
		gradient.addColorStop(0.98, '#e9ebee');
		gradient.addColorStop(0.9, '#000000');
		gradient.addColorStop(0, '#000000'); // dark
		context.fillStyle = gradient;
		context.fill();


		const image = new Image();
		image.id = 'pic';
		image.src = canvas.toDataURL();
		document.documentElement.appendChild(image);

		return image;

	}

	setGround() {

		// Generate gradient
		this.generateGradient();
		const img = document.querySelector('#pic');
		const texture = new Texture( img );
		texture.needsUpdate = true;



		const geometry = new PlaneGeometry(3000,4000);
		const mat = new MeshPhongMaterial({color: 0xFFFFFF});

		const ground = new Mesh(geometry, mat);

		ground.rotation.x = toRadian(-90);
		ground.position.y = -15;

		// this.scene.add(ground);

		const geometry2 = new PlaneGeometry(3000,3000);

		// material
		const mat2 = new MeshBasicMaterial( { map: texture, transparent: true } );
		// const mat2 = new MeshBasicMaterial({color: 0x00FFFF});
		const blackGround = new Mesh(geometry2, mat2);
		blackGround.rotation.z = toRadian(90);
		blackGround.position.y = -500;
		blackGround.position.z = -2000;

		// this.scene.add(blackGround);
	}

	setAsteroids() {
		// ADD Iceberg
		this.astXMin = -380;
		this.astXMax = 380;
		this.ipRadius = 50; // intra perimeter Radius
		this.startZ = -600;
		this.reappearZ = -300;
		this.endZ = 200;

		for (let i = 0; i < this.nbAst; i++) {

			const model = Math.round(getRandom(0, 2));

			let finalMat = new MeshPhongMaterial( {
				color: 0xffffff,
				flatShading: true
			} );
			// console.log(finalMat);

			// finalMat.shininess = 1;

			const rot = {
				x: 0,
				y: getRandom(-180, 180),
				z: 90,
			};


			let pos = {
				x: getRandom(this.astXMin, this.astXMax),
				y: 0,
				z: getRandom(this.startZ, this.endZ),
			};

			// check if ast already in other ast position
			for (let y = 0; y < this.asteroidsM.length; y++) {
				if (pos.x < this.ipRadius + this.asteroidsM[y].position.x && pos.x > -this.ipRadius + this.asteroidsM[y].position.x && pos.z < this.ipRadius + this.asteroidsM[y].position.z && pos.z > -this.ipRadius + this.asteroidsM[y].position.z) {
					// console.log(i, ' dans le périmetre !');
					pos.x += this.ipRadius;
					pos.z += this.ipRadius;

				}
			}


			//  force impulsion
			const force = {
				x: 0,
				y: 0,
				z: getRandom(30, 50)
			};

			const scale = getRandom(0.045, 0.075);
			// const speed = getRandom(500, 600); // more is slower
			const range = getRandom(2, 5);
			const timeRotate = getRandom(14000, 16000);
			const offsetScale = 1.6;

			const asteroid = new Asteroid({
				type: 'sphere',
				width: this.models[model].size.x,
				height: this.models[model].size.y,
				depth: this.models[model].size.z,
				geometry: this.models[model],
				material: finalMat,
				pos,
				rot,
				force,
				scale,
				offsetScale,
				range,
				// speed,
				timeRotate
			});

			asteroid.mesh.index = i;
			asteroid.pos = pos;

			if (this.gravity === true) {
				// add physic body to world
				asteroid.body = this.world.add(asteroid.physics);
				// Set rotation impulsion
				asteroid.body.angularVelocity.x = getRandom(-0.2, 0.2);
				asteroid.body.angularVelocity.y = getRandom(-0.5, 0.5);
				asteroid.body.angularVelocity.z = getRandom(-0.2, 0.2);
			}

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);


		}
	}

	fillTexture( texture ) {

		let waterMaxHeight = 10;

		let noise = ( x, y, z ) => {
			let multR = waterMaxHeight;
			let mult = 0.025;
			let r = 0;
			for ( let i = 0; i < 15; i++ ) {
				r += multR * this.simplex.noise( x * mult, y * mult );
				multR *= 0.53 + 0.025 * i;
				mult *= 1.25;
			}
			return r;
		};

		let pixels = texture.image.data;

		let p = 0;
		for ( let j = 0; j < this.WIDTH; j++ ) {
			for ( let i = 0; i < this.WIDTH; i++ ) {

				let x = i * 128 / this.WIDTH;
				let y = j * 128 / this.WIDTH;

				pixels[ p + 0 ] = noise( x, y, 123.4 );
				pixels[ p + 1 ] = 0;
				pixels[ p + 2 ] = 0;
				pixels[ p + 3 ] = 1;

				p += 4;
			}
		}

	}

	valuesChanger() {

		// this.heightmapVariable.material.uniforms.mouseSize.value = this.effectController.mouseSize;
		// this.heightmapVariable.material.uniforms.viscosityConstant.value = this.effectController.viscosity;

	}

	smoothWater() {

		let currentRenderTarget = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable );
		let alternateRenderTarget = this.gpuCompute.getAlternateRenderTarget( this.heightmapVariable );

		// for ( let i = 0; i < 10; i++ ) {

			this.smoothShader.uniforms.texture.value = currentRenderTarget.texture;
			// this.smoothShader.uniforms.texture.value = this.heightmapVariable.initialValueTexture;
			this.gpuCompute.doRenderTarget( this.smoothShader, alternateRenderTarget );

			this.smoothShader.uniforms.texture.value = alternateRenderTarget.texture;
			// this.smoothShader.uniforms.texture.value = this.heightmapVariable.initialValueTexture;
			this.gpuCompute.doRenderTarget( this.smoothShader, currentRenderTarget );

		// }
	}

	resetWater() {

		let obj = this.scene.getObjectByName('water');
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
		this.scene.remove( obj );

		this.initWater();
	}

	setMouseCoords( x, y ) {

		this.mouseCoords.set( ( x / SceneManager.renderer.domElement.clientWidth ) * 2 - 1, - ( y / SceneManager.renderer.domElement.clientHeight ) * 2 + 1 );
		this.mouseMoved = true;

	}

	onMouseMove( e ) {

		this.setMouseCoords( e.clientX, e.clientY );

		const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		this.mouse.x = eventX / window.innerWidth * 2 - 1;
		this.mouse.y = -(eventY / window.innerHeight) * 2 + 1;

	}

	onDocumentTouchStart( event ) {

		if ( event.touches.length === 1 ) {

			event.preventDefault();

			this.setMouseCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );


		}

	}

	onDocumentTouchMove( event ) {

		if ( event.touches.length === 1 ) {

			event.preventDefault();

			this.setMouseCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );


		}

	}

	onW(event) {

		// W Pressed: Toggle wireframe
		if ( event.keyCode === 87 ) {

			this.waterMesh.material.wireframe = !this.waterMesh.material.wireframe;
			this.waterMesh.material.needsUpdate = true;

		}
	}

	onHoverStart() {

		this.startIsHover = true;
		global.CURSOR.interractHover();
		if (this.animBtn === true) return false;

		const tl = new TimelineMax();
		TweenMax.killTweensOf(['.start .close-up','.start .close-down','.start .open-up','.start .open-down']);
		TweenMax.to('.start circle', 0, {opacity: 0});

		tl.to('.start .close-up', 1, {strokeDashoffset: -this.maxDash * 2, ease: window.Expo.easeOut}, 0);
		tl.to('.start .close-down', 1.2, {strokeDashoffset: this.maxDash * 3 + 205, ease: window.Expo.easeOut}, 0);
		tl.set(['.start .close-up','.start .close-down','.start .open-up','.start .open-down'], {clearProps: 'all'});
		tl.add(()=> {
			this.animBtn = false;
		});

		tl.fromTo('.start p', 1, {y: 20}, {y:0, ease: window.Expo.easeOut}, 0);
		tl.fromTo('.start p', 0.2, {opacity: 0}, {opacity:1, ease: window.Linear.easeNone}, 0);
	}

	onLeaveStart() {
		global.CURSOR.interractLeave();
		this.startIsHover = false;
		TweenMax.fromTo('.start circle', 0.2, {opacity: 0}, {opacity: 1});
		TweenMax.fromTo('.start circle', 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});

		TweenMax.to('.start p', 1, {y: 20, ease: window.Expo.easeOut});
		TweenMax.to('.start p', 0.2, {opacity: 0, ease: window.Linear.easeNone});
	}

	onClick() {
		if (this.clickAsteroid === true) {

			global.CURSOR.interractLeave();

			this.currentAstClicked = this.currentAstHover;
			this.currentAstClicked.animated = true;
			this.onAsteroidAnim = true;
			const dest = this.currentAstClicked.height * this.currentAstClicked.scale;

			// this.heightmapVariable.material.uniforms.mouseSize = { value: this.mouseSizeClick }; // change mouse size
			// this.heightmapVariable.material.uniforms.viscosity = { value: this.viscosityClick };

			const tl = new TimelineMax();

			tl.to([this.currentAstClicked.mesh.position, this.currentAstClicked.body.position], 3, {y: -dest, ease: window.Expo.easeOut});

			tl.add(()=> {
				// this.heightmapVariable.material.uniforms.mouseSize = { value: this.effectController.mouseSize };
				// this.heightmapVariable.material.uniforms.viscosity = { value: this.effectController.viscosity };
				this.onAsteroidAnim = false;
			}, 0.5);

			// this.heightmapVariable.material.uniforms.mouseSize = { value: 50.0 };
			// this.clickAnim = true;
			// this.currentPosLastX = this.currentPos.x;

			// setTimeout(() => {
			// 	this.heightmapVariable.material.uniforms.mouseSize = { value: this.effectController.mouseSize }; // water agitation
			// 	this.clickAnim = false;
			// }, 100);

		}
	}

	raf() {

		// water
		let currentTime = new Date().getTime();
		this.ms_Ocean.deltaTime = (currentTime - this.lastTime) / 1000 || 0.0;
		this.lastTime = currentTime;
		this.ms_Ocean.render(this.ms_Ocean.deltaTime);
		// Update ocean data
		this.ms_Ocean.update();

		// ?
		this.ms_Ocean.overrideMaterial = this.ms_Ocean.materialOcean;
		if (this.ms_Ocean.changed) {
			this.ms_Ocean.materialOcean.uniforms.u_size.value = this.ms_Ocean.size;
			this.ms_Ocean.materialOcean.uniforms.u_sunDirection.value.set( this.ms_Ocean.sunDirection, this.ms_Ocean.sunDirection, this.ms_Ocean.sunDirection );
			this.ms_Ocean.materialOcean.uniforms.u_exposure.value = this.ms_Ocean.exposure;
			this.ms_Ocean.changed = false;
		}
		this.ms_Ocean.materialOcean.uniforms.u_normalMap.value = this.ms_Ocean.normalMapFramebuffer.texture;
		this.ms_Ocean.materialOcean.uniforms.u_displacementMap.value = this.ms_Ocean.displacementMapFramebuffer.texture;
		this.ms_Ocean.materialOcean.uniforms.u_projectionMatrix.value = this.camera.projectionMatrix;
		this.ms_Ocean.materialOcean.uniforms.u_viewMatrix.value = this.camera.matrixWorldInverse;
		this.ms_Ocean.materialOcean.uniforms.u_cameraPosition.value = this.camera.position;
		this.ms_Ocean.materialOcean.depthTest = true;

		// Manual simulation of infinite waves
		// left to right
		// let pointX = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.x : Math.sin(this.clock.getElapsedTime() * 5 ) * (this.heightCamera * this.aspect) / 8;
		// let pointZ = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.z : -this.heightCamera / 2;

		// let pointX = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.x : 0;
		// let pointZ = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.z :  Math.sin(this.clock.getElapsedTime() * 5 ) * -this.heightCamera / 6 - this.heightCamera / 2;
		// // console.log(pointX, pointZ);

		// this.heightmapVariable.material.uniforms.mousePos.value.set( pointX, pointZ );

		// // Do the gpu computation
		// this.gpuCompute.compute();

		// // Get compute output in custom uniform
		// this.waterUniforms.heightmap.value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
		// // this.waterUniforms.heightmap.value = this.heightmapVariable.initialValueTexture; // get aperçu of init HeightMap stade 1
		// // this.waterUniforms.heightmap.value = this.heightmapVariable.renderTargets[1];  --> equivalent to gpu value

		// // issue of heightmap y increase, because of waves, dont know why, try to compense the gpuCompute but the value is exponentiel
		// this.waterMesh.position.y -= 0.0016;

		// console.log(this.waterMesh.position);


		if (this.gravity === true && this.startMove === true) this.world.step();

		// Moving Icebergs
		this.asteroids.forEach((el) => {

			if (el.animated === false) {
				el.mesh.position.y = el.body.position.y = 4; // constraint pos y
			}

			if (el.body !== undefined ) {

				if (this.asteroidsMove === true) {
					// APPLY IMPULSE
					el.body.linearVelocity.x = el.force.x;
					el.body.linearVelocity.y = el.force.y;
					el.body.linearVelocity.z = el.force.z;

					// Clamp rotation

					el.body.angularVelocity.x = 0;
					el.body.angularVelocity.y = clamp(el.body.angularVelocity.y, -0.5, 0.5);
					el.body.angularVelocity.z = 0;
				}


				el.mesh.position.copy(el.body.getPosition());
				el.mesh.quaternion.copy(el.body.getQuaternion());
				if (el.mesh.position.z >= 200) {
					// el.mesh.position.z = el.body.position.z =
					// el.body.position.x = el.mesh.position.x = getRandom(this.astXMin, this.astXMax);

					let z = el.mesh.index % 2 === 0 ? getRandom(0, this.reappearZ) : this.reappearZ;
					let x = getRandom(this.astXMin, this.astXMax);
					el.mesh.position.z = el.body.position.z = z;
					el.body.position.x = el.mesh.position.x = x;

					el.animated = true;
					const dest = el.height * el.scale;
					// TweenMax.fromTo(el.mesh.material, 0.5, {opacity: 0}, {opacity: 1}); // convert in time raf
					TweenMax.fromTo([el.mesh.position, el.body.position], 3, {y: -dest}, {y: el.endY, onComplete:() => {
						el.animated = false;
					}});
					// reboot
				}

			}
		});

		// Raycaster
		this.raycaster.setFromCamera(this.mouse, this.camera);

		// on Click asteroids
		const intersectsAst = this.raycaster.intersectObjects(this.asteroidsM);

		if (intersectsAst.length > 0) {
			this.ui.body.style.cursor = 'pointer';
			this.clickAsteroid = true;
			this.currentAstHover = this.asteroids[intersectsAst[0].object.index];
		} else {
			this.ui.body.style.cursor = 'auto';
			this.clickAsteroid = false;
		}

		// // deceleration
		if (this.cameraMove === false && this.isControls === false) {

			// Specify target we want
			this.camRotTarget.x = toRadian(round(this.mouse.y * 4, 100));
			this.camRotTarget.y = -toRadian(round(this.mouse.x * 4, 100));

			// Smooth it with deceleration
			this.camRotSmooth.x += (this.camRotTarget.x - this.camRotSmooth.x) * 0.08;
			this.camRotSmooth.y += (this.camRotTarget.y - this.camRotSmooth.y) * 0.08;

			// Apply rotation
			this.camera.rotation.x = this.camRotSmooth.x + this.currentCameraRotX;
			this.camera.rotation.y = clamp(this.camRotSmooth.y, -0.13, 0.13); // --> radian

		}

		if (this.startIsHover !== true) {
			if (this.clickAsteroid === true) global.CURSOR.interractHover();
			else global.CURSOR.interractLeave();
		}

		// glitch title
		if (this.glitch) {

			if (this.glitch.start === true) {
				this.glitch.render({type: 'intro'});
			} else {
				if (this.glitch.stop !== true) {
					this.glitch.render({stop: true});
					this.glitch.stop = true;
				}
			}
		}

		this.render();

		// Update ocean data
		// this.ms_Ocean.update();


	}

	transitionIn(fromProject = false) {

		this.el.classList.add('intro');
		this.el.classList.remove('project');
		this.el.classList.remove('about');
		// set ui
		this.UI.content.style.display = 'block';
		global.MENU.el.classList.remove('is-active');

		Ui.el.style.display = 'block';
		// const title1Arr = new SplitText(this.UI.title1, { type: 'chars' });
		// const title2Arr = new SplitText(this.UI.title2, { type: 'words' });

		if (fromProject === false) {
			this.glitchEl = document.querySelector('.intro__glitch');

			this.glitch = new Glitch({ // issue link to ui footer here but Css
				el: this.glitchEl,
				textSize: 50,
				sndColor: 'red',
				color: 'black',
				txt: 'R O B I N   P A Y O T',
				sndTxt: 'I N T E R A C T I V E   D E V E L O P E R',
				clock: this.clock
			});

			const canvas = this.glitchEl.querySelector('.glitch__canvas');

			const tl = new TimelineMax();

			tl.set(this.ui.overlay, {opacity: 1});
			tl.set(canvas, {opacity: 0, visibility: 'visible', display: 'block'});

			tl.fromTo(canvas, 3, {
				opacity: 0
			}, {
				opacity: 1,
				ease: window.Linear.easeNone
			}, 2);
			// tl.set([title1Arr.chars, title2Arr.words], {opacity: 0});
			// tl.set(this.asteroidsM.material, {opacity: 0});
			tl.add(() => {
				this.glitch.start = true;
			}, 0);
			tl.add(() => {
				// start move Ast
				this.startMove = true;
			});
			tl.to(this.ui.overlay, 1.5, {opacity: 0}, 4);
			tl.add(() => {
				this.moveCameraIn(fromProject);
			}, 2);
			tl.to(this.glitchEl, 1, {autoAlpha: 0, onComplete:()=> {
				this.glitch.start = false;
				console.log('stop');
			}}, '+=1');

			tl.set(this.ui.button, {opacity: 0, display: 'block'}, '+=1.5');
			tl.to(this.ui.button, 3, {opacity: 1});
			// tl.to('.overlay', 1, {
			// 	opacity: 0
			// }, 0);

		} else {

			const tl = new TimelineMax();
			// this.UI.title1.style.display = 'none';
			// this.UI.title2.style.display = 'none';

			this.camera.position.set(0, this.maxZoom, 0);
			this.camera.rotation.x = toRadian(-90);
			tl.add(() => {
				this.moveCameraIn(fromProject);
			}, 1.5);
			tl.set(this.ui.button, {opacity: 0, display: 'block'}, '+=1.5');
			tl.to(this.ui.button, 3, {opacity: 1});
			tl.to('.overlay', 1, {
				opacity: 0
			}, 1.6);

			tl.add(() => {
				// start move Ast
				this.startMove = true;
			},0);
		}





		// tl.o(this.asteroidsM.material, 0.5, {opacity: 1}, 5);

	}

	moveCameraIn(fromProject = false) {


		if (this.animating === true) return false;
		this.animating = true;

		const tl = new TimelineMax({
			onComplete: () => {
				this.cameraMove = false;
				this.currentCameraRotX = this.camera.rotation.x;

			}
		});

		if (fromProject === true) {
			tl.fromTo(this.camera.position, 5, {y: this.maxZoom }, {y: this.minZoom, ease: window.Expo.easeOut}, 0);
		} else {
			tl.to(this.camera.position, 7, {y: this.minZoom, ease: window.Expo.easeInOut});
		}


		tl.add(() => {

			this.asteroidsMove = true;
		}, 0);

	}

	transitionOut(dest) {

		// this.resetWater();

		const tl = new TimelineMax({delay: 0});

		tl.to(this.ui.button, 0.5, {opacity: 0}, 0);
		tl.set(this.ui.button, {opacity: 0, display: 'none'}, 0.5);

		tl.fromTo(this.camera.position, 4, {y: this.minZoom }, {y: this.maxZoom + 200, ease: window.Expo.easeOut}, 0);
		tl.fromTo('.overlay', 1, {
			opacity: 0
		}, {
			opacity: 1,
			ease: window.Linear.easeNone
		}, 0);
		tl.add(() => {
			EmitterManager.emit('view:transition:out');
		},2);


		this.animating = true;

		this.cameraMove = true;

	}

	resizeHandler() {
		super.resizeHandler();
		const obj = this.scene.getObjectByName('water');
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
		this.scene.remove( obj );

		this.initWater(true);
	}


}
