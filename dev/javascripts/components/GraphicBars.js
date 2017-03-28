import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';

export default class GraphicBars {

    constructor() {

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

        let listen = method === false ? 'removeEventListener' : 'addEventListener';
        listen = method === false ? 'off' : 'on';

        EmitterManager[listen]('resize', this.resizeHandler);
        EmitterManager[listen]('raf', this.raf);

    }

    resizeHandler(w, h) {

        this.canvas.width = w;
    }

    raf() {

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


        // Update circles size

        ////////////
        // hight
        ///////////

        TweenMax.to(this.ui.hight, 0, { width: this.sound.hightAvg, height: this.sound.hightAvg });

        ////////////
        // medium
        ///////////

        TweenMax.to(this.ui.medium, 0, { width: this.sound.mediumAvg, height: this.sound.mediumAvg });

        ////////////
        // low
        ///////////

        TweenMax.to(this.ui.low, 0, { width: this.sound.lowAvg, height: this.sound.lowAvg });

    }


}
