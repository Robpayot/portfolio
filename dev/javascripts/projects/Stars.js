import ProjectView from '../views/ProjectView';
import PreloadManager from '../managers/PreloadManager';
import { getRandom, toRadian } from '../helpers/utils';
import { loadJSON } from '../helpers/utils-three';

// THREE JS
import { MeshLambertMaterial, PointLight, Geometry, Vector3,PointsMaterial, SphereGeometry,PlaneGeometry, MeshBasicMaterial, Mesh, BoxGeometry, ShaderLib, UniformsUtils, ShaderMaterial, AdditiveBlending, Points, IcosahedronGeometry, Color, Texture } from 'three';
import Asteroid from '../shapes/Asteroid';


// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader


export default class Stars extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind

		this.nbAst = 30;

		this.init();

		console.log('Stars view');

	}

	setAsteroids() {

		this.asteroids = [];
		this.asteroidsM = [];

		const img = PreloadManager.getResult('texture-star');

		const shaderPoint = ShaderLib.points;
		let uniforms = UniformsUtils.clone(shaderPoint.uniforms);

		// create point
		const geometry = new Geometry();
		geometry.vertices.push(
			new Vector3( 0, 0, 0 )
		);

		uniforms.map.value = new Texture(img);
		uniforms.map.value.needsUpdate = true;
		uniforms.size.value = 2;
		uniforms.scale.value = window.innerHeight * 1;
		uniforms.diffuse.value = new Color(0xEF1300);
		uniforms.fogColor.value = new Color(0x000000);

		// for (let i = 0; i < this.nbAst; i++) {

			const scale = getRandom(1, 4);
			const speed = getRandom(400, 700); // more is slower
			const range = getRandom(3, 8);
			const pos = {
				x: getRandom(-80, 80),
				y: getRandom(-80, 80),
				z: getRandom(-80, 80),
			};

			const asteroid = {
				pos
			};

			asteroid.mesh = new Points(geometry, /* material || */ new ShaderMaterial({
				uniforms: uniforms,
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

			// asteroid.mesh.index = i;
			asteroid.mesh.position.set(0,0,0);

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);

		}
		// super.setAsteroids(this.models[0].geometry);

	// }

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
			let pointLight = new PointLight(0xFFFFFF, 0.8, 600, 2);
			// set its position
			pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
			// pointLight.power = 20;
			pointLight.visible = true;

			// add to the scene
			this.scene.add(pointLight);
		}

		// white spotlight shining from the side, casting a shadow

		// var spotLight = new SpotLight(0xffffff);
		// spotLight.position.set(0, 0, -100);
		// spotLight.angle = toRadian(180);

		// spotLight.castShadow = false;

		// spotLight.shadow.mapSize.width = 1024;
		// spotLight.shadow.mapSize.height = 1024;

		// spotLight.shadow.camera.near = 500;
		// spotLight.shadow.camera.far = 4;
		// spotLight.shadow.camera.fov = 120;

		// this.scene.add(spotLight);

		// var directionalLight = new DirectionalLight(0xffffff, 0.5);
		// this.scene.add(directionalLight);
	}

	onChangeAst() {

		this.asteroidsM[0].material.color.setHex(this.effectController.astColor);
	}

	raf() {

		// Asteroids meshs
		this.asteroids.forEach( (el)=> {

			// Move top and bottom --> Levit effect
			// Start Number + Math.sin(this.time*2*Math.PI/PERIOD)*(SCALE/2) + (SCALE/2)
			el.mesh.position.y = el.endY + Math.sin(this.time * 2 * Math.PI / el.speed) * (el.range / 2) + el.range / 2;
			// rotate

			el.mesh.rotation.y = toRadian(el.initRotateY + Math.sin(this.time * 2 * Math.PI / el.timeRotate) * (360 / 2) + 360 / 2);
			// el.mesh.rotation.x = toRadian(Math.sin(this.time * 2 * Math.PI / 400) * el.rotateRangeX ); // -30 to 30 deg rotation
			el.mesh.rotation.z = toRadian(el.initRotateZ + Math.sin(this.time * 2 * Math.PI / el.timeRotate) * el.rotateRangeZ ); // -30 to 30 deg rotation

			// if (el.mesh.index === 0) {
			// 	console.log(Math.sin(this.time * 2 * Math.PI / 400) * el.rotateRangeZ, el.rotateRangeZ);
			// }
		});

		super.raf();
	}

}
