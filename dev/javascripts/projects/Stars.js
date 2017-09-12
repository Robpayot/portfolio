import ProjectView from '../views/ProjectView';
import { getRandom, toRadian } from '../helpers/utils';
import { loadJSON } from '../helpers/utils-three';

// THREE JS
import { MeshLambertMaterial, PointLight, SphereGeometry, Mesh, BoxGeometry, ShaderLib, UniformsUtils, ShaderMaterial, AdditiveBlending, Points, IcosahedronGeometry, Color, Texture } from 'three';
import Asteroid from '../shapes/Asteroid';


// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader


export default class Stars extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind

		this.init();

		console.log('Levit view');

	}

	setAsteroids() {

		this.asteroids = [];
		this.asteroidsM = [];
		const imageSrc = `
data:image/png;base64,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
`
		// const shaderPoint = ShaderLib.points;
		// let uniforms = UniformsUtils.clone(shaderPoint.uniforms);
		// console.log(shaderPoint,uniforms);

		// const material = new MeshLambertMaterial({
		// 	color: this.data.color,
		// });

		// uniforms.map.value = new THREE.Texture(image)
		// image.onload = function() {
		// 	uniforms.map.value.needsUpdate = true
		// };
		// image.src = imageSrc
		// uniforms.size.value = 60;
		// uniforms.scale.value = window.innerHeight * .5;
		// uniforms.diffuse.value = new Color(0xEF1300);


		// const material = new ShaderMaterial({
		// 	uniforms: uniforms,
		// 	// defines: {
		// 	// 	USE_MAP: '',
		// 	// 	USE_SIZEATTENUATION: ''
		// 	// },
		// 	// // transparent: true,
		// 	// // alphaTest: .4,
		// 	// depthWrite: false,
		// 	// // depthTest: false,
		// 	// blending: AdditiveBlending,
		// 	vertexShader: shaderPoint.vertexShader,
		// 	fragmentShader: shaderPoint.fragmentShader
		// });

		const geometry = new BoxGeometry(20, 20,20);
		// const mesh = new Points(geometry, material);
	    // const geometry = new IcosahedronGeometry(20, 3)

	    const shaderPoint = ShaderLib.points
	    let uniforms = UniformsUtils.clone(shaderPoint.uniforms)
	    console.log(shaderPoint.vertexShader, shaderPoint.fragmentShader);

	    const image = new Image()
	    uniforms.map.value = new Texture(image)
	    image.onload = function() {
	        uniforms.map.value.needsUpdate = true
	    };
	    image.src = imageSrc
	    uniforms.size.value = 10
	    uniforms.scale.value = window.innerHeight * .5
	    uniforms.diffuse.value = new Color(0xEF1300);
	    uniforms.fogColor.value = new Color(0xFFFFFF);

	    let points = new Points(geometry, /* material || */ new ShaderMaterial({
	        uniforms: uniforms,
	        defines: {
	            USE_MAP: "",
	            USE_SIZEATTENUATION: ""
	        },
	        transparent: true,
	        // alphaTest: .4,
	        depthWrite: false,
	        // depthTest: false,
	        blending: AdditiveBlending,        
	        vertexShader: shaderPoint.vertexShader,
	        fragmentShader: shaderPoint.fragmentShader
	    }))
	    // points.position.x -= 220;    

		this.scene.add(points);

		return false;



		// this.materialAst1.shininess = 100;

		let pos;
		let posFixed;
		// get positions from a json
		// /! nu;brer of astd needed
		posFixed = [
			{ x: -40, y: -10, z: 80 },
			{ x: -50, y: 5, z: 10 },
			{ x: -30, y: -60, z: -20 },
			{ x: -10, y: 40, z: -40 },
			{ x: -60, y: 10, z: -40 },
			{ x: 0, y: -40, z: -60 },
			{ x: 30, y: 20, z: 60 },
			{ x: 20, y: -20, z: -30 },
			{ x: 50, y: -40, z: 30 },
			{ x: 40, y: 20, z: -80 }
		];

		for (let i = 0; i < this.nbAst; i++) {

			const rot = {
				x: getRandom(150, 210),
				y: getRandom(-180, 180),
				z: getRandom(-15, 15),
			};

			pos = posFixed[i];

			// //  force impulsion
			// const force = {
			// 	x: getRandom(-10, 10),
			// 	y: getRandom(-10, 10),
			// 	z: getRandom(-10, 10)
			// };

			const scale = getRandom(1, 4);
			const speed = getRandom(400, 700); // more is slower
			const range = getRandom(3, 8);
			const timeRotate = getRandom(15000, 17000);

			const model = Math.round(getRandom(0, 2));

			const asteroid = new Asteroid({
				width: this.models[model].size.x,
				height: this.models[model].size.y,
				depth: this.models[model].size.z,
				geometry: this.models[model],
				material,
				pos,
				rot,
				// force,
				scale,
				range,
				speed,
				timeRotate
			});

			asteroid.mesh.index = i;
			asteroid.rotateRangeZ = getRandom(-15,15);
			asteroid.rotateRangeX = getRandom(-30,30);

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);

		}
		// super.setAsteroids(this.models[0].geometry);

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
