import EmitterManager from '../managers/EmitterManager';
import RouterManager from '../managers/RouterManager';


export default class Cursor {

	constructor() {


		// bind
		this.onMouseMove = this.onMouseMove.bind(this);
		this.render = this.render.bind(this);
		this.interractHover = this.interractHover.bind(this);
		this.interractLeave = this.interractLeave.bind(this);

		this.el = document.querySelector('.cursor');
		this.wrapper = document.querySelector('.cursor__wrapper');
		this.svgCircle = this.el.querySelectorAll('circle');
		this.c1 = this.svgCircle[0];
		this.c2 = this.svgCircle[1];
		this.next = this.wrapper.querySelector('.cursor__next');
		this.prev = this.wrapper.querySelector('.cursor__prev');
		console.log(this.next);

		// let viewportOffset = circle1.getBoundingClientRect();
		// // these are relative to the viewport, i.e. the window
		// let top = viewportOffset.top;
		// let left = viewportOffset.left;
		// console.log(viewportOffset);
		// let marge = 20;

		// let minPointX = viewportOffset.left - viewportOffset.width / 2;
		// let maxPointX = viewportOffset.left + viewportOffset.width;
		// let minPointY = viewportOffset.top - viewportOffset.height / 2;
		// let maxPointY = viewportOffset.top + viewportOffset.height;

		this.circleObj = {val : 15.9};
		this.mouse = {};
		this.cursorTarget = { x: 0, y: 0};
		this.cursorSmooth = { x: 0, y: 0};

		EmitterManager.on('mousemove', this.onMouseMove);
		// EmitterManager.on('raf', this.render);

	}


	onMouseMove(x,y) {


		this.mouse.x = x;
		this.mouse.y = y;
		TweenMax.set(this.wrapper, {left: x});
		TweenMax.set(this.wrapper, {top: y});
	}

	render() {

		// no need
		// if (this.hasDelay === true) {

		// 	// Specify target we want
		// 	// à faire dans un raf
		// 	this.cursorTarget.x = this.mouse.x;
		// 	this.cursorTarget.y = this.mouse.y;

		// 	// Smooth it with deceleration
		// 	if (this.cursorTarget.x !== undefined && this.cursorTarget.y !== undefined) {
		// 		this.cursorSmooth.x += (this.cursorTarget.x - this.cursorSmooth.x) * 0.3;
		// 		this.cursorSmooth.y += (this.cursorTarget.y - this.cursorSmooth.y) * 0.3;
		// 	}


		// 	this.cursorSmooth.x = this.mouse.x;
		// 	this.cursorSmooth.y = this.mouse.y;
		// 	// TweenMax.set(this.el, {left: Math.round(this.cursorSmooth.x)});
		// 	// TweenMax.set(this.el, {top: Math.round(this.cursorSmooth.y)});


		// 	if (this.cursorTarget.x === Math.round(this.cursorSmooth.x) && this.cursorTarget.y === Math.round(this.cursorSmooth.y)) {
		// 		if (this.isHover !== true) {
		// 			this.hasDelay = false;
		// 		}

		// 	}

		// } else {
		// 	if (this.stopFollow !== true) {
		// 		// this.el.style.left = this.cursorSmooth.x = this.mouse.x; // not working on FF
		// 		// this.el.style.top = this.cursorSmooth.y = this.mouse.y; // not working on FF
		// 		this.cursorSmooth.x = this.mouse.x;
		// 		this.cursorSmooth.y = this.mouse.y;
		// 		// TweenMax.set(this.el, {left: this.cursorSmooth.x});
		// 		// TweenMax.set(this.el, {top: this.cursorSmooth.y});
		// 		console.log('ok', this.el.style.left, this.mouse.x);
		// 	}
		// }

	}

