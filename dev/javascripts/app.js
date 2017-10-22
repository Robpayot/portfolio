'use strict';

// Default Babel Polyfill, be careful, be sure you need it
// because it's ~6000 lines of code unminified
// import 'babel-polyfill';
import './vendors/modernizr-custom';
import 'gsap';

// console.log('%c 84.Boilerplate ===== Your app is ready.', 'background: #000; color: #FFF');

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
		// { id: 'damier', src: 'images/textures/damier.jpg' },
		{ id: 'tpl-project-title', src: `${global.BASE}/templates/projectTitle.hbs` },
		{ id: 'tpl-project-content', src: `${global.BASE}/templates/projectContent.hbs` },
		{ id: 'tpl-project-prev', src: `${global.BASE}/templates/projectPrev.hbs` },
		{ id: 'tpl-project-next', src: `${global.BASE}/templates/projectNext.hbs` },
		{ id: 'tpl-menu', src: `${global.BASE}/templates/menu.hbs` },
		{ id: 'tpl-about-content', src: `${global.BASE}/templates/aboutContent.hbs` },
		{ id: 'tpl-intro-content', src: `${global.BASE}/templates/introContent.hbs` }
		// { id: 'template-menu', src: ''}
	]);

	PreloadManager.load();



})();
