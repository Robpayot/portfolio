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



        var analyser = this.audioCtx.createAnalyser();

        var source = this.audioCtx.createMediaElementSource(this.myAudio);
        source.connect(analyser);
        analyser.connect(this.audioCtx.destination);


        analyser.fftSize = 2048;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);

        analyser.getByteTimeDomainData(dataArray);

        var canvas = document.querySelector('.canvas');
        canvas.width = 500;
        canvas.height = 500;

        var canvasCtx = canvas.getContext('2d');

        canvasCtx.clearRect(0, 0, 500, 500);

        console.log(analyser);


        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);
            canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            canvasCtx.fillRect(0, 0, 500, 500);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

            canvasCtx.beginPath();

            var sliceWidth = 500 * 1.0 / bufferLength;
            var x = 0;
            console.log('yes');

            for (var i = 0; i < bufferLength; i++) {

                var v = dataArray[i] / 128.0;
                var y = v * 500 / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };

        // Drawing code goes here

        draw();


        ///////////////////////////////////
        ///////////////////////////////////


        return false;


        console.log(this.frequencyB);

        const sound = sono.createSound({
            id: 'hiphop',
            src: ['sounds/dnb_ldd.mp3'],
            volume: 0.5,
            loop: true
        });

        this.analyser = sono.effect.analyser({
            fftSize: 2048,
            smoothingTimeConstant: 0.7
        });

        sound.play();

        setTimeout(() => {
            this.draw();
        }, 2000);


    }

    draw() {

        return false;


        ///////////////////////////////////
        ///////////////////////////////////


        window.requestAnimationFrame(this.draw);

        // var frequencies, waveform, magnitude, normalised, i;

        let frequencies = this.analyser.getFrequencies();


        for (let i = 0; i < frequencies.length; i++) {
            this.magnitude = frequencies[i];
            this.normalised = this.magnitude / 256;

            let val = this.normalised * 100;

            // console.log(val);
            // draw some visualisation
            if (val > 0) {
                this.frequencyB.style.height = `${val}px`;
            }


            // console.log(this.frequencyB);
            // console.log(normalised);
        }
        // console.log('test');

        let waveform = this.analyser.getWaveform();

        for (let i = 0; i < waveform.length; i++) {
            this.magnitudeW = waveform[i];
            this.normalisedW = this.magnitudeW / 256;
            let val = this.normalisedW * 100;
            // draw some visualisation
            if (val > 0) {
                this.waveFormB.style.height = `${val}px`;
            }
        }


        // let amplitude = this.analyser.getAmplitude();

        // for (let i = 0; i < amplitude.length; i++) {
        //     this.magnitudeA = amplitude[i];
        //     this.normalisedA = this.magnitudeA / 256;
        //     let val = this.normalisedA * 100;
        //     // draw some visualisation
        //     if (val > 0) {
        //         this.amplitudeB.style.height = `${val}px`;
        //     }
        // }
    }


}


export default new Xp();
