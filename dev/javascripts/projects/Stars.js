import ProjectView from '../views/ProjectView';
import { getRandom, toRadian, oscillate } from '../helpers/utils';
import SceneManager from '../managers/SceneManager';
import { Device } from '../helpers/Device';
import dat from 'dat-gui';

// THREE JS
import { SphereGeometry, Math as MathThree, Scene, MeshBasicMaterial, Geometry, Color, Line, Vector3, Object3D, MeshPhongMaterial, MeshToonMaterial, LineBasicMaterial, SpriteMaterial, Sprite, CanvasTexture, Mesh, PlaneBufferGeometry, LinearFilter, RGBFormat, Vector2, WebGLRenderTarget, OrthographicCamera, PointLight, UniformsUtils, ShaderMaterial, AdditiveBlending } from 'three';
import BufferGeometryUtils from '../vendors/BufferGeometryUtils';
import TerrainShader from '../shaders/TerrainShader';
import NoiseShader from '../shaders/NoiseShader';

export default class Stars extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind
		this.setTerrain = this.setTerrain.bind(this);
		this.handleGUI = this.handleGUI.bind(this);

		this.nbAst = 150;
		this.lightIntensity = { val: 0};
		this.coefSpeed = 0.015;


		this.gui = new dat.GUI();


		this.guiOpts = {
			terrain_color: '#2645B0',
			shape_color: '#2645B0',
			stars_color: '#2645B0'
		};



		this.gui.addColor(this.guiOpts, 'terrain_color').onChange(this.handleGUI).name('terrain color');
		this.gui.addColor(this.guiOpts, 'shape_color').onChange(this.handleGUI).name('shape color');
		this.gui.addColor(this.guiOpts, 'stars_color').onChange(this.handleGUI).name('stars color');


		// colors
		this.colorTerrain = '';

		super.startScene();
		this.setTerrain();


		// Add after , try to fix FF issue
		this.scene.add( this.terrain );
		this.scene.add(this.cursorPlane);

	}

	hexToRgbF(hex) {
		let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16),
		} : null;
	}

	handleGUI() {
		let color = this.guiOpts.terrain_color.substr(1);
		this.uniformsTerrain[ 'diffuse' ].value.setHex( `0x${color}` );

		color = this.hexToRgbF(this.guiOpts.shape_color);
		this.shapeMaterial.color = new Color( `rgb(${color.r}, ${color.g}, ${color.b})` );


		color = this.hexToRgbF(this.guiOpts.stars_color);
		for (let i = 0; i < this.asteroidsM.length; i++) {
			this.asteroidsM[i].material.map = new CanvasTexture( this.generateGradient(`rgba(${color.r}, ${color.g}, ${color.b}, 1)`) ); // color
		}
	}

	setTerrain() {

		this.animDelta = 0;
		this.animDeltaDir = -1;

		this.updateNoise = true;

		this.mlib = {};

		// init part

		// SCENE (RENDER TARGET)

		this.sceneRenderTarget = new Scene(); // Scene for OrthoGraphic Camera

		// This camera is only use for normal map and HeightMap
		this.cameraOrtho = new OrthographicCamera( window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000 );
		this.cameraOrtho.position.z = 100;

		this.sceneRenderTarget.add( this.cameraOrtho );

		// SCENE (FINAL)

		// HEIGHT + NORMAL MAPS
		const marge = Device.orientation === 'portrait' ? 120 : 70;

		// NormalMap shader
		this.size = this.wScreenSize + marge;

		// this.pointLight.range = this.size / 2; // for point light in device Touch

		this.scaleHeight = this.size * 0.15;
		this.tPosY = -20 - this.scaleHeight;

		this.nbVertices = 150;
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

		this.uniformsTerrain[ 'tDisplacement' ].value = this.heightMap.texture; // the Heightmap displacement (create mountains)

		this.uniformsTerrain[ 'enableDiffuse1' ].value = false;
		this.uniformsTerrain[ 'enableDiffuse2' ].value = false;
		this.uniformsTerrain[ 'enableSpecular' ].value = true;

		this.uniformsTerrain[ 'diffuse' ].value.setHex( 0x2645B0 ); // Light color : 0x343434
		this.uniformsTerrain[ 'specular' ].value.setHex( 0xffffff );

		this.uniformsTerrain[ 'shininess' ].value = 100; // shininess of material

		this.uniformsTerrain[ 'uDisplacementScale' ].value = this.scaleHeight; // max height of mountains


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


		let plane = new PlaneBufferGeometry( window.innerWidth, window.innerHeight );

		this.quadTarget = new Mesh( plane, new MeshBasicMaterial( { color: 0x000000 } ) );
		this.sceneRenderTarget.add( this.quadTarget );

		// TERRAIN MESH

		const geometryTerrain = new PlaneBufferGeometry( this.size, this.size, this.nbVertices, this.nbVertices ); // augmenter le nombre de vertices

		BufferGeometryUtils.computeTangents( geometryTerrain ); //??? Boucle ? wtf

		this.terrain = new Mesh( geometryTerrain, this.mlib[ 'terrain' ] );
		this.terrain.position.set( 0, this.tPosY, -50 );
		this.terrain.rotation.x = toRadian(-70);
		this.terrain.rotation.z = toRadian(-45);

		this.animDeltaDir *= -1;

		let valNorm = 0.1; // center light reflection

		this.uniformsTerrain[ 'uNormalScale' ].value = MathThree.mapLinear( valNorm, 0, 1, 0.6, 3.5 ); // scale, displacement,


		// Invisible objet used to cast a ray for the light
		const cursorPlane = new PlaneBufferGeometry( 1000, 1000 );


		this.cursorPlane = new Mesh( cursorPlane, new MeshPhongMaterial( { color: 0x00ff00, visible: false } ) );
		this.cursorPlane.position.set( 0, this.tPosY, -50 );
		this.cursorPlane.rotation.x = toRadian(-70);
		this.cursorPlane.rotation.z = toRadian(-45);



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
					material.map = new CanvasTexture( this.generateGradient('rgba(38, 69, 176, 1)') ); // color
					break;
				case 1:
					material.offset = 1000;
					material.time = 2;
					material.range = oscillate(0.3,1);
					// material.diffuse.value = new Color(0xEF1300);
					material.map = new CanvasTexture( this.generateGradient('rgba(38, 69, 176, 1)') ); // color
					break;
				case 2:
					material.offset = 200;
					material.time = 0.5;
					material.range = oscillate(0.8,1);
					// material.diffuse.value = new Color(0xEF1300);
					material.map = new CanvasTexture( this.generateGradient('rgba(38, 69, 176, 1)') ); // color
					break;
				case 3:
					material.offset = 400;
					material.time = 0.5;
					material.range = oscillate(0.5,1);
					// material.diffuse.value = new Color(0xEF4007);
					material.map = new CanvasTexture( this.generateGradient('rgba(38, 69, 176, 1)') ); // color
					break;
				case 4:
					material.offset = 700;
					material.time = 1.5;
					material.range = oscillate(0.2,0.8);
					// material.diffuse.value = new Color(0xEF4007);
					material.map = new CanvasTexture( this.generateGradient('rgba(38, 69, 176, 1)') ); // color
					break;
			}
			this.materials.push(material);

		}

		for (let i = 0; i < this.nbAst; i++) {

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

			this.asteroidsM.push(asteroid);

			this.scene.add(asteroid);

		}

	}

	generateGradient(color) {
		// gradient
		let canvas = document.createElement( 'canvas' );
		canvas.width = 64;
		canvas.height = 64;
		let context = canvas.getContext( '2d' );
		let gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
		gradient.addColorStop( 0, color );
		gradient.addColorStop( 0.3, color );
		gradient.addColorStop( 0.7, 'rgba(0,0,0,0)' );
		gradient.addColorStop( 1, 'rgba(0,0,0,0)' );
		context.fillStyle = gradient;
		context.fillRect( 0, 0, canvas.width, canvas.height );
		return canvas;
	}

	setLight() {

		this.pointLight = new PointLight(0xffffff, 1, 300);

		// add to the scene
		this.scene.add(this.pointLight);

		this.group = new Object3D();

		// Help & Debug

		const geometry = new SphereGeometry(6,6,50);

		const material = new MeshBasicMaterial({color: 0x00FFFFF});

		this.movingLight = new Mesh(geometry, material);
		this.movingLight.position.y = 100;
		this.movingLight.rotation.x = toRadian(20);

		this.group.add(this.movingLight);


		const geometry2 = new Geometry();
		const material2 = new LineBasicMaterial({color: 0x00FFFFF});
		geometry2.vertices.push(
			new Vector3( 0, 0, 0 ),
			new Vector3( 0, 60, 0 )
		);

		const line = new Line( geometry2, material2 );

		this.group.add(line);

		this.group.rotation.x = toRadian(20); // perpendiculaire
		this.group.visible = false;

		this.scene.add( this.group );

		this.setSphere();


	}

	setSphere() {

		this.nbSphere = 50;

		this.groupSphere = new Object3D();

		this.shapeMaterial = new MeshToonMaterial({
			color: 0x2645B0,
			reflectivity: 150,
			shininess: 150
		});

		for (let i = 0; i < this.nbSphere; i++) {
			const geometry = new SphereGeometry(getRandom(1, 7),32,32);

			// material.emissive = 0x9C2604;
			// material.emissiveIntensity = 4;

			let sphere = new Mesh(geometry, this.shapeMaterial);
			sphere.position.x = getRandom(-220, 220);
			sphere.position.y = getRandom(-40, 100);
			sphere.position.z = getRandom(-220, 220);

			this.groupSphere.add( sphere );
		}

		this.groupSphere.rotation.x = toRadian(20);
		this.groupSphere.rotation.y = toRadian(45);

		this.scene.add( this.groupSphere );
	}

	transitionIn() {

		super.transitionIn();

		TweenMax.to(this.lightIntensity, 5, {val:1.5, delay: 0, onUpdate:() => {
			this.pointLight.intensity = this.lightIntensity.val;
		}});

		TweenMax.fromTo(this.uniformsTerrain[ 'uDisplacementScale' ], 3, {value: 1.0}, {value: this.scaleHeight, ease: window.Expo.easeOut, delay: 0.2}); // max height of mountains

	}

	raf() {

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

		// Terrain
		if (this.terrain) {
			if ( this.terrain.visible ) {

				if (Device.touch === false) {

					this.raycaster.setFromCamera(this.mouse, this.camera);

					const intersection = this.raycaster.intersectObject(this.cursorPlane);
					if ( intersection.length > 0 ) {

						if (this.lightZ === true) {
							this.group.position.set(intersection[0].point.x, intersection[0].point.y * 0.7, intersection[0].point.z);
						} else {
							this.group.position.set(intersection[0].point.x, intersection[0].point.y, intersection[0].point.z * 0.7);
						}

						this.pointLight.position.setFromMatrixPosition( this.movingLight.matrixWorld );

					}

				} else {
					this.movingLight.position.x = this.pointLight.position.x = 0;
				}

				if ( this.updateNoise ) {

					this.animDelta = MathThree.clamp( this.animDelta + 0.00075 * this.animDeltaDir, 0, 0.05 );
					this.uniformsNoise[ 'time' ].value += this.coefSpeed * this.animDelta;

					this.uniformsTerrain[ 'uOffset' ].value.x = 4 * this.uniformsNoise[ 'offset' ].value.x;

					this.quadTarget.material = this.mlib[ 'heightmap' ];
					SceneManager.renderer.render( this.sceneRenderTarget, this.cameraOrtho, this.heightMap, true );

				}

			}
		}
		super.raf();
	}

}
