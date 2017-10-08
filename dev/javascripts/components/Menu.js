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
		this.ui.button[evListener]('mouseenter', this.onOverBtn);
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
		if (this.animClicked === true) return false;
		this.animBtn = true;
		this.animClicked = true;

		const tl = new TimelineMax();
		TweenMax.killTweensOf(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down']);

		if (this.el.classList.contains('is-open') === true) {

			this.el.classList.remove('is-open');

			tl.to('.menu__button .open-up', 0.3, {strokeDashoffset: this.maxDash, ease: window.Expo.easeOut });
			tl.to('.menu__button .open-down', 0.3, {strokeDashoffset: -this.maxDash, ease: window.Expo.easeOut }, 0);
			tl.to('.menu__button .close-up', 0.65, {strokeDashoffset: this.maxDash * 2, ease: window.Expo.easeOut}, 0.1 );
			tl.to('.menu__button .close-down', 0.9, {strokeDashoffset: -this.maxDash + 205, ease: window.Expo.easeOut}, 0.3);
			tl.add(()=> {
				this.ui.buttonSvg.classList.remove('is-open');
				this.ui.buttonSvg.classList.add('is-close');
				TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
				this.animBtn = false;
				this.animClicked = false;
			});

		} else {

			this.el.classList.add('is-open');
			tl.to('.menu__button .close-up', 0.3, {strokeDashoffset: -this.maxDash, ease: window.Expo.easeOut });
			tl.to('.menu__button .close-down', 0.3, {strokeDashoffset: this.maxDash * 3, ease: window.Expo.easeOut }, 0);
			tl.to('.menu__button .open-down', 0.65, {strokeDashoffset: this.maxDash * 3 - 205, ease: window.Expo.easeOut}, 0.1 );
			tl.to('.menu__button .open-up', 0.9, {strokeDashoffset: 0, ease: window.Expo.easeOut}, 0.3);
			tl.add(()=> {
				this.ui.buttonSvg.classList.add('is-open');
				this.ui.buttonSvg.classList.remove('is-close');
				TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
				this.animBtn = false;
				this.animClicked = false;
			});
		}
	}

	onOverBtn(e) {

		if (this.hoverBtn === true) return false;
		global.CURSOR.interractHover({el: e.currentTarget, magnet: true});

		if (this.animBtn === true) return false;
		if (this.animClicked === true) return false;

		// this.animBtn = true;
		this.hoverBtn = true;
		const tl = new TimelineMax();
		// TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
		TweenMax.killTweensOf(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down']);
		TweenMax.to('.menu__button circle', 0, {opacity: 0});
		if (this.ui.buttonSvg.classList.contains('is-close')) {

			tl.to('.menu__button .close-up', 1, {strokeDashoffset: -this.maxDash * 2, ease: window.Expo.easeOut}, 0);
			tl.to('.menu__button .close-down', 1.2, {strokeDashoffset: this.maxDash * 3 + 205, ease: window.Expo.easeOut}, 0);
			tl.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
			tl.add(()=> {
				this.animBtn = false;
			});
		} else {
			tl.to('.menu__button .open-up', 1, {strokeDashoffset: this.maxDash * 2, ease: window.Expo.easeOut}, 0 );
			tl.to('.menu__button .open-down', 1.2, {strokeDashoffset: -this.maxDash - 205, ease: window.Expo.easeOut}, 0);
			tl.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
			tl.add(()=> {
				this.animBtn = false;
			});
		}
	}

	onLeaveBtn() {
		global.CURSOR.interractLeave({magnet: true});
		this.hoverBtn = false;
		TweenMax.fromTo('.menu__button circle', 0.2, {opacity: 0}, {opacity: 1});
		TweenMax.fromTo('.menu__button circle', 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});
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
