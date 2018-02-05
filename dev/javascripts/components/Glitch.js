// import { Object3D, Mesh } from 'three';
import EmitterManager from '../managers/EmitterManager';
import Handlebars from 'handlebars';
import PreloadManager from '../managers/PreloadManager';
// import dat from 'dat-gui';
import { getRandom } from '../helpers/utils';
// import { Device } from '../helpers/Device';

export default class Glitch {

	constructor(obj) {

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

			// DEBUG ONLY
			// Preloader
			this.preloadCb = PreloadManager.on('complete', this.start, this, true);

			PreloadManager.loadManifest([
				{ id: 'template-glitch', src: `${global.BASE}/templates/glitch.hbs` }
			]);

			PreloadManager.load();
		}


	}


	events(method) {

		// let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let listener = method === false ? 'off' : 'on';

		EmitterManager[listener]('resize', this.resizeHandler);
		EmitterManager[listener]('raf', this.render);

	}

	start() {

		if (this.debug === true) {
			let template = Handlebars.compile(PreloadManager.getResult('template-glitch'));
			let html = template();

			this.el.innerHTML = html;
		}

		this.ui = {
			xp: document.querySelector('.xp'),
			canvas: this.el.querySelector('.glitch__canvas'),
			canvasBuffer: this.el.querySelector('.glitch__canvas-buffer'),
			canvasAlphaBuffer: this.el.querySelector('.glitch__canvas-alpha-buffer'),
			preloadWrapper: document.querySelector('.preload__wrapper')
		};

		this.textHeight = this.textSize; // need a real calcul
		this.last = 0;

		if (this.obj.type === 'intro') {
			this.introTxt = PreloadManager.getResult('introTxt');
		} else {
			this.ui.img = PreloadManager.getResult('glitchTex');
		}

		this.init();

	}

	setAlphaVideo(video) {
		// if (video)
		this.video = document.createElement('video');
		this.video.id = 'video2';
		// this.video.src = 'videos/destr-reverse.mp4';
		this.video.src = PreloadManager.getItem('videoGlitch') ? PreloadManager.getItem('videoGlitch').src : 'videos/destr.mp4';
		// this.video.autoplay = true;
		// this.video.loop = true;
		this.video.muted = true;
		this.video.setAttribute('playsinline', '');
		this.video.pause();
		// this.el.appendChild(this.video);
		// this.video.remove();

	}

	init() {

		this.ctx = this.ui.canvas.getContext('2d');
		if (this.ui.canvasBuffer) this.ctxBuffer = this.ui.canvasBuffer.getContext('2d');
		if (this.ui.canvasAlphaBuffer) this.ctxAlphaBuffer = this.ui.canvasAlphaBuffer.getContext('2d');

		this.channel = 0; // 0 = red, 1 = green, 2 = blue
		this.phase = 5.0;
		this.phaseStep = 0.2; //determines how often we will change channel and amplitude

		// set up alpha video
		if (this.obj.type === 'intro') this.setAlphaVideo();
		this.resizeHandler();

		if (this.debug === true) {
			this.events(true);

			this.video.play();

		} else {
			this.render();
		}

	}

	render() {

		this.phase += this.phaseStep;

		const frequency = getRandom(3.2, 4);

		if (this.phase > frequency) { // time for each channel
			this.phase = 0.0;
			this.channel = this.channel === 2 ? 0 : this.channel + 1;
		}

		// clear temp context
		this.ctx.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

		this.renderChannels();

	}


	renderChannels() {

		const top = 0; // top of image
		const centerY = this.height / 2 + this.textHeight / 2;
		let startClip = (this.width - this.textWidth) / 2 ;


		if (this.stop === true) {
			// DEFAULT value
			if (this.obj.type === 'intro') return false;

			// Just text and image alpha mask, no glitch
			// this.ctxBuffer.save();
			this.ctxBuffer.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

			this.ctxBuffer.fillStyle = this.color;
			this.ctxBuffer.fillText(this.text, (this.width - this.textWidth) / 2, centerY, this.ui.canvas.width); // First Text

			this.ctx.drawImage(this.ui.canvasBuffer, 0, 0); // add First comp

			return false;
		}

		if (this.ctxAlphaBuffer && this.obj.type === 'intro') {
			// Alpha video effect

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

			if (this.isLoading === false) {
				this.ctx.putImageData(this.imageAlpha, 0, 0, 0, 0, this.width, this.height);
				this.ctx.globalCompositeOperation = 'source-in';
			}


			this.ctx.drawImage(this.introTxt, 0, 0, this.width, this.height);

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
		this.width2 =  this.randomTimed(this.textWidth * 0.6, this.textWidth * 0.25, this.width2);
		this.width22 =   this.randomTimed(this.textWidth * 0.4, this.textWidth * 0.25, this.width22);

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

	resizeHandler() {


		if (this.obj.type === 'intro') {
			// this can be done without alphaData, except in Firefox which doesn't like it when image is bigger than the canvas
			// r.p : We select only the first half

			this.height = this.ui.preloadWrapper.offsetHeight * 2; // Higher than 600 its getting laggy a lot. * 2 for retina
			this.width = this.height * this.introTxt.width / this.introTxt.height; // retina;

			// Image size
			this.introTxt.width = this.width;
			this.introTxt.height = this.height;

			// Video size
			this.videoWidth = this.width;
			this.videoHeight = this.width; // square in that case
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

			this.ui.canvasBuffer.width = this.width;
			this.ui.canvasBuffer.height = this.height;
			// alert(this.width);
		}

		this.ui.canvas.width = this.width ;
		this.ui.canvas.height = this.height;

		if (this.obj.type === 'intro') {
			TweenMax.set([this.ui.canvas, this.el], {width: this.width / 2, height: this.height / 2}); // retina display
		}

		this.ctx.font = this.font;
		if (this.ctxBuffer) this.ctxBuffer.font = this.font;


	}

	isHover() {

		return this.hover;
	}

}




