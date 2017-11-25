'use strict';

// Default Babel Polyfill, be careful, be sure you need it
// because it's ~6000 lines of code unminified
// import 'babel-polyfill';
import './vendors/modernizr-custom';
import 'gsap';

// console.log('%c 84.Boilerplate ===== Your app is ready.', 'background: #000; color: #FFF');

import AppManager from './managers/AppManager';
// import PreloadManager from './managers/PreloadManager';

global.MENU;
global.PROD = false;
global.BASE = '';
global.SCROLLED = false;

if (window.location.host === 'robpayot.github.io') {
	global.PROD = true;
	global.BASE = 'https://robpayot.github.io/xp-son/dist';

}

(() => {

	// preload stuff
	AppManager.preload();



})();
