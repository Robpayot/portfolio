// import { Object3D, Mesh } from 'three';
import EmitterManager from '../managers/EmitterManager';
import Handlebars from 'handlebars';
import PreloadManager from '../managers/PreloadManager';
import dat from 'dat-gui';
import { getRandom, clamp } from '../helpers/utils';

export default class Glitch {

	constructor(obj) {

		// test cursor

		// const circle1 = document.querySelector('.circle1');
		// const circle2 = document.querySelector('.circle2');

		// let viewportOffset = circle1.getBoundingClientRect();
		// // these are relative to the viewport, i.e. the window
		// let top = viewportOffset.top;
		// let left = viewportOffset.left;
		// console.log(viewportOffset);
		// let marge = 20;

		// let minPointX = viewportOffset.left - viewportOffset.width / 2;
		// let maxPointX = viewportOffset.left + viewportOffset.width;
		// let minPointY = viewportOffset.top - viewportOffset.height / 2;
		// let maxPointY = viewportOffset.top + viewportOffset.height;

		// const svg = document.querySelector('.cursor');
		// const svgCircle = svg.querySelectorAll('circle');
		// const c1 = svgCircle[0];
		// const c2 = svgCircle[1];
		// this.circleObj = {val : 15.9};
		// this.cursorTarget = { x: 0, y: 0};
		// this.cursorSmooth = { x: 0, y: 0};

		// document.addEventListener('mousemove', (e) => {
		// 	const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		// 	const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		// 	if (this.hasDelay === true) {
		// 		// Specify target we want
		// 		// à faire dans un raf
		// 		this.cursorTarget.x = eventX;
		// 		this.cursorTarget.y = eventY;

		// 		if (this.cursorTarget.x === this.cursorSmooth.x && this.cursorTarget.y === this.cursorSmooth.y) {
		// 			this.hasDelay = false;
		// 			console.log('delay false !!!')
		// 		}

		// 		// Smooth it with deceleration
		// 		this.cursorSmooth.x += (this.cursorTarget.x - this.cursorSmooth.x) * 0.08;
		// 		this.cursorSmooth.y += (this.cursorTarget.y - this.cursorSmooth.y) * 0.08;

		// 		svg.style.left = this.cursorSmooth.x;
		// 		svg.style.top = this.cursorSmooth.y;

				
				
		// 	} else {

		// 		if (this.stopFollow !== true) {
		// 			svg.style.left = this.cursorSmooth.x = eventX;
		// 			svg.style.top = this.cursorSmooth.y = eventY;
		// 		}

				
		// 	}


		// 	if (eventX + marge > minPointX && eventX < maxPointX + marge && eventY + marge > minPointY && eventY < maxPointY + marge) {
		// 		if (svg.classList.contains('is-hover') === false) {
		// 			svg.classList.add('is-hover');
		// 			// this.hasDelay = true;
		// 			this.stopFollow = true;
		// 			TweenMax.to(svg, 0.5, {left: viewportOffset.left + viewportOffset.width / 2, top: viewportOffset.top + viewportOffset.height / 2});
		// 			TweenMax.to(this.cursorSmooth, 0.5, {x: viewportOffset.left + viewportOffset.width / 2, y: viewportOffset.top + viewportOffset.height / 2});
		// 			TweenMax.to(this.circleObj, 0.8, { val: 50, onUpdate:() => {
		// 				console.log(this.circleObj.val);
		// 				c1.setAttribute('r', this.circleObj.val);
		// 				c2.setAttribute('r', this.circleObj.val);
		// 			}});
		// 			TweenMax.to(circle1, 0.5, {borderWidth: 0});
		// 		}
		// 	} else {
		// 		if (svg.classList.contains('is-hover') === true) {
		// 			svg.classList.remove('is-hover');
		// 			this.stopFollow = false;
		// 			this.hasDelay = true;
		// 			// TweenMax.to(svg, 0.5, {left: eventX, top: eventY});
		// 			TweenMax.to(this.circleObj, 0.8, { val: 15.9, onUpdate:() => {
		// 				c1.setAttribute('r', this.circleObj.val);
		// 				c2.setAttribute('r', this.circleObj.val);

		// 				// this.hasDelay = false;
		// 			}});
		// 			TweenMax.to(circle1, 0.5, {borderWidth: 1});
		// 		}
		// 	}

		// });

		// test icon menu

		// const svg = document.querySelectorAll('.test-svg');
		// const maxDash = 635;
		// let anim = false;
		// let hover = false;
		// svg.forEach((el) => {

		// 	el.addEventListener('mouseover', () => {


		// 		if (hover === true) return false;
		// 		if (anim === true) return false;
		// 		console.log('hover');
		// 		anim = true;
		// 		hover = true;
		// 		const tl = new TimelineMax();
		// 		if (el.classList.contains('is-close')) {

		// 			tl.to('.close-up', 1, {strokeDashoffset: -maxDash * 2, ease: window.Power4.easeInOut}, 0 );
		// 			tl.to('.close-down', 1.2, {strokeDashoffset: maxDash * 3 + 205, ease: window.Power4.easeInOut}, 0.1);
		// 			tl.set(['.close-up','.close-down','.open-up','.open-down'], {clearProps: 'all'});
		// 			tl.add(()=> {
		// 				anim = false;
		// 			});
		// 		} else if (el.classList.contains('is-open')) {
		// 			tl.to('.open-up', 1, {strokeDashoffset: maxDash * 2, ease: window.Power4.easeInOut}, 0 );
		// 			tl.to('.open-down', 1.2, {strokeDashoffset: -maxDash - 205, ease: window.Power4.easeInOut}, 0.1);
		// 			tl.set(['.close-up','.close-down','.open-up','.open-down'], {clearProps: 'all'});
		// 			tl.add(()=> {
		// 				anim = false;
		// 			});
		// 		} else if (el.classList.contains('is-live')) {

		// 			tl.to('.close-down-2', 0.8, {strokeDashoffset: maxDash * 3 - 100, ease: window.Expo.easeInOut }, 0);
		// 			tl.to('.close-down', 0.9, {strokeDashoffset: maxDash * 2 - 180, ease: window.Expo.easeInOut }, 0.1);
		// 			tl.to('.close-up', 1, {strokeDashoffset: -maxDash * 3 - 205, ease: window.Expo.easeInOut }, 0.2);
		// 			tl.set(['.close-up','.close-down','.close-down-2','.open-up','.open-down'], {clearProps: 'all'});
		// 			tl.add(()=> {
		// 				anim = false;
		// 			});

		// 		} else if (el.classList.contains('is-down')) {

		// 			tl.to('.down-2', 1.15, {strokeDashoffset: '-236%', ease: window.Expo.easeInOut }, 0);
		// 			tl.to('.down-1', 1, {strokeDashoffset: '-130%', ease: window.Expo.easeInOut }, 0.1);
		// 			tl.set(['.down-1', '.down-2'], {clearProps: 'all'});
		// 			tl.add(()=> {
		// 				anim = false;
		// 			});
		// 		} else if (el.classList.contains('is-up')) {

		// 			tl.to('.up-1', 1.2, {strokeDashoffset: '292%', ease: window.Expo.easeInOut }, 0);
		// 			tl.to('.up-2', 1, {strokeDashoffset: '186%', ease: window.Expo.easeInOut }, 0.1);
		// 			tl.set(['.up-1', '.up-2'], {clearProps: 'all'});
		// 			tl.add(()=> {
		// 				anim = false;
		// 			});
		// 		}

		// 	});

		// 	el.addEventListener('mouseleave', () => {
		// 		console.log('leave');
		// 		hover = false;
		// 		TweenMax.set(['.close-up','.close-down','.close-down-2','.open-down', '.down-1', '.down-2', '.up-1', '.up-2'], {clearProps: 'all'});
		// 	});

		// 	el.addEventListener('click', () => {

		// 		if (anim === true) return false;
		// 		console.log('click');
		// 		anim = true;
		// 		const tl = new TimelineMax();

		// 		if (el.classList.contains('is-close')) {

		// 			tl.to('.close-up', 0.5, {strokeDashoffset: -maxDash, ease: window.Expo.easeInOut });
		// 			tl.to('.close-down', 0.75, {strokeDashoffset: maxDash * 3, ease: window.Expo.easeInOut }, 0);
		// 			tl.to('.open-down', 0.75, {strokeDashoffset: maxDash * 3 - 205, ease: window.Expo.easeInOut}, 0.1 );
		// 			tl.to('.open-up', 0.5, {strokeDashoffset: 0, ease: window.Expo.easeInOut}, 0.45);
		// 			tl.add(()=> {
		// 				el.classList.add('is-open');
		// 				el.classList.remove('is-close');
		// 				TweenMax.set(['.close-up','.close-down','.open-up','.open-down'], {clearProps: 'all'});
		// 				anim = false;
		// 			});

		// 		} else {

		// 			tl.to('.open-up', 0.4, {strokeDashoffset: maxDash, ease: window.Expo.easeInOut });
		// 			tl.to('.open-down', 0.65, {strokeDashoffset: -maxDash, ease: window.Expo.easeInOut }, 0);
		// 			tl.to('.close-up', 0.65, {strokeDashoffset: maxDash * 2, ease: window.Expo.easeInOut}, 0.1 );
		// 			tl.to('.close-down', 0.9, {strokeDashoffset: -maxDash + 205, ease: window.Expo.easeInOut}, 0.1);
		// 			tl.add(()=> {
		// 				el.classList.remove('is-open');
		// 				el.classList.add('is-close');
		// 				TweenMax.set(['.close-up','.close-down','.open-up','.open-down'], {clearProps: 'all'});
		// 				anim = false;
		// 			});
		// 		}


		// 	});

		// });

		// return false;

		// Load data
		this.obj = obj;
		this.el = obj.el;
		this.color = obj.color;
		this.sndColor = obj.sndColor;
		this.txt = obj.txt;
		this.sndTxt = obj.sndTxt;
		this.debug = obj.debug;
		this.clock = obj.clock;
		this.stop = obj.stop;

		this.el.style.display = 'block';

		// bind
		this.render = this.render.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);

