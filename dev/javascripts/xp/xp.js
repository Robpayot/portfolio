import sono from 'sono';

class Xp {

    constructor() {

        console.log(sono);



        this.draw = this.draw.bind(this);


        this.init();


    }

    init() {

        this.frequencyB = document.querySelector('.frequency .block');
        this.amplitudeB = document.querySelector('.amplitude .block');
        this.waveFormB = document.querySelector('.waveForm .block');
        this.ptichB = document.querySelector('.pitch .block');


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





        console.log(sound);
    }

    draw() {

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
