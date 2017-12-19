import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import {toRadian, getIndex } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import PreloadManager from '../managers/PreloadManager';
import { Device } from '../helpers/Device';
import Handlebars from 'handlebars';
import DATA from '../../datas/data.json';


import { Vector2, Raycaster, Vector3, Scene, DirectionalLight, PlaneGeometry, PlaneBufferGeometry, Mesh, MeshBasicMaterial, UniformsUtils, ShaderLib, ShaderChunk, ShaderMaterial, Color, MeshPhongMaterial } from 'three';
import OrbitControls from '../vendors/OrbitControls';
import SimplexNoise from '../vendors/SimplexNoise';
import GPUComputationRenderer from '../vendors/GPUComputationRenderer';
import HeightmapFragmentShader from '../shaders/HeightmapFragmentShader';
// import SmoothFragmentShader from '../shaders/SmoothFragmentShader';
import WaterVertexShader from '../shaders/WaterVertexShader';

// import dat from 'dat-gui';

export default class AboutView extends AbstractView {

	constructor(obj) {

		super();

		// properties


		this.el = this.ui.webGl;
		this.gravity = obj.gravity;
		this.name = 'about';
		this.isControls = false;

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
			socials: document.querySelector('.ui-content.is-about .socials'),
			p: document.querySelectorAll('.ui-content.is-about p'),
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

		// init


	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.raf);

		if (Device.touch === false) {
			document[evListener]( 'click', this.onClick , false );
			// move camera
			EmitterManager.on('mousemove', this.onMouseMove);

			for (let i = 0; i < this.ui.links.length; i++) {
				this.ui.links[i][evListener]( 'mouseenter', this.onHoverLink, false );
				this.ui.links[i][evListener]( 'mouseleave', this.onLeaveLink, false );
			}

			this.ui.more[evListener]( 'mouseenter', this.onHoverMore, false );
			this.ui.more[evListener]( 'mouseleave', this.onLeaveMore, false );

			this.ui.back[evListener]( 'mouseenter', this.onHoverMore, false );
			this.ui.back[evListener]( 'mouseleave', this.onLeaveMore, false );

			for (let i = 0; i < this.ui.works.length; i++) {
				this.ui.works[i][evListener]( 'mouseenter', this.onHoverWork, false );
				this.ui.works[i][evListener]( 'mouseleave', this.onLeaveWork, false );
			}
		} else {
			// document[evListener]( 'touchstart', this.onDocumentTouchStart, false ); // à faire pour tablet
			// document[evListener]( 'touchmove', this.onDocumentTouchMove, false );  // à faire pour tablet
		}

		// document[evListener]( 'keydown', this.onW , false );

