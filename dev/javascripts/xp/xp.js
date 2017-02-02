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

        this.el = document.querySelector('.xp');


        this.ui = {
            myAudio: this.el.querySelector('audio'),
            formFtt: this.el.querySelector('.formFtt'),
            frequencies: this.el.querySelector('.frequencies'),
            hight: this.el.querySelector('.frequencies .hight .circle'),
            medium: this.el.querySelector('.frequencies .medium .circle'),
            low: this.el.querySelector('.frequencies .low .circle')
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

        console.log(this.bufferLength);
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
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let barWidth = this.canvas.width / this.bufferLength;
        let barHeight;
        let x = 0;

        // Value of first Bar
        // console.log(this.dataArray[0]);

        for (let i = 0; i < this.bufferLength; i++) {

            barHeight = this.dataArray[i] * (3 / 4);

            let hue = i / this.bufferLength * 360;
            this.canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            this.canvasCtx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }


        ////////////
        // hight
        ///////////

        let hightVals = 0;
        let hightLimit = Math.round(this.bufferLength / 5);

        for (let i = 0; i < hightLimit; i++) {

            hightVals += this.dataArray[i];

        }

        const hightAvg = hightVals / hightLimit;
        TweenMax.to(this.ui.hight, 0, { width: hightAvg, height: hightAvg });

        ////////////
        // medium
        ///////////

        let mediumVals = 0;
        let mediumLimit = Math.round((this.bufferLength / 5) * 2);

        for (let i = hightLimit; i < mediumLimit; i++) {

            mediumVals += this.dataArray[i];

        }

        const mediumAvg = mediumVals / mediumLimit;
        TweenMax.to(this.ui.medium, 0, { width: mediumAvg, height: mediumAvg });

        ////////////
        // low
        ///////////

        let lowVals = 0;
        let lowLimit = Math.round((this.bufferLength / 5) * 3);

        for (let i = mediumLimit; i < lowLimit; i++) {

            lowVals += this.dataArray[i];

        }

        const lowAvg = lowVals / lowLimit;
        TweenMax.to(this.ui.low, 0, { width: lowAvg, height: lowAvg });
        requestAnimationFrame(this.draw);

    }


}


export default new Xp();
