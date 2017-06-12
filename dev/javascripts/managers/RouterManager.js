import EmitterManager from './EmitterManager';
import PreloadManager from './PreloadManager';
import UniversView from '../views/UniversView';

// console.log(ListView);


class RouterManager {

	constructor() {

		this.switchView = this.switchView.bind(this);
		this.initView = this.initView.bind(this);

	}

	start() {

		this.currentPage = null;
		this.currentRoute = null;

		const url = window.location.href;

		if (/\/#list/.test(url) === true) {
			this.switchView('/list');
		} else {
			this.switchView('/home');
		}

		EmitterManager.on('router:switch', this.switchView);
	}

	switchView(goToPage, index) {

		if (this.currentPage !== null) {

			if (goToPage === '/home') {
				this.currentPage.destroy(true);
			} else {
				this.currentPage.destroy(false);
			}

			EmitterManager.once('view:transition:out', () => {

				this.initView(goToPage, index);

			});

		} else {

			this.initView(goToPage, index);

		}

	}

	initView(goToPage, index = null) {

		let slug;

		switch (goToPage) {
			case '/home':
				this.currentPage = new UniversView();
				window.location = '#home';
				break;
			// case '/list':
			// 	this.currentPage = new ListView();
			// 	window.location = '#list';
			// 	break;
		}

		this.fromLoad = false;

	}
}

export default new RouterManager();
