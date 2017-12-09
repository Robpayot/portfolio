// import { Object3D, Mesh } from 'three';
import EmitterManager from '../managers/EmitterManager';
import dat from 'dat-gui';


class VideoAlphaMask {

	constructor() {

		// bind
		this.render = this.render.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.onKeyPress = this.onKeyPress.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onChangeSize = this.onChangeSize.bind(this);
		this.onChangeColor = this.onChangeColor.bind(this);

		// DOM selectors
		this.ui = {
			canvas: document.querySelector('.canvas'),
			canvasAlphaBuffer: document.querySelector('.canvas-alpha-buffer'),
			svgGithub: document.querySelector('.github svg'),
		};

		this.ctx = this.ui.canvas.getContext('2d');
		this.ctxAlphaBuffer = this.ui.canvasAlphaBuffer.getContext('2d');

		this.text = 'T Y P E  H E R E'; // default text value

		this.setGui();
		this.setAlphaVideo();
		this.resizeHandler();

		this.events();

	}

	setGui() {

		// a small GUI for controls
		this.controller = {
			size: 150,
			color: '#000000',
			background: '#FFFFFF',
			clear: () => {
				this.text = '';
			}
		};

		const gui = new dat.GUI();

		gui.add(this.controller, 'size', 0, 300).onChange(this.onChangeSize);
		gui.addColor(this.controller, 'color').onChange(this.onChangeColor);
		gui.addColor(this.controller, 'background').onChange(this.onChangeBackground);
		gui.add(this.controller, 'clear');
		gui.open();
	}

	onChangeSize(val) {

		this.controller.size = val;
		this.resizeHandler();

	}

	onChangeColor(val) {

		this.controller.color = this.ui.svgGithub.style.fill = document.body.style.color = val;
	}

	onChangeBackground(val) {

		document.body.style.backgroundColor = val;
	}

	setAlphaVideo() {

		// we create a video element. It contains our video alpha
		this.video = document.createElement('video');

		this.video.src = 'dist/video-alpha2.mp4'; // We need to create a video alpha (exemple on READ.ME)
		this.video.autoplay = true;
		this.video.loop = true;
		this.video.muted = true;

	}

	events() {

		window.onresize = this.resizeHandler();
		TweenMax.ticker.addEventListener('tick', this.render); // RAF

		document.addEventListener('keypress', this.onKeyPress, false);
		document.addEventListener('keydown', this.onKeyDown, false);

	}

	onKeyPress(e) {

		let code = e.charCode || e.keyCode; // e.charCode for FireFox

		if (String.fromCharCode(code) && String.fromCharCode(code) !== '') {
			if (this.firstKeypress !== true ) {
				this.firstKeypress = true;
				this.text = String.fromCharCode(code);
			} else {
				this.text += String.fromCharCode(code);
			}
		}

	}

	onKeyDown(e) {

		let code = e.charCode || e.keyCode; // e.charCode for FireFox
		if (code === 8 ) {
			this.text = this.text.slice(0,-1);
		}
	}


	resizeHandler() {


		this.width = Math.min(window.innerWidth * 0.5 * 2, 1400); // x2 display
		this.height = this.controller.size + 80; // text height + marge

		// Video size
		this.videoWidth = this.width;
		this.videoHeight = this.width; // square in that case

		this.ui.canvasAlphaBuffer.width = this.videoWidth;
		this.ui.canvasAlphaBuffer.height = this.videoHeight;

		this.font = `${this.controller.size}px "Lato"`; // Font

		this.ui.canvas.height = this.height; // set video canvas retina (size x2)
		this.ui.canvas.width = this.width;

		TweenMax.set(this.ui.canvas, {width: this.width / 2}); // add style for css pixel size x1
		TweenMax.set(this.ui.canvas, {height: this.height / 2});

		this.ctx.font = this.font;

	}

	render() {


		// clear temp context
		this.ctx.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

		// alpha video
		// draw images per images in our canvas Buffer
		this.ctxAlphaBuffer.drawImage(this.video, 0, 0, this.videoWidth, this.videoHeight);
		// get datas of image
		this.imageAlpha = this.ctxAlphaBuffer.getImageData(0, 0, this.videoWidth, this.videoHeight / 2); // top part of video 
		this.imageData = this.imageAlpha.data;
		this.alphaData = this.ctxAlphaBuffer.getImageData(0, this.videoHeight / 2, this.videoWidth, this.videoHeight / 2).data; // --> bottom part 50/50
		// We select the second half
		// we apply alpha
		this.imageDataLength = this.imageAlpha.data.length; // --> cached data length for perf
		for (let i = 3; i < this.imageDataLength; i += 4) { // iterate 4 for RGBA values
			this.imageAlpha.data[i] = this.alphaData[i - 1];
		}


		this.ctx.fillStyle = this.controller.color; // color fill
		this.ctx.putImageData(this.imageAlpha, 0, 0, 0, 0, this.width, this.height);
		this.ctx.globalCompositeOperation = 'source-in'; // use a source-in composition for mask

		this.ctx.textAlign = 'center';
		this.ctx.fillText(this.text, this.width / 2, this.height / 2 + this.controller.size / 2); // Fill with text

	}
}

new VideoAlphaMask();




