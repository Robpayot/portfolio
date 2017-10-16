import EmitterManager from '../managers/EmitterManager';

export default class Cursor {

	constructor() {


		// bind
		this.onMouseMove = this.onMouseMove.bind(this);
		this.render = this.render.bind(this);
		this.interractHover = this.interractHover.bind(this);
		this.interractLeave = this.interractLeave.bind(this);

		this.el = document.querySelector('.cursor');
		this.svgCircle = this.el.querySelectorAll('circle');
		this.c1 = this.svgCircle[0];
		this.c2 = this.svgCircle[1];

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
		EmitterManager.on('raf', this.render);

	}


	onMouseMove(x,y) {

		this.mouse.x = x;
		this.mouse.y = y;
	}

	render() {

		if (this.hasDelay === true) {

			// Specify target we want
			// à faire dans un raf
			this.cursorTarget.x = this.mouse.x;
			this.cursorTarget.y = this.mouse.y;

			// Smooth it with deceleration
			if (this.cursorTarget.x !== undefined && this.cursorTarget.y !== undefined) {
				this.cursorSmooth.x += (this.cursorTarget.x - this.cursorSmooth.x) * 0.3;
				this.cursorSmooth.y += (this.cursorTarget.y - this.cursorSmooth.y) * 0.3;
			}


			this.el.style.left = Math.round(this.cursorSmooth.x);
			this.el.style.top = Math.round(this.cursorSmooth.y);


			if (this.cursorTarget.x === Math.round(this.cursorSmooth.x) && this.cursorTarget.y === Math.round(this.cursorSmooth.y)) {
				if (this.isHover !== true) {
					this.hasDelay = false;
				}

			}

		} else {
			if (this.stopFollow !== true) {
				this.el.style.left = this.cursorSmooth.x = this.mouse.x;
				this.el.style.top = this.cursorSmooth.y = this.mouse.y;
			}
		}

	}

	interractHover(obj = {}) {

		if (this.hoverGlobal === true) return false;
		this.hoverGlobal = true;

		// console.log('hover');

		if (obj.color !== undefined) {
			this.c2.style.stroke = obj.color;
			this.hoverGoTo = true;
			// remplie
			TweenMax.to(this.c2, 5, {strokeDashoffset: '0%', ease: window.Linear.easeNone, onComplete:() => {
				if (this.hoverGoTo = true) window.location.href = obj.href;
			}});
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
				TweenMax.to(this.circleObj,1.5, { val: 49, ease: window.Expo.easeOut, onUpdate:() => {
					this.c1.setAttribute('r', this.circleObj.val);
					this.c2.setAttribute('r', this.circleObj.val);
				}});
			}
		} else {
			TweenMax.to(this.circleObj,0.7, { val: 49, ease: window.Expo.easeOut, onUpdate:() => {
				this.c1.setAttribute('r', this.circleObj.val);
				this.c2.setAttribute('r', this.circleObj.val);
			}});
		}

	}

	interractLeave(obj = {}) {
		if (this.hoverGlobal === false) return false;
		this.hoverGlobal = false;
		// console.log('leave');
		// remplie
		TweenMax.to(this.c2, 0.5, {strokeDashoffset: '308%', ease: window.Expo.easeOut});

		if (obj.color !== undefined) {
			this.hoverGoTo = false;
		}

		if (obj.magnet === true) {
			this.isHover = false;
			if (this.el.classList.contains('is-hover') === true) {
				this.el.classList.remove('is-hover');
				this.stopFollow = false;
				this.hasDelay = true;
				TweenMax.to(this.circleObj,1.5, { val: 15.9, ease: window.Expo.easeOut, onUpdate:() => {
					this.c1.setAttribute('r', this.circleObj.val);
					this.c2.setAttribute('r', this.circleObj.val);
				}});
			}
		} else {
			TweenMax.to(this.circleObj,0.7, { val: 15.9, ease: window.Expo.easeOut, onUpdate:() => {
				this.c1.setAttribute('r', this.circleObj.val);
				this.c2.setAttribute('r', this.circleObj.val);
			}});
		}
	}

}
