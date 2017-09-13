import ProjectView from '../views/ProjectView';
import PreloadManager from '../managers/PreloadManager';
import { getRandom, toRadian, oscillate, round } from '../helpers/utils';
import { loadJSON } from '../helpers/utils-three';

// THREE JS
import { MeshLambertMaterial, PointLight, Geometry, Vector3, ShaderLib, UniformsUtils, ShaderMaterial, AdditiveBlending, Points, Color, Texture } from 'three';


// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader


export default class Stars extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind

		this.nbAst = 200;

		this.init();

		console.log('Stars view');

	}

	setAsteroids() {

		this.asteroids = [];
		this.asteroidsM = [];
		this.uniforms = [];

		const img = PreloadManager.getResult('texture-star');

		// create point
		const geometry = new Geometry();
		geometry.vertices.push(
			new Vector3( 0, 0, 0 )
		);

		const shaderPoint = ShaderLib.points;

		this.nbUnif = 5;
		this.topY = 35;
		this.bottomY = -15;

		for (let i = 0; i < this.nbUnif; i++) {

			let uniforms = UniformsUtils.clone(shaderPoint.uniforms);
			uniforms.map.value = new Texture(img);
			uniforms.map.value.needsUpdate = true;
			uniforms.scale.value = window.innerHeight * 1;

			switch (i) {
				case 0:
					uniforms.offset = 300;
					uniforms.time = 600;
					uniforms.range = oscillate(0.4,0.5);
					uniforms.diffuse.value = new Color(0xEF1300);
					break;
				case 1:
					uniforms.offset = 1000;
					uniforms.time = 700;
					uniforms.range = oscillate(0.4,0.8);
					uniforms.diffuse.value = new Color(0xEF1300);
					break;
				case 2:
					uniforms.offset = 200;
					uniforms.time = 200;
					uniforms.range = oscillate(0.5,0.9);
					uniforms.diffuse.value = new Color(0xEF1300);
					break;
				case 3:
					uniforms.offset = 400;
					uniforms.time = 200;
					uniforms.range = oscillate(0.3,0.5);
					uniforms.diffuse.value = new Color(0xEF4007);
					break;
				case 4:
					uniforms.offset = 700;
					uniforms.time = 1000;
					uniforms.range = oscillate(0.4,0.7);
					uniforms.diffuse.value = new Color(0xEF4007);
					break;
			}

			// uniforms.fogColor.value = new Color(0x000000);
			this.uniforms.push(uniforms);

		}


		for (let i = 0; i < this.nbAst; i++) {

			const range = getRandom(3, 8);

			const pos = {
				x: getRandom(-60, 60),
				y: getRandom(this.bottomY, this.topY),
				z: getRandom(-60, 60),
			};

			const random = Math.round(getRandom(0,this.nbUnif - 1));

			const asteroid = new Points(geometry, /* material || */ new ShaderMaterial({
				uniforms: this.uniforms[random],
				defines: {
					USE_MAP: '',
					USE_SIZEATTENUATION: ''
				},
				transparent: true,
				// alphaTest: .4,
				depthWrite: false,
				// depthTest: false,
				blending: AdditiveBlending,
				vertexShader: shaderPoint.vertexShader,
				fragmentShader: shaderPoint.fragmentShader
			}));

			asteroid.progress = 0;
			asteroid.position.set(pos.x, pos.y, pos.z);
			asteroid.initPosY = pos.y;
			asteroid.initPosX = pos.x;
			asteroid.coefX = getRandom(0.3, 1);
			asteroid.time = getRandom(0.01, 0.02); // more is slower

			// asteroid.scale.set(20, 20, 20); --> won't work

			this.asteroidsM.push(asteroid);

			this.scene.add(asteroid);

		}

	}

	setLight() {

		let paramsLight = [
			// { x: 70, y: 70, z: 0 },
			{ x: -100, y: 0, z: 0 },
			{ x: 100, y: 0, z: 0 },
			{ x: 0, y: 0, z: 170 },
			{ x: 0, y: -0, z: 0 }
		];

		// Check Ambient Light
		// scene.add( new THREE.AmbientLight( 0x00020 ) );

		for (let i = 0; i < paramsLight.length; i++) {

			// create a point light
			let pointLight = new PointLight(0xFFFFFF, 0.8, 480, 2);
			// set its position
			pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
			// pointLight.power = 20;
			pointLight.visible = true;

			// add to the scene
			this.scene.add(pointLight);
		}

	}

	onChangeAst() {

		this.asteroidsM[0].material.color.setHex(this.effectController.astColor);
	}

	raf() {

		// update uniforms

		this.uniforms.forEach( (el)=> {
			el.size.value = Math.sin((this.time + el.offset) * 2 * Math.PI / el.time) * el.range.coef + el.range.add;
		});

		// Asteroids meshs
		this.asteroidsM.forEach( (el)=> {

			if (el.position.y < this.bottomY) {
				// reset
				el.progress = 0;
				el.initPosY = getRandom(this.topY - 5, this.topY);
			}
			el.progress +=  el.time;
			el.position.y = el.initPosY - el.progress + this.camRotSmooth.x * 100 * el.coefX;

			el.position.x = el.initPosX - this.camRotSmooth.y * 100 * el.coefX;

		});

		// console.log(-this.camRotSmooth.y * 70);

		super.raf();
	}

}
