import EmitterManager from './EmitterManager';
// import PreloadManager from './PreloadManager';
import ProjectView from '../views/ProjectView';
import IntroView from '../views/IntroView';
import GlitchView from '../views/GlitchView';
import data from '../../datas/data.json';
import Menu from '../components/Menu';

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
		} else if (/\/#project-0/.test(url) === true) {
			this.switchView('/project-0', 0, true);
		} else if (/\/#glitch/.test(url) === true) {
			this.switchView('/glitch', 0, true);
		} else {
			this.switchView('/intro', 0, true);
		}

		EmitterManager.on('router:switch', this.switchView);
	}

	switchView(goToPage, index = 0, fromUrl = false) {

		console.log('change view', goToPage, index);
		// return false;

		if (this.currentPage !== null) {

			this.lastPage = this.currentPage.name;

			this.currentPage.destroy(false);

			EmitterManager.once('view:transition:out', () => {

				this.initView(goToPage, index, false);

			});

		} else {
			// here we are sure that transition come from a refresh, so fromUrl = true
			this.initView(goToPage, index, true);

		}

	}

	initView(goToPage, index = null, fromUrl, lastPage = null) {

		// let slug;

		switch (goToPage) {
			case '/project-0':

				if (this.project0 === null) {
					this.currentPage = this.project0 = new ProjectView({
						id: 0,
						bkg: 0x0101010,
						astd: 'spheres',
						gravity: false,
						pointsLight: true,
						glow: true,
						alt: false,
						data: data.projects[0],
						fromUrl
					});
				} else {
					this.currentPage = this.project0;
					this.currentPage.start();
				}

				window.location = '#project-0';
				break;
			case '/project-1':

				if (this.project1 === null) {
					this.currentPage = this.project1 = new ProjectView({
						id: 1,
						bkg: 0xcafefd,
						astd: 'cubes',
						gravity: false,
						pointsLight: false,
						glow: false,
						alt: true,
						data: data.projects[1],
						fromUrl
					});
				} else {
					this.currentPage = this.project1;
					this.currentPage.start();
				}
				window.location = '#project-1';
				break;

			case '/intro':

				this.currentPage = new IntroView({
					gravity: true,
				});
				window.location = '#intro';
				break;

			case '/glitch':

				this.currentPage = new GlitchView({
					el: document.querySelector('.glitch'),
					txt: 'BMW Motorshow',
					color: 'rgb(41,64,16)',
					debug: true
				});
				window.location = '#glitch';
				break;
		}

		Menu.update(this.currentPage.name, this.currentPage.id);

		this.fromLoad = false;

	}
}

export default new RouterManager();
