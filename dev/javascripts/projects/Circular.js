import ProjectView from '../views/ProjectView';
import { getRandom, toRadian } from '../helpers/utils';

// THREE JS
import { Mesh, Group, PlaneGeometry, DirectionalLight, MeshLambertMaterial, Object3D } from 'three';


export default class Circular extends ProjectView {

	constructor(obj) {

		super(obj);

		this.nbAst = 27;
		this.color1 = 0xEF2178;
		this.color2 = 0x5A1996;
		this.color3 = 0x424242;

		super.startScene();


		// console.log('Circular view');

	}

	setAsteroids() {


		this.asteroids = [];
		this.asteroidsM = [];
		this.materials = [
			new MeshLambertMaterial({color: this.color1, transparent: true}),
			new MeshLambertMaterial({color: this.color2, transparent: true}),
			new MeshLambertMaterial({color: this.color3, transparent: true})
		];

		this.groupAst = new Group();

		for (let i = 0; i < this.nbAst; i++) {

			const asteroid = new Group();
			const width = getRandom(3, 4);
			const height = getRandom(6, 12);
			const radius = getRandom(80, 160);
			const pivotY = 20;
			const coefRot = getRandom(3,4);
			const initRot = getRandom(toRadian(0), toRadian(360));


			const nbPalm = getRandom(2, 5);

			const geometry = new PlaneGeometry(width,height);

			// const material = this.materials[Math.round(getRandom(0, this.materials.length - 1))];
			const material = this.materials[i % 3]; // every 3 times


			for (let i = 0; i < nbPalm; i++) {

				const palm = new Mesh(geometry, material);

				palm.position.x = 0;
				palm.position.y = radius - pivotY;

				const pivotPalm = new Object3D();
				pivotPalm.position.y = -pivotY;
				pivotPalm.position.x = 0;

				// Pivot each palms
				if (nbPalm % 2 === 0) {

					if (i <= nbPalm / 2 - 1) {
						let rot = nbPalm / 2 - i;
						pivotPalm.rotation.z = toRadian(rot * coefRot) + toRadian(coefRot * (rot - 1));
					}

					if (i > nbPalm / 2 - 1) {
						let rot = i - (nbPalm / 2 - 1);
						pivotPalm.rotation.z = toRadian(-rot * coefRot) + toRadian(-coefRot * (rot - 1));
					}
				} else {

					if (i < nbPalm / 2 - 0.5) {
						let rot = nbPalm / 2 - i;
						pivotPalm.rotation.z = toRadian(rot * coefRot) + toRadian(coefRot * (rot - 1));
					}

					if (i > nbPalm / 2 - 0.5) {
						let rot = i - (nbPalm / 2 - 1);
						pivotPalm.rotation.z = toRadian(-rot * coefRot) + toRadian(-coefRot * (rot - 1));
					}
				}

				pivotPalm.add(palm);

				asteroid.add(pivotPalm);

			}

			asteroid.dir = Math.round(getRandom(0,1)) === 0 ? -1 : 1;
			asteroid.speed = getRandom(5,35);
			asteroid.position.z = getRandom(-160,10);
			asteroid.rotation.z = asteroid.initRot = initRot;

			this.asteroidsM.push(asteroid);

			this.groupAst.add(asteroid);

			// asteroid.children[0].position.x = 50;

		}



		this.scene.add(this.groupAst);

	}

	setLight() {

		let light = new DirectionalLight( 0xB72ABF, 2 );
		light.position.set( 0, 0, 1 );
		this.scene.add( light );

	}

	transitionIn() {

		// console.log(this.asteroidsM);
		// this.materials[0].opacity = 0;
		let delay = 0.3;
		const tl = new TimelineMax();
		for (let i = 0; i < this.materials.length; i++) {
			tl.fromTo(this.materials[i], 1.5, {opacity: 0}, {opacity: 1, ease: window.Linear.easeNone }, delay);

			delay += 0.1;
		}

		// tl.staggerFromTo(this.materials, 3, {opacity: 0}, {opacity:1});

		// tl.add(() => {
		// 	this.canRotate = true;
		// });


		super.transitionIn();
	}

	raf() {

		// Asteroids meshs
		for (let i = 0; i < this.nbAst; i++) {
			this.asteroidsM[i].rotation.z = this.asteroidsM[i].initRot + toRadian(this.clock.getElapsedTime() * this.asteroidsM[i].speed * this.asteroidsM[i].dir);

			for (let y = 0; y < this.asteroidsM[i].children.length; y++) {
				this.asteroidsM[i].children[y].children[0].position.x = -this.camRotSmooth.y * 200;
				this.asteroidsM[i].children[y].position.x = this.camRotSmooth.x * 270;
				// console.log(this.asteroidsM[i].children[y].position);
			}
		}

		this.groupAst.rotation.y = toRadian(this.camRotSmooth.y * 50);
		this.groupAst.rotation.x = toRadian(this.camRotSmooth.x * 50);


		super.raf();

	}

}
