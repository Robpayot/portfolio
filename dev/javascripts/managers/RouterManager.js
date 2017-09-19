import EmitterManager from './EmitterManager';
// import PreloadManager from './PreloadManager';
// import ProjectView from '../views/ProjectView';
import IntroView from '../views/IntroView';
import Glitch from '../components/Glitch';
import Levit from '../projects/Levit';
import Blob from '../projects/Blob';
import Stars from '../projects/Stars';
import data from '../../datas/data.json';

// console.log(ListView);


class RouterManager {

	constructor() {

		this.switchView = this.switchView.bind(this);
		this.initView = this.initView.bind(this);
		this.onChange = this.onChange.bind(this);


		window.addEventListener('hashchange', this.onChange, false);

	}

	onChange() {
		console.log('change');
		const url = window.location.href;

		if (/\/#project-0/.test(url) === true) {
			this.switchView('/project-0', 0, true);
		} else if (/\/#project-1/.test(url) === true) {
			this.switchView('/project-1', 1, true);
		} else if (/\/#project-2/.test(url) === true) {
			this.switchView('/project-2', 2, true);
		} else if (/\/#glitch/.test(url) === true) {
			this.switchView('/glitch', 0, true);
		} else {
			this.switchView('/intro', 0, true);
		}

		EmitterManager.on('router:switch', this.switchView);
	}

	start() {

		this.currentPage = null;
		this.currentRoute = null;
		this.project0 = null;
		this.project1 = null;

		const url = window.location.href;

		if (/\/#project-0/.test(url) === true) {
			this.switchView('/project-0', 0, true);
		} else if (/\/#project-1/.test(url) === true) {
			this.switchView('/project-1', 1, true);
		} else if (/\/#project-2/.test(url) === true) {
			this.switchView('/project-2', 2, true);
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

			this.currentPage.transitionOut(); // animation Out
			global.MENU.toggleOpen(true); // close Menu

			EmitterManager.once('view:transition:out', () => {

				// When animation out, destroy scene, init new view

				this.currentPage.destroy(false);
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
					this.currentPage = this.project0 = new Levit({ // Attention, Garde en mémoire une cette variable très lourde !
						id: 0,
						bkg: 0x0101010,
						astd: 'cubes',
						gravity: false,
						pointsLight: true,
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
					this.currentPage = this.project1 = new Stars({
						id: 1,
						bkg: 0x0101010,
						astd: 'spheres',
						gravity: false,
						pointsLight: true,
						alt: false,
						data: data.projects[1],
						fromUrl
					});
				} else {
					this.currentPage = this.project1;
					this.currentPage.start();
				}
				window.location = '#project-1';
				break;

			case '/project-2':

				if (this.project2 === null) {
					this.currentPage = this.project2 = new Blob({
						id: 2,
						bkg: 0x0101010,
						astd: 'spheres',
						gravity: false,
						pointsLight: true,
						alt: false,
						data: data.projects[2],
						fromUrl
					});
				} else {
					this.currentPage = this.project2;
					this.currentPage.start();
				}
				window.location = '#project-2';
				break;

			case '/intro':
				console.log('introooooooo');

				this.currentPage = new IntroView({
					gravity: true,
				});
				window.location = '#intro';
				break;

			case '/glitch':

				this.currentPage = new Glitch({
					el: document.querySelector('.glitch'),
					txt: 'AKTR',
					color: 'rgb(41,64,16)',
					debug: true
				});
				window.location = '#glitch';
				break;
		}

		global.MENU.update(this.currentPage.name, this.currentPage.id);

		this.fromLoad = false;

	}
}

export default new RouterManager();
