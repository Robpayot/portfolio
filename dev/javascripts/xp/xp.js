import sono from 'sono';

class Xp {

    constructor() {

        console.log(sono);



        this.draw = this.draw.bind(this);


        this.init();


    }

    init() {

        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

        this.audioCtx = new(window.AudioContext || window.webkitAudioContext)(); // définition du contexte audio

        this.myAudio = document.querySelector('audio');
        this.frequencyB = document.querySelector('.frequency .block');
        this.amplitudeB = document.querySelector('.amplitude .block');
        this.waveFormB = document.querySelector('.waveForm .block');
        this.ptichB = document.querySelector('.pitch .block');

        // init

        this.analyser = this.audioCtx.createAnalyser();

        var source = this.audioCtx.createMediaElementSource(this.myAudio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);


        this.analyser.fftSize = 256;
        //  Longueur des fréquences !!!
        this.bufferLength = this.analyser.frequencyBinCount;
        // Tableaux des intensités !!
        this.dataArray = new Uint8Array(this.bufferLength);

        this.analyser.getByteTimeDomainData(this.dataArray);

        this.canvas = document.querySelector('.canvas');
        this.canvas.width = 1400;
        this.canvas.height = 200;

        this.canvasCtx = this.canvas.getContext('2d');

        this.canvasCtx.clearRect(0, 0, 500, 500);

        console.log(this.analyser);


        // Drawing code goes here

        this.draw();


    }

    draw() {

        requestAnimationFrame(this.draw);

        this.analyser.getByteFrequencyData(this.dataArray);
        // .getByteFrequencyData()
        // .getByteTimeDomainData()
        this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.fillRect(0, 0, this.canvas.width, 500);

        var barWidth = (500 / this.bufferLength) * 2.5;
        var barHeight;
        var x = 0;

        for (var i = 0; i < this.bufferLength; i++) {
            barHeight = this.dataArray[i] / 2;

            var hue = i / this.analyser.frequencyBinCount * 360;
            this.canvasCtx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
            // this.canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',' + (barHeight + 100) + ',50)';
            this.canvasCtx.fillRect(x, this.canvas.height - barHeight / 2, barWidth, barHeight);

            x += barWidth + 1;
        }

        // this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
        // this.canvasCtx.stroke();

    }


}


export default new Xp();
