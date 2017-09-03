// import { Object3D, Mesh } from 'three';
import Handlebars from 'handlebars';
import PreloadManager from '../managers/PreloadManager';
import dat from 'dat-gui';

export default class GlitchView {

	constructor() {

		// Load data
		this.el = document.querySelector('.glitch');
		this.el.style.display = 'block';

		this.ui = {
			xp: document.querySelector('.xp')
		};

		// Preloader
		this.preloadCb = PreloadManager.on('complete', this.start, this, true);


		PreloadManager.loadManifest([
			{ id: 'template-glitch', src: '/templates/glitch.hbs' },
		]);

		PreloadManager.load();



	}

	start() {


		let template = Handlebars.compile(PreloadManager.getResult('template-glitch'));
		let html  = template();
		console.log(html);

		this.el.innerHTML = html;

		// Nathan Gordon <3
		// //Create a canvas that is to become our reference image
		// const baseCanvas = document.createElement('canvas');
		// baseCanvas.width = 600;
		// baseCanvas.height = 200;
		// const baseContext = baseCanvas.getContext('2d');

		// //populate it with whatever you want, including dynamic text
		// // baseContext.fillStyle = '#222';
		// // baseContext.globalAlpha = 0;
		// baseContext.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
		// // baseContext.globalAlpha = 1;
		// baseContext.fillStyle = '#fff';
		// baseContext.font = '40pt Arial';
		// baseContext.textBaseline = 'top';
		// baseContext.fillText('this is your dynamic text', 20, 20);
		// this.el.appendChild(baseCanvas);

		// let imageData = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
		// let d = imageData.data;

		// for (let i = 0; i < d.length; i += 4) {
		// 	let offset = 5;

		// 	//for the red channel, take the value of the pixel 5 spots in advance. If it doesn't exist, put 0.
		// 	d[i] = d[i+4*offset] == undefined ? 0 : d[i+4*offset];
		// }

		// //repopulate base context with the affected data
		// baseContext.putImageData(imageData, 0, 0);

		//    //create a canvas half the size of the original
		//    var canvas = document.createElement('canvas');
		//    canvas.width = 300;
		//    canvas.height = 100;
		//    var context = canvas.getContext('2d');
		//    //draw the base canvas onto it
		//    context.drawImage(baseCanvas, 0, 0);

		//    //display it
		//    this.el.appendChild(canvas);
		//    //aaand do it again
		//    var canvas2 = document.createElement('canvas');
		//    canvas2.style.display = 'block';
		//    canvas2.width = 300;
		//    canvas2.height = 100;
		//    var context2 = canvas2.getContext('2d');
		//    //shift the reference over halfway this time
		//    context2.drawImage(baseCanvas, -300, 0);
		//    this.el.appendChild(canvas2);

		/* Based off of work on http://retromodular.com/ */
		/*·····················································
		···· Paul Reny ········································
		····················· ██ ██ ██ ██ ██ ·· ██ ██ ·········
		··············· ██ ██ ▒▒ ░░ ░░ ░░ ░░ ██ ▒▒ ░░ ██ ······
		············ ██ ▒▒ ░░ ░░ ██ ░░ ██ ░░ ░░ ██ ░░ ░░ ██ ···
		········· ██ ▒▒ ░░ ░░ ░░ ██ ░░ ██ ░░ ░░ ░░ ▒▒ ░░ ██ ···
		········· ██ ░░ ░░ ░░ ░░ ██ ░░ ██ ░░ ░░ ░░ ▒▒ ▒▒ ██ ···
		······ ██ ░░ ░░ ░░ ▒▒ ▒▒ ░░ ░░ ░░ ▒▒ ▒▒ ░░ ░░ ▒▒ ██ ···
		··· ██ ▒▒ ░░ ░░ ░░ ░░ ░░ ░░ ██ ░░ ░░ ░░ ░░ ░░ ░░ ██ ···
		··· ██ ░░ ░░ ▒▒ ░░ ░░ ░░ ░░ ██ ░░ ░░ ░░ ░░ ░░ ▒▒ ██ ···
		··· ██ ░░ ░░ ▒▒ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ██ ······
		······ ██ ██ ██ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ▒▒ ██ ······
		··· ██ ▒▒ ▒▒ ▒▒ ██ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ▒▒ ██ ······
		··· ██ ▒▒ ▒▒ ▒▒ ▒▒ ██ ░░ ░░ ░░ ░░ ░░ ░░ ▒▒ ██ ·········
		··· ██ ▒▒ ▒▒ ▒▒ ▒▒ ██ ░░ ░░ ░░ ░░ ░░ ▒▒ ██ ██ ·········
		······ ██ ▒▒ ▒▒ ▒▒ ▒▒ ██ ▒▒ ▒▒ ▒▒ ██ ██ ▒▒ ▒▒ ██ ······
		········· ██ ▒▒ ▒▒ ██ ██ ██ ██ ██ ▒▒ ▒▒ ▒▒ ▒▒ ▒▒ ██ ···
		············ ██ ██ ██ ········ ██ ██ ██ ██ ██ ██ ······
		·····················································*/
		/* added dynamic sizing to the text. as long as it's */
		/* not too long of string, should always be visible */
		/* Controls info: https://code.google.com/p/dat-gui/ */
		/* dat.gui.js ==> https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.5/dat.gui.min.js */
		var textSize = 10;
		var glitcher = {

			init: function () {
				setTimeout((function () {
					this.canvas = document.querySelector('.glitch__canvas');
					this.context = this.canvas.getContext('2d');

					this.initOptions();
					this.resize();
					this.tick();
				}).bind(this), 100);
			},

			initOptions: function () {

				var gui = new dat.GUI(),
					current = gui.addFolder('Current'),
					controls = gui.addFolder('Controls');

				this.width = document.documentElement.offsetWidth;
				this.forceHeight = 300;
				this.height = this.forceHeight;

				this.textSize = Math.floor(this.width / 7);
				// sets text size based on window size
				if (this.textSize > this.height) {
					this.textSize = Math.floor(this.height / 2);
				}
				// tries to make text fit if window is
				// very wide, but not very tall
				this.font = this.textSize + 'px "Theinhardt"'; // Theinhardt
				this.context.font = this.font;
				// this.context.font = '900px "Theinhardt"';
				this.text = 'The Forest';
				this.textWidth = (this.context.measureText(this.text)).width;

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
				var text = controls.add(this, 'text');
				text.onChange((function (){
					this.textWidth = (this.context.measureText(this.text)).width;
				}).bind(this));
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
			},

			tick: function () {
				setTimeout((function () {
					this.phase += this.phaseStep;

					if (this.phase > 1) {
						this.phase = 0.0;
						this.channel = (this.channel === 2) ? 0 : this.channel + 1;
						this.amplitude = this.amplitudeBase + (this.amplitudeRange * Math.random());
					}

					this.render();
					this.tick();

				}).bind(this), 1000 / this.fps);
			},

			render: function () {
				var x0 = this.amplitude * Math.sin((Math.PI * 2) * this.phase) >> 0, x1, x2, x3;

				if (Math.random() >= this.glitchThreshold) {
					x0 *= this.glitchAmplitude;
				}

				x1 = this.width - this.textWidth >> 1;
				x2 = x1 + x0;
				x3 = x1 - x0;


				this.context.clearRect(0, 0, this.width, this.height);
				this.context.globalAlpha = this.alphaMin + ((1 - this.alphaMin) * Math.random());

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
			},

			renderChannels: function(x1, x2, x3) {

				this.context.font = this.font;
				this.context.fillStyle = 'rgb(255,255,255)';
				this.context.fillText(this.text, x1, this.height / 2 + this.textSize - 10);

				this.context.globalCompositeOperation = this.compOp;

				this.context.fillStyle = 'rgb(0,0,0)';
				this.context.fillText(this.text, x2, this.height / 2 + this.textSize - 10);

				// this.context.rect(0, 0, 900, this.height);
				// this.context.clip();
				this.context.save();
				this.context.beginPath();
				this.context.rect(0,0,400,this.height);
				this.context.arc(100,75,50,0,2*Math.PI);
				this.context.clip();
				this.context.fillStyle = 'rgb(255,255,255)';
				let margeX = 100;
				let margeY = 50;
				this.context.fillText(this.text, x3 - margeX, this.height / 2 + this.textSize - margeY);
				this.context.restore(); // --> magic here
				// this.context.globalCompositeOperation = 'destination-over';


			},

			renderScanline: function () {

				var y = this.height * Math.random() >> 0,
					o = this.context.getImageData(0, y, this.width, 1),
					d = o.data,
					i = d.length,
					s = this.scanlineBase + this.scanlineRange * Math.random() >> 0,
					x = -this.scanlineShift + this.scanlineShift * 2 * Math.random() >> 0;

				while (i-- > 0) {
					d[i] += s;
				}

				this.context.putImageData(o, x, y);
			},

			resize: function () {
				this.width = document.documentElement.offsetWidth;
				//this.height = window.innerHeight;
				this.height = this.forceHeight;
				if (this.canvas) {
					this.canvas.height = this.height;
					//document.documentElement.offsetHeight;
					this.canvas.width = this.width;
					//document.documentElement.offsetWidth;
					this.textSize = Math.floor(this.canvas.width / 7);
					// RE-sets text size based on window size
					if (this.textSize > this.height) {
						this.textSize = Math.floor(this.canvas.height/1.5);
					}
					// tries to make text fit if window is
					// very wide, but not very tall
					this.font = '900 ' + this.textSize + 'px "Theinhardt"';
					this.context.font = this.font;
				}
			}
		};
		// setTimeout(() => {
		document.onload = glitcher.init();
		window.onresize = glitcher.resize();

	}

	isHover() {

		return this.hover;
	}

}




