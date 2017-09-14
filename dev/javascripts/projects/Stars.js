import ProjectView from '../views/ProjectView';
import PreloadManager from '../managers/PreloadManager';
import { getRandom, toRadian, oscillate, round } from '../helpers/utils';
import { loadJSON } from '../helpers/utils-three';
import SceneManager from '../managers/SceneManager';


// THREE JS
import { MeshLambertMaterial, Clock, Math as MathThree, Scene, WebGLRenderer, MeshBasicMaterial, Mesh, PlaneBufferGeometry, LinearFilter, RGBFormat, Vector2, WebGLRenderTarget, OrbitControls, OrthographicCamera, PerspectiveCamera, PointLight, Geometry, Vector3, ShaderLib, UniformsUtils, ShaderMaterial, AdditiveBlending, Points, Color, Texture } from 'three';
import BufferGeometryUtils from './BufferGeometryUtils';
import ShaderTerrain from './ShaderTerrain';

// POSTPROCESSING
// import { THREEx } from '../vendors/threex-glow'; // THREEx lib for Glow shader


export default class Stars extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind
		this.setTerrain = this.setTerrain.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);

		this.nbAst = 100;

		this.init();

		this.setTerrain();

		console.log('Stars view');

	}

	setTerrain() {
		console.log('yo');

		let SCREEN_WIDTH = window.innerWidth;
		let SCREEN_HEIGHT = window.innerHeight;

		let camera;

		this.animDelta = 0, this.animDeltaDir = -1;
		this.lightVal = 0, this.lightDir = 1;

		this.clock = new Clock();

		this.updateNoise = true;

		this.mlib = {};

		this.lights = [];

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

		let rx = 256, ry = 256;
		let pars = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat };

		this.heightMap  = new WebGLRenderTarget( rx, ry, pars );
		this.heightMap.texture.generateMipmaps = false;

		this.uniformsNoise = {

			time:   { value: 1.0 },
			scale:  { value: new Vector2( 1.5, 1.5 ) },
			offset: { value: new Vector2( 0, 0 ) }

		}; /// HeightMap noise ????

		// All uniforms for this normal map

		let vertexShader = document.getElementById( 'vertexShader' ).textContent;

		// TEXTURES

		// Gestion of texture for Grass, ground, terrain/ combi normal map

		// Dont know what it is. It does nothing
		// let specularMap = new WebGLRenderTarget( 10, 2048, pars );
		// specularMap.texture.generateMipmaps = false;

		// specularMap.texture.wrapS = specularMap.texture.wrapT = RepeatWrapping;

		// TERRAIN SHADER

		// A lot is here....

		const terrainShader = ShaderTerrain[ 'terrain' ];

		this.uniformsTerrain = UniformsUtils.clone( terrainShader.uniforms );

		// ShaderTerrain

		this.uniformsTerrain[ 'tDisplacement' ].value = this.heightMap.texture; // Important : the Heightmap displacement (create mountains)

		// this.uniformsTerrain[ 'tSpecular' ].value = specularMap.texture; ///???

		this.uniformsTerrain[ 'enableDiffuse1' ].value = false;
		this.uniformsTerrain[ 'enableDiffuse2' ].value = false;
		this.uniformsTerrain[ 'enableSpecular' ].value = true;

		this.uniformsTerrain[ 'diffuse' ].value.setHex( 0x00FFFF ); // diffuse color : 0x343434
		this.uniformsTerrain[ 'specular' ].value.setHex( 0xffffff );

		this.uniformsTerrain[ 'shininess' ].value = 1000; // shininess of material

		this.uniformsTerrain[ 'uDisplacementScale' ].value = 155; // max height of mountains

		this.uniformsTerrain[ 'uRepeatOverlay' ].value.set( 6, 6 ); // ?

		const params = [
			[ 'heightmap', 	document.getElementById( 'fragmentShaderNoise' ).textContent, 	vertexShader, this.uniformsNoise, false ],
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

		console.log(this.mlib[ 'heightmap' ]);


		const plane = new PlaneBufferGeometry( SCREEN_WIDTH, SCREEN_HEIGHT );

		this.quadTarget = new Mesh( plane, new MeshBasicMaterial( { color: 0x000000 } ) );
		// this.quadTarget.position.z = -500;
		this.sceneRenderTarget.add( this.quadTarget );

		// TERRAIN MESH

		const geometryTerrain = new PlaneBufferGeometry( 800, 800, 516, 516 );

		BufferGeometryUtils.computeTangents( geometryTerrain ); //??? Boucle ? wtf

		this.terrain = new Mesh( geometryTerrain, this.mlib[ 'terrain' ] );
		this.terrain.position.set( 0, -125, 0 );
		this.terrain.rotation.x = -Math.PI / 2;
		this.scene.add( this.terrain );

		// RENDERER

		// renderer = new WebGLRenderer();
		// renderer.setPixelRatio( window.devicePixelRatio );
		// renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
		// container.appendChild( renderer.domElement );

		// STATS

		// stats = new Stats();
		// container.appendChild( stats.dom );

		// EVENTS

		// onWindowResize();

		// window.addEventListener( 'resize', onWindowResize, false );

		document.addEventListener( 'keydown', this.onKeyDown, false );

		// Add light
		let paramsLight = [
			// { x: 70, y: 70, z: 0 },
			{ x: -10, y: 30, z: 0 },
			{ x: 10, y: 50, z: 30 },
			{ x: 0, y: 0, z: 10 },
			{ x: 200, y: 30, z: 0 },
			{ x: -200, y: 30, z: 0 },
			{ x: 200, y: 60, z: 600 },
			{ x: -200, y: 30, z: -200 },
			{ x: 800, y: 60, z: 800 }
		];

		// Check Ambient Light
		// scene.add( new AmbientLight( 0x00020 ) );


		for (let i = 0; i < paramsLight.length; i++) {

			// create a point light
			let pointLight = new PointLight(0xFFFFFF, 0.8, 700, 2);
			// set its position
			pointLight.position.set(paramsLight[i].x, paramsLight[i].y, paramsLight[i].z);
			// pointLight.power = 20;
			pointLight.visible = true;

			// add to the scene
			this.scene.add(pointLight);
			this.lights.push(pointLight);
		}

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
		// scene.add( new AmbientLight( 0x00020 ) );

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

	onKeyDown( event ) {

		switch ( event.keyCode ) {

			case 78: /*N*/  this.lightDir *= -1; break;
			case 77: /*M*/  this.animDeltaDir *= -1; break;

		}

	}

	onChangeAst() {

		this.asteroidsM[0].material.color.setHex(this.effectController.astColor);
	}

	raf() {

		// update uniforms

		// this.uniforms.forEach( (el)=> {
		// 	el.size.value = Math.sin((this.time + el.offset) * 2 * Math.PI / el.time) * el.range.coef + el.range.add;
		// });

		// // Asteroids meshs
		// this.asteroidsM.forEach( (el)=> {

		// 	if (el.position.y < this.bottomY) {
		// 		// reset
		// 		el.progress = 0;
		// 		el.initPosY = getRandom(this.topY - 5, this.topY);
		// 	}
		// 	el.progress +=  el.time;
		// 	el.position.y = el.initPosY - el.progress + this.camRotSmooth.x * 100 * el.coefX;

		// 	el.position.x = el.initPosX - this.camRotSmooth.y * 100 * el.coefX;

		// });

		// console.log(-this.camRotSmooth.y * 70);

		// Terrain

		let delta = this.clock.getDelta();

		if ( this.terrain.visible ) {

			let time = Date.now() * 0.001;

			let fLow = 0.1, fHigh = 0.8;

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

				this.lights[0].position.x = Math.sin(time * 2 * Math.PI / 10) * 200;
				this.lights[0].position.z = Math.sin(time * 2 * Math.PI / 10) * 200;

			}

			time++;

		}
		super.raf();
	}

}
