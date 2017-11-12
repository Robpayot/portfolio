// import AbstractView from './AbstractView';
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
			subLinksTitles: this.el.querySelectorAll('.menu__sublink > div'),
			links: this.el.querySelectorAll('.menu__link'),
			linksTitles: this.el.querySelectorAll('.menu__link .title--3')
		};

		this.maxDash = 635;
		this.animBtn = false;
		this.hoverBtn = false;

		// bind
		this.toggleOpen = this.toggleOpen.bind(this);
		this.onHoverBtn = this.onHoverBtn.bind(this);
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
		this.ui.button[evListener]('mouseenter', this.onHoverBtn);
		this.ui.button[evListener]('mouseleave', this.onLeaveBtn);
		for (let i = 0; i < this.ui.linksTitles.length; i++) {
			this.ui.linksTitles[i][evListener]('mouseenter', this.onHoverLink);
			this.ui.linksTitles[i][evListener]('mouseleave', this.onLeaveLink);
		}

		for (let i = 0; i < this.ui.subLinksTitles.length; i++) {
			this.ui.subLinksTitles[i][evListener]('mouseenter', this.onHoverLink);
			this.ui.subLinksTitles[i][evListener]('mouseleave', this.onLeaveLink);
		}
		// svg.addEventListener('mouseleave', () => {
		// 	console.log('leave');
		// 	hover = false;
		// });
	}

	toggleOpen(close = false) {

		if (close === true) {

			TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
			this.el.classList.remove('is-open');
			global.CURSOR.el.classList.remove('menu-open');
			this.ui.buttonSvg.classList.remove('is-open');
			this.ui.buttonSvg.classList.add('is-close');
			this.animBtn = false;
			this.animClicked = false;
			console.log('close');
			return false;
		}

		if (this.animBtn === true) return false;
		if (this.animClicked === true) return false;
		this.animBtn = true;
		this.animClicked = true;

		TweenMax.killTweensOf(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down']);

		if (this.el.classList.contains('is-open') === true || close === true) {

			this.el.classList.remove('is-open');
			global.CURSOR.el.classList.remove('menu-open');
			const tl = new TimelineMax();

			// tl.fromTo('.menu__link .title--3', 1, {x: '-100%'}, { x: 0, ease: window.Expo.easeOut});
			tl.to('.menu__button .open-up', 0.3, {strokeDashoffset: this.maxDash, ease: window.Expo.easeOut }, 0);
			tl.to('.menu__button .open-down', 0.3, {strokeDashoffset: -this.maxDash, ease: window.Expo.easeOut }, 0);
			tl.to('.menu__button .close-up', 0.65, {strokeDashoffset: this.maxDash * 2, ease: window.Expo.easeOut}, 0.1 );
			tl.to('.menu__button .close-down', 0.9, {strokeDashoffset: -this.maxDash + 205, ease: window.Expo.easeOut}, 0.3);
			tl.add(() => {
				this.ui.buttonSvg.classList.remove('is-open');
				this.ui.buttonSvg.classList.add('is-close');
				TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
				this.animBtn = false;
				this.animClicked = false;
			});

		} else {

			this.el.classList.add('is-open');
			global.CURSOR.el.classList.add('menu-open');

			const links = document.querySelectorAll('.menu__link .title--3');

			const tl = new TimelineMax();

			tl.set(links, {opacity: 0});
			tl.staggerFromTo([links[2], links[1], links[0]], 1.5, {x: '-120%', opacity: 0}, { x: '0%', opacity: 1, ease: window.Expo.easeOut}, 0.05, 0.2);
			// tl.set('.menu__sublink span', {opacity: 1}, 1.5);
			tl.staggerFromTo('.menu__sublink div', 1.5, {x: '-120%', opacity: 0}, { x: '0%', opacity: 1, ease: window.Expo.easeOut}, 0.03, 0.4);
			tl.to('.menu__button .close-up', 0.3, {strokeDashoffset: -this.maxDash, ease: window.Expo.easeOut }, 0);
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

	onHoverLink(e) {
		const el = e.currentTarget;
		el.parentNode.classList.add('is-hover');

		if (el.parentNode.getAttribute('data-color')) {
			global.CURSOR.interractHover({color: el.parentNode.getAttribute('data-color'), small: true });
		} else {
			global.CURSOR.interractHover();
		}
	}

	onLeaveLink(e) {
		const el = e.currentTarget;
		el.parentNode.classList.remove('is-hover');
		global.CURSOR.interractLeave({ small: true });
	}

	onHoverBtn(e) {

		if (this.hoverBtn === true) return false;
		global.CURSOR.interractHover();

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
		global.CURSOR.interractLeave();
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
