import EmitterManager from './EmitterManager';
import VirtualScroll from 'virtual-scroll';
const virtualScroll = new VirtualScroll();

class ScrollManager {

	constructor() {

		this.targetY = 0;

		this.scroll = this.scroll.bind(this);

	}

	on(e) {
		virtualScroll.on(this.scroll);

	}

	off() {
		virtualScroll.off();
	}

	scroll(e) {

		EmitterManager.emit('scroll', e);

	}

}

export default new ScrollManager();
