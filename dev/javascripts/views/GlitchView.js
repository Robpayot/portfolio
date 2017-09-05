// import { Object3D, Mesh } from 'three';
import EmitterManager from '../managers/EmitterManager';
import Handlebars from 'handlebars';
import PreloadManager from '../managers/PreloadManager';
import dat from 'dat-gui';

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


		PreloadManager.loadManifest([
			{ id: 'template-glitch', src: `${base}/templates/glitch.hbs` },
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
			img2: this.el.querySelector('.glitch__img-2')
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

		this.canvas = document.querySelector('.glitch__canvas');
		this.ctx = this.canvas.getContext('2d');

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
		this.ctx.font = this.font;
		this.text = 'The Forest';
		this.textWidth = (this.ctx.measureText(this.text)).width;
		// this.textHeight = (this.ctx.measureText(this.text)).height;
		// console.log((this.ctx.measureText(this.text)));

		this.fps = 60;

		this.channel = 0; // 0 = red, 1 = green, 2 = blue
		this.compOp = 'lighter'; // CompositeOperation = lighter || darker || xor
		this.phase = 0.0;
		this.phaseStep = 0.05; //determines how often we will change channel and amplitude
		this.amplitude = 0.0;
		this.amplitudeBase = 2.0;
		this.amplitudeRange = 2.0;
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

		if (this.phase > 1) {
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


		// console.log(x1, x2, x3, this.channel);
		this.ctx.save();

		// clear temp context
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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


		// draw rectangle (destination)
		const top = Math.sin(this.time / 60 ) * 30;
		// console.log(top);
		this.ctx.beginPath();
		this.ctx.drawImage(this.ui.img, x3, top, this.textWidth + 30, this.textWidth + 30);

		// set global composite
		this.ctx.globalCompositeOperation = 'destination-atop';

		// draw circle (source)
		this.ctx.beginPath();
		// this.ctx.fillText(this.text, 125,150);
		// this.ctx.restore();



		this.ctx.font = this.font;
		this.ctx.fillStyle = 'rgb(255,255,255)';
		const centerY = this.height / 2 + this.textHeight / 2;
		this.ctx.fillText(this.text, x1, centerY);

		this.ctx.globalCompositeOperation = this.compOp;


		this.ctx.fillStyle = 'rgb(0,0,0)';
		this.ctx.fillText(this.text, x2, centerY);

		// this.ctx.rect(0, 0, 900, this.height);
		// this.ctx.clip();
		this.ctx.save();

		this.ctx.beginPath();
		// this.ctx.drawImage(this.ui.img, x1,0, this.textWidth + 30, this.textWidth + 30);
		// this.ctx.restore();
		this.ctx.globalCompositeOperation = 'destination-atop';
		// this.ctx.globalCompositeOperation = this.compOp;


		this.ctx.beginPath();
		let margeStart = this.textWidth * 0.2;
		let startClip = (window.innerWidth - this.textWidth) / 2 - margeStart;
		// console.log(this.height, this.textHeight);
		this.ctx.rect(startClip,0, this.textWidth * 0.4,this.height);
		// this.ctx.arc(100,75,50,0,2*Math.PI);
		this.ctx.clip();
		this.ctx.fillStyle = 'rgb(255,255,255)';
		let margeX = 80;
		let margeY = 50;
		this.ctx.fillText(this.text, x3 - margeX, centerY - margeY);

		this.ctx.globalCompositeOperation = this.compOp;

		this.ctx.fillStyle = 'rgb(41,64,16)';
		this.ctx.fillText(this.text, x3 - margeX - 10, centerY - margeY + 10);
		this.ctx.restore(); // --> magic here
		// this.ctx.globalCompositeOperation = 'destination-over';

		this.time++;


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
		if (this.canvas) {
			this.canvas.height = this.height;
			//document.documentElement.offsetHeight;
			this.canvas.width = this.width;
			//document.documentElement.offsetWidth;
			this.textSize = this.textSize;
			// RE-sets text size based on window size
			if (this.textSize > this.height) {
				this.textSize = Math.floor(this.canvas.height / 1.5);
			}
			// tries to make text fit if window is
			// very wide, but not very tall
			this.font = `${this.textSize}px "Theinhardt"`; // Theinhardt
			this.ctx.font = this.font;
			console.log(this.textSize);
		}
	}

	isHover() {

		return this.hover;
	}

}




