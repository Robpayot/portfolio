import EmitterManager from './EmitterManager';
import SceneManager from './SceneManager';
// import PreloadManager from './PreloadManager';
// import ProjectView from '../views/ProjectView';
import AboutView from '../views/AboutView';
import IntroView from '../views/IntroView';
import Glitch from '../components/Glitch';
import Levit from '../projects/Levit';
import Blob from '../projects/Blob';
import Stars from '../projects/Stars';
import Circular from '../projects/Circular';
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

		if (/\/#about/.test(url) === true) {
			this.switchView('/about', 0, true);
		} else if (/\/#project-0/.test(url) === true) {
			this.switchView('/project-0', 0, true);
		} else if (/\/#project-1/.test(url) === true) {
			this.switchView('/project-1', 1, true);
		} else if (/\/#project-2/.test(url) === true) {
			this.switchView('/project-2', 2, true);
		} else if (/\/#project-3/.test(url) === true) {
			this.switchView('/project-3', 3, true);
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
		this.project2 = null;
		this.project3 = null;

		const url = window.location.href;

		if (/\/#about/.test(url) === true) {
			this.switchView('/about', 0, true);
		} else if (/\/#project-0/.test(url) === true) {
			this.switchView('/project-0', 0, true);
		} else if (/\/#project-1/.test(url) === true) {
			this.switchView('/project-1', 1, true);
		} else if (/\/#project-2/.test(url) === true) {
			this.switchView('/project-2', 2, true);
		} else if (/\/#project-3/.test(url) === true) {
			this.switchView('/project-3', 3, true);
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

			this.lastId = this.currentPage.id;

			EmitterManager.once('view:transition:out', () => {

				// When animation out, destroy scene, init new view

				this.currentPage.destroy(true);
				this.initView(goToPage, index, false);

			});

		} else {
			// here we are sure that transition come from a refresh, so fromUrl = true
			this.initView(goToPage, index, true);

		}

	}

	initView(goToPage, index = null, fromUrl, lastPage = null) {

		// let slug;
		let dir;
		let id;

		switch (goToPage) {
			case '/about':

				// if (this.about === null) {
					this.currentPage = this.about = new AboutView({ // Attention, Garde en mémoire une cette variable très lourde !
						gravity: false,
					});
				// } else {
				// 	this.currentPage = this.about;
				// 	this.currentPage.start();
				// }

				window.location = '#about';
				break;

			case '/project-0':
						// id: 0,
						// bkg: 0x0101010,
						// astd: 'cubes',
						// gravity: false,
						// pointsLight: true,
						// alt: false,
						// data: data.projects[0],
						// fromUrl
				// if (this.project0 === null) {
					id = 0;
					dir = this.lastId > id ? -1 : 1;
					console.log(this.lastId);
					if (this.lastId === 3 || this.lastId === undefined) dir = 1;
					console.log(dir);
					this.currentPage = this.project0 = new Stars({ // Attention, Garde en mémoire une cette variable très lourde !
						id,
						bkg: 0x0101010,
						astd: 'spheres',
						gravity: false,
						pointsLight: true,
						alt: false,
						data: data.projects[0],
						fromUrl,
						dir
					});
				// } else {
				// 	this.currentPage = this.project0;
				// 	this.currentPage.start();
				// }

				window.location = '#project-0';
				break;

			case '/project-1':

				// if (this.project1 === null) {
					id = 1;
					dir = this.lastId > id ? -1 : 1;
					this.currentPage = this.project1 = new Blob({
						id,
						bkg: 0x0101010,
						astd: 'spheres',
						gravity: false,
						pointsLight: true,
						alt: false,
						data: data.projects[1],
						fromUrl,
						dir
					});
				// } else {
				// 	this.currentPage = this.project1;
				// 	this.currentPage.start();
				// }
				window.location = '#project-1';
				break;

			case '/project-2':

				// if (this.project2 === null) {
					id = 2;
					dir = this.lastId > id ? -1 : 1;
					this.currentPage = this.project2 = new Circular({
						id,
						bkg: 0x0101010,
						astd: 'spheres',
						gravity: false,
						pointsLight: true,
						alt: false,
						data: data.projects[2],
						fromUrl,
						dir
					});
				// } else {
				// 	this.currentPage = this.project2;
				// 	this.currentPage.start();
				// }
				window.location = '#project-2';
				break;

			case '/project-3':

				// if (this.project3 === null) {
					id = 3;
					dir = this.lastId > id ? -1 : 1;
					if (this.lastId === 0) dir = -1;
					this.currentPage = this.project3 = new Levit({
						id,
						bkg: 0x0101010,
						astd: 'cubes',
						gravity: false,
						pointsLight: true,
						alt: false,
						data: data.projects[3],
						fromUrl,
						dir
					});
				// } else {
				// 	this.currentPage = this.project3;
				// 	this.currentPage.start();
				// }
				window.location = '#project-3';
				break;

			case '/intro':

				this.currentPage = new IntroView({
					gravity: true,
					fromUrl
				});
				window.location = '#intro';
				break;

			case '/glitch':

				this.currentPage = new Glitch({
					el: document.querySelector('.glitch'),
					txt: 'AKTR',
					color: 'white',
					sndColor: 'blue',
					debug: true,
					clock: SceneManager.clock
				});
				window.location = '#glitch';
				break;
		}

		global.MENU.update(this.currentPage.name, this.currentPage.id);

		this.fromLoad = false;

	}
}

export default new RouterManager();