		this.ui.more[evListener]('click', this.onClickMore);
		this.ui.back[evListener]('click', this.onClickBack);


	}

	init() {

		console.log('init about');


		// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
		// this.UI.intro.style.display = 'none';
		global.MENU.el.classList.add('is-active');
		global.MENU.el.classList.add('alt');
		global.MENU.el.classList.remove('is-open');

		// Set UiContainers
		this.setUiContainer();

		this.scene = new Scene();
		this.scene.background = new Color(0x000000);
		// SceneManager.renderer.setPixelRatio( clamp(window.devicePixelRatio, 1, 1.5)); // passer à 1.5 si rétina

		// set Camera
		this.setCamera();
		this.setCameraPos();

		// set Light
		this.setLight();

		this.minZoom = 1000;
		this.maxZoom = 1700;
		this.maxDash = 635;
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
			mouseSize: 34.0,
			viscosity: 0.15
		};

		this.initWater(false, false);

		this.setGround();

		// let gui = new dat.GUI();

		// gui.add( this.effectController, 'mouseSize', 1.0, 100.0, 1.0 ).onChange( this.valuesChanger );
		// gui.add( this.effectController, 'viscosity', 0.0, 0.5, 0.001 ).onChange( this.valuesChanger );
		// this.valuesChanger();
		// let buttonSmooth = {
		// 	smoothWater: () => {
		// 		this.smoothWater();
		// 	}
		// };
		// gui.add( buttonSmooth, 'smoothWater' );
		// gui.close();

		global.CURSOR.el.classList.add('alt');

		this.isInit = true;

	}

	////////////////////
	// SET SCENE
	////////////////////

	setCameraPos() {

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

	}

	initWater(destroy = false, bigger = false) {

		this.WIDTH = 128; // Texture width for simulation bits

		// Magic calculs ;)
		const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		const height = 2 * Math.tan( vFOV / 2 ) * this.minZoom; // dist between 0 and camerapos.y

		const aspect = window.innerWidth / window.innerHeight;
		let finalBounds;
		if (aspect > 1) {
			// landscape
			finalBounds = height * aspect;
		} else {
			finalBounds = height;
		}

		const extra = bigger === true ? 400 : finalBounds / 2.05; // for rotation camera left / right
		this.BOUNDS = finalBounds + extra; // Water size
		this.BOUNDSSUP = bigger === true ? 700 : 0; // Bounds supp for TransitionOut, we see the horizon

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

	setGround() {

		const geometry = new PlaneGeometry(3000,4000);
		const mat = new MeshPhongMaterial({color: 0xFFFFFF});

		const ground = new Mesh(geometry, mat);

		ground.rotation.x = toRadian(-90);
		ground.position.y = -15;

		this.scene.add(ground);
	}

	setUiContainer() {

		const data = DATA;
		this.ui.uiContent.className = '';
		this.ui.uiContent.classList.add('ui-content', 'is-about');
		let template = Handlebars.compile(PreloadManager.getResult('tpl-about-content'));
		let html  = template(data);

		this.ui.uiContent.innerHTML = html;

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
		this.initWater();
	}

	setMouseCoords( x, y ) {

		this.mouseCoords.set( ( x / SceneManager.renderer.domElement.clientWidth ) * 2 - 1, - ( y / SceneManager.renderer.domElement.clientHeight ) * 2 + 1 );
		this.mouseMoved = true;

	}

	onMouseMove( x, y ) {

		this.setMouseCoords( x, y );

		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		this.mouse.x = x / window.innerWidth * 2 - 1;
		this.mouse.y = -(y / window.innerHeight) * 2 + 1;

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
		// tl.set(el, {clearProps: 'paddingLeft'});
		TweenMax.killTweensOf(line);

		tl.to(line, 0.7, { width: 15, ease: window.Expo.easeOut }, 0);
		tl.to(el, 0.7, { paddingLeft: 25, ease: window.Expo.easeOut }, 0);

	}

	onLeaveMore(e) {

		const el = e.currentTarget;
		const line = el.querySelector('.line');

		global.CURSOR.interractLeave();

		TweenMax.killTweensOf(line);
		const tl = new TimelineMax();

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

		tl.to(this.ui.worksDown2[index], 0.8, {strokeDashoffset: this.maxDash * 7 - 100, ease: window.Expo.easeOut }, 0);
		tl.to(this.ui.worksDown[index], 0.9, {strokeDashoffset: this.maxDash * 6 - 180, ease: window.Expo.easeOut }, 0.1);
		tl.to(this.ui.worksUp[index], 1, {strokeDashoffset: this.maxDash - 205, ease: window.Expo.easeOut }, 0.2);
		tl.set([this.ui.worksUp[index], this.ui.worksDown[index], this.ui.worksDown2[index]], {clearProps: 'all'});
		tl.add(()=> {
			this.animLink = false;
		});

	}

	onLeaveWork(e) {
		const el = e.currentTarget;
		const index = getIndex(el);

		this.hoverLink = false;
		global.CURSOR.interractLeave();
		TweenMax.fromTo(this.ui.worksCircle[index], 0.2, {opacity: 0}, {opacity: 1});
		TweenMax.set(this.ui.worksCircle[index], {transformOrigin: '50% 50%'});
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

	raf() {

		if (this.isInit !== true) return false;

		if (Device.touch === false) {
			if ( this.clickAnim === true) {
				this.heightmapVariable.material.uniforms.mousePos.value.set( this.currentPos.x, this.currentPos.z );
			} else {
				// Raycaster
				if ( this.mouseMoved ) {

					this.raycaster.setFromCamera(this.mouse, this.camera);

					let intersects = this.raycaster.intersectObject( this.meshRay );

					if ( intersects.length > 0 ) {
						this.currentPos = intersects[ 0 ].point;
						this.heightmapVariable.material.uniforms.mousePos.value.set( this.currentPos.x, this.currentPos.z );

					}

					this.mouseMoved = false;
				}
			}
		}

		// Do the gpu computation
		this.gpuCompute.compute();

		// Get compute output in custom uniform
		this.waterUniforms.heightmap.value = this.gpuCompute.getCurrentRenderTarget( this.heightmapVariable ).texture;

		this.render();


	}

	transitionIn() {

		this.el.classList.add('about');
		this.el.classList.remove('project');
		this.el.classList.remove('intro');

		const tl = new TimelineMax();
		tl.fromTo('.overlay', 1, {
			opacity: 1
		}, {
			opacity: 0,
			ease: window.Linear.easeNone
		});
		tl.add(() => {
			this.moveCameraIn();
		}, 0);

	}

	moveCameraIn(dest) {

		const tl = new TimelineMax({
			onComplete: () => {
				this.cameraMove = false;
				// this.transitionOut();

			},
			delay: 0
		});
		tl.fromTo(this.camera.position, 5, {y: this.maxZoom - 100 }, {y: this.minZoom, ease: window.Expo.easeOut});
		tl.set(this.ui.introWrap, {display : 'block'} , 0.5);
		tl.staggerFromTo(this.targetsIntro, 2, {y: 120 }, {y: 0, ease: window.Expo.easeOut}, 0.04, 0.5);
		tl.staggerFromTo(this.targetsIntro, 0.5, {opacity: 0},{opacity: 1, ease: window.Linear.easeNone}, 0.04, 0.5);

	}

	transitionOut(dest) {
		this.resetWater();

		const tl = new TimelineMax({delay: 0.5});

		tl.staggerTo(this.targetsIntro, 2, {y: -120, ease: window.Power4.easeOut}, 0.04);
		tl.staggerTo(this.targetsIntro, 0.5, {opacity: 0, ease: window.Linear.easeNone}, 0.04, 0);
		tl.set(this.ui.introWrap, {display : 'none'});
		tl.staggerTo(this.targetsWorks, 1.7, {y: -120, ease: window.Power4.easeOut}, 0.04);
		tl.staggerTo(this.targetsWorks, 0.5, {opacity: 0, ease: window.Linear.easeNone}, 0.04, 0);
		tl.set(this.ui.worksWrap, {display : 'none'});

		tl.fromTo(this.camera.position, 4, {y: this.minZoom }, {y: this.maxZoom, ease: window.Expo.easeOut}, 0);
		tl.fromTo('.overlay', 1, {
			opacity: 0
		}, {
			opacity: 1,
			ease: window.Linear.easeNone
		}, 0);
		tl.add(() => {
			EmitterManager.emit('view:transition:out');
		}, 1);

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
