import ProjectView from '../views/ProjectView';
import PreloadManager from '../managers/PreloadManager';
import { getRandom, toRadian, oscillate } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';


// THREE JS
import { SphereGeometry, Clock, DirectionalLight, Math as MathThree, Scene, MeshBasicMaterial, Mesh, PlaneBufferGeometry, LinearFilter, RGBFormat, Vector2, WebGLRenderTarget, OrthographicCamera, PointLight, Geometry, Vector3, ShaderLib, UniformsUtils, ShaderMaterial, AdditiveBlending, Points, Color, Texture } from 'three';
import BufferGeometryUtils from '../vendors/BufferGeometryUtils';
import TerrainShader from '../shaders/TerrainShader';
import NoiseShader from '../shaders/NoiseShader';
import { BlobLightShader } from '../shaders/BlobLightShader';
import { BrightnessShader } from '../shaders/BrightnessShader';

// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader


export default class Stars extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind
		this.setTerrain = this.setTerrain.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);

		this.nbAst = 100;
		this.lights = [];

		this.init();

		this.setTerrain();

		console.log('Stars view', this.clock.getElapsedTime());

	}

	setTerrain() {

		let SCREEN_WIDTH = window.innerWidth;
		let SCREEN_HEIGHT = window.innerHeight;

		this.animDelta = 0;
		this.animDeltaDir = -1;
		this.lightVal = 0;
		this.lightDir = 1;

		this.updateNoise = true;

		this.mlib = {};

		// init part

		// SCENE (RENDER TARGET)

		this.sceneRenderTarget = new Scene(); // Scene for OrthoGraphic Camera

		this.cameraOrtho = new OrthographicCamera( SCREEN_WIDTH / -2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT / -2, -10000, 10000 );
		this.cameraOrtho.position.z = 100;

		// This camera is only use for normal map and HeightMap

		this.sceneRenderTarget.add( this.cameraOrtho );

		// SCENE (FINAL)

		// HEIGHT + NORMAL MAPS

		// var normalShader = NormalMapShader;

		// NormalMap shader
		this.size = 150;
		this.scaleHeight = 30;
		this.tPosY = -20 - this.scaleHeight;

		this.nbVertices = 150; /// ???
		let rx = this.nbVertices, ry = this.nbVertices; // lié à PlaneBufferGeometry ???
		let pars = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat };

		this.heightMap  = new WebGLRenderTarget( rx, ry, pars );
		this.heightMap.texture.generateMipmaps = false;

		this.uniformsNoise = {

			time:   { value: 1.0 },
			scale:  { value: new Vector2( 0.7, 0.7 ) },
			offset: { value: new Vector2( 0, 0 ) }

		}; /// HeightMap noise ????

		// All uniforms for this normal map

		// TEXTURES

		// Gestion of texture for Grass, ground, terrain/ combi normal map

		// Dont know what it is. It does nothing
		// let specularMap = new WebGLRenderTarget( 10, 2048, pars );
		// specularMap.texture.generateMipmaps = false;

		// specularMap.texture.wrapS = specularMap.texture.wrapT = RepeatWrapping;

		// TERRAIN SHADER

		// A lot is here....

		const terrainShader = TerrainShader[ 'terrain' ];

		this.uniformsTerrain = UniformsUtils.clone( terrainShader.uniforms );

		// TerrainShader

		this.uniformsTerrain[ 'tDisplacement' ].value = this.heightMap.texture; // Important : the Heightmap displacement (create mountains)

		// this.uniformsTerrain[ 'tSpecular' ].value = specularMap.texture; ///???

		this.uniformsTerrain[ 'enableDiffuse1' ].value = false;
		this.uniformsTerrain[ 'enableDiffuse2' ].value = false;
		this.uniformsTerrain[ 'enableSpecular' ].value = true;

		this.uniformsTerrain[ 'diffuse' ].value.setHex( 0x343434 ); // diffuse color : 0x343434
		this.uniformsTerrain[ 'specular' ].value.setHex( 0xffffff );

		this.uniformsTerrain[ 'shininess' ].value = 100; // shininess of material

		this.uniformsTerrain[ 'uDisplacementScale' ].value = this.scaleHeight; // max height of mountains

		this.uniformsTerrain[ 'uRepeatOverlay' ].value.set( 6, 6 ); // ?



		const params = [
			[ 'heightmap', 	NoiseShader.fragmentShader, NoiseShader.vertexShader, this.uniformsNoise, false ],
			[ 'terrain', 	terrainShader.fragmentShader, terrainShader.vertexShader, this.uniformsTerrain, true ]
		];

		for ( let i = 0; i < params.length; i++ ) {

			const material = new ShaderMaterial( {

				uniforms: 		params[ i ][ 3 ],
				vertexShader: 	params[ i ][ 2 ],
				fragmentShader: params[ i ][ 1 ],
				lights: 		params[ i ][ 4 ],
				fog: 			true
			} );

			this.mlib[ params[ i ][ 0 ] ] = material;

		}


		const plane = new PlaneBufferGeometry( SCREEN_WIDTH, SCREEN_HEIGHT );

		this.quadTarget = new Mesh( plane, new MeshBasicMaterial( { color: 0x000000 } ) );
		// this.quadTarget.position.z = -500;
		this.sceneRenderTarget.add( this.quadTarget );

		// TERRAIN MESH

		const geometryTerrain = new PlaneBufferGeometry( this.size, this.size, this.nbVertices, this.nbVertices ); // augmenter le nombre de vertices

		BufferGeometryUtils.computeTangents( geometryTerrain ); //??? Boucle ? wtf

		this.terrain = new Mesh( geometryTerrain, this.mlib[ 'terrain' ] );
		this.terrain.position.set( 0, this.tPosY, -50 );
		this.terrain.rotation.x = toRadian(-70);
		this.terrain.rotation.z = toRadian(-45);
		this.scene.add( this.terrain );

		// EVENTS

		document.addEventListener( 'keydown', this.onKeyDown, false );

		const geometry = new SphereGeometry(6,6,50);

		const material = new MeshBasicMaterial({color: 0x00FFFFF});

		this.test = new Points(geometry, material);
		// this.scene.add(this.test);


		this.animDeltaDir *= -1;

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
		this.topY = 25;
		this.bottomY = -45;

		for (let i = 0; i < this.nbUnif; i++) {

			let uniforms = UniformsUtils.clone(shaderPoint.uniforms);
			// console.log(uniforms);
			uniforms.map.value = new Texture(img);
			uniforms.map.value.needsUpdate = true;
			uniforms.scale.value = window.innerHeight * 1;
			uniforms.brightness = { type: 'f', value: 0 };
			uniforms.contrast = { type: 'f', value: 0.5 };

			switch (i) {
				case 0:
					uniforms.offset = 300;
					uniforms.time = 1;
					uniforms.range = oscillate(0.9,1.5);
					uniforms.diffuse.value = new Color(0xEF1300);
					break;
				case 1:
					uniforms.offset = 1000;
					uniforms.time = 2;
					uniforms.range = oscillate(0.9,1.8);
					uniforms.diffuse.value = new Color(0xEF1300);
					break;
				case 2:
					uniforms.offset = 200;
					uniforms.time = 0.5;
					uniforms.range = oscillate(1.2,1.7);
					uniforms.diffuse.value = new Color(0xEF1300);
					break;
				case 3:
					uniforms.offset = 400;
					uniforms.time = 0.5;
					uniforms.range = oscillate(0.8,1.5);
					uniforms.diffuse.value = new Color(0xEF4007);
					break;
				case 4:
					uniforms.offset = 700;
					uniforms.time = 1.5;
					uniforms.range = oscillate(0.9,1.6);
					uniforms.diffuse.value = new Color(0xEF4007);
					break;
			}

			// uniforms.fogColor.value = new Color(0x000000);
			this.uniforms.push(uniforms);

		}

		// const blobLightShader = new BrightnessShader();
		// console.log(shaderPoint);


		for (let i = 0; i < this.nbAst; i++) {

			// const range = getRandom(3, 8);

			const pos = {
				x: getRandom(-80, 80),
				y: getRandom(this.bottomY, this.topY),
				z: getRandom(-100, 30),
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
				// uniforms: {
				// 	tInput: { type: 't', value: new Texture(img) },
				// 	brightness: { type: 'f', value: 3 },
				// 	contrast: { type: 'f', value: 5 },
				// },
				// // blending: AdditiveBlending,
				// vertexShader: blobLightShader.vertexShader,
				// fragmentShader: blobLightShader.fragmentShader
			asteroid.progress = 0;
			asteroid.position.set(pos.x, pos.y, pos.z);
			asteroid.initPosY = pos.y;
			asteroid.initPosX = pos.x;
			asteroid.coefX = getRandom(0.3, 1);
			asteroid.time = getRandom(0.03, 0.05); // more is slower

			// asteroid.scale.set(20, 20, 20); --> won't work

			this.asteroidsM.push(asteroid);

			this.scene.add(asteroid);

		}

	}

	setLight() {

		let paramsLight = [
			{ x: -10, y: 0, z: 0, d: 120, it: 3, moving: true },
			// { x: 0, y: 0, z: -100, d: 150, it: 2 },
			// { x: 0, y: 0, z: 0, d: 30, it: 2 },
			// { x: 0, y: 30, z: 30 },
			// { x: 0, y: 30, z: -30 },
			// { x: -30, y: 30, z: 0 },
			// { x: 0, y: -30, z: 0 }
		];

		// Check Ambient Light
		// scene.add( new THREE.AmbientLight( 0x00020 ) );

		for (let i = 0; i < paramsLight.length; i++) {

			const d = paramsLight[i].d || 100;
			const it = paramsLight[i].it || 1;

			// create a point light
			let pointLight = new PointLight(0x707070, it, d, 1);
			// set its position
			pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
			// pointLight.power = 20;
			pointLight.visible = true;

			// add to the scene
			this.scene.add(pointLight);
			if (paramsLight[i].moving === true) {
				this.lights.push(pointLight);
			}
		}
		let light = new DirectionalLight( 0xBF1812, 2 );
		light.position.set( 0, 0, 1 );
		this.scene.add( light );
		// let light2 = new DirectionalLight( 0xffffff, 1 );
		// light2.position.set( 1, 0, 0 );
		// this.scene.add( light2 );


	}

	onKeyDown( event ) {

		// switch ( event.keyCode ) {

		// 	case 78: /*N*/  this.lightDir *= -1; break;
		// 	case 77: /*M*/  this.animDeltaDir *= -1; break;

		// }

	}

	onChangeAst() {

		this.asteroidsM[0].material.color.setHex(this.effectController.astColor);
	}

	raf() {

		let delta = this.clock.getDelta();

		// update uniforms

		this.uniforms.forEach( (el)=> {
			el.size.value = Math.sin(this.clock.getElapsedTime() * el.time + el.offset) * el.range.coef + el.range.add;
		});

		// Asteroids meshs
		this.asteroidsM.forEach( (el)=> {

			if (el.position.y < this.bottomY) {
				// reset
				el.progress = 0;
				el.initPosY = getRandom(this.topY - 5, this.topY);
			}
			el.progress += delta * 4;
			el.position.y = el.initPosY - el.progress + this.camRotSmooth.x * 100 * el.coefX;

			el.position.x = el.initPosX - this.camRotSmooth.y * 100 * el.coefX;

		});

		// console.log(-this.camRotSmooth.y * 70);

		// Terrain

		if ( this.terrain.visible ) {

			let fLow = 0.1, fHigh = 0.8;

			// relative to light ???

			this.lightVal = MathThree.clamp( this.lightVal + 0.5 * delta * this.lightDir, fLow, fHigh );

			let valNorm = ( this.lightVal - fLow ) / ( fHigh - fLow );

			this.uniformsTerrain[ 'uNormalScale' ].value = MathThree.mapLinear( valNorm, 0, 1, 0.6, 3.5 ); // scale, displacement, weird thing here

			if ( this.updateNoise ) {

				this.animDelta = MathThree.clamp( this.animDelta + 0.00075 * this.animDeltaDir, 0, 0.05 );
				this.uniformsNoise[ 'time' ].value += delta * this.animDelta;

				// this.uniformsNoise[ 'offset' ].value.x += delta * 0.05; // moves

				this.uniformsTerrain[ 'uOffset' ].value.x = 4 * this.uniformsNoise[ 'offset' ].value.x;

				this.quadTarget.material = this.mlib[ 'heightmap' ];
				SceneManager.renderer.render( this.sceneRenderTarget, this.cameraOrtho, this.heightMap, true );

				this.test.position.x = this.lights[0].position.x = Math.sin(this.clock.getElapsedTime()) * 50;
				// this.test.position.z = this.lights[0].position.z = -Math.sin(this.time * 2 * Math.PI / 400) * 100 - 100;

			}

		}
		super.raf();
	}

}
