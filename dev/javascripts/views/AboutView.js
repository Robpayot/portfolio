import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import {toRadian, getIndex, round, clamp } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import PreloadManager from '../managers/PreloadManager';
import RouterManager from '../managers/RouterManager';
import ScrollManager from '../managers/ScrollManager';
import { Device } from '../helpers/Device';
import Handlebars from 'handlebars';
import DATA from '../../datas/data.json';
import SplitText from '../vendors/SplitText';


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
		this.initWater = this.initWater.bind(this);
		this.fillTexture = this.fillTexture.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.setMouseCoords = this.setMouseCoords.bind(this);
		this.onTouchStartContainer = this.onTouchStartContainer.bind(this);
		this.onTouchMoveContainer = this.onTouchMoveContainer.bind(this);
		this.onTouchEndContainer = this.onTouchEndContainer.bind(this);
		this.setLight = this.setLight.bind(this);
		this.resetWater = this.resetWater.bind(this);
		this.setUiContainer = this.setUiContainer.bind(this);
		this.moveCameraIn = this.moveCameraIn.bind(this);
		this.transitionIn = this.transitionIn.bind(this);
		this.transitionOut = this.transitionOut.bind(this);
		this.scroll = this.scroll.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onHoverLink = this.onHoverLink.bind(this);
		this.onHoverMore = this.onHoverMore.bind(this);
		this.onLeaveMore = this.onLeaveMore.bind(this);
		this.onClickMore = this.onClickMore.bind(this);
		this.onClickBack = this.onClickBack.bind(this);
		this.onHoverWork = this.onHoverWork.bind(this);
		this.onLeaveWork = this.onLeaveWork.bind(this);

		// preload Models

		super.startScene();

		// ui
		this.ui = {
			title: document.querySelector('.about__title'),
			links: document.querySelectorAll('.about__intro a'),
			more: document.querySelector('.about__more'),
			back: document.querySelector('.about__back'),
			socials: document.querySelector('.ui-content.is-about .socials'),
			p: document.querySelectorAll('.ui-content.is-about p:not(.about__work__descr)'),
			introWrap: document.querySelector('.about__intro'),
			worksWrap: document.querySelector('.about__works'),
			works: document.querySelectorAll('.about__work'),
			worksLinks: document.querySelectorAll('.about__work .about__button'),
			worksCircle: document.querySelectorAll('.about__works svg circle'),
			worksDown: document.querySelectorAll('.about__works svg .close-down'),
			worksDown2: document.querySelectorAll('.about__works svg .close-down-2'),
			worksUp: document.querySelectorAll('.about__works svg .close-up'),
		};


		this.targetsIntro = [this.ui.title];
		let p = [].slice.call(this.ui.p);
		this.targetsIntro = this.targetsIntro.concat(p);
		// this.targetsIntro.push(this.ui.socials);
		// this.targetsIntro.push(this.ui.more);

		this.targetsWorks = [this.ui.back];
		let works = [].slice.call(this.ui.works);
		this.targetsWorks = this.targetsWorks.concat(works);

		// Detect if we need a scroll event
		TweenMax.set(this.ui.worksWrap, {display: 'block'});
		if (this.ui.worksWrap.offsetHeight < window.innerHeight - 100) {
			this.noscroll = true;
			this.ui.worksWrap.classList.add('noscroll');

		}
		TweenMax.set(this.ui.worksWrap, {display: 'none'});

		this.events(true);
		global.OVERLAY.classList.add('black');

		this.scrollY = this.scrollYSmooth = this.lastTouchY = this.startTouchY = 0;
		this.scrollZ = this.scrollZSmooth = 0;
		this.zoomZ = 0;
		this.coefScrollY = Device.touch === true ? 0.1 : 0.6;
		this.coefScrollZ = 0.15;
		this.margeScrollY = Device.touch === true ? 100 : 250;

		global.OVERLAY.classList.add('is-about');
		global.OVERLAY.classList.remove('is-intro');


	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let listener = method === false ? 'off' : 'on';

		EmitterManager[listener]('resize', this.resizeHandler);
		EmitterManager[listener]('raf', this.raf);

		if (Device.touch === false) {
			document[evListener]( 'click', this.onClick , false );
			// move camera
			EmitterManager.on('mousemove', this.onMouseMove);

			// if (this.noscroll !== true) {
			EmitterManager[listener]('scroll', this.scroll);
			ScrollManager[listener]();
			// }

			for (let i = 0; i < this.ui.links.length; i++) {
				this.ui.links[i][evListener]( 'mouseenter', this.onHoverLink, false );
				this.ui.links[i][evListener]( 'mouseleave', this.onLeaveLink, false );
			}

			this.ui.more[evListener]( 'mouseenter', this.onHoverMore, false );
			this.ui.more[evListener]( 'mouseleave', this.onLeaveMore, false );

			this.ui.back[evListener]( 'mouseenter', this.onHoverMore, false );
			this.ui.back[evListener]( 'mouseleave', this.onLeaveMore, false );

			for (let i = 0; i < this.ui.worksLinks.length; i++) {
				this.ui.worksLinks[i][evListener]( 'mouseenter', this.onHoverWork, false );
				this.ui.worksLinks[i][evListener]( 'mouseleave', this.onLeaveWork, false );
			}
		} else {

			if (this.noscroll !== true) {
				this.ui.worksWrap[evListener]( 'touchstart', this.onTouchStartContainer, false );
				this.ui.worksWrap[evListener]( 'touchmove', this.onTouchMoveContainer, false );
				this.ui.worksWrap[evListener]( 'touchend', this.onTouchEndContainer, false );
			}
			// document[evListener]( 'touchstart', this.onDocumentTouchStart, false ); // à faire pour tablet
			// document[evListener]( 'touchmove', this.onDocumentTouchMove, false );  // à faire pour tablet
		}

		this.ui.more[evListener]('click', this.onClickMore);
		this.ui.back[evListener]('click', this.onClickBack);


	}

	init(sceneReady) {

		// console.log('init about');


		// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
		// this.UI.intro.style.display = 'none';
		global.MENU.el.classList.add('is-active');
		global.MENU.el.classList.add('alt');
		global.MENU.toggleOpen(null, true);

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


		// Camera controls
		if (this.isControls === true) {
			this.controls = new OrbitControls(this.camera, SceneManager.renderer.domElement);
			this.controls.enableZoom = true;
		}

		this.effectController = {
			mouseSize: 40.0,
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

		sceneReady();

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
		let template = Handlebars.compile(PreloadManager.getResult('tpl-about-content'), {noEscape: true});
		let html  = template(data.about);

		this.ui.uiContent.innerHTML = html;

		this.splitTitle = new SplitText('.about__title', {type:'chars'});
		this.splitTexts = new SplitText('.about__intro p', {type:'words'});
		this.splitWorksTop = new SplitText('.about__work__top > span:first-child', {type:'chars'});
		this.splitWorksDescr = new SplitText('.about__work__descr', {type:'words'});

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
		// sound
		global.SOUNDS['hover_2'].play();

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

		// sound
		global.SOUNDS['hover_2'].play();

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

		tl.set(this.ui.more, {transition: 'none'});
		tl.staggerTo([...this.targetsIntro, this.ui.more], 1.9, {y: -110, ease: window.Expo.easeOut}, 0.04);
		tl.staggerTo([...this.targetsIntro, this.ui.more], 0.6, {opacity: 0, ease: window.Linear.easeNone}, 0.04, 0);
		tl.set(this.ui.introWrap, {display : 'none'});

		tl.set(this.ui.worksWrap, {display : 'block'} , 1);
		tl.staggerFromTo(this.targetsWorks, 2, {y: 120 }, {y: 0, ease: window.Expo.easeOut}, 0.04, 1);
		tl.staggerFromTo(this.targetsWorks, 0.5, {opacity: 0},{opacity: 1, ease: window.Linear.easeNone}, 0.04, 1);
		tl.set(this.ui.more, {clearProps: 'all'});

		tl.add(() => {
			this.animWorks();
		}, 1);

		tl.add(() => {
			this.moreOpen = true;
			const isAnims = this.ui.introWrap.querySelectorAll('.is-anim');
			for (let i = 0; i < isAnims.length; i++) {
				isAnims[i].classList.remove('is-anim');
			}

		}, 2);




		// sound
		global.SOUNDS['switch'].play();


	}

	onClickBack(e) {

		const tl = new TimelineMax(); // Ultimate TimelineMax God Saiyan

		tl.staggerTo(this.targetsWorks, 1.9, {y: -110, ease: window.Expo.easeOut}, 0.04);
		tl.staggerTo(this.targetsWorks, 0.6, {opacity: 0, ease: window.Linear.easeNone}, 0.04, 0);
		tl.set(this.ui.worksWrap, {display : 'none'});

		tl.set(this.ui.introWrap, {display : 'block'} , 1);
		tl.staggerFromTo(this.targetsIntro, 2, {y: 120 }, {y: 0, ease: window.Expo.easeOut}, 0.04, 1);
		tl.staggerFromTo(this.targetsIntro, 0.5, {opacity: 0},{opacity: 1, ease: window.Linear.easeNone}, 0.04, 1);

		tl.add(() => {
			this.animIntro();
		}, 1);

		tl.add(() => {
			this.moreOpen = false;
			const isAnims = this.ui.worksWrap.querySelectorAll('.is-anim');
			for (let i = 0; i < isAnims.length; i++) {
				isAnims[i].classList.remove('is-anim');
			}
		}, 2);

		// sound
		global.SOUNDS['switch'].play();


	}

	onHoverWork(e) {

		const el = e.currentTarget;
		const index = getIndex(el.parentNode.parentNode);
		global.CURSOR.interractHover({magnet: true, el});

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

		// sound
		global.SOUNDS['hover'].play();

	}

	onLeaveWork(e) {
		const el = e.currentTarget;
		const index = getIndex(el.parentNode.parentNode);

		this.hoverLink = false;
		global.CURSOR.interractLeave({magnet: true, el});
		TweenMax.fromTo(this.ui.worksCircle[index], 0.2, {opacity: 0}, {opacity: 1});
		TweenMax.set(this.ui.worksCircle[index], {transformOrigin: '50% 50%'});
		TweenMax.fromTo(this.ui.worksCircle[index], 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});
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

	animIntro() {

		const tlTitle = new TimelineMax();
		let delayTitle = 0;
		for (let i = 0; i < this.splitTitle.chars.length; i++) {

			tlTitle.add(() => {
				this.splitTitle.chars[i].classList.add('is-anim');
			}, delayTitle);

			delayTitle += 0.07;
		}

		delayTitle = 0;
		const splitTextsWords = document.querySelectorAll('.about__intro p > *');

		for (let i = 0; i < splitTextsWords.length; i++) {

			tlTitle.add(() => {
				splitTextsWords[i].classList.add('is-anim');
			}, 0.5 + delayTitle);

			delayTitle += 0.01;
		}

		// delayTitle = 0;
		// const splitP = document.querySelectorAll('.about__intro p');

		// for (let i = 0; i < splitP.length; i++) {

		// 	tlTitle.add(() => {
		// 		let delayWords = 0;
		// 		const tlWords = new TimelineMax();

		// 		for (let y = 0; y < splitP[i].children.length; y++) {

		// 			tlWords.add(() => {
		// 				splitP[i].children[y].classList.add('is-anim');
		// 			}, delayWords);
		// 			delayWords += 0.015;

		// 		}

		// 	}, delayTitle);

		// 	delayTitle += 0.2;
		// }

		tlTitle.add(() => {
			this.ui.more.classList.add('is-anim');
		});
	}

	animWorks() {
		const tlTitle = new TimelineMax();
		let delayTitle = 0;
		// for (let i = 0; i < this.splitTitle.chars.length; i++) {

		// 	tlTitle.add(() => {
		// 		this.splitTitle.chars[i].classList.add('is-anim');
		// 	}, delayTitle);

		// 	delayTitle += 0.07;
		// }

		// delayTitle = 0;
		// const splitTextsWords = document.querySelectorAll('.about__intro p > *');
		// console.log(splitTextsWords);

		// for (let i = 0; i < this.splitTexts.words.length; i++) {

		// 	tlTitle.add(() => {
		// 		splitTextsWords[i].classList.add('is-anim');
		// 	}, 0.5 + delayTitle);

		// 	delayTitle += 0.01;
		// }

		delayTitle = 0;
		const splitP = document.querySelectorAll('.about__work__top > span:first-child');
		const splitDescr = document.querySelectorAll('.about__work__descr');
		const splitBtn = document.querySelectorAll('.about__work .about__button');


		for (let i = 0; i < splitP.length; i++) {

			tlTitle.add(() => {
				let delayWords = 0;
				const tlWords = new TimelineMax();

				for (let y = 0; y < splitP[i].children.length; y++) {

					tlWords.add(() => {
						splitP[i].children[y].classList.add('is-anim');
					}, delayWords);
					delayWords += 0.015;

				}

				let delayDescr = 0;
				const tlDescr = new TimelineMax();

				for (let y = 0; y < splitDescr[i].children.length; y++) {

					tlDescr.add(() => {
						splitDescr[i].children[y].classList.add('is-anim');
					}, delayDescr);
					delayDescr += 0.1;

				}

				splitBtn[i].classList.add('is-anim');

			}, delayTitle);

			delayTitle += 0.3;
		}

		// tlTitle.add(() => {
		// 	this.ui.more.classList.add('is-anim');
		// });
	}

	scroll(e) {

		if (this.stopScrollZ === true) return false;

		if (e.deltaY > 30 || e.deltaY < -30 ) { ///!\ depend of Browsers clamp value.
			this.scrollZ += clamp(e.deltaY * 0.04, -6, 6); //reverse

			// if (this.id === 0) this.scrollZ = Math.min(this.zoomZ, this.scrollZ); // cannot scroll supp zoomZ

		}

		if (this.moreOpen !== true || this.noscroll === true) {
			this.scrollY = 0;
			return false;
		}

		if (Device.touch === false) {
			// need profil for each browser
			let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

			if (isFirefox) {
				this.scrollY -= e.deltaY * 0.9;
			} else {
				this.scrollY -= e.deltaY * 0.17;
			}
		}

	}

	onTouchStartContainer(e) {
		e.stopPropagation();

		let touchobj = e.changedTouches[0];
		this.startTouchY = parseInt(touchobj.clientY);
	}

	onTouchMoveContainer(e) {
		// e.preventDefault();
		let touchobj = e.changedTouches[0];// reference first touch point for this event
		let y = parseInt(touchobj.clientY) - this.startTouchY + this.lastTouchY;

		this.scrollY = -y * 1.5;

	}

	onTouchEndContainer(e) {
		let touchobj = e.changedTouches[0];// reference first touch point for this event

		this.lastTouchY = parseInt(touchobj.clientY) - this.startTouchY + this.lastTouchY;
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

		// on scroll Z
		// smooth scroll
		if (this.scrollZ !== 0 || this.scrollY !== 0) {

			if (this.noscroll === true || this.moreOpen !== true && this.noscroll !== true) {
				if (round(this.scrollZ, 10) !== round(this.scrollZSmooth, 10))  {
					// console.log(round(this.scrollZ, 10), this.scrollZSmooth);

					// smooth scroll
					this.scrollZSmooth += (this.scrollZ - this.scrollZSmooth) * this.coefScrollZ; // We need a RAF for a smooth like that

					if (this.scrollZSmooth > this.zoomZ) { // going backward

						if (this.stopScrollZ !== true ) {
							// this.transitionOutScrolled = true;
							this.stopScrollZ = true;
							this.goToNoScroll = true;
							this.dir = 1;
							window.location.href = `#${DATA.projects[3].slug}`;

						}
					}

				}
			}

			// on scroll Content
			if (round(this.scrollY, 10) !== round(this.scrollYSmooth, 10))  {

				// smooth scroll
				this.scrollYSmooth += (this.scrollY - this.scrollYSmooth) * this.coefScrollY; // We need a RAF for a smooth like that

				if (this.scrollYSmooth >= this.ui.worksWrap.offsetHeight - window.innerHeight + this.margeScrollY) { // end
					this.scrollY = this.scrollYSmooth = this.ui.worksWrap.offsetHeight - window.innerHeight + this.margeScrollY;
					TweenMax.to(this.ui.worksWrap, 0.4, { y: -this.scrollYSmooth}); // smooth it
				} else if (this.scrollYSmooth < 0) { // top
					this.scrollY = this.scrollYSmooth = 0;
					TweenMax.to(this.ui.worksWrap, 0.4, { y: -this.scrollYSmooth}); // smooth it
				} else {
					TweenMax.set(this.ui.worksWrap, { y: -this.scrollYSmooth});
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

		if ( RouterManager.fromUrl !== true) {
			tl.add(() => {
				global.OVERLAY.classList.remove('visible');
			}, 0);
		}

		tl.add(() => {
			this.moveCameraIn();
		}, 0);

		tl.add(() => {
			if (global.MENU.el.classList.contains('is-anim') === false && Device.orientation !== 'portrait') {
				global.MENU.el.classList.add('is-anim');
				TweenMax.set('.navigate', {display: 'block', delay: 2});
			}
		}, 1);

	}

	moveCameraIn(dest) {

		const delay = RouterManager.fromUrl === true ? 2 : 0.5;

		const tl = new TimelineMax({
			onComplete: () => {
				// this.transitionOut();

			},
			delay: 0
		});
		tl.fromTo(this.camera.position, 5, {y: this.maxZoom - 100 }, {y: this.minZoom, ease: window.Expo.easeOut});
		tl.set(this.ui.introWrap, {display : 'block'} , delay);
		tl.staggerFromTo(this.targetsIntro, 2, {y: 120 }, {y: 0, ease: window.Expo.easeOut}, 0.04, delay);
		tl.staggerFromTo(this.targetsIntro, 0.5, {opacity: 0},{opacity: 1, ease: window.Linear.easeNone}, 0.04, delay);

		tl.add(() => {
			this.animIntro();

		}, delay);
		// sound
		global.SOUNDS['switch_long'].play();

	}

	transitionOut(dest) {
		// this.resetWater();

		const tl = new TimelineMax({delay: 0});

		tl.staggerTo([...this.targetsIntro, this.ui.more], 2, {y: -120, ease: window.Power4.easeOut}, 0.04);
		tl.staggerTo([...this.targetsIntro, this.ui.more], 0.5, {opacity: 0, ease: window.Linear.easeNone}, 0.04, 0);
		tl.set(this.ui.introWrap, {display : 'none'});
		tl.staggerTo(this.targetsWorks, 1.7, {y: -120, ease: window.Power4.easeOut}, 0.04);
		tl.staggerTo(this.targetsWorks, 0.5, {opacity: 0, ease: window.Linear.easeNone}, 0.04, 0);
		tl.set(this.ui.worksWrap, {display : 'none'});

		tl.fromTo(this.camera.position, 2, {y: this.minZoom }, {y: this.maxZoom - 150, ease: window.Expo.easeOut}, 0);
		tl.add(() => {
			global.OVERLAY.classList.add('visible');
		}, 0.5);
		tl.add(() => {
			EmitterManager.emit('view:transition:out');
		}, 1.5);

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
