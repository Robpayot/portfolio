// Math

export function oscillate(val1, val2) {

	let coef;
	let add;

	if (val1 < 0 && val2 < 0 || val1 >= 0 && val2 >= 0) {
		coef = Math.abs(val1 - val2) / 2;
		add = coef + Math.min(val1, val2);
	} else {
		coef = (Math.abs(val1) + Math.abs(val2)) / 2;
		add = (val1 + val2) / 2;
	}

	return {
		coef,
		add
	};
}

export function toDegree(radians) {

	return radians * 180 / Math.PI;
}

export function toRadian(degrees) {

	return degrees * Math.PI / 180;
}

export function clamp(value, min, max) {

	return Math.min(Math.max(value, min), max);
}

export function round(value, dec) {

	return Math.round(value * dec) / dec;
}

// DOM

export function findAncestor(el, cls) {
	while ((el = el.parentElement) && !el.classList.contains(cls));
	return el;
}

export function getRandom(min, max) {
	return Math.random() * (max - min) + min;
}


export function elementInViewport(el) {
	let top = el.offsetTop;
	let left = el.offsetLeft;
	let width = el.offsetWidth;
	let height = el.offsetHeight;

	while (el.offsetParent) {
		el = el.offsetParent;
		top += el.offsetTop;
		left += el.offsetLeft;
	}

	return (
		top < window.pageYOffset + window.innerHeight &&
		left < window.pageXOffset + window.innerWidth &&
		top + height > window.pageYOffset &&
		left + width > window.pageXOffset
	);
}

export function browser() {
	let ua = navigator.userAgent,
		tem,
		M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	if (/trident/i.test(M[1])) {
		tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
		return `IE ${(tem[1] || '')}`;
	}
	if (M[1] === 'Chrome') {
		tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
		if (tem !== null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
	}
	M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
	if (tem = ua.match(/version\/(\d+)/i) !== null) M.splice(1, 1, tem[1]);
	return M.join(' ');
}

export function getOffsetTop(elem) {

	let offsetTop = 0;
	do {
		if (!isNaN(elem.offsetTop)) {
			offsetTop += elem.offsetTop;
		}
	} while (elem = elem.offsetParent);
	return offsetTop;
}

export function getIndex(el) {

	return Array.from(el.parentNode.children).indexOf(el);
}

export function isTouch() {
	return (('ontouchstart' in window)
		|| (navigator.MaxTouchPoints > 0)
		|| (navigator.msMaxTouchPoints > 0));
}

export function preventLink(e, nohref = false) {
	// --> Counter display safari bar on iOs
	e.preventDefault();

	if (nohref === false) {
		const el = e.currentTarget;
		requestAnimationFrame(()=> {
			window.location.href = el.href;

		});
	}

	// if (window.fullScreen || window.innerWidth === screen.width && window.innerHeight === screen.height) {
	// 	console.log('already fullscreen');
	// } else {
	// go full-screen
	// let i = document.documentElement;
	// if (i.requestFullscreen) {
	// 	i.requestFullscreen();
	// } else if (i.webkitRequestFullscreen) {
	// 	i.webkitRequestFullscreen();
	// } else if (i.mozRequestFullScreen) {
	// 	i.mozRequestFullScreen();
	// } else if (i.msRequestFullscreen) {
	// 	i.msRequestFullscreen();
	// }
	// if (document.exitFullscreen) {
	// 	document.exitFullscreen();
	// }
	// }
}
