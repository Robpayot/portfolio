import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import {toRadian, getIndex, clamp, round } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import PreloadManager from '../managers/PreloadManager';
import SplitText from '../vendors/SplitText.js';
import { Device } from '../helpers/Device';
import Ui from '../components/Ui';
import Handlebars from 'handlebars';
import DATA from '../../datas/data.json';


import { Vector2, Raycaster, Vector3, Scene, DirectionalLight, Texture, PlaneGeometry, PlaneBufferGeometry, Mesh, MeshBasicMaterial, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color, MeshPhongMaterial } from 'three';
import { CameraDolly } from '../vendors/three-camera-dolly-custom';
import OrbitControls from '../vendors/OrbitControls';
import SimplexNoise from '../vendors/SimplexNoise';
import GPUComputationRenderer from '../vendors/GPUComputationRenderer';
import HeightmapFragmentShader from '../shaders/HeightmapFragmentShader';
// import SmoothFragmentShader from '../shaders/SmoothFragmentShader';
import WaterVertexShader from '../shaders/WaterVertexShader';


import dat from 'dat-gui';

export default class AboutView extends AbstractView {

	constructor(obj) {

		super();

		// properties


		this.el = this.ui.webGl;
		this.gravity = obj.gravity;
		this.UI = Ui.ui; // Global UI selector
		this.name = 'about';
		this.isControls = true;

		// bind

		this.init = this.init.bind(this);
		this.raf = this.raf.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.valuesChanger = this.valuesChanger.bind(this);
		this.initWater = this.initWater.bind(this);
		this.fillTexture = this.fillTexture.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.smoothWater = this.smoothWater.bind(this);
		this.setMouseCoords = this.setMouseCoords.bind(this);
		this.setLight = this.setLight.bind(this);
		this.resetWater = this.resetWater.bind(this);
		this.onW = this.onW.bind(this);
		this.moveCameraIn = this.moveCameraIn.bind(this);
		this.transitionIn = this.transitionIn.bind(this);
		this.transitionOut = this.transitionOut.bind(this);
		this.onClickStart = this.onClickStart.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onHoverLink = this.onHoverLink.bind(this);
		this.onHoverMore = this.onHoverMore.bind(this);
		this.onLeaveMore = this.onLeaveMore.bind(this);
		this.onClickMore = this.onClickMore.bind(this);
		this.onClickBack = this.onClickBack.bind(this);
		this.onHoverWork = this.onHoverWork.bind(this);
		this.onLeaveWork = this.onLeaveWork.bind(this);

		// preload Models
		// when all is loaded
		this.init();

		// ui
		this.ui = {
			title: document.querySelector('.about__title'),
			links: document.querySelectorAll('.about__intro a'),
			more: document.querySelector('.about__more'),
			back: document.querySelector('.about__back'),
			socials: document.querySelector('.about__container .socials'),
			p: document.querySelectorAll('.about__container p'),
			introWrap: document.querySelector('.about__intro'),
			worksWrap: document.querySelector('.about__works'),
			works: document.querySelectorAll('.about__work'),
			worksCircle: document.querySelectorAll('.about__works svg circle'),
			worksDown: document.querySelectorAll('.about__works svg .close-down'),
			worksDown2: document.querySelectorAll('.about__works svg .close-down-2'),
			worksUp: document.querySelectorAll('.about__works svg .close-up'),
		};

		this.targetsIntro = [this.ui.title];
		let p = [].slice.call(this.ui.p);
		this.targetsIntro = this.targetsIntro.concat(p);
		this.targetsIntro.push(this.ui.socials);
		this.targetsIntro.push(this.ui.more);

		this.targetsWorks = [this.ui.back];
		let works = [].slice.call(this.ui.works);
		this.targetsWorks = this.targetsWorks.concat(works);


		this.events(true);
		global.OVERLAY.classList.add('black');

		this.transitionIn();

		// this.events(false);

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

			for (let i = 0; i < this.ui.links.length; i++) {
				this.ui.links[i][evListener]( 'mouseenter', this.onHoverLink, false );
				this.ui.links[i][evListener]( 'mouseleave', this.onLeaveLink, false );
			}
			document[evListener]( 'mouseover', this.onMouseMove, false );

			this.ui.more[evListener]( 'mouseenter', this.onHoverMore, false );
			this.ui.more[evListener]( 'mouseleave', this.onLeaveMore, false );

			this.ui.back[evListener]( 'mouseenter', this.onHoverMore, false );
			this.ui.back[evListener]( 'mouseleave', this.onLeaveMore, false );

			for (let i = 0; i < this.ui.works.length; i++) {
				this.ui.works[i][evListener]( 'mouseenter', this.onHoverWork, false );
				this.ui.works[i][evListener]( 'mouseleave', this.onLeaveWork, false );
			}
		} else {
			document[evListener]( 'touchstart', this.onDocumentTouchStart, false );
			document[evListener]( 'touchmove', this.onDocumentTouchMove, false );
		}

