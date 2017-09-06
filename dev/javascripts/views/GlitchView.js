// import { Object3D, Mesh } from 'three';
import EmitterManager from '../managers/EmitterManager';
import Handlebars from 'handlebars';
import PreloadManager from '../managers/PreloadManager';
import dat from 'dat-gui';
import { getRandom } from '../helpers/utils';

export default class GlitchView {

	constructor() {

		// Load data
		this.el = document.querySelector('.glitch');
		this.el.style.display = 'block';

		// bind
		this.raf = this.raf.bind(this);

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


	events(method) {

		// let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.raf);



	}

	start() {


		let template = Handlebars.compile(PreloadManager.getResult('template-glitch'));
		let html  = template();
		// console.log(html);

		this.el.innerHTML = html;

		this.ui = {
			xp: document.querySelector('.xp'),
			img: this.el.querySelector('.glitch__img'),
			img2: this.el.querySelector('.glitch__img-2'),
			img3: this.el.querySelector('.glitch__img-3'),
			canvas: this.el.querySelector('.glitch__canvas'),
			canvasTemp: this.el.querySelector('.glitch__canvas-temp')
		};
		console.log(this.ui.img);
		// Nathan Gordon <3
		// //Create a canvas that is to become our reference image
		// const baseCanvas = document.createElement('canvas');
		// baseCanvas.width = 600;
		// baseCanvas.height = 200;
		// const basectx = baseCanvas.getctx('2d');

		this.textSize = 120;
		this.textHeight = this.textSize - 33; // need a real calcul
		this.time = 0;

		this.init();

	}

	init() {

		this.ctx = this.ui.canvas.getContext('2d');
		this.ctxTemp = this.ui.canvasTemp.getContext('2d');

		this.initOptions();
		this.resizeHandler();
		this.events(true);
	}

	initOptions() {

		const gui = new dat.GUI(),
			current = gui.addFolder('Current'),
			controls = gui.addFolder('Controls');

		this.width = document.documentElement.offsetWidth;
		this.forceHeight = window.innerHeight * 0.5;
		this.height = this.forceHeight;

		// this.textSize = Math.floor(this.width / 7);
		// // sets text size based on window size
		// if (this.textSize > this.height) {
		// 	this.textSize = Math.floor(this.height / 2);
		// }
		// tries to make text fit if window is
		// very wide, but not very tall
		console.log(this.textSize);
		this.font = `${this.textSize}px "Theinhardt"`; // Theinhardt
		this.ctxTemp.font = this.font;
		this.text = 'The Forest';
		this.textWidth = (this.ctxTemp.measureText(this.text)).width;
		// this.textHeight = (this.ctx.measureText(this.text)).height;
		// console.log((this.ctx.measureText(this.text)));

		this.fps = 60;

		this.channel = 0; // 0 = red, 1 = green, 2 = blue
		this.compOp = 'lighter'; // CompositeOperation = lighter || darker || xor
		this.phase = 0.0;
		this.phaseStep = 0.05; //determines how often we will change channel and amplitude
		this.amplitude = 0.0;
		this.amplitudeBase = 3; //2.0;
		this.amplitudeRange = 2; // 2.0;
		this.alphaMin = 0.8;

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

	raf() {

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
				this.renderChannels(x1, x2, x3);
				break;
			case 1:
				this.renderChannels(x2, x3, x1);
				break;
			case 2:
				this.renderChannels(x3, x1, x2);
				break;
		}

		this.renderScanline();
		if (Math.floor(Math.random() * 2) > 1) {
			this.renderScanline();
			// renders a second scanline 50% of the time
		}
	}


	renderChannels(x1, x2, x3) {

		// It's important to note that a canvas context can only support one composite operation throughout its life cycle.
		// if we want to use multiple composite operations, as this tutorial does, we need to apply the operations on a hidden canvas and then copy the results onto a visible canvas.

		// MOST IMPORTANT HERE

		const top = Math.sin(this.time / 60 ) * 30; // move image
		const centerY = this.height / 2 + this.textHeight / 2;
		let margeStart = this.textWidth * 0.2;
		let startClip = (window.innerWidth - this.textWidth) / 2 - margeStart;

		// offset gesture
		let margeX1 = 350;
		let posX1 = 50;
		let posY1 = -20;
		let margeX12 = 450;
		let posX12 = -10;
		let posY12 = 10;

		let posX2 = -90;
		let posY2 = -40;
		let width2 = this.textWidth * 0.3;
		let posX22 = -70;
		let posY22 = 20;
		let width22 = this.textWidth * 0.5;


		let posX3 = -80;
		let posY3 = -50;
		let width3 = this.textWidth * 0.4;

		let margeX4 = 550;
		let posX4 = 10;
		let posY4 = 50;
		let width4 = this.textWidth * 0.3;

		// Draw Second Comp
		// Start of Text, Offset Left, white, with image
		this.ctxTemp.save();
		this.ctxTemp.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxTemp.beginPath(); // avoid Drop fps

		// // // // Ici on veut que une fois sur 3 (tt les 3 seconds ? ou moins, on mais le Y en décallé haut gauche.)
		// // // // et 2 fois sur 3 gauche
		// // // // et par défaut normal
		this.ctxTemp.fillStyle = 'rgb(41,64,16)'; // Third Text

		if (this.channel === 1) {


		} else if (this.channel === 2) {

			this.ctxTemp.rect(startClip + margeX12,0, this.textWidth, this.height); // create clip rectangle
			this.ctxTemp.clip();
			this.ctxTemp.drawImage(this.ui.img3, startClip + margeX12 + 2, top, this.textWidth + 30, this.textWidth + 30);
			this.ctxTemp.globalCompositeOperation = 'destination-atop';
			this.ctxTemp.fillText(this.text, x2 + posX12, centerY + posY12);
		} else {

			this.ctxTemp.rect(startClip + margeX1,0, this.textWidth, this.height); // create clip rectangle
			this.ctxTemp.clip();
			this.ctxTemp.drawImage(this.ui.img3, startClip + margeX1 + 2, top, this.textWidth + 30, this.textWidth + 30);
			this.ctxTemp.globalCompositeOperation = 'destination-atop';
			this.ctxTemp.fillText(this.text, x2 + posX1, centerY + posY1);
		}


		this.ctxTemp.restore();

		this.ctx.drawImage(this.ui.canvasTemp, 0, 0);


		// Draw first Comp
		// DEFAULT
		// Normal Text, center white, with image
		this.ctxTemp.save();
		this.ctxTemp.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

		// Draw image that gonna be use as mask.
		this.ctxTemp.drawImage(this.ui.img, x1, top, this.textWidth + 30, this.textWidth + 30);
		this.ctxTemp.globalCompositeOperation = 'destination-atop'; // put the reste on top and mask

		this.ctxTemp.fillStyle = 'rgb(255,255,255)';
		this.ctxTemp.fillText(this.text, x1, centerY); // First Text

		this.ctxTemp.fillStyle = 'rgb(0,0,0)'; // Black, center, without image
		this.ctxTemp.fillText(this.text, x2, centerY); // Second Text

		this.ctx.drawImage(this.ui.canvasTemp, 0, 0); // add First comp



		// Draw Second Comp
		// Start of Text, Offset Left, white, with image
		this.ctxTemp.save();
		this.ctxTemp.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxTemp.beginPath(); // avoid Drop fps

		this.ctxTemp.fillStyle = 'rgb(41,64,16)'; // Third Text

		if (this.channel === 0) {


		} else if (this.channel === 1) {

			this.ctxTemp.rect(startClip,0, width2,this.height); // create clip rectangle
			this.ctxTemp.clip();

			this.ctxTemp.drawImage(this.ui.img3, startClip + 2, centerY + posY2 - this.textHeight , width2 - 2, width2 - 2);
			this.ctxTemp.globalCompositeOperation = 'destination-atop';
			this.ctxTemp.fillText(this.text, x2 + posX2, centerY + posY2);
		} else {

			this.ctxTemp.rect(startClip,0, width22 - 10,this.height); // create clip rectangle
			this.ctxTemp.clip();

			this.ctxTemp.drawImage(this.ui.img3, startClip + 2, centerY + posY22 - this.textHeight , width22 - 20, width22 - 2);
			this.ctxTemp.globalCompositeOperation = 'destination-atop';
			this.ctxTemp.fillText(this.text, x2 + posX22, centerY + posY22);
		}




		this.ctxTemp.restore();

		this.ctx.drawImage(this.ui.canvasTemp, 0, 0);



		// Draw Third Comp
		// Start of Text, Offset Left, white, with image
		this.ctxTemp.save();
		this.ctxTemp.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxTemp.beginPath(); // avoid Drop fps

		this.ctxTemp.fillStyle = 'rgb(255,255,255)'; // Third Text

		if (this.channel === 2) {

			this.ctxTemp.rect(startClip,0, width3,this.height); // create clip rectangle
			this.ctxTemp.clip();

			this.ctxTemp.drawImage(this.ui.img, startClip + 2, top - posY3 - this.textHeight + 50, width3 - 2, width3 - 2);
			this.ctxTemp.globalCompositeOperation = 'destination-atop';
			this.ctxTemp.fillText(this.text, x3 + posX3, centerY + posY3);

		} else {

		}


		this.ctxTemp.restore();

		this.ctx.drawImage(this.ui.canvasTemp, 0, 0);



		// Draw Third Comp
		// Start of Text, Offset Left, white, with image
		this.ctxTemp.save();
		this.ctxTemp.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height); // Need to clear react before each New COMP
		this.ctxTemp.beginPath(); // avoid Drop fps

		this.ctxTemp.fillStyle = 'rgb(255,255,255)'; // Third Text

		if (this.channel === 1) {

			this.ctxTemp.rect(startClip + margeX4,0, width4 - 2,this.height); // create clip rectangle
			this.ctxTemp.clip();

			this.ctxTemp.drawImage(this.ui.img, startClip + margeX4 + 2, top - posY4 - this.textHeight + 50 , width4 - 10, this.textWidth + 30);
			this.ctxTemp.globalCompositeOperation = 'destination-atop';

			this.ctxTemp.fillText(this.text, x3 + posX4, centerY + posY4);

		} else {

		}


		this.ctxTemp.restore();

		this.ctx.drawImage(this.ui.canvasTemp, 0, 0);


		// }
		// if (this.channel === 1) {
		// 	this.ctx.fillText(this.text, x3 - margeX + 5, centerY - margeY + 10);
		// }

		// this.ctx.globalCompositeOperation = this.compOp;

		// this.ctx.globalCompositeOperation = 'destination-over';

		this.time++;


	}

	defaultText() {

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
		this.width = document.documentElement.offsetWidth;
		//this.height = window.innerHeight;
		this.height = this.forceHeight;
		if (this.ui.canvas) {
			this.ui.canvas.height = this.height;
			this.ui.canvasTemp.height = this.height;
			//document.documentElement.offsetHeight;
			this.ui.canvas.width = this.width;
			this.ui.canvasTemp.width = this.width;
			//document.documentElement.offsetWidth;
			this.textSize = this.textSize;
			// RE-sets text size based on window size
			if (this.textSize > this.height) {
				this.textSize = Math.floor(this.ui.canvas.height / 1.5);
				this.textSize = Math.floor(this.ui.canvas.height / 1.5);
			}
			// tries to make text fit if window is
			// very wide, but not very tall
			this.font = `${this.textSize}px "Theinhardt"`; // Theinhardt
			this.ctx.font = this.ctxTemp.font = this.font;
			console.log(this.textSize);
		}
	}

	isHover() {

		return this.hover;
	}

}




