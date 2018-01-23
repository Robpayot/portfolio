import EmitterManager from '../managers/EmitterManager';
import { Device } from '../helpers/Device';


export default class Cursor {

	constructor() {


		// bind
		this.onMouseMove = this.onMouseMove.bind(this);
		this.interractHover = this.interractHover.bind(this);
		this.interractLeave = this.interractLeave.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);

		this.wrapper = this.el = document.querySelector('.cursor__wrapper');

		if (Device.touch) {
			this.el.style.display = 'none';
			return false;
		}
		this.svgCircle = this.el.querySelectorAll('circle');
		this.c1 = this.svgCircle[0];
		this.c2 = this.svgCircle[1];
		this.next = this.wrapper.querySelector('.cursor__next');
		this.prev = this.wrapper.querySelector('.cursor__prev');
		this.text = this.el.querySelector('text');


		this.circleObj = {val: 15.9};
		this.mouse = {};
		this.cursorTarget = { x: 0, y: 0};

		EmitterManager.on('mousemove', this.onMouseMove);
		EmitterManager.on('resize', this.resizeHandler);

		this.resizeHandler();

	}


	onMouseMove(x,y) {


		this.mouse.x = x;
		this.mouse.y = y;

		if (this.stopFollow === true) return false;
		TweenMax.set(this.wrapper, {left: x});
		TweenMax.set(this.wrapper, {top: y});
	}

	interractHover(obj = {}) {

		if (this.hoverGlobal === true) return false;
		this.hoverGlobal = true;

		let maxVal = obj.small === true ? 35 : 49;

		if (obj.back === true) {
			TweenMax.set('text', {display: 'block'});
			TweenMax.to('text', 0.5, {opacity: 1});
		}

		if (obj.color !== undefined) {
			this.c2.style.stroke = obj.color;
			if (obj.color === '#000000') this.c2.style.strokeWidth = 5;
			this.hoverGoTo = true;
			this.currentEl = obj.el;
			// remplie
			if (obj.small !== true) {
				TweenMax.to(this.c2, 1.2, {strokeDashoffset: '0%', ease: window.Power3.easeOut,
					// onComplete:() => {
					// 	if (this.hoverGoTo === true) {
					// 		RouterManager.currentPage.goTo(null, this.currentEl);
					// 		window.location.href = this.currentEl.href;
					// 	}
					// }
				});
			} else {
				TweenMax.set(this.c2, {strokeDashoffset: '0%'});
			}

		}

		if (obj.type === 'next') {
			const tl = new TimelineMax();
			tl.to(['.up-1', '.up-2'], 0.5, {opacity: 1});
			tl.to('.up-1', 0.6, {strokeDashoffset: '492%', ease: window.Expo.easeOut }, 0.1);
			tl.to('.up-2', 0.7, {strokeDashoffset: '386%', ease: window.Expo.easeOut }, 0.1);
			tl.set(['.up-1', '.up-2'], {clearProps: 'stroke-dashoffset'});
			tl.fromTo(this.next, 1, { y: '100%', x: '-50%'}, { y: '0%', x: '-50%', ease: window.Expo.easeOut}, 0);
			tl.fromTo(this.next, 0.5, {opacity: 0}, {opacity: 1, ease: window.Linear.easeNone}, 0);

		} else if (obj.type === 'prev') {
			const tl = new TimelineMax();
			tl.to(['.down-1', '.down-2'], 0.5, {opacity: 1});
			tl.to('.down-2', 0.95, {strokeDashoffset: '164%', ease: window.Expo.easeOut }, 0);
			tl.to('.down-1', 0.8, {strokeDashoffset: '270%', ease: window.Expo.easeOut }, 0.1);
			tl.set(['.down-1', '.down-2'], {clearProps: 'stroke-dashoffset'});
			tl.fromTo(this.prev, 1, { y: '-100%', x: '-50%'}, { y: '0%', x: '-50%', ease: window.Expo.easeOut}, 0);
			tl.fromTo(this.prev, 0.5, {opacity: 0}, {opacity: 1, ease: window.Linear.easeNone}, 0);
		}


		let time = 0.7;

		if (obj.magnet === true) {
			const vpOffset = obj.el.getBoundingClientRect();
			this.stopFollow = true;
			TweenMax.to(this.wrapper, 0.3, {left: vpOffset.left + vpOffset.width / 2, top: vpOffset.top + vpOffset.height / 2});
			time = 1.2;

		}

		TweenMax.to(this.circleObj, time, { val: maxVal, ease: window.Expo.easeOut, onUpdate:() => {
			this.c1.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
			this.c2.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
		}});

	}

	interractLeave(obj = {}) {
		if (this.hoverGlobal === false) return false;
		this.hoverGlobal = false;
		this.currentEl = null;
		this.hoverGoTo = false;
		this.stopFollow = false;

		this.c2.style.strokeWidth = 2;
		// console.log('leave');
		// remplie

		// if (obj.type === 'next' || obj.type === 'prev') {
		TweenMax.to(['.up-1', '.up-2'], 0.2, {opacity: 0, ease: window.Linear.easeNone});
		TweenMax.to(['.down-1', '.down-2'], 0.2, {opacity: 0, ease: window.Linear.easeNone});
		TweenMax.to(this.next, 0.2, {opacity: 0, ease: window.Linear.easeNone}, 0);
		TweenMax.to(this.prev, 0.2, {opacity: 0, ease: window.Linear.easeNone}, 0);
		// }

		if (obj.back === true) {
			TweenMax.to('text', 0.2, {opacity: 0});
			TweenMax.set('text', {display: 'block', delay: 0.2});
		}

		if (obj.color !== undefined) {
			TweenMax.to(this.c2, 0.5, {strokeDashoffset: '308%', ease: window.Expo.easeOut});
		}

		if (obj.small === true) {
			TweenMax.to(this.c2, 0, {strokeDashoffset: '308%', ease: window.Expo.easeOut});
		}

		TweenMax.to(this.circleObj,0.7, { val: 15.9, ease: window.Expo.easeOut, onUpdate:() => {
			this.c1.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
			this.c2.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
		}});

	}

	resizeHandler() {
		let textLength;

		switch (Device.size) {
			case 'desktop':
				textLength = 54;
				break;
			case 'small-desktop':
				textLength = 46;
				break;
			default:
				textLength = 43;
				break;
		}

		this.text.setAttribute('textLength', textLength);
	}

}
