'use strict';

// Default Babel Polyfill, be careful, be sure you need it
// because it's ~6000 lines of code unminified
// import 'babel-polyfill';
import './vendors/modernizr-custom';
import 'gsap';

import AppManager from './managers/AppManager';

global.MENU;
global.OVERLAY;
global.MODELS;
global.SKYTEX;
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
