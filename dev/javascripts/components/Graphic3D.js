import EmitterManager from '../managers/EmitterManager';
import SoundManager from '../managers/SoundManager';

export default class Graphic3D {

    constructor(SoundManager) {

        this.raf = this.raf.bind(this);
        this.events = this.events.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);

        this.start();


    }

    start() {

        console.log('test 2', SoundManager);

        this.events(true);


        return false;

        this.el = document.querySelector('.xp');


        this.ui = {
            myAudio: this.el.querySelector('audio'),
            formFtt: this.el.querySelector('.formFtt'),
            frequencies: this.el.querySelector('.frequencies'),
            hight: this.el.querySelector('.frequencies .hight .circle'),
            medium: this.el.querySelector('.frequencies .medium .circle'),
            low: this.el.querySelector('.frequencies .low .circle')
        };



    }

    events(method) {

        let listen = method === false ? 'removeEventListener' : 'addEventListener';
        listen = method === false ? 'off' : 'on';

        EmitterManager[listen]('resize', this.resizeHandler);
        EmitterManager[listen]('raf', this.raf);

    }


    resizeHandler() {
        this.canvas.width = window.innerWidth;
    }

    raf() {


    }


}
