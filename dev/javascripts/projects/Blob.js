import ProjectView from '../views/ProjectView';
import { getRandom, clamp, oscillate } from '../helpers/utils';
import Asteroid from '../shapes/Asteroid';
import { Device } from '../helpers/Device';

// THREE JS
import { ShaderMaterial, RGBFormat, DirectionalLight, LinearFilter, IcosahedronGeometry } from 'three';
import { BlobLightShader } from '../shaders/BlobLightShader';


export default class Blob extends ProjectView {

	constructor(obj) {

		super(obj);

		this.playTex = this.playTex.bind(this);

		this.toggle = 0;
		this.intersection;
		this.inc = Date.now();


		// this.video = document.createElement('video');
		// this.video.id = 'video';
		// this.video.src = 'videos/blob2.mp4';
		// this.video.autoplay = true;
		// this.video.loop = true;
		// this.video.muted = true;
		// this.video.setAttribute('playsinline', '');
		// this.video = document.createElement('img');
		// this.video.id = 'video';
		// this.video.src = 'images/textures/blob-4.jpg';
		// this.video.autoplay = true;
		// this.video.loop = true;
		// this.video.muted = true;
		// this.video.setAttribute('playsinline', '');
		// this.el.appendChild(this.video);

		this.playTex();

		// if (this.canplay === true) {
		// 	this.playTex();
		// } else {
		// 	this.video.addEventListener('canplay', this.playTex);
		// }

		// console.log('Blob view');

	}

	playTex() {
		if (this.canplay === true) return false;
		this.canplay = true;

		super.startScene();
	}

	setAsteroids() {


		this.asteroids = [];
		this.asteroidsM = [];

		const geometry = new IcosahedronGeometry( 5, 5 );

		global.BLOBTEX.minFilter = LinearFilter;
		global.BLOBTEX.magFilter = LinearFilter;
		global.BLOBTEX.format = RGBFormat;
		global.BLOBTEX.needsUpdate = true;

		let pos;
		const posFixed = [
			{ x: 30, y: 35, z: -10, s: 5 },
			{ x: -50, y: -30, z: 30 },
			{ x: 40, y: -78, z: -80 },
			{ x: -60, y: 50, z: -50 },
			{ x: 70, y: -15, z: -40 },
		];

		this.nbAst = posFixed.length;


		for (let i = 0; i < posFixed.length; i++) {


			const blobLightShader = new BlobLightShader();
			const material = new ShaderMaterial( {

				uniforms: {
					tShine: { type: 't', value: global.BLOBTEX },
					time: { type: 'f', value: 0 },
					weight: { type: 'f', value: 0 },
					brightness: { type: 'f', value: 0 },
					contrast: { type: 'f', value: 0.6 }, // already set
				},
				vertexShader: blobLightShader.vertexShader,
				fragmentShader: blobLightShader.fragmentShader

			} );

			material.transparent = true;
			material.opacity = 0.5;

			const rot = {
				x: 0,
				y: 0,
				z: 0,
			};

			pos = posFixed[i];

			//  force impulsion
			const force = {
				x: getRandom(-10, 10),
				y: getRandom(-10, 10),
				z: getRandom(-10, 10)
			};

			const scale = posFixed[i].s || getRandom(2,4.5);
			const speed = getRandom(0.5,1.5); // more is slower
			const range = oscillate(-5,5);
			const timeRotate = getRandom(15000, 17000);


			const asteroid = new Asteroid({
				geometry,
				material,
				pos,
				rot,
				force,
				scale,
				range,
				speed,
				timeRotate
			});

			asteroid.mesh.index = i;
			asteroid.initY = posFixed[i].y;
			asteroid.offset = getRandom(0,1000);
			asteroid.initW = 0.0;
			asteroid.rangeMat = oscillate(0.0,2.0);
			asteroid.speedMat = getRandom(1,5);

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);


		}

	}

	setLight() {

		let light = new DirectionalLight( 0x279EDB, 2 );
		light.position.set( 0, 0, 1 );
		this.scene.add( light );

	}

	raf() {

		if (Device.touch === false) {

			this.raycaster.setFromCamera(this.mouse, this.camera);

			const intersectsAst = this.raycaster.intersectObjects(this.asteroidsM);
			this.intersection = intersectsAst.length > 0 ? intersectsAst[ 0 ] : null;

			if ( this.toggle > 0.02 && this.intersection !== null) {
				document.body.style.cursor = 'pointer';
				this.hoverAst = true;
				this.currentHoverAst = this.asteroids[intersectsAst[0].object.index];
				const el = this.asteroids[intersectsAst[0].object.index];
				el.active = true;

			} else {
				this.hoverAst = false;
				for (let i = 0; i < this.nbAst; i++) {
					this.asteroids[i].active = false;
				}
			}
		}

		this.toggle += this.clock.getDelta();

		// Asteroids meshs
		for (let i = 0; i < this.nbAst; i++) {

			// Move top and bottom --> Levit effect
			this.asteroids[i].mesh.position.y = this.asteroids[i].initY + Math.sin(this.clock.getElapsedTime() * this.asteroids[i].speed + this.asteroids[i].offset) * this.asteroids[i].range.coef + this.asteroids[i].range.add;

			if (Device.touch === false) {
				// rotate
				this.asteroids[i].mesh.material.uniforms[ 'time' ].value = .00065 * ( Date.now() - this.inc ); // use getDelta??

				if (this.asteroids[i].mesh.material.uniforms['weight'].value >= 0.0) {
					if (this.asteroids[i].active === true) {
						this.asteroids[i].mesh.material.uniforms[ 'weight' ].value = clamp(this.asteroids[i].mesh.material.uniforms[ 'weight' ].value + 0.035, 0.0, this.asteroids[i].initW + this.asteroids[i].rangeMat.coef + this.asteroids[i].rangeMat.add);
					} else {
						this.asteroids[i].mesh.material.uniforms[ 'weight' ].value = clamp(this.asteroids[i].mesh.material.uniforms[ 'weight' ].value - 0.03, 0.0, this.asteroids[i].initW + this.asteroids[i].rangeMat.coef + this.asteroids[i].rangeMat.add);
					}
				}
			}

		}

		super.raf();

	}

	destroy() {
		// this.video.removeEventListener('canplay', this.init);
		super.destroy();
	}

}
