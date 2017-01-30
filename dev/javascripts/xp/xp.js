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

        let analyser = sono.effect.analyser({
            fftSize: 2048,
            smoothingTimeConstant: 0.7
        });

        this.frequencies = analyser.getFrequencies();

        var frequencies, waveform, magnitude, normalised, i;

        function draw() {
            window.requestAnimationFrame(draw);

            frequencies = analyser.getFrequencies();

            for (i = 0; i < frequencies.length; i++) {
                magnitude = frequencies[i];
                normalised = magnitude / 256;
                // draw some visualisation
                console.log(magnitude);
            }

            waveform = analyser.getWaveform();

            for (i = 0; i < waveform.length; i++) {
                magnitude = waveform[i];
                normalised = magnitude / 256;
                // draw some visualisation
            }
        }
        draw();
        // this.draw();

        sound.play();

        console.log(sound);
    }

    draw() {

        window.requestAnimationFrame(this.draw);

        // var frequencies, waveform, magnitude, normalised, i;


        for (let i = 0; i < this.frequencies.length; i++) {
            this.magnitude = this.frequencies[i];
            this.normalised = this.magnitude / 256;
            console.log(this.normalised);
            // draw some visualisation
            // this.frequencyB.style.height = `${normalised*100}px`;

            // console.log(this.frequencyB);
            // console.log(normalised);
        }

        this.waveform = this.analyser.getWaveform();

        // for (i = 0; i < this.waveform.length; i++) {
        //     magnitude = this.waveform[i];
        //     normalised = magnitude / 256;
        //     // draw some visualisation
        //     // console.log(normalised);
        // }
    }


}


export default new Xp();