		if (this.debug !== true) {
			this.start();
		} else {
			// Preloader
			this.preloadCb = PreloadManager.on('complete', this.start, this, true);

			let prod;

			if (window.location.host === 'robpayot.github.io') {
				prod = true;

			}

			let base = prod === true ? 'https://robpayot.github.io/xp-son/dist' : '';

			console.log(`${base}/templates/glitch.hbs`, Handlebars);


			PreloadManager.loadManifest([
				{ id: 'template-glitch', src: `${base}/templates/glitch.hbs` }
			]);

			PreloadManager.load();
		}


	}


	events(method) {

		// let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.render);



	}

	start() {

		if (this.debug === true) {
			let template = Handlebars.compile(PreloadManager.getResult('template-glitch'));
			let html  = template();
			// console.log(html);

			this.el.innerHTML = html;
		}

		this.ui = {
			xp: document.querySelector('.xp'),
			img: document.querySelector('.glitch__img'),
			img2: document.querySelector('.glitch__img-2'),
			imgAlpha: document.querySelector('.glitch__img-3'),
			canvas: this.el.querySelector('.glitch__canvas'),
			canvasBuffer: this.el.querySelector('.glitch__canvas-buffer'),
			canvasAlphaBuffer: this.el.querySelector('.glitch__canvas-alpha-buffer'),
		};
		// From Nathan Gordon (y)
		// //Create a canvas that is to become our reference image
		// const baseCanvas = document.createElement('canvas');
		// baseCanvas.width = 600;
		// baseCanvas.height = 200;
		// const basectx = baseCanvas.getctx('2d');
		this.textHeight = this.textSize; // need a real calcul
		this.last = 0;

		if (this.obj.type === 'intro') {
			this.introTxt = PreloadManager.getResult('introTxt');
		} else {
			this.ui.img = PreloadManager.getResult('glitchTex');
		}

		this.init();

		// console.log(PreloadManager.getResult('svg'));
	}

	setAlphaVideo() {

		this.video = document.createElement('video');
		this.video.id = 'video2';
		this.video.src = 'videos/glitch-text2-slow.mp4';
		this.video.autoplay = true;
		this.video.loop = true;
		this.video.muted = true;
		this.el.appendChild(this.video);

	}

	init() {

		this.ctx = this.ui.canvas.getContext('2d');
		if (this.ui.canvasBuffer) this.ctxBuffer = this.ui.canvasBuffer.getContext('2d');
		if (this.ui.canvasAlphaBuffer) this.ctxAlphaBuffer = this.ui.canvasAlphaBuffer.getContext('2d');

		this.initOptions();
		// set up alpha video
		this.setAlphaVideo();
		this.resizeHandler();

		if (this.debug === true) {
			this.events(true);

		} else {
			this.render();
		}

	}

	initOptions() {

		// const gui = new dat.GUI(),
		// 	current = gui.addFolder('Current'),
		// 	controls = gui.addFolder('Controls');


		this.fps = 60;

		this.channel = 0; // 0 = red, 1 = green, 2 = blue
		this.compOp = 'lighter'; // CompositeOperation = lighter || darker || xor
		this.phase = 5.0;
		this.phaseStep = 0.2; //determines how often we will change channel and amplitude
		this.amplitude = 0.0;
		this.amplitudeBase = 2; //2.0;
		this.amplitudeRange = 3; // 2.0;
		this.alphaMin = 0.8;

		this.glitchAmplitude = 20.0;
		this.glitchThreshold = 0.9;
		this.scanlineBase = 40;
		this.scanlineRange = 40;
		this.scanlineShift = 15;

		// current.add(this, 'channel', 0, 2).listen();
		// current.add(this, 'phase', 0, 1).listen();
		// current.add(this, 'amplitude', 0, 5).listen();
		// // comment out below to hide ability to change text string
		// // var text = controls.add(this, 'text');
		// // text.onChange((function (){
		// // 	this.textWidth = (this.ctx.measureText(this.text)).width;
		// // }).bind(this));
		// // comment out above to hide ability to change text string
		// controls.add(this, 'fps', 1, 60);
		// controls.add(this, 'phaseStep', 0, 1);
		// controls.add(this, 'alphaMin', 0, 1);
		// controls.add(this, 'amplitudeBase', 0, 5);
		// controls.add(this, 'amplitudeRange', 0, 5);
		// controls.add(this, 'glitchAmplitude', 0, 100);
		// controls.add(this, 'glitchThreshold', 0, 1);
		// controls.open();
		// gui.close(); // start the control panel cloased
	}

	render() {

		// console.log('render');


		this.phase += this.phaseStep;

		const frequency = getRandom(3.2, 4);

		if (this.phase > frequency) { // time for each channel
			this.phase = 0.0;
			this.channel = this.channel === 2 ? 0 : this.channel + 1;
			this.amplitude = this.amplitudeBase + this.amplitudeRange * Math.random();
		}

		// clear temp context
		this.ctx.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

		switch (this.channel) {
			case 0:
				this.renderChannels();
				break;
			case 1:
				this.renderChannels();
				break;
			case 2:
				this.renderChannels();
				break;
		}


		// if (calm === true) {
		// 	this.renderScanline();
		// 	if (Math.floor(Math.random() * 2) > 1) {
		// 		this.renderScanline();
		// 		// renders a second scanline 50% of the time
		// 	}
		// }
	}


	renderChannels() {

		const top = 0; // top of image
		const centerY = this.height / 2 + this.textHeight / 2;
		// let margeStart = this.textWidth * 0.2;
		let startClip = (this.width - this.textWidth) / 2 ;

		// const arr = [{
		// 	channel:[{
		// 		margeX: getRandom(350, 400),
		// 		posX: getRandom(30, 80), // 50
		// 		posY: getRandom(-10, -30),
		// 		width: 0
		// 	}, {
		// 		margeX: getRandom(350, 450),
		// 		posX: getRandom(0, -20), // 50
		// 		posY: getRandom(0, 20),
		// 		width: 0
		// 	}, {
		// 		margeX: getRandom(350, 400),
		// 		posX: getRandom(30, 80), // 50
		// 		posY: getRandom(-10, -30),
		// 		width: 0
		// 	}]
		// }];

		if (this.stop === true) {

			if (this.obj.type === 'intro') return false;
			// DEFAULT value
			// Just text and image alpha mask, no glitch
			// this.ctxBuffer.save();
			this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

			this.ctxBuffer.fillStyle = this.color;
			// this.ctxBuffer.drawImage(this.imageAlpha, (this.width - this.textWidth) / 2, top, this.textWidth + 30, this.height);
			// this.ctxBuffer.putImageData(this.imageAlpha, (this.width - this.textWidth) / 2, top, 0, 0, this.textWidth + 30, this.height);
			// this.ctxBuffer.globalCompositeOperation = 'destination-atop';
			this.ctxBuffer.fillText(this.text, (this.width - this.textWidth) / 2, centerY); // First Text
			// this.ctxBuffer.fillStyle = 'rgba(255, 0, 0, 0.1)';

			this.ctx.drawImage(this.ui.canvasBuffer, 0, 0); // add First comp

			return false;
		}

		if (this.ctxAlphaBuffer && this.obj.type === 'intro') {
			// alpha video
			// this.ctxAlphaBuffer.save();
			// this.ctxAlphaBuffer.clearRect(0, 0, this.videoWidth, this.videoHeight);
			this.ctxAlphaBuffer.beginPath();

			this.ctxAlphaBuffer.drawImage(this.video, 0, 0, this.videoWidth, this.videoHeight);
			this.imageAlpha = this.ctxAlphaBuffer.getImageData(0, 0, this.videoWidth, this.videoHeight / 2); // --> top part of video
			this.imageData = this.imageAlpha.data;
			this.alphaData = this.ctxAlphaBuffer.getImageData(0, this.videoHeight / 2, this.videoWidth, this.videoHeight / 2).data; // --> bottom part 50/50
			// r.p : We select the second half
			// we apply alpha
			this.imageDataLenght = this.imageData.length; // --> cached data for perf
			for (let i = 3; i < this.imageDataLenght; i += 4) { // why 3 and 4 ? RGB ?
				this.imageData[i] = this.alphaData[i - 1];
			}
			// this.ctxAlphaBuffer.restore();

			// Txt as an image --> Better perf
			// this.ctx.save();
			// this.ctx.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
			this.ctx.beginPath(); // avoid Drop fps

			// this.ctx.fillStyle = this.color;
			// this.ctx.drawImage(this.imageAlpha, (this.width - this.textWidth) / 2, top, this.textWidth + 30, this.height);
			this.ctx.putImageData(this.imageAlpha, 0, 0, 0, 0, this.width, this.height);
			this.ctx.globalCompositeOperation = 'source-in';

			// old
			// this.ctx.font = this.ctx.font = this.font;
			// this.ctx.fillText(this.text, (this.width - this.textWidth) / 2, centerY - 30); // First Text
			this.ctx.drawImage(this.introTxt, 0, 0, this.width, this.height);
			// this.ctx.restore();

			return false;
		}

		// offset gesture
		this.margeX1 = this.randomTimed(this.textWidth * 0.2, this.textWidth * 0.3, this.margeX1);
		this.posX1 =  this.randomTimed(30, 80, this.posX1); // 50
		this.posY1 =  this.randomTimed(-5, -15, this.posY1); // -20
		this.margeX12 =  this.randomTimed(this.textWidth * 0.25, this.textWidth * 0.35, this.margeX12);
		this.posX12 =  this.randomTimed(0, -20, this.posX12); // -10
		this.posY12 =  this.randomTimed(0, 20, this.posY12); // 10


		this.margeX2 =  this.randomTimed(this.textWidth * 0.2, this.textWidth * 0.3, this.margeX2);
		// this.posX2 =  this.randomTimed(x2, x2, this.);
		// this.posY2 =  this.randomTimed(0, 0, this.);
		this.width2 =  this.randomTimed(this.textWidth * 0.6, this.textWidth * 0.25, this.width2);
		this.width22 =   this.randomTimed(this.textWidth * 0.4, this.textWidth * 0.25, this.width22);
		// this.posX22 =  this.randomTimed(x2, x2, this.);
		// this.posY22 =  this.randomTimed(0, 0, this.);

		this.margeX3 = this.randomTimed(-this.textWidth * 0.2, -this.textWidth * 0.3, this.margeX3);
		this.posX3 =  this.randomTimed(30, -30, this.posX3);
		this.posY3 =  this.randomTimed(30, -10, this.posY3);
		this.width3 =  this.randomTimed(this.textWidth * 0.6, this.textWidth * 0.25, this.width3);
		this.margeX32 = this.randomTimed(-this.textWidth * 0.2, -this.textWidth * 0.3, this.margeX32);
		this.posX32 =  this.randomTimed(-10, -20, this.posX32);
		this.posY32 =  this.randomTimed(-20, 30, this.posY32);
		this.width32 = this.textWidth * 0.5;

		this.margeX4 = this.randomTimed(-this.textWidth * 0.3, -this.textWidth * 0.4, this.margeX4);
		this.posX4 =  this.randomTimed(-80, -30, this.posX4);
		this.posY4 =  this.randomTimed(-30, -10, this.posY4);
		this.width4 =  this.randomTimed(this.textWidth * 0.4, this.textWidth * 0.5, this.width4);

		this.margeX5 =  this.randomTimed(this.textWidth * 0.7, this.textWidth * 0.8, this.margeX5);
		this.posX5 =  this.randomTimed(10, 20, this.posX5);
		this.posY5 =  this.randomTimed(10, 20, this.posY5);
		this.width5 =  this.randomTimed(this.textWidth * 0.2, this.textWidth * 0.2, this.width5);


		// Draw First Comp
		// Start of Text, Offset Left, white, with image
		this.ctxBuffer.save();
		this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxBuffer.beginPath(); // avoid Drop fps

		this.ctxBuffer.fillStyle = this.sndColor;

		if (this.channel === 2) {

			this.ctxBuffer.rect(startClip + this.margeX12.val,0, this.textWidth, this.height); // create clip rectangle
			this.ctxBuffer.clip();
			// this.ctxBuffer.putImageData(this.imageAlpha, startClip + this.margeX12.val + 2, top, 0, 0, this.textWidth - 2, this.height);
			this.ctxBuffer.drawImage(this.ui.img, startClip + this.margeX12.val + 2, top, this.textWidth - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'source-in';
			this.ctxBuffer.fillText(this.text, startClip + this.posX12.val, centerY + this.posY12.val);
		} else {

			this.ctxBuffer.rect(startClip + this.margeX1.val,0, this.textWidth, this.height); // create clip rectangle
			this.ctxBuffer.clip();
			// this.ctxBuffer.putImageData(this.imageAlpha, startClip + this.margeX1.val + 2, top, 0, 0, this.textWidth - 2 , this.height);
			this.ctxBuffer.drawImage(this.ui.img,  startClip + this.margeX1.val + 2, top, this.textWidth - 2 , this.height);
			this.ctxBuffer.globalCompositeOperation = 'source-in';
			this.ctxBuffer.fillText(this.text, startClip + this.posX1.val, centerY + this.posY1.val);
		}

		this.ctxBuffer.restore();

		this.ctx.drawImage(this.ui.canvasBuffer, 0, 0);

		// Draw Second Comp
		// DEFAULT
		// Normal Text, center white, with image
		this.ctxBuffer.save();
		this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);
		this.ctxBuffer.beginPath();

		this.ctxBuffer.fillStyle = this.color;

		if (this.channel === 0) {
			this.ctxBuffer.rect(startClip + this.margeX2.val, top, this.width2.val, this.height); // create clip rectangle
			this.ctxBuffer.clip();
			// Draw image that gonna be use as mask.
			// this.ctxBuffer.putImageData(this.imageAlpha, startClip + this.margeX2.val + 2, top, 0, 0, this.width2.val - 2, this.height);
			this.ctxBuffer.drawImage(this.ui.img, startClip + this.margeX2.val + 2, top, this.width2.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'source-in';
		} else if (this.channel === 2) {
			this.ctxBuffer.rect(startClip, 0, this.width22.val, this.height); // create clip rectangle
			this.ctxBuffer.clip();
			// this.ctxBuffer.putImageData(this.imageAlpha, startClip + 2, top, 0, 0, this.width22.val - 2, this.height);
			this.ctxBuffer.drawImage(this.ui.img, startClip + 2, top, this.width22.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'source-in';
		} else {
			// this.ctxBuffer.putImageData(this.imageAlpha, startClip, top, 0, 0, this.textWidth + 30, this.height);
			this.ctxBuffer.drawImage(this.ui.img, startClip, top, this.textWidth + 30, this.height);
			this.ctxBuffer.globalCompositeOperation = 'source-in'; // put the reste on top and mask
		}

		this.ctxBuffer.fillText(this.text, startClip, centerY); // First Text

		this.ctxBuffer.restore();

		this.ctx.drawImage(this.ui.canvasBuffer, 0, 0); // add First comp

		// Draw Third Comp
		// Start of Text, Offset Left, white, with image
		this.ctxBuffer.save();
		this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxBuffer.beginPath(); // avoid Drop fps

		this.ctxBuffer.fillStyle = this.sndColor; // Third Text

		if (this.channel === 1) {

			this.ctxBuffer.rect(startClip + this.margeX3.val,0, this.width3.val,this.height); // create clip rectangle
			this.ctxBuffer.clip();

			// this.ctxBuffer.putImageData(this.imageAlpha, startClip + this.margeX3.val + 2, centerY + this.posY3.val - this.textHeight , 0, 0, this.width3.val - 2, this.height);
			this.ctxBuffer.drawImage(this.ui.img, startClip + this.margeX3.val + 2, centerY + this.posY3.val - this.textHeight, this.width3.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'source-in';
			this.ctxBuffer.fillText(this.text, startClip + this.posX3.val, centerY + this.posY3.val);
		} else {

			this.ctxBuffer.rect(startClip + this.margeX32.val,0, this.width32.val - 10,this.height); // create clip rectangle
			this.ctxBuffer.clip();

			// this.ctxBuffer.putImageData(this.imageAlpha, startClip + this.margeX32.val + 2, centerY + this.posY32.val - this.textHeight , 0, 0, this.width32.val - 2, this.height);
			this.ctxBuffer.drawImage(this.ui.img, startClip + this.margeX32.val + 2, centerY + this.posY32.val - this.textHeight, this.width32.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'source-in';
			this.ctxBuffer.fillText(this.text, startClip + this.posX32.val.val, centerY + this.posY32.val);
		}

		this.ctxBuffer.restore();

		this.ctx.drawImage(this.ui.canvasBuffer, 0, 0);

		// Draw Fourth Comp
		// Start of Text, Offset Left, white, with image
		this.ctxBuffer.save();
		this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxBuffer.beginPath(); // avoid Drop fps

		this.ctxBuffer.fillStyle = this.color; // Third Text

		if (this.channel === 1) {

			this.ctxBuffer.rect(startClip + this.margeX4.val, 0, this.width4.val,this.height); // create clip rectangle
			this.ctxBuffer.clip();

			// this.ctxBuffer.putImageData(this.imageAlpha, startClip + this.margeX4.val + 2, top - this.posY4.val - this.textHeight + 50, 0, 0, this.width4.val - 2, this.height);
			this.ctxBuffer.drawImage(this.ui.img, startClip + this.margeX4.val + 2, top - this.posY4.val - this.textHeight + 50, this.width4.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'source-in';
			this.ctxBuffer.fillText(this.text, startClip + this.posX4.val, centerY + this.posY4.val);

		}

		this.ctxBuffer.restore();

		this.ctx.drawImage(this.ui.canvasBuffer, 0, 0);

		// Draw Fifth Comp
		// Start of Text, Offset Left, white, with image
		this.ctxBuffer.save();
		this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxBuffer.beginPath(); // avoid Drop fps

		this.ctxBuffer.fillStyle = this.color; // Third Text

		if (this.channel === 1) {

			this.ctxBuffer.rect(startClip + this.margeX5.val,0, this.width5.val, this.height); // create clip rectangle
			this.ctxBuffer.clip();

			// this.ctxBuffer.putImageData(this.imageAlpha, startClip + this.margeX5.val + 2, top, 0, 0, this.width5.val - 2, this.height);
			this.ctxBuffer.drawImage(this.ui.img, startClip + this.margeX5.val + 2, top, this.width5.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'source-in';
			this.ctxBuffer.fillText(this.text, startClip + this.posX5.val, centerY + this.posY5.val);

		}

		this.ctxBuffer.restore();

		this.ctx.drawImage(this.ui.canvasBuffer, 0, 0);

		if (this.clock.getElapsedTime() >= this.last + 0.035) {
			this.last = this.clock.getElapsedTime();
			this.breakTime = true;

		} else {
			this.breakTime = false;
		}


	}

	randomTimed(val1, val2, obj) {

		let lastVal, val;

		if (!obj) {
			lastVal = val = Math.round(getRandom(val1,val2));
			// console.log('non at all');
		} else {
			lastVal = obj.lastVal;
			// console.log('ok');
			// each 2 seconds call the createNewObject() function
			if (this.breakTime === true) {
				lastVal = Math.round(getRandom(val1,val2));
			}

			val = lastVal;
		}

		return {
			val,
			lastVal
		};

	}

	renderScanline() {

		let y = this.height * Math.random() >> 0,
			o = this.ctx.getImageData(0, y, this.width, 1),
			d = o.data,
			i = d.length,
			s = this.scanlineBase + this.scanlineRange * Math.random() >> 0,
			x = -this.scanlineShift + this.scanlineShift * 2 * Math.random() >> 0;

		while (i-- > 0) {
			d[i] += s;
		}

		this.ctx.putImageData(o, x, y);

		// var imgData = this.ctx.getImageData(10,10,500,500);
		// this.ctx.putImageData(imgData,10,70);
	}

	resizeHandler() {

		// return false;
		//this.height = window.innerHeight;

		if (this.obj.type === 'intro') {
			// this can be done without alphaData, except in Firefox which doesn't like it when image is bigger than the canvas
			// r.p : We select only the first half
			this.width = clamp(window.innerWidth * 0.31, 200, 600); // Higher than 600 its getting laggy a lot
			this.height = this.width * this.introTxt.height / this.introTxt.width;
			this.videoWidth = this.width;
			this.videoHeight = this.width * 2; // square in that case
			if (this.ui.canvasAlphaBuffer.width !== this.videoWidth) {
				this.ui.canvasAlphaBuffer.width = this.videoWidth;
				this.video.width = this.videoWidth;
			}
			if (this.ui.canvasAlphaBuffer.height !== this.videoHeight) {
				this.ui.canvasAlphaBuffer.height = this.videoHeight;
				// this.video.height = this.videoHeight;
			}
		} else {
			this.textSize = this.obj.textSize || this.ui.canvas.offsetHeight / 3;
			this.biggestRange = this.obj.biggestRange || 200; // - 100 max X , +100 max X
			this.textHeight = this.textSize; // need a real calcul
			this.height = this.ui.canvas.offsetHeight;
			this.font = `${this.textSize}px "Theinhardt"`; // Theinhardt
			this.ctxBuffer.font = this.font;
			this.text = this.txt;
			this.textWidth = Math.round((this.ctxBuffer.measureText(this.text)).width);
			this.width = this.textWidth + this.biggestRange;
		}

		if (this.ui.canvas) {
			this.ui.canvas.height = this.height;
			if (this.ui.canvasBuffer) this.ui.canvasBuffer.height = this.height;
			// this.ui.canvasAlphaBuffer.height = this.width;
			// this.ui.canvasAlphaBuffer.style.height = this.height * 2; // retina

			this.ui.canvas.width = this.width;
			if (this.ui.canvasBuffer) this.ui.canvasBuffer.width = this.width;
			// this.ui.canvasAlphaBuffer.width = this.width;
			// this.ui.canvasAlphaBuffer.style.width = this.width * 2; // retina

			this.ctx.font = this.font;
			if (this.ctxBuffer) this.ctxBuffer.font = this.font;
		}

	}

	isHover() {

		return this.hover;
	}

}




