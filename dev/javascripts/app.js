'use strict';

// Default Babel Polyfill, be careful, be sure you need it
// because it's ~6000 lines of code unminified
// import 'babel-polyfill';
import './vendors/modernizr-custom';
import 'gsap';

// import './vendors/preloadjs-0.6.2.min.js';



// import * as tools from '@84paris/84.tools';

// Your imports
// import MyComponent from './component.es6'
console.log('%c 84.Boilerplate ===== Your app is ready.', 'background: #000; color: #FFF');

// import Xp from './xp/xp';

import AppManager from './managers/AppManager';
import PreloadManager from './managers/PreloadManager';

global.MENU;
global.PROD = false;
global.BASE = '';

if (window.location.host === 'robpayot.github.io') {
	global.PROD = true;
	global.BASE = 'https://robpayot.github.io/xp-son/dist';

}

(() => {

	PreloadManager.on('complete', AppManager.start, this, true);

	PreloadManager.loadManifest([
		{ id: 'texture-asteroid', src: 'images/textures/asteroid-1.jpg' },
		{ id: 'texture-star', src: 'images/textures/star-2.png' },
		{ id: 'damier', src: 'images/textures/damier.jpg' },
		{ id: 'tpl-project-title', src: `${global.BASE}/templates/projectTitle.hbs` },
		{ id: 'tpl-project-content', src: `${global.BASE}/templates/projectContent.hbs` },
		{ id: 'tpl-menu', src: `${global.BASE}/templates/menu.hbs` }
		// { id: 'template-menu', src: ''}
	]);

	PreloadManager.load();



})();
