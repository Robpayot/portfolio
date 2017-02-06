import EmitterManager from '../managers/EmitterManager';

export default class GraphicBars {

    constructor(SoundManager) {


        this.sound = SoundManager;

        this.bind();

        this.init();


    }

    bind() {

        this.init = this.init.bind(this);
        this.raf = this.raf.bind(this);
        this.events = this.events.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);
    }

    init() {

        this.el = document.querySelector('.xp');


        this.ui = {
            frequencies: this.el.querySelector('.frequencies'),
            hight: this.el.querySelector('.frequencies .hight .circle'),
            medium: this.el.querySelector('.frequencies .medium .circle'),
            low: this.el.querySelector('.frequencies .low .circle')
        };

        this.canvas = document.querySelector('.canvas__bars');
        this.canvas.width = window.innerWidth;
        this.canvas.height = 300;
        this.canvasCtx = this.canvas.getContext('2d');
        this.canvasCtx.clearRect(0, 0, 500, 500);

        this.events(true);


    }


    events(method) {

        let listener = method === false ? 'removeEventListener' : 'addEventListener';
        let emitterListener = method === false ? 'off' : 'on';

        EmitterManager[emitterListener]('resize', this.resizeHandler);

    }

    resizeHandler(w, h) {

        this.canvas.width = w;
    }

    raf() {

        // .getByteFrequencyData() --> For bar graph visualisation (abscisse = Fréquence / ordonnée = intensité)
        // .getByteTimeDomainData() --> For oscilloscope visualisation 
        this.sound.analyser.getByteFrequencyData(this.sound.dataArray);


        // Create background
        this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let barWidth = this.canvas.width / this.sound.bufferLength;
        let barHeight;
        let x = 0;

        // Bars anim

        for (let i = 0; i < this.sound.bufferLength; i++) {

            barHeight = this.sound.dataArray[i] * (3 / 4);

            let hue = i / this.sound.bufferLength * 360;
            this.canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            this.canvasCtx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }


        // Circles anim

        ////////////
        // hight
        ///////////

        let hightVals = 0;
        let hightLimit = Math.round(this.sound.bufferLength / 5);

        for (let i = 0; i < hightLimit; i++) {

            hightVals += this.sound.dataArray[i];

        }

        const hightAvg = hightVals / hightLimit;
        TweenMax.to(this.ui.hight, 0, { width: hightAvg, height: hightAvg });

        ////////////
        // medium
        ///////////

        let mediumVals = 0;
        let mediumLimit = Math.round((this.sound.bufferLength / 5) * 2);

        for (let i = hightLimit; i < mediumLimit; i++) {

            mediumVals += this.sound.dataArray[i];

        }

        const mediumAvg = mediumVals / mediumLimit;
        TweenMax.to(this.ui.medium, 0, { width: mediumAvg, height: mediumAvg });

        ////////////
        // low
        ///////////

        let lowVals = 0;
        let lowLimit = Math.round((this.sound.bufferLength / 5) * 3);

        for (let i = mediumLimit; i < lowLimit; i++) {

            lowVals += this.sound.dataArray[i];

        }

        const lowAvg = lowVals / lowLimit;
        TweenMax.to(this.ui.low, 0, { width: lowAvg, height: lowAvg });

    }


}
