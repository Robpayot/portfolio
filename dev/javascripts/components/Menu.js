// import AbstractView from './AbstractView';
import Handlebars from 'handlebars';
import PreloadManager from '../managers/PreloadManager';
import DATA from '../../datas/data.json';
import ScrollManager from '../managers/ScrollManager';
// import RouterManager from '../managers/RouterManager';
import { Device } from '../helpers/Device';
import { preventLink } from '../helpers/utils';
import '../helpers/polyfills';
import { Howler } from 'howler';

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
			linksTitles: this.el.querySelectorAll('.menu__link .title--3'),
			aLinks: this.el.querySelectorAll('.menu__link a'),
			sound: document.querySelector('.sound')
		};

		this.maxDash = 635;
		this.animBtn = false;
		this.hoverBtn = false;
		this.tl = new TimelineMax();

		// bind
		this.toggleOpen = this.toggleOpen.bind(this);
		this.onClickOutside = this.onClickOutside.bind(this);
		this.onHoverBtn = this.onHoverBtn.bind(this);
		this.onLeaveBtn = this.onLeaveBtn.bind(this);
		this.update = this.update.bind(this);
		this.turnOff = this.turnOff.bind(this);
		this.toggleSound = this.toggleSound.bind(this);

		this.events(true);

	}

	events(method) {

		let evListener = method === false ? 'removeEventListener' : 'addEventListener';
		// let onListener = method === false ? 'off' : 'on';

		if (Device.touch === false) {
			this.ui.sound[evListener]('click', this.toggleSound);
			this.el[evListener]('click', this.onClickOutside);
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
		} else {
			this.ui.sound[evListener]('touchstart', this.toggleSound);
			this.ui.button[evListener]('touchstart', this.toggleOpen);
			for (let i = 0; i < this.ui.linksTitles.length; i++) {
				this.ui.linksTitles[i][evListener]('touchstart', this.onHoverLink);
			}

			for (let i = 0; i < this.ui.subLinksTitles.length; i++) {
				this.ui.subLinksTitles[i][evListener]('touchstart', this.onHoverLink);
			}
			for (let i = 0; i < this.ui.aLinks.length; i++) {
				this.ui.aLinks[i][evListener]('click', preventLink);
			}
		}


	}

	turnOff() {
		Howler.volume(0);
	}

	toggleSound(e) {
		const el = e.currentTarget;
		TweenMax.killDelayedCallsTo(this.turnOff);

		if (el.classList.contains('off') === true) {
			el.classList.remove('off');
			Howler.volume(1);
			global.SOUNDS['music'].fade(0, 1, 1500);
		} else {
			el.classList.add('off');
			global.SOUNDS['music'].fade(1, 0, 1500);
			TweenMax.delayedCall(1.5, this.turnOff);
		}
	}

	toggleOpen(e, close = false) {

		if (e) e.stopPropagation();

		if (this.animBtn === true && close === false) return false;
		if (this.animClicked === true && close === false) return false;

		this.animBtn = true;
		this.animClicked = true;

		this.tl.kill();
		TweenMax.killTweensOf(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down']);
		TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});

		if (this.el.classList.contains('is-open') === true || close === true) {
			this.el.style.pointerEvents = 'none';

			ScrollManager.on();

			this.el.classList.remove('is-open');
			if (!Device.touch) global.CURSOR.el.classList.remove('menu-open');


			this.tl = new TimelineMax();

			// tl.fromTo('.menu__link .title--3', 1, {x: '-100%'}, { x: 0, ease: window.Expo.easeOut});
			this.tl.to('.menu__button .open-up', 0.3, {strokeDashoffset: this.maxDash * 3, ease: window.Expo.easeOut }, 0);
			this.tl.to('.menu__button .open-down', 0.3, {strokeDashoffset: this.maxDash, ease: window.Expo.easeOut }, 0);
			this.tl.to('.menu__button .close-up', 0.65, {strokeDashoffset: this.maxDash * 4, ease: window.Expo.easeOut}, 0.1 );
			this.tl.to('.menu__button .close-down', 0.9, {strokeDashoffset: this.maxDash + 205, ease: window.Expo.easeOut}, 0.3);
			this.tl.add(() => {
				this.ui.buttonSvg.classList.remove('is-open');
				this.ui.buttonSvg.classList.add('is-close');
				TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
				this.animBtn = false;
				this.animClicked = false;
			});

		} else {

			ScrollManager.off();
			this.el.style.pointerEvents = 'auto';

			this.el.classList.add('is-open');
			if (!Device.touch) global.CURSOR.el.classList.add('menu-open');


			const links = document.querySelectorAll('.menu__link .title--3');

			this.tl = new TimelineMax();

			this.tl.set(links, {opacity: 0});
			if (Device.orientation === 'portrait' ) {
				const subLinks = document.querySelectorAll('.menu__sublink div');
				this.tl.staggerFromTo([links[0], links[1], ...subLinks, links[2]], 1.5, {x: '-120%', opacity: 0}, { x: '0%', opacity: 1, ease: window.Expo.easeOut}, 0.05, 0.2);
			} else {
				this.tl.staggerFromTo([links[2], links[1], links[0]], 1.5, {x: '-120%', opacity: 0}, { x: '0%', opacity: 1, ease: window.Expo.easeOut}, 0.05, 0.2);
				this.tl.staggerFromTo('.menu__sublink div', 1.5, {x: '-120%', opacity: 0}, { x: '0%', opacity: 1, ease: window.Expo.easeOut}, 0.03, 0.4);
			}

			this.tl.to('.menu__button .close-up', 0.3, {strokeDashoffset: this.maxDash, ease: window.Expo.easeOut }, 0);
			this.tl.to('.menu__button .close-down', 0.3, {strokeDashoffset: this.maxDash * 5, ease: window.Expo.easeOut }, 0);
			this.tl.to('.menu__button .open-down', 0.65, {strokeDashoffset: this.maxDash * 5 - 205, ease: window.Expo.easeOut}, 0.1 );
			this.tl.to('.menu__button .open-up', 0.9, {strokeDashoffset: this.maxDash * 2, ease: window.Expo.easeOut}, 0.3);
			this.tl.add(()=> {
				this.ui.buttonSvg.classList.add('is-open');
				this.ui.buttonSvg.classList.remove('is-close');
				TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
				this.animBtn = false;
				this.animClicked = false;
			});

			TweenMax.to('.navigate', 1, {x: '0%', ease: window.Expo.easeOut});
			TweenMax.to('.navigate', 0.2, {opacity: 0, ease: window.Linear.easeNone});
		}

		// sound
		global.SOUNDS['switch'].play();
	}

	onClickOutside(e) {

		if (this.el.classList.contains('is-open') === true ) {
			this.toggleOpen(e, true);
		}
	}

	onHoverLink(e) {
		const el = e.currentTarget;
		el.parentNode.classList.add('is-hover');

		if (Device.touch === false) {
			if (el.parentNode.getAttribute('data-color')) {
				global.CURSOR.interractHover({color: el.parentNode.getAttribute('data-color'), small: true });
			} else {
				global.CURSOR.interractHover();
			}
		}

		// sound
		global.SOUNDS['hover_2'].play();
	}

	onLeaveLink(e) {
		const el = e.currentTarget;
		el.parentNode.classList.remove('is-hover');
		global.CURSOR.interractLeave({ small: true });
	}

	onHoverBtn(e) {

		if (this.hoverBtn === true) return false;
		global.CURSOR.interractHover({magnet: true, el: this.ui.buttonSvg});

		if (this.animBtn === true) return false;
		if (this.animClicked === true) return false;

		// this.animBtn = true;
		this.hoverBtn = true;
		const tl = new TimelineMax();
		// TweenMax.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
		TweenMax.killTweensOf(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down']);
		TweenMax.to('.menu__button circle', 0, {opacity: 0});
		if (this.ui.buttonSvg.classList.contains('is-close')) {

			tl.to('.menu__button .close-up', 1, {strokeDashoffset: 0, ease: window.Expo.easeOut}, 0);
			tl.to('.menu__button .close-down', 1.2, {strokeDashoffset: this.maxDash * 5 + 205, ease: window.Expo.easeOut}, 0);
			tl.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
			tl.add(()=> {
				this.animBtn = false;
			});

			tl.fromTo('.navigate', 1, {x: '0%'}, {x: '60%', ease: window.Expo.easeOut}, 0);
			tl.fromTo('.navigate', 0.2, {opacity: 0}, {opacity:1, ease: window.Linear.easeNone}, 0);
		} else {
			tl.to('.menu__button .open-up', 1, {strokeDashoffset: this.maxDash * 4, ease: window.Expo.easeOut}, 0 );
			tl.to('.menu__button .open-down', 1.2, {strokeDashoffset: this.maxDash - 205, ease: window.Expo.easeOut}, 0);
			tl.set(['.menu__button .close-up','.menu__button .close-down','.menu__button .open-up','.menu__button .open-down'], {clearProps: 'all'});
			tl.add(()=> {
				this.animBtn = false;
			});
		}

		// sound
		global.SOUNDS['hover'].play();
	}

	onLeaveBtn() {
		global.CURSOR.interractLeave({magnet: true, el: this.ui.buttonSvg});
		this.hoverBtn = false;
		TweenMax.fromTo('.menu__button circle', 0.2, {opacity: 0}, {opacity: 1});
		TweenMax.set('.menu__button circle', {transformOrigin: '50% 50%'});
		TweenMax.fromTo('.menu__button circle', 1.2, {scale: 0.5}, {scale: 1, ease: window.Expo.easeOut});

		TweenMax.to('.navigate', 1, {x: '0%', ease: window.Expo.easeOut});
		TweenMax.to('.navigate', 0.2, {opacity: 0, ease: window.Linear.easeNone});
	}

	update(view, index) {

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

}
