// import { Object3D, Mesh } from 'three';
import EmitterManager from '../managers/EmitterManager';
import Handlebars from 'handlebars';
import PreloadManager from '../managers/PreloadManager';
import dat from 'dat-gui';
import { getRandom } from '../helpers/utils';

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
		this.el = obj.el;
		this.color = obj.color;
		this.txt = obj.txt;
		this.debug = obj.debug;
		this.clock = obj.clock;

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
				{ id: 'template-glitch', src: `templates/glitch.hbs` },
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
			console.log(this.el.querySelector('.glitch__canvas'));
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
		console.log(this.el, this.clock);
		// Nathan Gordon <3
		// //Create a canvas that is to become our reference image
		// const baseCanvas = document.createElement('canvas');
		// baseCanvas.width = 600;
		// baseCanvas.height = 200;
		// const basectx = baseCanvas.getctx('2d');

		this.textSize = this.ui.canvas.offsetHeight / 3;
		this.textHeight = this.textSize; // need a real calcul
		this.last = 0;

		this.init();

	}

	setAlphaVideo() {

		this.video = document.createElement('video');
		this.video.id = 'video2';
		this.video.src = 'videos/glitch-text.mp4';
		this.video.autoplay = true;
		this.video.loop = true;
		this.video.muted = true;
		this.el.appendChild(this.video);

	}

	init() {

		this.ctx = this.ui.canvas.getContext('2d');
		this.ctxBuffer = this.ui.canvasBuffer.getContext('2d');
		this.ctxAlphaBuffer = this.ui.canvasAlphaBuffer.getContext('2d');

		this.initOptions();
		this.resizeHandler();
		// set up alpha video
		this.setAlphaVideo();

		if (this.debug === true) {
			this.events(true);
		} else {
			this.render();
		}

	}

	initOptions() {

		const gui = new dat.GUI(),
			current = gui.addFolder('Current'),
			controls = gui.addFolder('Controls');


		this.fps = 60;

		this.channel = 0; // 0 = red, 1 = green, 2 = blue
		this.compOp = 'lighter'; // CompositeOperation = lighter || darker || xor
		this.phase = 0.0;
		this.phaseStep = 0.05; //determines how often we will change channel and amplitude
		this.amplitude = 0.0;
		this.amplitudeBase = 2; //2.0;
		this.amplitudeRange = 3; // 2.0;
		this.alphaMin = 0.8;
		this.biggestRange = 200; // - 100 max X , +100 max X

		this.glitchAmplitude = 20.0;
		this.glitchThreshold = 0.9;
		this.scanlineBase = 40;
		this.scanlineRange = 40;
		this.scanlineShift = 15;

		current.add(this, 'channel', 0, 2).listen();
		current.add(this, 'phase', 0, 1).listen();
		current.add(this, 'amplitude', 0, 5).listen();
		// comment out below to hide ability to change text string
		// var text = controls.add(this, 'text');
		// text.onChange((function (){
		// 	this.textWidth = (this.ctx.measureText(this.text)).width;
		// }).bind(this));
		// comment out above to hide ability to change text string
		controls.add(this, 'fps', 1, 60);
		controls.add(this, 'phaseStep', 0, 1);
		controls.add(this, 'alphaMin', 0, 1);
		controls.add(this, 'amplitudeBase', 0, 5);
		controls.add(this, 'amplitudeRange', 0, 5);
		controls.add(this, 'glitchAmplitude', 0, 100);
		controls.add(this, 'glitchThreshold', 0, 1);
		controls.open();
		gui.close(); // start the control panel cloased
	}

	render(calm = true) {


		this.phase += this.phaseStep;

		const frequency = getRandom(0.2, 2);

		if (this.phase > frequency) { // time for ezch channel
			this.phase = 0.0;
			this.channel = this.channel === 2 ? 0 : this.channel + 1;
			this.amplitude = this.amplitudeBase + this.amplitudeRange * Math.random();
		}

		let x0 = this.amplitude * Math.sin(Math.PI * 2 * this.phase) >> 0, x1, x2, x3;

		if (Math.random() >= this.glitchThreshold) {
			x0 *= this.glitchAmplitude;
		}

		x1 = this.width - this.textWidth >> 1;
		x2 = x1 + x0;
		x3 = x1 - x0;

		// console.log(x3);
		// change de channel chaque seconde.
		// x1 = placement classique
		// x2 = variant Math.random range + amplitude
		// x3 = variant 2 Math.random range + amplitude


		// console.log(x1, x2, x3, this.channel);

		// clear temp context
		this.ctx.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

		switch (this.channel) {
			case 0:
				this.renderChannels(x1, x2, x3, calm);
				break;
			case 1:
				this.renderChannels(x2, x3, x1, calm);
				break;
			case 2:
				this.renderChannels(x3, x1, x2, calm);
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


	renderChannels(x1, x2, x3, calm) {

		// It's important to note that a canvas context can only support one composite operation throughout its life cycle.
		// if we want to use multiple composite operations, as this tutorial does, we need to apply the operations on a hidden canvas and then copy the results onto a visible canvas.
		// alpha video
		if (this.ctxAlphaBuffer) {
			// console.log(this.textWidth, this.height);
			// this.ui.canvasAlphaBuffer.width = 980;

			// this can be done without alphaData, except in Firefox which doesn't like it when image is bigger than the canvas
			// r.p : We select only the first half
			let videoWidth = this.width;
			let videoHeight = this.width * 2;
			if (this.ui.canvasAlphaBuffer.width !== videoWidth) {
				this.ui.canvasAlphaBuffer.width = videoWidth;
				this.video.width = videoWidth;
			}
			if (this.ui.canvasAlphaBuffer.height !== videoHeight) {
				this.ui.canvasAlphaBuffer.height = videoHeight;
				// this.video.height = videoHeight;
			}

			this.ctxAlphaBuffer.drawImage(this.video, 0, 0, videoWidth, videoHeight);
			// console.log(this.ui.canvasAlphaBuffer.width);
			this.imageAlpha = this.ctxAlphaBuffer.getImageData(0, 0, videoWidth, videoHeight / 2); // --> top part of video
			let imageData = this.imageAlpha.data,
				alphaData = this.ctxAlphaBuffer.getImageData(0, videoHeight / 2, videoWidth, videoHeight / 2).data; // --> bottom part 50/50
			// r.p : We select the second half
			// we apply alpha
			for (let i = 3; i < imageData.length; i += 4) { // why 3 and 4 ?
				imageData[i] = alphaData[i - 1];
			}
		}
		// MOST IMPORTANT HERE

		const top = 0; // move image
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


		if (calm === true) {
			// DEFAULT
			// Normal Text, center white, with image
			// this.ctxBuffer.save();
			this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

			this.ctxBuffer.fillStyle = 'rgba(255, 255, 255, 1)';
			// this.ctxBuffer.drawImage(this.ui.imgAlpha, (this.width - this.textWidth) / 2, top, this.textWidth + 30, this.height);
			this.ctxBuffer.putImageData(this.imageAlpha, (this.width - this.textWidth) / 2, top);
			// this.ctxBuffer.globalCompositeOperation = 'source-in';
			this.ctxBuffer.fillText(this.text, (this.width - this.textWidth) / 2, centerY); // First Text
			// this.ctxBuffer.fillStyle = 'rgba(255, 0, 0, 0.1)';

			this.ctx.drawImage(this.ui.canvasBuffer, 0, 0); // add First comp

			return false;
		}

		// Draw First Comp
		// Start of Text, Offset Left, white, with image
		this.ctxBuffer.save();
		this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxBuffer.beginPath(); // avoid Drop fps

		// // // // Ici on veut que une fois sur 3 (tt les 3 seconds ? ou moins, on mais le Y en décallé haut gauche.)
		// // // // et 2 fois sur 3 gauche
		// // // // et par défaut normal
		this.ctxBuffer.fillStyle = this.color; // Third Text

		if (this.channel === 1) {


		} else if (this.channel === 2) {

			this.ctxBuffer.rect(startClip + this.margeX12.val,0, this.textWidth, this.height); // create clip rectangle
			this.ctxBuffer.clip();
			this.ctxBuffer.drawImage(this.ui.imgAlpha, startClip + this.margeX12.val + 2, top, this.textWidth - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'destination-atop';
			this.ctxBuffer.fillText(this.text, startClip + this.posX12.val, centerY + this.posY12.val);
		} else {

			this.ctxBuffer.rect(startClip + this.margeX1.val,0, this.textWidth, this.height); // create clip rectangle
			this.ctxBuffer.clip();
			this.ctxBuffer.drawImage(this.ui.imgAlpha, startClip + this.margeX1.val + 2, top, this.textWidth - 2 , this.height);
			this.ctxBuffer.globalCompositeOperation = 'destination-atop';
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

		this.ctxBuffer.fillStyle = 'rgb(255,255,255)';

		if (this.channel === 0) {
			this.ctxBuffer.rect(startClip + this.margeX2.val, top, this.width2.val, this.height); // create clip rectangle
			this.ctxBuffer.clip();
			// Draw image that gonna be use as mask.
			this.ctxBuffer.drawImage(this.ui.imgAlpha, x3 + this.margeX2.val + 2, top, this.width2.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'destination-atop';
			// this.ctxBuffer.fillText(this.text, x3 + posX2, centerY + posY2);
			// this.ctxBuffer.drawImage(this.ui.imgAlpha, x1, top, this.textWidth + 30, this.textWidth + 30);
		} else if (this.channel === 2) {
			this.ctxBuffer.rect(x3, 0, this.width22.val, this.height); // create clip rectangle
			this.ctxBuffer.clip();
			this.ctxBuffer.drawImage(this.ui.imgAlpha, x3 + 2, top, this.width22.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'destination-atop';
			// this.ctxBuffer.fillText(this.text, x3 + posX22, centerY + posY22);
			// this.ctxBuffer.drawImage(this.ui.imgAlpha, x1, top, this.textWidth + 30, this.textWidth + 30);
		} else {
			this.ctxBuffer.drawImage(this.ui.imgAlpha, x3, top, this.textWidth + 30, this.height);
			this.ctxBuffer.globalCompositeOperation = 'destination-atop'; // put the reste on top and mask

		}

		this.ctxBuffer.fillText(this.text, x3, centerY); // First Text


		// this.ctxBuffer.fillStyle = 'rgb(0,0,0)'; // Black, center, without image
		// this.ctxBuffer.fillText(this.text, x2, centerY); // Second Text

		this.ctxBuffer.restore();

		this.ctx.drawImage(this.ui.canvasBuffer, 0, 0); // add First comp




		// Draw Third Comp
		// Start of Text, Offset Left, white, with image
		this.ctxBuffer.save();
		this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxBuffer.beginPath(); // avoid Drop fps

		this.ctxBuffer.fillStyle = this.color; // Third Text

		if (this.channel === 0) {


		} else if (this.channel === 1) {

			this.ctxBuffer.rect(startClip + this.margeX3.val,0, this.width3.val,this.height); // create clip rectangle
			this.ctxBuffer.clip();

			this.ctxBuffer.drawImage(this.ui.imgAlpha, startClip + this.margeX3.val + 2, centerY + this.posY3.val - this.textHeight , this.width3.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'destination-atop';
			this.ctxBuffer.fillText(this.text, startClip + this.posX3.val, centerY + this.posY3.val);
		} else {

			this.ctxBuffer.rect(startClip + this.margeX32.val,0, this.width32.val - 10,this.height); // create clip rectangle
			this.ctxBuffer.clip();

			this.ctxBuffer.drawImage(this.ui.imgAlpha, startClip + this.margeX32.val + 2, centerY + this.posY32.val - this.textHeight , this.width32.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'destination-atop';
			this.ctxBuffer.fillText(this.text, startClip + this.posX32.val.val, centerY + this.posY32.val);
		}

		this.ctxBuffer.restore();

		this.ctx.drawImage(this.ui.canvasBuffer, 0, 0);



		// Draw Fourth Comp
		// Start of Text, Offset Left, white, with image
		this.ctxBuffer.save();
		this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxBuffer.beginPath(); // avoid Drop fps

		this.ctxBuffer.fillStyle = 'rgb(255,255,255)'; // Third Text

		if (this.channel === 1) {

			this.ctxBuffer.rect(startClip + this.margeX4.val, 0, this.width4.val,this.height); // create clip rectangle
			this.ctxBuffer.clip();

			this.ctxBuffer.drawImage(this.ui.img, startClip + this.margeX4.val + 2, top - this.posY4.val - this.textHeight + 50, this.width4.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'destination-atop';
			this.ctxBuffer.fillText(this.text, startClip + this.posX4.val, centerY + this.posY4.val);

		} else {

		}


		this.ctxBuffer.restore();

		this.ctx.drawImage(this.ui.canvasBuffer, 0, 0);



		// Draw Fifth Comp
		// Start of Text, Offset Left, white, with image
		this.ctxBuffer.save();
		this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxBuffer.beginPath(); // avoid Drop fps

		this.ctxBuffer.fillStyle = 'rgb(255,255,255)'; // Third Text

		if (this.channel === 1) {

			this.ctxBuffer.rect(startClip + this.margeX5.val,0, this.width5.val, this.height); // create clip rectangle
			this.ctxBuffer.clip();

			this.ctxBuffer.drawImage(this.ui.imgAlpha, startClip + this.margeX5.val + 2, top, this.width5.val - 2, this.height);
			this.ctxBuffer.globalCompositeOperation = 'destination-atop';

			this.ctxBuffer.fillText(this.text, startClip + this.posX5.val, centerY + this.posY5.val);

		} else {

		}


		this.ctxBuffer.restore();

		this.ctx.drawImage(this.ui.canvasBuffer, 0, 0);

		if (this.clock.getElapsedTime() >= this.last + 0.035) { // 
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
		this.textSize = this.ui.canvas.offsetHeight / 3;
		this.textHeight = this.textSize; // need a real calcul
		this.height = this.ui.canvas.offsetHeight;
		this.font = `${this.textSize}px "Theinhardt"`; // Theinhardt
		this.ctxBuffer.font = this.font;
		this.text = this.txt;
		this.textWidth = Math.round((this.ctxBuffer.measureText(this.text)).width);
		this.width = this.textWidth + this.biggestRange;

		if (this.ui.canvas) {
			this.ui.canvas.height = this.height;
			this.ui.canvasBuffer.height = this.height;
			// this.ui.canvasAlphaBuffer.height = this.width;
			// this.ui.canvasAlphaBuffer.style.height = this.height;

			this.ui.canvas.width = this.width;
			this.ui.canvasBuffer.width = this.width;
			// this.ui.canvasAlphaBuffer.width = this.width;
			// this.ui.canvasAlphaBuffer.style.width = this.width;

			this.font = `${this.textSize}px "Theinhardt"`; // Theinhardt
			this.ctx.font = this.ctxBuffer.font = this.font;
		}
	}

	isHover() {

		return this.hover;
	}

}




