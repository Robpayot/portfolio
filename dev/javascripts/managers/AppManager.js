// import PreloadManager from './PreloadManager';
import EmitterManager from './EmitterManager';
// import RouterManager from './RouterManager';
// import Device from '../helpers/Device';
// import WebFont from 'webfontloader';
import SoundManager from './SoundManager';


class AppManager {

    constructor() {

        this.start = this.start.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);

    }

    start() {

        // }
        window.addEventListener('resize', this.resizeHandler);
        this.resizeHandler();

        // create SoundManager
        new SoundManager();

    }

    // completeLoading() {



    //     // Preload Font for pixi.js
    //     // WebFont.load({
    //     //     custom: {
    //     //         families: ['Avenir-black']
    //     //     }
    //     // });

    // }

    resizeHandler() {

        // const touch = document.querySelector('html').classList.contains('touchevents');

        // if (touch) {
        //     Device.touch = true;
        // } else {
        //     Device.touch = false;
        // }

        // // Device.browser = Detect.browser();

        // // if (/Edge/.test(Device.browser) || /IE/.test(Device.browser)) {

        // //     document.body.classList.add('ie');
        // // }



        // Device.size = 'mobile';

        // if (window.innerWidth >= 768) {
        //     Device.size = 'tablet';
        // }

        // if (window.innerWidth > 1024) {
        //     Device.size = 'desktop';
        // }
        console.log('resize');

        EmitterManager.emit('resize', window.innerWidth, window.innerHeight);

    }
}

export default new AppManager();
