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
			buttonSvg: this.el.querySelector('.menu__button svg'),
			overlay: this.el.querySelector('.menu__overlay'),
			subLinks: this.el.querySelectorAll('.menu__sublink'),
			links: this.el.querySelectorAll('.menu__link')
		};

		this.maxDash = 635;
		this.animBtn = false;
		this.hoverBtn = false;

		// bind
		this.toggleOpen = this.toggleOpen.bind(this);
		this.onOverBtn = this.onOverBtn.bind(this);
		this.onLeaveBtn = this.onLeaveBtn.bind(this);
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
		this.ui.button[evListener]('mouseover', this.onOverBtn);
		this.ui.button[evListener]('mouseleave', this.onLeaveBtn);

		// svg.addEventListener('mouseleave', () => {
		// 	console.log('leave');
		// 	hover = false;
		// });
	}

	toggleOpen(close = false) {

		if (close === true) {
			this.el.classList.remove('is-open');
			return false;
		}

		if (this.animBtn === true) return false;

		this.animBtn = true;

		const tl = new TimelineMax();
		TweenMax.killTweensOf(['.close-up','.close-down','.open-up','.open-down']);

		if (this.el.classList.contains('is-open') === true) {

			this.el.classList.remove('is-open');

			tl.to('.open-up', 0.3, {strokeDashoffset: this.maxDash, ease: window.Power4.easeInOut });
			tl.to('.open-down', 0.55, {strokeDashoffset: -this.maxDash, ease: window.Power4.easeInOut }, 0);
			tl.to('.close-up', 0.55, {strokeDashoffset: this.maxDash * 2, ease: window.Power4.easeInOut}, 0.1 );
			tl.to('.close-down', 0.8, {strokeDashoffset: -this.maxDash + 205, ease: window.Expo.easeInOut}, 0.1);
			tl.add(()=> {
				this.ui.buttonSvg.classList.remove('is-open');
				this.ui.buttonSvg.classList.add('is-close');
				TweenMax.set(['.close-up','.close-down','.open-up','.open-down'], {clearProps: 'all'});
				this.animBtn = false;
			});

		} else {

			this.el.classList.add('is-open');
			tl.to('.close-up', 0.4, {strokeDashoffset: -this.maxDash, ease: window.Power4.easeInOut });
			tl.to('.close-down', 0.65, {strokeDashoffset: this.maxDash * 3, ease: window.Power4.easeInOut }, 0);
			tl.to('.open-down', 0.65, {strokeDashoffset: this.maxDash * 3 - 205, ease: window.Power4.easeInOut}, 0.1 );
			tl.to('.open-up', 0.4, {strokeDashoffset: 0, ease: window.Expo.easeInOut}, 0.45);
			tl.add(()=> {
				this.ui.buttonSvg.classList.add('is-open');
				this.ui.buttonSvg.classList.remove('is-close');
				TweenMax.set(['.close-up','.close-down','.open-up','.open-down'], {clearProps: 'all'});
				this.animBtn = false;
			});
		}
	}

	onOverBtn() {

		if (this.hover === true) return false;
		if (this.anim === true) return false;

		this.anim = true;
		this.hover = true;
		const tl = new TimelineMax();
		if (this.ui.buttonSvg.classList.contains('is-close')) {

			tl.to('.close-up', 0.4, {strokeDashoffset: -this.maxDash, ease: window.Power4.easeInOut });
			tl.to('.close-down', 0.65, {strokeDashoffset: this.maxDash * 3, ease: window.Power4.easeInOut }, 0);
			tl.to('.close-up', 0.4, {strokeDashoffset: -this.maxDash * 2, ease: window.Power4.easeInOut}, 0.4 );
			tl.to('.close-down', 0.25, {strokeDashoffset: this.maxDash * 3 + 205, ease: window.Power4.easeInOut}, 0.65);
			tl.set(['.close-up','.close-down','.open-up','.open-down'], {clearProps: 'all'});
			tl.add(()=> {
				this.anim = false;
			});
		} else {
			tl.to('.open-up', 0.4, {strokeDashoffset: this.maxDash, ease: window.Power4.easeInOut });
			tl.to('.open-down', 0.65, {strokeDashoffset: -this.maxDash, ease: window.Power4.easeInOut }, 0);
			tl.to('.open-up', 0.4, {strokeDashoffset: this.maxDash * 2, ease: window.Power4.easeInOut}, 0.4 );
			tl.to('.open-down', 0.25, {strokeDashoffset: -this.maxDash - 205, ease: window.Power4.easeInOut}, 0.65);
			tl.set(['.close-up','.close-down','.open-up','.open-down'], {clearProps: 'all'});
			tl.add(()=> {
				this.anim = false;
			});
		}
	}

	onLeaveBtn() {
		this.hover = false;
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
