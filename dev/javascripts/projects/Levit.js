import ProjectView from '../views/ProjectView';
import { getRandom, toRadian } from '../helpers/utils';
import { Device } from '../helpers/Device';
import DATA from '../../datas/data.json';

// THREE JS
import { MeshPhongMaterial, DirectionalLight } from 'three';
import Asteroid from '../shapes/Asteroid';



export default class Levit extends ProjectView {

	constructor(obj) {

		super(obj);

		// bind
		this.setAsteroids = this.setAsteroids.bind(this);

		this.nbAst = 10;
		this.interval = 0;

		super.startScene();

	}

	setAsteroids() {

		this.asteroids = [];
		this.asteroidsM = [];

		const material = new MeshPhongMaterial({
			color: 0x125714,
			flatShading: true
		});

		const positions = DATA.projects[this.id].asteroidsPositions; // get positions from a json

		let pos;

		for (let i = 0; i < positions.length; i++) {

			const rot = {
				x: getRandom(150, 210),
				y: getRandom(-180, 180),
				z: getRandom(-15, 15),
			};

			pos = positions[i];

			const scale = getRandom(0.018, 0.035);
			const speed = getRandom(0.5,0.72);
			const range = getRandom(3, 8);
			const timeRotate = getRandom(0.0013, 0.0016);

			const model = Math.round(getRandom(2, 4));

			const asteroid = new Asteroid({
				width: global.MODELS[model].size.x,
				height: global.MODELS[model].size.y,
				depth: global.MODELS[model].size.z,
				geometry: global.MODELS[model],
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
			asteroid.dir = Math.round(getRandom(0,1)) === 0 ? -1 : 1;
			asteroid.rotateRangeZ = getRandom(-15,15);
			asteroid.rotateRangeX = getRandom(-30,30);
			asteroid.offset = getRandom(0,10);
			asteroid.velocity = 0;

			this.asteroids.push(asteroid);
			this.asteroidsM.push(asteroid.mesh);

			// add mesh to the scene
			this.scene.add(asteroid.mesh);

		}


	}

	setLight() {

		let light = new DirectionalLight( 0x125714, 2 );
		light.position.set( 0, 0, 1 );
		this.scene.add( light );

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

			if (this.asteroids[i].active === true) {

				this.asteroids[i].velocity += 0.01;
				this.asteroids[i].velocity = Math.min(0.04, this.asteroids[i].velocity);
				this.asteroids[i].mesh.rotation.y += (this.asteroids[i].timeRotate + this.asteroids[i].velocity) * this.asteroids[i].dir ;

			} else {
				if (this.asteroids[i].velocity !== 0) {
					this.asteroids[i].velocity -= 0.0004;
					this.asteroids[i].velocity = Math.max(0, this.asteroids[i].velocity);
				}

				this.asteroids[i].mesh.rotation.y += (this.asteroids[i].timeRotate + this.asteroids[i].velocity) * this.asteroids[i].dir;

			}

			// Move top and bottom --> Levit effect
			this.asteroids[i].mesh.position.y = this.asteroids[i].endY + Math.sin( this.clock.getElapsedTime() * this.asteroids[i].speed + this.asteroids[i].offset) * (this.asteroids[i].range / 2) + this.asteroids[i].range / 2;
			this.asteroids[i].mesh.rotation.z = toRadian(this.asteroids[i].initRotateZ + Math.sin(this.clock.getElapsedTime() * this.asteroids[i].timeRotate + this.asteroids[i].offset) * this.asteroids[i].rotateRangeZ ) * this.asteroids[i].dir; // -30 to 30 deg rotation
		}

		super.raf();
	}

}
