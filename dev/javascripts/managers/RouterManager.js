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
		this.project0 = null;
		this.project1 = null;

		const url = window.location.href;

		if (/\/#project-1/.test(url) === true) {
			this.switchView('/project-1', 1, true);
		} else {
			this.switchView('/project-0', 0, true);
		}

		EmitterManager.on('router:switch', this.switchView);
	}

	switchView(goToPage, index = 0, fromUrl = false) {

		console.log('change view', goToPage, index);
		// return false;

		if (this.currentPage !== null) {

			this.currentPage.destroy(false);

			EmitterManager.once('view:transition:out', () => {

				this.initView(goToPage, index, false);

			});

		} else {
			// here we are sure that transition come from a refresh, so fromUrl = true
			this.initView(goToPage, index, true);

		}

	}

	initView(goToPage, index = null, fromUrl) {

		let slug;

		switch (goToPage) {
			case '/project-0':

				if (this.project0 === null) {
					this.currentPage = this.project0 = new UniversView({
						id: 0,
						bkg: 0x0101010,
						astd: 'spheres',
						gravity: false,
						pointsLight: true,
						glow: true,
						alt: false,
						data: data.projects[0],
						fromUrl: fromUrl
					});
				} else {
					this.currentPage = this.project0;
					this.currentPage.start();
				}

				window.location = '#project-0';
				break;
			case '/project-1':

				if (this.project1 === null) {
					this.currentPage = this.project1 = new UniversView({
						id: 1,
						bkg: 0xcafefd,
						astd: 'cubes',
						gravity: false,
						pointsLight: false,
						glow: false,
						alt: true,
						data: data.projects[1],
						fromUrl: fromUrl
					});
				} else {
					this.currentPage = this.project1;
					this.currentPage.start();
				}
				window.location = '#project-1';
				break;
		}

		this.fromLoad = false;

	}
}

export default new RouterManager();
