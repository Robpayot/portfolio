// import { Object3D, Mesh } from 'three';
import EmitterManager from '../managers/EmitterManager';
import dat from 'dat-gui';

export default class Glitch {

	constructor(obj) {



		// Load data
		this.obj = obj;
		this.el = obj.el;
		this.color = obj.color;
		this.sndColor = obj.sndColor;
		this.txt = obj.txt;
		this.debug = obj.debug;
		this.clock = obj.clock;
		this.stop = obj.stop;

		this.el.style.display = 'block';
		this.text = 'T Y P E  H E R E';

		// bind
		this.render = this.render.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.onKeyPress = this.onKeyPress.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.changeSize = this.changeSize.bind(this);

		this.start();

	}


	events(method) {

		// let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		let onListener = method === false ? 'off' : 'on';

		EmitterManager[onListener]('resize', this.resizeHandler);
		EmitterManager[onListener]('raf', this.render);

		document.addEventListener('keypress', this.onKeyPress, false);
		document.addEventListener('keydown', this.onKeyDown, false);

	}

	onKeyPress(e) {

		if (this.firstKeypress !== true ) {
			this.firstKeypress = true;
			this.text = String.fromCharCode(e.keyCode);
		} else {
			this.text += String.fromCharCode(e.keyCode);
		}

	}

	onKeyDown(e) {
		if (e.keyCode === 8 ) {
			this.text = this.text.slice(0,-1);
			return false;
		}
	}

	start() {

		this.initOptions();

		this.ui = {
			canvas: this.el.querySelector('.glitch__canvas'),
			canvasAlphaBuffer: this.el.querySelector('.glitch__canvas-alpha-buffer'),
		};

		this.textHeight = this.controller.size; // need a real calcul
		this.last = 0;

		this.init();

		// console.log(PreloadManager.getResult('svg'));
	}

	setAlphaVideo() {

		this.video = document.createElement('video');
		this.video.id = 'video2';
		this.video.src = 'videos/glitch-text.mp4';
		this.video.autoplay = true;
		this.video.loop = true;
		this.video.muted = true;
		this.video.pause();
		this.el.appendChild(this.video);

	}

	init() {

		this.ctx = this.ui.canvas.getContext('2d');
		if (this.ui.canvasAlphaBuffer) this.ctxAlphaBuffer = this.ui.canvasAlphaBuffer.getContext('2d');

		// set up alpha video
		this.setAlphaVideo();
		this.resizeHandler();

		if (this.debug === true) {
			this.events(true);

			this.video.play();

		} else {
			this.render();
		}

	}

	changeSize(val) {

		this.controller.size = val;
		this.resizeHandler();
		console.log('ok');

	}

	initOptions() {

		this.controller = {
			size: 100,
		};

		const gui = new dat.GUI();

		gui.add(this.controller, 'size', 0, 200).onChange(this.changeSize);
		gui.open();

	}

	render() {


		// clear temp context
		this.ctx.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

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

		this.ctx.beginPath(); // avoid Drop fps

		this.ctx.fillStyle = this.color;
		this.ctx.putImageData(this.imageAlpha, 0, 0, 0, 0, this.width, this.height);
		this.ctx.globalCompositeOperation = 'source-in';

		// old
		this.ctx.font = this.font;
		this.ctx.textAlign = 'center';
		this.ctx.fillText(this.text, this.width / 2, this.height / 2 + this.controller.size / 2); // First Text
		this.ctx.font = this.font;
		// this.ctx.restore();

	}

	resizeHandler() {


		this.width = Math.min(window.innerWidth * 0.5 * 2, 1400); // x2 display
		this.height = this.controller.size + 30; // marge

		// Video size
		this.videoWidth = this.width;
		this.videoHeight = this.width; // square in that case

		this.ui.canvasAlphaBuffer.width = this.videoWidth;
		this.ui.canvasAlphaBuffer.height = this.videoHeight;

		this.font = `${this.controller.size}px "Lato"`; // Theinhardt
		this.textWidth = Math.round((this.ctx.measureText(this.text)).width);
		this.textHeight = Math.round((this.ctx.measureText(this.text)).height);

		this.ui.canvas.height = this.height;
		this.ui.canvas.width = this.width;

		TweenMax.set(this.ui.canvas, {width: this.width / 2}); // x2 display
		TweenMax.set(this.ui.canvas, {height: this.height / 2}); // x2 display

		this.ctx.font = this.font;

	}

}




