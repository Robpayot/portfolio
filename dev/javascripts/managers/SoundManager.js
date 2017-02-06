import GraphicBars from '../components/GraphicBars';
import Graphic3D from '../components/Graphic3D';


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
            myAudio: this.el.querySelector('audio'),
            formFtt: this.el.querySelector('.formFtt')
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
        this.analyser.fftSize = this.ui.formFtt.value;
        // Get frequency length ( fftSize / 2)
        this.bufferLength = this.analyser.frequencyBinCount;
        // Prepare array of frequencies
        this.dataArray = new Uint8Array(this.bufferLength);

        console.log(this.bufferLength);

        this.graphicBars = new GraphicBars(this);
        // new Graphic3D(this);

        this.events(true);


    }

    events(method) {

        let listener = method === false ? 'removeEventListener' : 'addEventListener';
        let emitterListener = method === false ? 'off' : 'on';

        this.ui.formFtt[listener]('change', this.changeFtt);

        // raf
        TweenMax.ticker[listener]('tick', this.raf);

    }

    changeFtt(e) {
        // Reset frequencies 
        this.analyser.fftSize = this.ui.formFtt.value;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        console.log(this.bufferLength);
    }

    raf() {

        // Raf for GraphicBars
        this.graphicBars.raf();

    }


}
