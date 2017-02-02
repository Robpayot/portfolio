import sono from 'sono';

class Xp {

    constructor() {

        console.log(sono);



        this.draw = this.draw.bind(this);
        this.events = this.events.bind(this);
        this.changeFtt = this.changeFtt.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);


        this.init();


    }

    init() {


        this.ui = {
            myAudio: document.querySelector('audio'),
            frequencyB: document.querySelector('.frequency .block'),
            amplitudeB: document.querySelector('.amplitude .block'),
            waveFormB: document.querySelector('.waveForm .block'),
            ptichB: document.querySelector('.pitch .block'),
            formFtt: document.querySelector('.fttSize')
        }

        // New WebAudio API
        this.audioCtx = new(window.AudioContext || window.webkitAudioContext)();

        //  Create Analyser node
        this.analyser = this.audioCtx.createAnalyser();

        // Connect nodes together
        var source = this.audioCtx.createMediaElementSource(this.ui.myAudio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);


        // Set Fourier value
        this.analyser.fftSize = this.ui.formFtt.value;
        // Get frequency length ( fftSize / 2)
        this.bufferLength = this.analyser.frequencyBinCount;
        // Prepare array of frequencies
        this.dataArray = new Uint8Array(this.bufferLength);


        this.canvas = document.querySelector('.canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = 300;
        console.log(this.canvas.width);
        this.canvasCtx = this.canvas.getContext('2d');
        this.canvasCtx.clearRect(0, 0, 500, 500);

        console.log(this.bufferLength);

        this.events();

        this.draw();


    }

    events() {

        this.ui.formFtt.addEventListener('change', this.changeFtt);
        window.addEventListener('resize', this.resizeHandler);

    }

    changeFtt(e) {
        // Reset frequencies 
        this.analyser.fftSize = this.ui.formFtt.value;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        console.log(this.bufferLength, this.dataArray);
    }

    resizeHandler() {
        this.canvas.width = window.innerWidth;
    }

    draw() {


        // .getByteFrequencyData() --> For bar graph visualisation (abscisse = Fréquence / ordonnée = intensité)
        // .getByteTimeDomainData() --> For oscilloscope visualisation 
        this.analyser.getByteFrequencyData(this.dataArray);

        // create background
        this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.fillRect(0, 0, this.canvas.width, 500);

        let barWidth = (this.canvas.width / this.bufferLength);
        let barHeight;
        let x = 0;

        // Value of first Bar
        // console.log(this.dataArray[0]);

        for (let i = 0; i < this.bufferLength; i++) {
            barHeight = this.dataArray[i];

            let hue = i / this.bufferLength * 360;
            this.canvasCtx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
            this.canvasCtx.fillRect(x, this.canvas.height - barHeight * 3/4, barWidth, barHeight);

            x += barWidth + 1;
        }



        requestAnimationFrame(this.draw);

    }


}


export default new Xp();