		document[evListener]( 'keydown', this.onW , false );
		document[evListener]( 'click', this.onClick , false );

		this.ui.more[evListener]('click', this.onClickMore);
		this.ui.back[evListener]('click', this.onClickBack);


	}

	init() {

		// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
		// this.UI.intro.style.display = 'none';
		global.MENU.el.classList.add('is-active');
		global.MENU.el.classList.add('alt');
		global.MENU.el.classList.remove('is-open');

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

		this.nbAst = 16;
		this.mouseSize = 16.0; // wave agitation
		this.maxDash = 635;

		this.mouseMoved = false;
		this.mouseCoords = new Vector2();
		this.raycaster = new Raycaster();

		this.simplex = new SimplexNoise();

		// Mouse
		this.mouse = { x: 0, y: 0 };
		this.currentPos = { };
		this.mouseMoved = false;
		this.camRotTarget = new Vector3(0, 0, 0);
		this.camRotSmooth = new Vector3(0, 0, 0);

		this.cameraMove = true;

		// Camera controls
		if (this.isControls === true) {
			this.controls = new OrbitControls(this.camera, SceneManager.renderer.domElement);
			this.controls.enableZoom = true;
		}

		this.effectController = {
			mouseSize: 30.0,
			viscosity: 0.15
		};

		this.initWater(false, false);

		// this.setAsteroids();
		this.setGround();

		// Set CssContainers
		this.setUiContainer();

		global.CURSOR.el.classList.add('alt');
		// reset Water bits to 64
		// setInterval(() => {
		// 	this.resetWater();
		// }, 10000);

		let gui = new dat.GUI();

		gui.add( this.effectController, 'mouseSize', 1.0, 100.0, 1.0 ).onChange( this.valuesChanger );
		gui.add( this.effectController, 'viscosity', 0.0, 0.5, 0.001 ).onChange( this.valuesChanger );
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
		let sun = new DirectionalLight( 0xFFFFFF, 1.0 );
		sun.position.set( 300, 400, -205 );
		this.scene.add( sun );

		let sun2 = new DirectionalLight( 0xe8f0ff, 0.2 );
		sun2.position.set( -300, 400, -205 );
		this.scene.add( sun2 );

		// let hemisphere = new HemisphereLight( 0x00FFFF, 0xFF0000, 1 );
		// this.scene.add( hemisphere );

		// FOG
		// this.scene.fog = new Fog( 0xFFFFFF, 1, 200 ); --> dosent affect water

	}

	initWater(destroy = false, bigger = false) {

		this.WIDTH = 128; // Texture width for simulation bits

		// Magic calculs ;)
		const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		const height = 2 * Math.tan( vFOV / 2 ) * 1000; // dist between 0 and camerapos.y

		const aspect = window.innerWidth / window.innerHeight;
		let finalBounds;
		if (aspect > 1) {
			// landscape
			finalBounds = height * aspect;
		} else {
			finalBounds = height;
		}

		const extra = bigger === true ? 400 : 100; // for rotation camera left / right
		this.BOUNDS = finalBounds + extra; // Water size
		this.BOUNDSSUP = bigger === true ? 700 : 0; // Bounds supp for TransitionOut, we see the horizon
		this.mouseSize = bigger === true ? 100.0 : 16.0; // wave agitation

		// Mesh just for mouse raycasting
		let geometryRay = new PlaneBufferGeometry( this.BOUNDS, this.BOUNDS, 1, 1 );
		this.meshRay = new Mesh( geometryRay, new MeshBasicMaterial( { color: 0xFFFFFF, visible: false } ) );
		this.meshRay.rotation.x = -Math.PI / 2;
		this.meshRay.matrixAutoUpdate = false;
		this.meshRay.updateMatrix();
		this.meshRay.name = 'meshRay';
		this.scene.add( this.meshRay );

		let materialColor = 0xffffff;

		let geometry = new PlaneGeometry( this.BOUNDS, this.BOUNDS , this.WIDTH - 1, this.WIDTH - 1 );

		// material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
		let material = new ShaderMaterial({
			uniforms: UniformsUtils.merge([
				ShaderLib[ 'phong' ].uniforms,
				{
					heightmap: { value: null }
				}
			]),
			vertexShader: WaterVertexShader.vertexShader,
			fragmentShader: ShaderChunk[ 'meshphong_frag' ]

		});

		material.lights = true;
		// Material attributes from MeshPhongMaterial
		material.color = new Color( materialColor );
		material.specular = new Color( 0x111111 );
		material.shininess = 1;

		// Sets the uniforms with the material values
		material.uniforms.diffuse.value = material.color;
		material.uniforms.specular.value = material.specular;
		material.uniforms.shininess.value = Math.max( material.shininess, 1e-4 );
		material.uniforms.opacity.value = material.opacity;

		// Defines
		material.defines.WIDTH = this.WIDTH.toFixed( 1 );
		material.defines.BOUNDS = this.BOUNDS.toFixed( 1 );

		this.waterUniforms = material.uniforms;

		this.waterMesh = new Mesh( geometry, material );
		this.waterMesh.rotation.x = -Math.PI / 2;
		this.waterMesh.position.set( 0, 0, 0);
		this.waterMesh.name = 'water';
		// this.waterMesh.matrixAutoUpdate = false;
		// this.waterMesh.updateMatrix();

		this.scene.add( this.waterMesh );

		if (destroy === false ) { // if not already set
			this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, SceneManager.renderer );

			let heightmap0 = this.gpuCompute.createTexture();

			this.fillTexture( heightmap0 );

			this.heightmapVariable = this.gpuCompute.addVariable( 'heightmap', HeightmapFragmentShader.fragmentShader, heightmap0 );

			this.gpuCompute.setVariableDependencies( this.heightmapVariable, [ this.heightmapVariable ] );

			this.heightmapVariable.material.uniforms.debug = { value: new Vector2( 0, 0 ) };
			this.heightmapVariable.material.uniforms.mousePos = { value: new Vector2( 10000, 10000 ) };
			this.heightmapVariable.material.uniforms.viscosityConstant = { value: 0.2 };
			this.heightmapVariable.material.defines.BOUNDS = this.BOUNDS.toFixed( 1 );
			this.heightmapVariable.material.uniforms.mouseSize = { value: this.effectController.mouseSize }; // water agitation
			this.heightmapVariable.material.uniforms.viscosityConstant = { value: this.effectController.viscosity };

			let error = this.gpuCompute.init();
			if ( error !== null ) {
				console.error( error );
			}

			// Create compute shader to smooth the water surface and velocity
			// this.smoothShader = this.gpuCompute.createShaderMaterial( SmoothFragmentShader.fragmentShader, { texture: { value: null } } ); --> A étudier

			// console.log(this.heightmapVariable, this.smoothShader);
		}

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

		this.scene.add(ground);

		const geometry2 = new PlaneGeometry(3000,3000);

		// material
		const mat2 = new MeshBasicMaterial( { map: texture, transparent: true } );
		// const mat2 = new MeshBasicMaterial({color: 0x00FFFF});
		const blackGround = new Mesh(geometry2, mat2);
		blackGround.rotation.z = toRadian(90);
		blackGround.position.y = -500;
		blackGround.position.z = -2000;

		this.scene.add(blackGround);
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


	setUiContainer() {

		const data = DATA;
		// console.log(data, PreloadManager.getResult('tpl-about-content'));

		// Context + gallery arrows
		let template = Handlebars.compile(PreloadManager.getResult('tpl-about-content'));
		let html  = template(data);
		this.UI.content.innerHTML = html;

	}

	valuesChanger() {

		// this.heightmapVariable.material.uniforms.mouseSize.value = this.effectController.mouseSize;
		this.heightmapVariable.material.uniforms.viscosityConstant.value = this.effectController.viscosity;

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

		let currentRenderTarget = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable );
		let alternateRenderTarget = this.gpuCompute.getAlternateRenderTarget( this.heightmapVariable );

		this.smoothShader.uniforms.texture.value = this.heightmapVariable.initialValueTexture;
		this.gpuCompute.doRenderTarget( this.smoothShader, alternateRenderTarget );

		this.smoothShader.uniforms.texture.value = this.heightmapVariable.initialValueTexture;
		this.gpuCompute.doRenderTarget( this.smoothShader, currentRenderTarget );
	}

	setMouseCoords( x, y ) {

		this.mouseCoords.set( ( x / SceneManager.renderer.domElement.clientWidth ) * 2 - 1, - ( y / SceneManager.renderer.domElement.clientHeight ) * 2 + 1 );
		this.mouseMoved = true;

	}

	onMouseMove( e ) {

		const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		this.setMouseCoords( e.clientX, e.clientY );

		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		this.mouse.x = eventX / window.innerWidth * 2 - 1;
		this.mouse.y = -(eventY / window.innerHeight) * 2 + 1;

	}

	onHoverLink(e) {

		global.CURSOR.interractHover();

		const el = e.currentTarget;
		const span = el.querySelector('span');

		const tl = new TimelineMax();
		TweenMax.killTweensOf(span);

		tl.set(span, { left: 'auto', right: '0', width: '100%' }, 0);

		tl.to(span, 0.6, { width: '0%', ease: window.Power2.easeOut }, 0);

		tl.set(span, { left: '0', right: 'auto' }, 0.3);

		tl.to(span, 0.3, { width: '100%', ease: window.Power2.easeOut }, 0.3 );

		// this.tlLink.play();
	}

	onLeaveLink(e) {

		global.CURSOR.interractLeave();

	}

	onHoverMore(e) {


		const el = e.currentTarget;
		const line = el.querySelector('.line');

		global.CURSOR.interractHover();

		const tl = new TimelineMax();
		tl.set(el, {clearProps: 'paddingLeft'});
		TweenMax.killTweensOf(line);

		tl.to(line, 0.7, { width: 15, ease: window.Expo.easeOut }, 0);
		tl.to(el, 0.7, { paddingLeft: 25, ease: window.Expo.easeOut }, 0);

	}

	onLeaveMore(e) {

		const el = e.currentTarget;
		const line = el.querySelector('.line');

		global.CURSOR.interractLeave();

		const tl = new TimelineMax();
		tl.set(el, {clearProps: 'paddingLeft'});
		TweenMax.killTweensOf(line);

		tl.to(line, 0.7, { width: 0, ease: window.Expo.easeOut }, 0);
		tl.to(el, 0.7, { paddingLeft: 0, ease: window.Expo.easeOut }, 0);
	}

	onClickMore(e) {

		const tl = new TimelineMax(); // Ultimate TimelineMax God Saiyan

		tl.staggerTo(this.targetsIntro, 2, {y: -120, ease: window.Power4.easeOut}, 0.04);
		tl.staggerTo(this.targetsIntro, 0.5, {opacity: 0, ease: window.Linear.easeNone}, 0.04, 0);
		tl.set(this.ui.introWrap, {display : 'none'});

		tl.set(this.ui.worksWrap, {display : 'block'} , 1);
		tl.staggerFromTo(this.targetsWorks, 2, {y: 120 }, {y: 0, ease: window.Expo.easeOut}, 0.04, 1);
		tl.staggerFromTo(this.targetsWorks, 0.5, {opacity: 0},{opacity: 1, ease: window.Linear.easeNone}, 0.04, 1);

	}

	onClickBack(e) {

		const tl = new TimelineMax(); // Ultimate TimelineMax God Saiyan

		tl.staggerTo(this.targetsWorks, 1.7, {y: -120, ease: window.Power4.easeOut}, 0.04);
		tl.staggerTo(this.targetsWorks, 0.5, {opacity: 0, ease: window.Linear.easeNone}, 0.04, 0);
		tl.set(this.ui.worksWrap, {display : 'none'});

		tl.set(this.ui.introWrap, {display : 'block'} , 1);
		tl.staggerFromTo(this.targetsIntro, 2, {y: 120 }, {y: 0, ease: window.Expo.easeOut}, 0.04, 1);
		tl.staggerFromTo(this.targetsIntro, 0.5, {opacity: 0},{opacity: 1, ease: window.Linear.easeNone}, 0.04, 1);

	}

	onHoverWork(e) {

		const el = e.currentTarget;
		const index = getIndex(el);
		global.CURSOR.interractHover();


		this.animLink = true;
		this.hoverLink = true;

		TweenMax.to(this.ui.worksCircle[index], 0, {opacity: 0});
		const tl = new TimelineMax();

		tl.to(this.ui.worksDown2[index], 0.8, {strokeDashoffset: this.maxDash * 3 - 100, ease: window.Expo.easeOut }, 0);
		tl.to(this.ui.worksDown[index], 0.9, {strokeDashoffset: this.maxDash * 2 - 180, ease: window.Expo.easeOut }, 0.1);
		tl.to(this.ui.worksUp[index], 1, {strokeDashoffset: -this.maxDash * 3 - 205, ease: window.Expo.easeOut }, 0.2);
		tl.set([this.ui.worksUp[index], this.ui.worksDown[index], this.ui.worksDown2[index]], {clearProps: 'all'});
		tl.add(()=> {
			this.animLink = false;
		});

	}

	onLeaveWork(e) {
		const el = e.currentTarget;
		const index = getIndex(el);
		console.log(index);

		this.hoverLink = false;
		global.CURSOR.interractLeave();
		TweenMax.fromTo(this.ui.worksCircle[index], 0.2, {opacity: 0}, {opacity: 1});
		TweenMax.fromTo(this.ui.worksCircle[index], 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});
	}

	onW(event) {

		// W Pressed: Toggle wireframe
		if ( event.keyCode === 87 ) {

			this.waterMesh.material.wireframe = !this.waterMesh.material.wireframe;
			this.waterMesh.material.needsUpdate = true;

		}
	}

	onClick() {

		this.heightmapVariable.material.uniforms.mouseSize = { value: 50.0 };
		this.clickAnim = true;
		this.currentPosLastX = this.currentPos.x;

		setTimeout(() => {
			this.heightmapVariable.material.uniforms.mouseSize = { value: this.effectController.mouseSize }; // water agitation
			this.clickAnim = false;
		}, 100); // time circle propagation
	}

	onClickStart(e) {

		// e.preventDefault();

		if (this.clicked === true) return false;
		this.clicked = true;



		// const tl = new TimelineMax({delay: 2});
		const tl = new TimelineMax();

		tl.add(() => {
			console.log('switch water');
			// Clean water and replace it !
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
			this.initWater(true, true);
		}, '+=1.8');

		// tl.to(this.symbol.mesh.position, 10, {y: this.symbol.endPointY, z: this.symbol.endPointZ, ease: window.Expo.easeOut }, '+=0.2');
		// tl.to(this.symbol.mesh.material, 0.5, {opacity: 0 }, 1.5);

		tl.to(this.UI.button, 0.5, {opacity: 0}, 0);
		tl.set(this.UI.button, {opacity: 0, display: 'none'}, 0.5);


	}

	raf() {

		// let pointX = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.x : Math.sin(this.clock.getElapsedTime() * 7 ) * (this.BOUNDS - this.BOUNDSSUP) / 4;
		// let pointZ = this.onAsteroidAnim === true ? this.currentAstClicked.mesh.position.z : -(this.BOUNDS - this.BOUNDSSUP) / 2;

		if ( this.clickAnim === true) {
			this.heightmapVariable.material.uniforms.mousePos.value.set( this.currentPos.x, this.currentPos.z );
			// this.clickAnim = false;
		} else {
			// Raycaster
			if ( this.mouseMoved ) {

				this.raycaster.setFromCamera(this.mouse, this.camera);

				let intersects = this.raycaster.intersectObject( this.meshRay );

				if ( intersects.length > 0 ) {
					this.currentPos = intersects[ 0 ].point;
					this.heightmapVariable.material.uniforms.mousePos.value.set( this.currentPos.x, this.currentPos.z );
					// if ( this.clickAnim === true) {
					// 	this.heightmapVariable.material.uniforms.mousePos.value.set( this.currentPosLastX, this.currentPos.z );
					// } else {
					// 	this.heightmapVariable.material.uniforms.mousePos.value.set( this.currentPos.x, this.currentPos.z );
					// }

				}
				else {
					// if (this.heightmapVariable.material.mousePos) this.heightmapVariable.material.mousePos.value.set( 10000, 10000 );
				}

				this.mouseMoved = false;
			} else {
				// if (this.heightmapVariable.material.mousePos) this.heightmapVariable.material.mousePos.value.set( 10000, 10000 );
			}
		}



		// this.heightmapVariable.material.uniforms.mouseSize = { value: this.effectController.mouseSize }; // water agitation --> only one
		// this.heightmapVariable.material.uniforms.viscosityConstant = { value: this.effectController.viscosity };

		// Do the gpu computation
		this.gpuCompute.compute();

		// Get compute output in custom uniform
		this.waterUniforms.heightmap.value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;
		// this.waterUniforms.heightmap.value = this.heightmapVariable.initialValueTexture; // get aperçu of init HeightMap stade 1
		// this.waterUniforms.heightmap.value = this.heightmapVariable.renderTargets[1];  --> equivalent to gpu value

		// issue of heightmap y increase, because of waves, dont know why, try to compense the gpuCompute but the value is exponentiel
		this.waterMesh.position.y -= 0.0014;

		// console.log(this.waterMesh.position);

		// on Click asteroids

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

		this.render();


	}

	transitionIn() {

		this.el.classList.add('about');
		this.el.classList.remove('project');
		this.el.classList.remove('intro');
		// set ui
		// this.UI.intro.style.display = 'block';

		// Ui.el.style.display = 'block';

		const tl = new TimelineMax();

		tl.set(this.UI.overlay, {opacity: 1});

		tl.to(this.UI.overlay, 1.5, {opacity: 0});
		tl.add(() => {
			this.moveCameraIn();
		}, 0);


		tl.to('.overlay', 0, {
			opacity: 0
		}, 0);
		// tl.o(this.asteroidsM.material, 0.5, {opacity: 1}, 5);

	}

	moveCameraIn(dest) {

		// this.camera.lookAt(new Vector3(0,0,0));
		// const tl2 = new TimelineMax();

		// tl2.to(this.camera.position, 5, {y: 400});
		// tl2.to(this.camera.rotation, 5, {x: toRadian(180)});
		// const tl2 = new TimelineMax();
		// tl2.to(this.camera.position, 10, {y: -400});

		if (this.animating === true) return false;
		this.animating = true;

		const tl = new TimelineMax({
			onComplete: () => {
				this.cameraMove = false;
				this.currentCameraRotX = this.camera.rotation.x;

			}
		});
		tl.to(this.camera.position, 0, {y: 1000, ease: window.Expo.easeInOut});
		tl.add(() => {

			this.asteroidsMove = true;
		}, 0);

	}

	transitionOut(dest) {


		this.animating = true;

		this.cameraMove = true;

		// const tl2 = new TimelineMax();

		// tl2.to(this.camera.position, 2, {y: 100, ease: window.Expo.easeOut});
		// tl2.to(this.camera.rotation, 3, {x: toRadian(0), ease: window.Expo.easeOut}, 0);
		// // tl2.to(this.camera.position, 2, {z: 0}, 2);
		// tl2.to(this.camera.rotation, 2, {x: toRadian(45), ease: window.Expo.easeOut}, '-=1');
		// tl2.to(this.camera.position, 4, {z: -5000, y: 2000}, '-=2');
		// // tl2.to(this.camera.rotation, 2, {x: toRadian(90)})

		// return false;

		// if (this.animating === true) return false;


		// console.log(this.symbols[0].mesh.getPosition());
		// Set camera Dolly
		const points = {
			'camera': [{
				'x': this.camera.position.x,
				'y': this.camera.position.y,
				'z': this.camera.position.z
			}, {
				'x': 0,
				'y': 100,
				'z': -100
			}, {
				'x': 0,
				'y': 300,
				'z': -3000
			}],
			'lookat': [{
				'x': 0,
				'y': 0,
				'z': -1
			}, {
				'x': 0,
				'y': 100, // symbol.endPointY = 2000;
				'z': -200 // symbol.endPointZ = 5000;
			}, {
				'x': 0,
				'y': 300, // symbol.endPointY = 2000;
				'z': -3000 // symbol.endPointZ = 5000;
			}]
		};

		this.dolly = new CameraDolly(this.camera, this.scene, points, null, false);

		this.dolly.cameraPosition = 0;
		this.dolly.lookatPosition = 0;
		this.dolly.range = [0, 1];
		this.dolly.both = 0;

		const tl = new TimelineMax({
			onComplete: () => {

				this.cameraMove = false;
				// this.currentCameraRotX = this.camera.rotation.x;

				// EmitterManager.emit('router:switch', '/project-0', 0);
				EmitterManager.emit('view:transition:out');
			}
		});

		tl.to(this.dolly, 4, {
			cameraPosition: 1,
			lookatPosition: 1,
			ease: window.Power4.easeIn,
			onUpdate: () => {
				this.dolly.update();
			}
		});

		tl.to('.overlay', 0.5, {
			opacity: 1
		}, 2.9);

	}

	resizeHandler() {
		super.resizeHandler();
		// remove Mesh water
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

		// remove meshRay
		obj = this.scene.getObjectByName('meshRay');
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
