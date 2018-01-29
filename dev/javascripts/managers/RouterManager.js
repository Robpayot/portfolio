import EmitterManager from './EmitterManager';
import SceneManager from './SceneManager';
// import PreloadManager from './PreloadManager';
// import ProjectView from '../views/ProjectView';
import { Device } from '../helpers/Device';
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

		this.regexProjects = [];
		for (let i = 0; i < data.projects.length; i++) {
			this.regexProjects[i] = new RegExp(`/#${data.projects[i].slug}`);
		}

	}

	onChange() {

		if (this.ready !== true) return false;

		this.testUrl();

	}

	start() {

		this.currentPage = null;
		this.currentRoute = null;
		this.project0 = null;
		this.project1 = null;
		this.project2 = null;
		this.project3 = null;

		this.testUrl();

		EmitterManager.on('router:switch', this.switchView);
		window.addEventListener('hashchange', this.onChange, false);

		this.ready = true;
	}

	testUrl() {

		const url = window.location.href;

		if (/\/#about/.test(url) === true) {
			this.switchView('/about', 0, true);
		} else if (this.regexProjects[0].test(url) === true) {
			this.switchView(`/${data.projects[0].slug}`, 0, true);
		} else if (this.regexProjects[1].test(url) === true) {
			this.switchView(`/${data.projects[1].slug}`, 1, true);
		} else if (this.regexProjects[2].test(url) === true) {
			this.switchView(`/${data.projects[2].slug}`, 2, true);
		} else if (this.regexProjects[3].test(url) === true) {
			this.switchView(`/${data.projects[3].slug}`, 3, true);
		} else if (/\/#glitch/.test(url) === true) {
			this.switchView('/glitch', 0, true);
		} else {
			this.switchView('/intro', 0, true);
		}
	}

	switchView(goToPage, index = 0, fromUrl = false) {

		if (this.currentPage) {
			if (this.currentPage.uri === goToPage) {
				// alreay on this view
				return false;
			}
		}

		if (this.isChanging === true) return false;

		this.isChanging = true;

		// return false;

		if (this.currentPage !== null) {

			this.lastPage = this.currentPage.name;
			let dir = this.lastId > index ? 1 : -1;
			if (goToPage === '/about') {
				dir = -1;
				global.OVERLAY.classList.remove('is-intro');
				global.OVERLAY.classList.add('is-about');
			}
			if (goToPage === '/intro') dir = 1;
			this.currentPage.transitionOut(dir); // animation Out

			if (global.MENU.el.classList.contains('is-open') === true) global.MENU.toggleOpen(null, true); // close Menu
			if (!Device.touch) global.CURSOR.interractLeave({color: 'reset'});
			// When animation out, destroy scene, init new view


			EmitterManager.once('view:transition:out', () => {
				this.isChanging = false;

				this.currentPage.destroy(true);
				this.initView(goToPage, index, false);

			});

		} else {
			// here we are sure that transition come from a refresh, so fromUrl = true
			this.initView(goToPage, index, true);
			this.isChanging = false;

		}

	}

	initView(goToPage, index = null, fromUrl, lastPage = null) {


		this.fromUrl = fromUrl;

		// let slug;
		let dir;
		let id;

		switch (goToPage) {
			case '/about':

				this.currentPage = new AboutView({ // Attention, Garde en mémoire une cette variable très lourde !
					gravity: false,
				});

				break;

			case `/${data.projects[0].slug}`:

				id = 0;
				dir = this.lastId > id ? -1 : 1;

				if (this.lastId === 3 || this.lastId === undefined) dir = 1;
				this.currentPage = new Stars({ // Attention, Garde en mémoire une cette variable très lourde !
					id,
					bkg: 0x0101010,
					astd: 'spheres',
					gravity: false,
					pointsLight: true,
					alt: false,
					data: data.projects[0],
					dir
				});

				break;

			case `/${data.projects[1].slug}`:

				id = 1;
				dir = this.lastId > id ? -1 : 1;
				this.currentPage = new Blob({
					id,
					bkg: 0x0101010,
					astd: 'spheres',
					gravity: false,
					pointsLight: true,
					alt: false,
					data: data.projects[1],
					dir
				});

				break;

			case `/${data.projects[2].slug}`:

				id = 2;
				dir = this.lastId > id ? -1 : 1;
				this.currentPage = new Circular({
					id,
					bkg: 0x0101010,
					astd: 'spheres',
					gravity: false,
					pointsLight: true,
					alt: false,
					data: data.projects[2],
					dir
				});

				break;

			case `/${data.projects[3].slug}`:

				id = 3;
				dir = this.lastId > id ? -1 : 1;
				if (this.lastId === 0) dir = -1;
				this.currentPage = new Levit({
					id,
					bkg: 0x0101010,
					astd: 'cubes',
					gravity: false,
					pointsLight: true,
					alt: false,
					data: data.projects[3],
					dir
				});

				break;

			case '/glitch':
				// DEBUG ONLY
				this.currentPage = new Glitch({
					el: document.querySelector('.glitch'),
					textSize: 50,
					sndColor: 'red',
					color: 'black',
					txt: 'R O B I N   P A Y O T',
					sndTxt: 'I N T E R A C T I V E   D E V E L O P E R',
					clock: SceneManager.clock,
					debug: true,
					type: 'intro'
				});

				break;

			default:

				this.currentPage = new IntroView({
					gravity: true
				});

				break;
		}

		this.currentPage.uri = goToPage;
		this.lastId = this.currentPage.id;

		global.MENU.update(this.currentPage.name, this.currentPage.id);

		this.fromLoad = false;

	}
}

export default new RouterManager();
