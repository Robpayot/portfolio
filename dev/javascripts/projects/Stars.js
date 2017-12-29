import ProjectView from '../views/ProjectView';
import { getRandom, toRadian, oscillate } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import { Device } from '../helpers/Device';



// THREE JS
import { SphereGeometry, Math as MathThree, Scene, MeshBasicMaterial, Geometry, Line, Vector3, Object3D, MeshPhongMaterial, LineBasicMaterial, SpriteMaterial, Sprite, CanvasTexture, Mesh, PlaneBufferGeometry, LinearFilter, RGBFormat, Vector2, WebGLRenderTarget, OrthographicCamera, PointLight, UniformsUtils, ShaderMaterial, AdditiveBlending } from 'three';
import BufferGeometryUtils from '../vendors/BufferGeometryUtils';
import TerrainShader from '../shaders/TerrainShader';
import NoiseShader from '../shaders/NoiseShader';



export default class Stars extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind
		this.setTerrain = this.setTerrain.bind(this);

		this.nbAst = 150;
		this.lights = [];
		this.coefSpeed = 0.015;

		super.startScene();

		setTimeout(() => {
			this.setTerrain();
		}, 200); // maybe fix white issue

		// console.log('Stars view');

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
		const marge = 70;

		// NormalMap shader
		this.size = this.wScreenSize + marge; //

		this.scaleHeight = this.size * 0.15;
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

		};

		// TERRAIN SHADER

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


		let plane = new PlaneBufferGeometry( SCREEN_WIDTH, SCREEN_HEIGHT );

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

		this.animDeltaDir *= -1;


		const cursorPlane = new PlaneBufferGeometry( 1000, 1000 );


		this.cursorPlane = new Mesh( cursorPlane, new MeshPhongMaterial( { color: 0x00ff00, visible: false } ) );
		this.cursorPlane.position.set( 0, this.tPosY, -50 );
		this.cursorPlane.rotation.x = toRadian(-70);
		this.cursorPlane.rotation.z = toRadian(-45);
		// this.cursorPlane.visible = false;

		this.scene.add(this.cursorPlane);



	}

	setAsteroids() {
		// Pixel to Units magic FORMULE
		const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
		const h = 2 * Math.tan( vFOV / 2 ) * this.zoomZ; // visible height dist = 60 (160 - 100)

		this.wScreenSize = h * window.innerWidth / window.innerHeight;

		this.asteroids = [];
		this.asteroidsM = [];
		this.materials = [];

		this.nbMat = 5;
		this.topY = 80;
		this.bottomY = -45;

		for (let i = 0; i < this.nbMat; i++) {

			const material = new SpriteMaterial( {
				blending: AdditiveBlending,
				transparent: true
			});

			switch (i) {
				case 0:
					material.offset = 300;
					material.time = 1;
					material.range = oscillate(0.2,1);
					// material.diffuse.value = new Color(0xEF1300);
					material.map = new CanvasTexture( this.generateSprite('rgba(239, 19, 0, 1)') ); // color
					break;
				case 1:
					material.offset = 1000;
					material.time = 2;
					material.range = oscillate(0.3,1);
					// material.diffuse.value = new Color(0xEF1300);
					material.map = new CanvasTexture( this.generateSprite('rgba(239, 19, 0, 1)') ); // color
					break;
				case 2:
					material.offset = 200;
					material.time = 0.5;
					material.range = oscillate(0.8,1);
					// material.diffuse.value = new Color(0xEF1300);
					material.map = new CanvasTexture( this.generateSprite('rgba(239, 19, 0, 1)') ); // color
					break;
				case 3:
					material.offset = 400;
					material.time = 0.5;
					material.range = oscillate(0.5,1);
					// material.diffuse.value = new Color(0xEF4007);
					material.map = new CanvasTexture( this.generateSprite('rgba(239, 64, 7, 1)') ); // color
					break;
				case 4:
					material.offset = 700;
					material.time = 1.5;
					material.range = oscillate(0.2,0.8);
					// material.diffuse.value = new Color(0xEF4007);
					material.map = new CanvasTexture( this.generateSprite('rgba(239, 64, 7, 1)') ); // color
					break;
			}
			this.materials.push(material);

		}

		for (let i = 0; i < this.nbAst; i++) {

			// const range = getRandom(3, 8);

			const pos = {
				x: getRandom(-this.wScreenSize / 2, this.wScreenSize / 2),
				y: getRandom(this.bottomY, this.topY),
				z: getRandom(-130, 110),
			};

			const random = Math.round(getRandom(0,this.nbMat - 1));

			const asteroid = new Sprite( this.materials[random] );
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

	generateSprite(color) {
		// gradient
		let canvas = document.createElement( 'canvas' );
		canvas.width = 64;
		canvas.height = 64;
		let context = canvas.getContext( '2d' );
		let gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
		gradient.addColorStop( 0, color );
		// gradient.addColorStop( 0.1, 'rgba(0,255,255,1)' );
		gradient.addColorStop( 0.3, color );
		gradient.addColorStop( 0.7, 'rgba(0,0,0,0)' );
		gradient.addColorStop( 1, 'rgba(0,0,0,0)' );
		context.fillStyle = gradient;
		context.fillRect( 0, 0, canvas.width, canvas.height );
		return canvas;
	}

	setLight() {


		this.pointLight = new PointLight(0xffffff, 1.5, 120, 1);
		this.pointLight.range = 120;
		// add to the scene
		this.scene.add(this.pointLight);

		// Help & Debug

		const geometry = new SphereGeometry(6,6,50);

		const material = new MeshBasicMaterial({color: 0x00FFFFF});

		this.movingLight = new Mesh(geometry, material);
		this.movingLight.position.y = 60;
		// this.scene.add(this.movingLight);

		const geometry2 = new Geometry();
		const material2 = new LineBasicMaterial({color: 0x00FFFFF});
		geometry2.vertices.push(
			new Vector3( 0, 0, 0 ),
			new Vector3( 0, 60, 0 )
		);

		const line = new Line( geometry2, material2 );

		this.group = new Object3D();

		this.group.add(line);
		this.group.add(this.movingLight);

		this.group.rotation.x = toRadian(20); // perpendiculaire
		this.group.visible = false;

		this.scene.add( this.group );


	}

	onChangeAst() {

		this.asteroidsM[0].material.color.setHex(this.effectController.astColor);
	}

	raf() {

		// console.log(this.animDelta, this.animDeltaDir, this.clock.getDelta());

		// update uniforms

		for (let i = 0; i < this.nbMat; i++) {
			this.materials[i].opacity = Math.sin(this.clock.getElapsedTime() * this.materials[i].time + this.materials[i].offset) * this.materials[i].range.coef + this.materials[i].range.add;
		}

		// Asteroids meshs
		for (let i = 0; i < this.nbAst; i++) {

			if (this.asteroidsM[i].position.y < this.bottomY) {
				// reset
				this.asteroidsM[i].progress = 0;
				this.asteroidsM[i].initPosY = getRandom(this.topY - 5, this.topY);
			}
			this.asteroidsM[i].progress += this.coefSpeed * 4;
			this.asteroidsM[i].position.y = this.asteroidsM[i].initPosY - this.asteroidsM[i].progress + this.camRotSmooth.x * 100 * this.asteroidsM[i].coefX;

			this.asteroidsM[i].position.x = this.asteroidsM[i].initPosX - this.camRotSmooth.y * 100 * this.asteroidsM[i].coefX;

		}

		// console.log(-this.camRotSmooth.y * 70);

		// Terrain
		if (this.terrain) {
			if ( this.terrain.visible ) {

				if (Device.touch === false) {

					this.raycaster.setFromCamera(this.mouse, this.camera);

					const intersection = this.raycaster.intersectObject(this.cursorPlane);
					if ( intersection.length > 0 ) {

						if (this.contentOpen === true) {
							this.group.position.set(intersection[0].point.x, intersection[0].point.y * 0.9, intersection[0].point.z);
						} else {
							this.group.position.set(intersection[0].point.x, intersection[0].point.y, intersection[0].point.z * 0.9);
						}

						this.pointLight.position.setFromMatrixPosition( this.movingLight.matrixWorld );

					}

				} else {
					this.movingLight.position.x = this.pointLight.position.x = Math.sin(this.clock.getElapsedTime() * 0.8) * this.pointLight.range;
					// this.movingLight.position.z = this.lights[0].position.z = -Math.sin(this.time * 2 * Math.PI / 400) * 100 - 100;
				}

				let valNorm = 0.1; // center light reflection

				this.uniformsTerrain[ 'uNormalScale' ].value = MathThree.mapLinear( valNorm, 0, 1, 0.6, 3.5 ); // scale, displacement,

				if ( this.updateNoise ) {

					this.animDelta = MathThree.clamp( this.animDelta + 0.00075 * this.animDeltaDir, 0, 0.05 );
					this.uniformsNoise[ 'time' ].value += this.coefSpeed * this.animDelta;

					// this.uniformsNoise[ 'offset' ].value.x += delta * 0.05; // moves

					this.uniformsTerrain[ 'uOffset' ].value.x = 4 * this.uniformsNoise[ 'offset' ].value.x;

					this.quadTarget.material = this.mlib[ 'heightmap' ];
					SceneManager.renderer.render( this.sceneRenderTarget, this.cameraOrtho, this.heightMap, true );

				}

			}
		}
		super.raf();
	}

}
