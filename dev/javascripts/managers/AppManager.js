// import PreloadManager from './PreloadManager';
import EmitterManager from './EmitterManager';
import RouterManager from './RouterManager';
import { Device } from '../helpers/Device';
// import WebFont from 'webfontloader';
// import SoundManager from './SoundManager';
// import GraphicBars from '../components/GraphicBars';
import SceneManager from './SceneManager';
import Menu from '../components/Menu';
import Cursor from '../components/Cursor';
import bean from 'bean';
import Handlebars from 'handlebars';

global.OVERLAY;


class AppManager {

	constructor() {

		this.start = this.start.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.raf = this.raf.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);

	}

	start() {

		this.events(true);

		// HandlebarRegisters
		Handlebars.registerHelper('math', (lvalue, operator, rvalue, options) => {
			lvalue = parseFloat(lvalue);
			rvalue = parseFloat(rvalue);

			return {
				'+': lvalue + rvalue,
				'-': lvalue - rvalue,
				'*': lvalue * rvalue,
				'/': lvalue / rvalue,
				'%': lvalue % rvalue
			}[operator];
		});

		// SoundManager

		// this.graphicBars = new GraphicBars();
		this.menu = global.MENU = new Menu();
		this.cursor = global.CURSOR = new Cursor();

		// Set up scene
		SceneManager.start();

		// Selectors we need only one time
		this.ui = {
			xp: document.querySelector('.xp'),
			webGl: document.querySelector('.webGl'),
			overlay: document.querySelector('.overlay'),
			body: document.getElementsByTagName('body')[0] // not sure needed
		};

		global.OVERLAY = this.ui.overlay;

		RouterManager.start();
	}

	events(method) {

		this.resizeHandler();

		let listen = method === false ? 'removeEventListener' : 'addEventListener';

		// raf
		TweenMax.ticker[listen]('tick', this.raf);
		if (Device.touch === false) {
			// move camera
			document[listen]( 'mousemove', this.onMouseMove, false );
		}

		listen = method === false ? 'off' : 'on';

		bean[listen](window, 'resize', this.resizeHandler);

	}

	raf() {

		EmitterManager.emit('raf');
	}

	onMouseMove(e) {
		const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		EmitterManager.emit('mousemove', eventX, eventY);
	}

	resizeHandler() {

		const touch = document.querySelector('html').classList.contains('touchevents');

		if (touch) {
			Device.touch = true;
		} else {
			Device.touch = false;
		}

		// // Device.browser = Detect.browser();

		// // if (/Edge/.test(Device.browser) || /IE/.test(Device.browser)) {

		// //     document.body.classList.add('ie');
		// // }



		Device.size = 'mobile';

		if (window.innerWidth >= 768) {
			Device.size = 'tablet';
		}

		if (window.innerWidth > 1024) {
			Device.size = 'desktop';
		}

		EmitterManager.emit('resize', window.innerWidth, window.innerHeight);

	}
}

export default new AppManager();
