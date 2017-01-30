import sono from 'sono';

class Xp {

    constructor() {

        console.log(sono);



        this.draw = this.draw.bind(this);


        this.init();


    }

    init() {

        this.frequencyB = document.querySelector('.frequency .block');

        this.frequencyB.style.height = '300px';

        console.log(this.frequencyB);

        const sound = sono.createSound({
            id: 'hiphop',
            src: ['sounds/hiphop_ldd.mp3'],
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

            console.log(val);
            // draw some visualisation
            this.frequencyB.style.height = `${val}px`;

            // console.log(this.frequencyB);
            // console.log(normalised);
        }

        // this.waveform = this.analyser.getWaveform();

        // for (i = 0; i < this.waveform.length; i++) {
        //     magnitude = this.waveform[i];
        //     normalised = magnitude / 256;
        //     // draw some visualisation
        //     // console.log(normalised);
        // }
    }


}


export default new Xp();