	interractHover(obj = {}) {

		if (this.hoverGlobal === true) return false;
		this.hoverGlobal = true;

		// console.log('hover');

		let maxVal = obj.small === true ? 35 : 49;

		if (obj.back === true) {
			TweenMax.set('text', {display: 'block'});
			TweenMax.to('text', 0.5, {opacity: 1});
		}

		if (obj.color !== undefined) {
			this.c2.style.stroke = obj.color;
			this.hoverGoTo = true;
			this.currentEl = obj.el;
			// remplie
			if (obj.small !== true) {
				TweenMax.to(this.c2, 3, {strokeDashoffset: '0%', ease: window.Linear.easeNone,
					onComplete:() => {
						if (this.hoverGoTo = true) {
							RouterManager.currentPage.goTo(null, this.currentEl);
							window.location.href = this.currentEl.href;
						}
					}
				});
			} else {
				TweenMax.set(this.c2, {strokeDashoffset: '0%'});
			}

		}

		if (obj.type === 'next') {
			const tl = new TimelineMax();
			tl.to(['.up-1', '.up-2'], 0.5, {opacity: 1});
			tl.to('.up-1', 0.6, {strokeDashoffset: '292%', ease: window.Expo.easeOut }, 0.1);
			tl.to('.up-2', 0.7, {strokeDashoffset: '186%', ease: window.Expo.easeOut }, 0.1);
			tl.set(['.up-1', '.up-2'], {clearProps: 'stroke-dashoffset'});
			tl.fromTo(this.next, 1, { y: '100%', x: '-50%'}, { y: '0%', x: '-50%', ease: window.Expo.easeOut}, 0);
			tl.fromTo(this.next, 0.5, {opacity: 0}, {opacity: 1, ease: window.Linear.easeNone}, 0);

		} else if (obj.type === 'prev') {
			const tl = new TimelineMax();
			tl.to(['.down-1', '.down-2'], 0.5, {opacity: 1});
			tl.to('.down-2', 0.95, {strokeDashoffset: '-236%', ease: window.Expo.easeOut }, 0);
			tl.to('.down-1', 0.8, {strokeDashoffset: '-130%', ease: window.Expo.easeOut }, 0.1);
			tl.set(['.down-1', '.down-2'], {clearProps: 'stroke-dashoffset'});
			tl.fromTo(this.prev, 1, { y: '-100%', x: '-50%'}, { y: '0%', x: '-50%', ease: window.Expo.easeOut}, 0);
			tl.fromTo(this.prev, 0.5, {opacity: 0}, {opacity: 1, ease: window.Linear.easeNone}, 0);
		}


		if (obj.magnet === true) {
			this.isHover = true;
			this.hasDelay = false;
			if (this.el.classList.contains('is-hover') === false) {
				this.el.classList.add('is-hover');

				const vpOffset = obj.el.getBoundingClientRect();
				this.stopFollow = true;
				TweenMax.to(this.el, 0.3, {left: vpOffset.left + vpOffset.width / 2, top: vpOffset.top + vpOffset.height / 2});
				TweenMax.to(this.cursorSmooth, 0.3, {x: vpOffset.left + vpOffset.width / 2, y: vpOffset.top + vpOffset.height / 2});
				TweenMax.to(this.circleObj,1.5, { val: maxVal, ease: window.Expo.easeOut, onUpdate:() => {
					this.c1.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
					this.c2.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
				}});
			}
		} else {
			TweenMax.to(this.circleObj,0.7, { val: maxVal, ease: window.Expo.easeOut, onUpdate:() => {
				this.c1.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
				this.c2.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
			}});
		}

	}

	interractLeave(obj = {}) {
		if (this.hoverGlobal === false) return false;
		this.hoverGlobal = false;
		this.currentEl = null;
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
			this.hoverGoTo = false;
		}

		if (obj.small === true) {
			TweenMax.to(this.c2, 0, {strokeDashoffset: '308%', ease: window.Expo.easeOut});
		}

		if (obj.magnet === true) {
			this.isHover = false;
			if (this.el.classList.contains('is-hover') === true) {
				this.el.classList.remove('is-hover');
				this.stopFollow = false;
				this.hasDelay = true;
				TweenMax.to(this.circleObj,1.5, { val: 15.9, ease: window.Expo.easeOut, onUpdate:() => {
					this.c1.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
					this.c2.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
				}});
			}
		} else {
			TweenMax.to(this.circleObj,0.7, { val: 15.9, ease: window.Expo.easeOut, onUpdate:() => {
				this.c1.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
				this.c2.setAttribute('r', this.circleObj.val - 0.9); // 0.9 fix issue on Chrome
			}});
		}
	}

}
