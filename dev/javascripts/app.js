'use strict';

// Default Babel Polyfill, be careful, be sure you need it
// because it's ~6000 lines of code unminified
// import 'babel-polyfill';
import 'modernizr';
import 'gsap';

// import './vendors/preloadjs-0.6.2.min.js';


 

// import * as tools from '@84paris/84.tools';

// Your imports
// import MyComponent from './component.es6'
console.log('%c 84.Boilerplate ===== Your app is ready.', 'background: #000; color: #FFF');

// import Xp from './xp/xp';

import AppManager from './managers/AppManager';
import PreloadManager from './managers/PreloadManager';



(() => {

    PreloadManager.on('complete', () => {

        AppManager.start();

    }, this, true);



    PreloadManager.loadFile({ id: 'texture-asteroid', src: 'images/textures/asteroid-1.jpg' });
    PreloadManager.loadFile({ id: 'damier', src: 'images/textures/damier.jpg' });



    PreloadManager.load();



})();
