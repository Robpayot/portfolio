import EmitterManager from './EmitterManager';
import PreloadManager from './PreloadManager';
import UniversView from '../views/UniversView';
import data from '../../datas/data.json';

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

		if (/\/#project-1/.test(url) === true) {
			this.switchView('/project-1');
		} else {
			this.switchView('/project-0');
		}

		EmitterManager.on('router:switch', this.switchView);
	}

	switchView(goToPage, index) {

		if (this.currentPage !== null) {

			if (goToPage === '/project-0') {
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
			case '/project-0':

				this.currentPage = new UniversView({
					id: 0,
					bkg: 0x0101010,
					astd: 'spheres',
					gravity: true,
					pointsLight: true,
					glow: true,
					alt: false,
					data: data.projects[0]
				});
				window.location = '#project-0';
				break;
			case '/project-1':
				this.currentPage = new UniversView({
					id: 1,
					bkg: 0xcafefd,
					astd: 'cubes',
					gravity: false,
					pointsLight: false,
					glow: false,
					alt: true,
					data: data.projects[1]
				});
				window.location = '#project-1';
				break;
		}

		this.fromLoad = false;

	}
}

export default new RouterManager();
