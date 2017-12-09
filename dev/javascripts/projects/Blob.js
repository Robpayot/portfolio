import ProjectView from '../views/ProjectView';
import { getRandom, clamp, oscillate } from '../helpers/utils';
import Asteroid from '../shapes/Asteroid';

// THREE JS
import { ShaderMaterial, VideoTexture, RGBFormat, DirectionalLight, LinearFilter, IcosahedronGeometry } from 'three';
import { BlobLightShader } from '../shaders/BlobLightShader';


export default class Blob extends ProjectView {

	constructor(obj) {

		super(obj);

		this.init = this.init.bind(this);

		this.toggle = 0;
		this.intersection;
		this.inc = Date.now();


		this.video = document.createElement('video');
		this.video.id = 'video';
		this.video.src = 'videos/blob2.mp4';
		this.video.autoplay = true;
		this.video.loop = true;
		this.video.muted = true;
		this.el.appendChild(this.video);

		if (this.canplay === true) {
			this.init();
		} else {
			this.video.addEventListener('canplay', this.init);
		}


		console.log('Blob view');

	}

	init() {
		if (this.canplay === true) return false;
		this.canplay = true;

		super.init();
	}

	setAsteroids() {


		this.asteroids = [];
		this.asteroidsM = [];

		// const geometry = new SphereGeometry(props.RADIUS, props.SEGMENTS, props.RINGS);
		const geometry = new IcosahedronGeometry( 5, 5 );
		// const material = new MeshLambertMaterial({ color: 0x4682b4 });


		const tex = new VideoTexture( this.video );
		tex.minFilter = LinearFilter;
		tex.magFilter = LinearFilter;
		tex.format = RGBFormat;
		tex.needsUpdate = true;


		// this.materialAst1 = new ShaderMaterial({
		// 	uniforms: this.brightness.uniforms,
		// 	vertexShader: this.brightness.vertexShader,
		// 	fragmentShader: this.brightness.fragmentShader,
		// 	transparent: true,
		// 	opacity: 0.5
		// });

		// this.materialAst2 = new ShaderMaterial({
		// 	uniforms: this.brightness2.uniforms,
		// 	vertexShader: this.brightness2.vertexShader,
		// 	fragmentShader: this.brightness2.fragmentShader,
		// 	transparent: true,
		// 	opacity: 0.5
		// });

		let pos;
		const posFixed = [
			{ x: 30, y: -20, z: -10, s: 6 },
			{ x: -50, y: 15, z: 30 },
			{ x: 40, y: -90, z: -80 },
			{ x: -40, y: 70, z: -50 },
			{ x: 60, y: 20, z: -40 },
			// { x: 80, y: -30, z: 50 },
			// { x: -40, y: -40, z: -100 },
		];

		this.nbAst = posFixed.length;


		for (let i = 0; i < posFixed.length; i++) {

			// Material shader

			// const brightness = new BrightnessShader();

			// // this.brightness2 = new BrightnessShader();

			// brightness.uniforms.tInput.value = tex;
			// brightness.range = oscillate(3,3);
			// brightness.time = 200;
			// this.brightness2.uniforms.tInput.value = tex;

			// const material = new MeshBasicMaterial({
			// 	color: 0xFFFFFF,
			// 	map: tex
			// });
			const blobLightShader = new BlobLightShader();
			const material = new ShaderMaterial( {

				uniforms: {
					tShine: { type: 't', value: tex },
					time: { type: 'f', value: 0 },
					weight: { type: 'f', value: 0 },
					brightness: { type: 'f', value: 0 },
					contrast: { type: 'f', value: 0.7 }, // already set
				},
				vertexShader: blobLightShader.vertexShader,
				fragmentShader: blobLightShader.fragmentShader

			} );

			// const material = new ShaderMaterial({
			// 	uniforms: brightness.uniforms,
			// 	vertexShader: brightness.vertexShader,
			// 	fragmentShader: brightness.fragmentShader,
			// 	transparent: true,
			// 	// opacity: 0.5
			// });

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

			// let finalMat;

			// if (i % 2 === 0) {
			// 	finalMat = this.materialAst1;
			// } else {
			// 	finalMat = this.materialAst2;
			// }

			const asteroid = new Asteroid({
				geometry,
				material: material,
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
			// asteroid.brightness = brightness;

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);

		}
		// super.setAsteroids(this.models[0].geometry);

	}

	setLight() {

		// let paramsLight = [
		// 	// { x: 70, y: 70, z: 0 },
		// 	// { x: 0, y: 0, z: -100, d: 70, it: 1 },
		// 	// { x: -100, y: 0, z: 0, d: 70, it: 1 },
		// 	// { x: 0, y: 30, z: 30 },
		// 	// { x: 0, y: 30, z: -30 },
		// 	// { x: -30, y: 30, z: 0 },
		// 	// { x: 0, y: -30, z: 0 }
		// ];

		// // Check Ambient Light
		// // scene.add( new THREE.AmbientLight( 0x00020 ) );

		// for (let i = 0; i < paramsLight.length; i++) {

		// 	const d = paramsLight[i].d || 100;
		// 	const it = paramsLight[i].it || 1;

		// 	// create a point light
		// 	let pointLight = new PointLight(0xFFFFFF, it, d, 1);
		// 	// set its position
		// 	pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
		// 	// pointLight.power = 20;
		// 	pointLight.visible = true;

		// 	// add to the scene
		// 	this.scene.add(pointLight);
		// }

		let light = new DirectionalLight( 0x279EDB, 2 );
		light.position.set( 0, 0, 1 );
		this.scene.add( light );
		// let light2 = new DirectionalLight( 0xffffff, 1 );
		// light2.position.set( 1, 0, 0 );
		// this.scene.add( light2 );
	}

	raf() {


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

		this.toggle += this.clock.getDelta();

		// Asteroids meshs
		for (let i = 0; i < this.nbAst; i++) {
			// Move top and bottom --> Levit effect
			// Start Number + Math.sin(this.time*2*Math.PI/PERIOD)*(SCALE/2) + (SCALE/2)
			this.asteroids[i].mesh.position.y = this.asteroids[i].initY + Math.sin(this.clock.getElapsedTime() * this.asteroids[i].speed + this.asteroids[i].offset) * this.asteroids[i].range.coef + this.asteroids[i].range.add;
			// this.asteroids[i].mesh.position.y = this.asteroids[i].initY;
			// rotate
			this.asteroids[i].mesh.material.uniforms[ 'time' ].value = .00065 * ( Date.now() - this.inc ); // use getDelta??

			if (this.asteroids[i].mesh.material.uniforms['weight'].value >= 0.0) {
				if (this.asteroids[i].active === true) {
					this.asteroids[i].mesh.material.uniforms[ 'weight' ].value = clamp(this.asteroids[i].mesh.material.uniforms[ 'weight' ].value + 0.04, 0.0, this.asteroids[i].initW + this.asteroids[i].rangeMat.coef + this.asteroids[i].rangeMat.add);
				} else {
					this.asteroids[i].mesh.material.uniforms[ 'weight' ].value = clamp(this.asteroids[i].mesh.material.uniforms[ 'weight' ].value - 0.04, 0.0, this.asteroids[i].initW + this.asteroids[i].rangeMat.coef + this.asteroids[i].rangeMat.add);
				}
			}
		}

		super.raf();

	}

	destroy() {
		this.video.removeEventListener('canplay', this.init);
		super.destroy();
	}

}
