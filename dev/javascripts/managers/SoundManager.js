import EmitterManager from './EmitterManager';

import dat from 'dat-gui';


class SoundManager {

	constructor() {

		this.bind();

		this.init();


	}

	bind() {

		this.events = this.events.bind(this);
		this.changeFtt = this.changeFtt.bind(this);
		this.init = this.init.bind(this);
		this.raf = this.raf.bind(this);
	}

	init() {
		console.log('init SoundManager');

		this.el = document.querySelector('.xp');


		this.ui = {
			myAudio: this.el.querySelector('audio')
		};

		// New WebAudio API
		this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

		//  Create Analyser node
		this.analyser = this.audioCtx.createAnalyser();

		// Connect nodes together
		let source = this.audioCtx.createMediaElementSource(this.ui.myAudio);
		source.connect(this.analyser);
		this.analyser.connect(this.audioCtx.destination);


		// Set Fourier value
		this.analyser.fftSize = 2048;
		// Get frequency length ( fftSize / 2)
		this.bufferLength = this.analyser.frequencyBinCount;
		// Prepare array of frequencies
		this.dataArray = new Uint8Array(this.bufferLength);

		this.events(true);

		// GUI

		this.params = {
			Fourier_value: this.analyser.fftSize
		};

		this.gui = new dat.GUI();
		this.gui.add(this.params, 'Fourier_value', [256, 512, 1024, 2048]).onChange(this.changeFtt);


	}

	events(method) {

		let listen = method === false ? 'removeEventListener' : 'addEventListener';
		listen = method === false ? 'off' : 'on';

		EmitterManager[listen]('raf', this.raf);

	}

	changeFtt(e) {
		// Reset frequencies
		this.analyser.fftSize = this.params.Fourier_value;
		this.bufferLength = this.analyser.frequencyBinCount;
		this.dataArray = new Uint8Array(this.bufferLength);
	}

	raf() {

		// .getByteFrequencyData() --> For bar graph visualisation (abscisse = Fréquence / ordonnée = intensité)
		// .getByteTimeDomainData() --> For oscilloscope visualisation
		this.analyser.getByteFrequencyData(this.dataArray);

		// Divise frequencies in 3 parts

		////////////
		// hight
		///////////

		let hightVals = 0;
		let hightLimit = Math.round(this.bufferLength / 5);

		for (let i = 0; i < hightLimit; i++) {

			hightVals += this.dataArray[i];

		}

		this.hightAvg = hightVals / hightLimit;

		////////////
		// medium
		///////////

		let mediumVals = 0;
		let mediumLimit = Math.round(this.bufferLength / 5 * 2);

		for (let i = hightLimit; i < mediumLimit; i++) {

			mediumVals += this.dataArray[i];

		}

		this.mediumAvg = mediumVals / mediumLimit;

		////////////
		// low
		///////////

		let lowVals = 0;
		let lowLimit = Math.round(this.bufferLength / 5 * 3);

		for (let i = mediumLimit; i < lowLimit; i++) {

			lowVals += this.dataArray[i];

		}

		this.lowAvg = lowVals / lowLimit;
	}


}

export default new SoundManager();
