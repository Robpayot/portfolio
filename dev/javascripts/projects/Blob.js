import ProjectView from '../views/ProjectView';
import { getRandom, clamp, oscillate } from '../helpers/utils';
import Asteroid from '../shapes/Asteroid';
import { Device } from '../helpers/Device';

// THREE JS
import { ShaderMaterial, RGBAFormat, DirectionalLight, LinearFilter, IcosahedronGeometry, Object3D, Group } from 'three';
import { BlobLightShader } from '../shaders/BlobLightShader';


export default class Blob extends ProjectView {

	constructor(obj) {

		super(obj);

		// this.playTex = this.playTex.bind(this);

		this.interval = 0;
		this.intersection;
		this.inc = Date.now();

		super.startScene();


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

		// this.playTex();

		// if (this.canplay === true) {
		// 	this.playTex();
		// } else {
		// 	this.video.addEventListener('canplay', this.playTex);
		// }

		// console.log('Blob view');

	}

	// playTex() {
	// 	if (this.canplay === true) return false;
	// 	this.canplay = true;

	// 	super.startScene();
	// }

	setAsteroids() {


		this.asteroids = [];
		this.asteroidsM = [];
		this.groupPivots = [];

		global.BLOBTEX.minFilter = LinearFilter;
		global.BLOBTEX.magFilter = LinearFilter;
		global.BLOBTEX.format = RGBAFormat;
		global.BLOBTEX.needsUpdate = true;

		let pos;
		const posFixed = [
			{ x: 30, y: 35, z: -10, s: 5, v: 0.0010},
			{ x: -50, y: -40, z: 30, s: 3.4 , v: 0.0015},
			{ x: 40, y: -78, z: -80, s: 3, v: 0.0025},
			{ x: -60, y: 50, z: -50, s: 3.5, v: 0.0035},
			{ x: 70, y: -15, z: -40, s: 3.8, v: 0.0020},
		];

		this.nbAst = posFixed.length;

		const geometry = new IcosahedronGeometry( 5, 5 );


		for (let i = 0; i < posFixed.length; i++) {

			const group = new Group();
			const pivot = new Object3D();

			// const geometry = new IcosahedronGeometry( 5, 5 );

			const blobLightShader = new BlobLightShader();
			const material = new ShaderMaterial( {

				uniforms: {
					tShine: { type: 't', value: global.BLOBTEX },
					time: { type: 'f', value: 0 },
					weight: { type: 'f', value: 0 },
					brightness: { type: 'f', value: 0 },
					contrast: { type: 'f', value: 0.6 }, // already set
					vOpacity: { type: 'f', value: 0.0 }, // already set
				},
				vertexShader: blobLightShader.vertexShader,
				fragmentShader: blobLightShader.fragmentShader

			} );

			material.transparent = true;
			material.opacity = 0.1;

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

			// // change vertices positions
			// geometry.translate( posFixed[i].x / 3, 0, posFixed[i].z / 3 );

			// pos.x = 0;
			// pos.z = 0;

			pivot.x = -pos.x;
			pivot.z = -pos.z;

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
			this.groupPivots.push(group);

			// add mesh to the scene

			group.add(asteroid.mesh);
			group.add(pivot);
			group.speed = posFixed[i].v;

			this.scene.add(group);


		}

	}

	setLight() {

		let light = new DirectionalLight( 0x279EDB, 2 );
		light.position.set( 0, 0, 1 );
		this.scene.add( light );

	}

	transitionIn() {

		const tl = new TimelineMax();
		let delay = 0.2;

		for (let i = 0; i < this.asteroidsM.length; i++) {

			tl.fromTo(this.asteroidsM[i].scale, 2, {x: 1.5, y: 1.5, z: 1.5}, {x: this.asteroids[i].scale, y: this.asteroids[i].scale, z: this.asteroids[i].scale, ease: window.Expo.easeOut}, delay);
			tl.fromTo(this.asteroids[i].mesh.material.uniforms[ 'vOpacity' ], 1.5, {value: 0.0}, {value: 1.0, ease: window.Expo.easeOut}, delay);

			delay += 0.1;
		}


		super.transitionIn();
	}

	raf() {

		if (Device.touch === false) {

			this.raycaster.setFromCamera(this.mouse, this.camera);

			const intersectsAst = this.raycaster.intersectObjects(this.asteroidsM);
			this.intersection = intersectsAst.length > 0 ? intersectsAst[ 0 ] : null;

			if ( this.interval > 0.02 && this.intersection !== null) {

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

		this.interval += this.clock.getDelta();

		// Asteroids meshs
		for (let i = 0; i < this.nbAst; i++) {

			// Move top and bottom --> Levit effect
			// this.asteroids[i].mesh.position.y = this.asteroids[i].initY + Math.sin(this.clock.getElapsedTime() * this.asteroids[i].speed + this.asteroids[i].offset) * this.asteroids[i].range.coef + this.asteroids[i].range.add;
			this.groupPivots[i].rotation.y += this.groupPivots[i].speed;
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
