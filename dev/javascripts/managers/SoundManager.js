import GraphicBars from '../components/GraphicBars';
import Graphic3D from '../components/Graphic3D';

import dat from 'dat-gui';


export default class SoundManager {

    constructor() {

        this.bind();

        this.init();


    }

    bind() {
        this.raf = this.raf.bind(this);
        this.events = this.events.bind(this);
        this.changeFtt = this.changeFtt.bind(this);
    }

    init() {

        this.el = document.querySelector('.xp');


        this.ui = {
            myAudio: this.el.querySelector('audio')
        };

        // New WebAudio API
        this.audioCtx = new(window.AudioContext || window.webkitAudioContext)();

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

        console.log(this.bufferLength);

        this.graphicBars = new GraphicBars(this);
        // new Graphic3D(this);

        this.events(true);

        // GUI

        this.params = {
            Fourier_value: this.analyser.fftSize
        }

        const gui = new dat.GUI();
        gui.add(this.params, 'Fourier_value', [256, 512, 1024, 2048]).onChange(this.changeFtt);


    }

    events(method) {

        let listener = method === false ? 'removeEventListener' : 'addEventListener';
        let emitterListener = method === false ? 'off' : 'on';

        // raf
        TweenMax.ticker[listener]('tick', this.raf);

    }

    changeFtt(e) {
        // Reset frequencies 
        this.analyser.fftSize = this.params.Fourier_value;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        console.log(this.bufferLength);
    }

    raf() {

        // Raf for GraphicBars
        this.graphicBars.raf();

    }


}
