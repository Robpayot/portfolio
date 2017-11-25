import AppManager from '../managers/AppManager';
import SceneManager from '../managers/SceneManager';
import { PerspectiveCamera } from 'three';
import p2 from 'p2';

export default class AbstractView {

	constructor() {

		this.ui = AppManager.ui;
		console.log(this.ui);

		this.clock = SceneManager.clock; // time
		this.postProc = false;


		// console.log('abstract viewww');
		// clean menu

	}

	initPhysics(gravity) {

		this.world = new p2.World({
			gravity
		});
	}

	setCamera(fov = 45) {
		console.log('set camera abs');

		this.camera = new PerspectiveCamera(
			fov, // fov
			window.innerWidth / window.innerHeight, // aspect
			1, // near
			3000 // far
		);

	}

	resizeHandler() {
		console.log('resizeeee');

		// this.width = window.innerWidth * window.devicePixelRatio;
		// this.height = window.innerHeight * window.devicePixelRatio;
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		SceneManager.resizeHandler({
			camera: this.camera,
			cssScene: this.cssScene
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
				if (this.world && obj.body) this.world.removeBody(obj.body);

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
			this.cssScene.traverse((obj) => { // ?

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
