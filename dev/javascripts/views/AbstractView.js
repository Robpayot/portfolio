import AppManager from '../managers/AppManager';
import SceneManager from '../managers/SceneManager';
import { PerspectiveCamera } from 'three';
import { World } from 'oimo';



export default class AbstractView {

	constructor() {

		this.ui = AppManager.ui;

		this.clock = SceneManager.clock; // time
		this.postProc = false;


		// console.log('abstract viewww');

	}

	initPhysics() {

		this.world = new World({
			timestep: 1 / 60,
			iterations: 8,
			broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
			worldscale: 1, // scale full world
			random: true, // randomize sample
			info: false, // calculate statistic or not
			gravity: [0, 0, 0] // 0 gravity
		});

	}

	setCamera() {
		console.log('set camera abs');

		this.camera = new PerspectiveCamera(
			45, // fov
			window.innerWidth / window.innerHeight, // aspect
			1, // near
			3000 // far
		);

	}

	resizeHandler() {

		this.width = window.innerWidth * window.devicePixelRatio;
		this.height = window.innerHeight * window.devicePixelRatio;

		SceneManager.resizeHandler({
			camera: this.camera
		});

	}

	render() {

		// Render Scenes
		SceneManager.render({
			camera: this.camera,
			scene: this.scene,
			cssScene: this.cssScene,
			postProc: this.postProc,
			composer: this.composer
		});

		if (this.isControls === true) {
			this.controls.update();
		}
	}

	destroy(all = false) {

		console.log('destroy');
		if (this.contentOpen) this.reset();

		if (all === true) {

			this.scene.traverse((obj) => {

				// remove physics
				if (obj.body) obj.body.remove();

				if (obj.geometry) obj.geometry.dispose();

				if (obj.material) {

					if (obj.material.materials) {

						for (const mat of obj.material.materials) {

							if (mat.map) mat.map.dispose();

							mat.dispose();
						}
					} else {

						if (obj.material.map) obj.material.map.dispose();

						obj.material.dispose();
					}
				}

			});

			for (let i = this.scene.children.length - 1; i >= 0; i--) {

				this.scene.remove(this.scene.children[i]);
			}

		}

		if (this.cssScene) {
			// Destroy css scene
			this.cssScene.traverse((obj) => {

				// remove physics
				if (obj.body) obj.body.remove();

				if (obj.geometry) obj.geometry.dispose();

				if (obj.material) {

					if (obj.material.materials) {

						for (const mat of obj.material.materials) {

							if (mat.map) mat.map.dispose();

							mat.dispose();
						}
					} else {

						if (obj.material.map) obj.material.map.dispose();

						obj.material.dispose();
					}
				}

			});

			for (let i = this.scene.children.length - 1; i >= 0; i--) {

				this.cssScene.remove(this.scene.children[i]);
			}

			let cssContainers = document.querySelectorAll('.css-container');
			for (let i = 0; i < cssContainers.length; i++) {

				this.cssObjects[i].element = null;
				cssContainers[i].remove();
			}

			this.cssObjects = [];
		}


		// Wait destroy scene before stop js events
		// setTimeout(() => {
		this.events(false);
		// }, 500);

	}

}
