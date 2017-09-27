// import AbstractView from './AbstractView';
import EmitterManager from '../managers/EmitterManager';
import { getIndex } from '../helpers/utils';
import Handlebars from 'handlebars';
import PreloadManager from '../managers/PreloadManager';
import DATA from '../../datas/data.json';

export default class Menu {

	constructor() {

		this.el = document.querySelector('.menu');
		let template = Handlebars.compile(PreloadManager.getResult('tpl-menu'));
		let html  = template(DATA);
		this.el.innerHTML = html;

		this.ui = {
			button: this.el.querySelector('.menu__button'),
			overlay: this.el.querySelector('.menu__overlay'),
			subLinks: this.el.querySelectorAll('.menu__sublink'),
			links: this.el.querySelectorAll('.menu__link')
		};

		// bind
		this.toggleOpen = this.toggleOpen.bind(this);
		this.update = this.update.bind(this);
		this.goTo = this.goTo.bind(this);

		this.events(true);

	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		// let onListener = method === false ? 'off' : 'on';

		// EmitterManager[onListener]('resize', this.resizeHandler);
		this.ui.links.forEach((el) => {

			el[evListener]('click', this.goTo);
		});
		this.ui.button[evListener]('click', this.toggleOpen);

	}

	toggleOpen(close = false) {

		if (close === true) {
			this.el.classList.remove('is-open');
			return false;
		}

		if (this.el.classList.contains('is-open') === true) this.el.classList.remove('is-open');
		else this.el.classList.add('is-open');
	}

	update(view, index) {

		console.log(view);

		this.ui.links.forEach((el) => {
			el.classList.remove('is-active');
		});
		this.ui.subLinks.forEach((el) => {
			el.classList.remove('is-active');
		});

		switch (view) {
			case 'about':
				this.ui.links[2].classList.add('is-active');
				this.ui.subLinks[4].classList.add('is-active');
				break;
			case 'intro':
				this.ui.links[0].classList.add('is-active');
				break;
			case 'project-0':
				this.ui.links[1].classList.add('is-active');
				this.ui.subLinks[0].classList.add('is-active');
				break;
			case 'project-1':
				this.ui.links[1].classList.add('is-active');
				this.ui.subLinks[1].classList.add('is-active');
				break;
			case 'project-2':
				this.ui.links[1].classList.add('is-active');
				this.ui.subLinks[2].classList.add('is-active');
				break;
			case 'project-3':
				this.ui.links[1].classList.add('is-active');
				this.ui.subLinks[3].classList.add('is-active');
				break;
		}

	}

	goTo(e) {
		// const el = e.currentTarget;

		// switch (getIndex(el)) {
		// 	case 0:
		// 		EmitterManager.emit('router:switch', '/intro', 0);
		// 		EmitterManager.emit('view:transition:out');
		// 		break;
		// }

	}
}
