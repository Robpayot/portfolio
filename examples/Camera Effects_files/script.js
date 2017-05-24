	(function(){

	var renderer,
		scene,
		camera,
		controls,
		aspectRatio		= 0.425531,
		devicePixelRatio = window.devicePixelRatio || 1,
		depthMaterial,
		depthTarget,
		composer,
		dof,
		centerLight,
		_last;

	if ( ! Detector.webgl ) {
		Detector.addGetWebGLMessage();
		return;
	}else{
		preload();
	}

	function preload(){

		manifest = [
			{src:'resources/textures/checker_board.png', id:'testPattern'}
		];

		preloader.add(manifest);
		preloader.completeSignal.connect(preloadCompleteHander);
		preloader.start();

		preloader.completeSignal.connect(circularProgressBar.transitionOut);
		preloader.progressSignal.connect(circularProgressBar.setProgress);

	}

	function preloadCompleteHander(){
		init();
		setup();
		animate(0);
		transitionIn();
	}

	function init(){

		var width	= document.body.clientWidth * devicePixelRatio,
			height	= (width * aspectRatio) * devicePixelRatio,
			depthShader,
			depthUniforms,
			gui;

		renderer = new THREE.WebGLRenderer({clearColor:0x888888});
		renderer.setSize(width, height);
		renderer.domElement.style.opacity = 0;
		document.getElementsByClassName('viewport')[0].appendChild(renderer.domElement);

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(0, width / height, 0.01, 20);
		camera.focalLength = 45;
		camera.frameSize = 32;
		camera.setLens(camera.focalLength, camera.frameSize);
		camera.position.y = 1;
		camera.position.z = 5;

		controls = new THREE.OrbitControls( camera,  renderer.domElement);
		// min pole is the north pole defaults to 0
		controls.minPolarAngle = 0;
		// max pole is the south pole defaults to Math.PI
		controls.maxPolarAngle = Math.PI-1.37;
		controls.maxDistance = 5;

		// depth
		depthShader = THREE.ShaderLib[ "depthRGBA" ];
		depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );

		depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
		depthMaterial.blending = THREE.NoBlending;

		depthTarget = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

		// postprocessing
		composer = new THREE.EffectComposer( renderer );
		composer.addPass( new THREE.RenderPass( scene, camera ) );

		// depth of field
		dof = new THREE.ShaderPass( THREE.DoFShader );
		dof.uniforms[ 'tDepth' ].value = depthTarget;
		dof.uniforms[ 'size' ].value.set( width, height );
		dof.uniforms[ 'textel' ].value.set( 1.0/width, 1.0/height);

		//make sure that these two values are the same for your camera, otherwise distances will be wrong.
		dof.uniforms[ 'znear' ].value = camera.near; //camera clipping start
		dof.uniforms[ 'zfar' ].value = camera.far; //camera clipping end

		dof.uniforms[ 'focalDepth' ].value = 5; //focal distance value in meters, but you may use autofocus option below
		dof.uniforms[ 'focalLength' ].value	= camera.focalLength; //focal length in mm
		dof.uniforms[ 'fstop' ].value = 8.0; //f-stop value
		dof.uniforms[ 'showFocus' ].value = false; //show debug focus point and focal range (orange = focal point, blue = focal range)

		dof.uniforms[ 'manualdof' ].value = false; //manual dof calculation
		dof.uniforms[ 'ndofstart' ].value = 1.0; //near dof blur start
		dof.uniforms[ 'ndofdist' ].value = 2.0; //near dof blur falloff distance	
		dof.uniforms[ 'fdofstart' ].value = 2.0; //far dof blur start
		dof.uniforms[ 'fdofdist' ].value = 3.0; //far dof blur falloff distance	

		dof.uniforms[ 'CoC' ].value = 0.03;//circle of confusion size in mm (35mm film = 0.03mm)	

		dof.uniforms[ 'vignetting' ].value = true; //use optical lens vignetting?
		dof.uniforms[ 'vignout' ].value = 1.3;//vignetting outer border
		dof.uniforms[ 'vignin' ].value = 0.1;//vignetting inner border
		dof.uniforms[ 'vignfade' ].value = 22.0;//f-stops till vignete fades	

		dof.uniforms[ 'autofocus' ].value = false;//use autofocus in shader? disable if you use external focalDepth value
		dof.uniforms[ 'focus' ].value.set(0.5, 0.5);// autofocus point on screen (0.0,0.0 - left lower corner, 1.0,1.0 - upper right) 
		dof.uniforms[ 'maxblur' ].value = 2.0; //clamp value of max blur (0.0 = no blur,1.0 default)	

		dof.uniforms[ 'threshold' ].value = 0.5;//highlight threshold;
		dof.uniforms[ 'gain' ].value = 2.0; //highlight gain;

		dof.uniforms[ 'bias' ].value = 0.5;//bokeh edge bias		
		dof.uniforms[ 'fringe' ].value = 3.7;//bokeh chromatic aberration/fringing

		dof.uniforms[ 'noise' ].value = true; //use noise instead of pattern for sample dithering
		dof.uniforms[ 'namount' ].value	= 0.0001; //dither amount

		dof.uniforms[ 'depthblur' ].value = false;//blur the depth buffer?
		dof.uniforms[ 'dbsize' ].value  = 1.25;//depthblursize

		composer.addPass( dof );
		dof.renderToScreen = true;


		window.onresize = debounce( resizeHandler, 100 );
		//window.onresize = resizeHandler;

		initGUI();

	}

	function initGUI(){

		var gui,
			cameraFolder,
			cameraFocalLength,
			_last;

		gui = new dat.GUI();
		cameraFolder = gui.addFolder('Camera');
		cameraFocalLength = cameraFolder.add(camera, 'focalLength', 28, 200).name('Focal Length');
		cameraFocalLength.onChange(updateCamera);
		cameraFolder.open();

		dofFolder = gui.addFolder('Depth of Field');
		dofFolder.add(dof.uniforms.focalDepth, 'value', 0, 10).name('Focal Depth');
		dofFolder.add(dof.uniforms.fstop, 'value', 0, 22).name('F Stop');
		dofFolder.add(dof.uniforms.maxblur, 'value', 0, 3).name('max blur');

		dofFolder.add(dof.uniforms.showFocus, 'value').name('Show Focal Range');

		dofFolder.add(dof.uniforms.manualdof, 'value').name('Manual DoF');
		dofFolder.add(dof.uniforms.ndofstart, 'value', 0, 200).name('near start');
		dofFolder.add(dof.uniforms.ndofdist, 'value', 0, 200).name('near falloff');
		dofFolder.add(dof.uniforms.fdofstart, 'value', 0, 200).name('far start');
		dofFolder.add(dof.uniforms.fdofdist, 'value', 0, 200).name('far falloff');

		dofFolder.add(dof.uniforms.CoC, 'value', 0, 0.1).step(0.001).name('circle of confusion');

		dofFolder.add(dof.uniforms.vignetting, 'value').name('Vignetting');
		dofFolder.add(dof.uniforms.vignout, 'value', 0, 2).name('outer border');
		dofFolder.add(dof.uniforms.vignin, 'value', 0, 1).step(0.01).name('inner border');
		dofFolder.add(dof.uniforms.vignfade, 'value', 0, 22).name('fade at');

		dofFolder.add(dof.uniforms.autofocus, 'value').name('Autofocus');
		dofFolder.add(dof.uniforms.focus.value, 'x', 0, 1).name('focus x');
		dofFolder.add(dof.uniforms.focus.value, 'y', 0, 1).name('focus y');

		dofFolder.add(dof.uniforms.threshold, 'value', 0, 1).step(0.01).name('threshold');
		dofFolder.add(dof.uniforms.gain, 'value', 0, 100).name('gain');

		dofFolder.add(dof.uniforms.bias, 'value', 0, 4).step(0.01).name('bias');
		dofFolder.add(dof.uniforms.fringe, 'value', 0, 5).step(0.01).name('fringe');

		dofFolder.add(dof.uniforms.noise, 'value').name('Use Noise');
		dofFolder.add(dof.uniforms.namount, 'value', 0, 0.001).step(0.0001).name('dither');

		dofFolder.add(dof.uniforms.depthblur, 'value').name('Blur Depth');
		dofFolder.add(dof.uniforms.dbsize, 'value', 0, 5).name('blur size');

		dofFolder.open();
	}

	function updateCamera(){
		camera.setLens(camera.focalLength, camera.frameSize);
		camera.updateProjectionMatrix();
		dof.uniforms[ 'focalLength' ].value	= camera.focalLength;
	}

	function setup(){

		var ambientLight,
			spotLight,
			pointLight,
			geometry,
			texture,
			material,
			mesh,
			cube,
			i,
			colors,
			_last;

		ambientLight = new THREE.AmbientLight(0x333333);
		scene.add(ambientLight);

		spotLight = new THREE.SpotLight(0xFFFFFF);
		spotLight.position.set(0, 8, 0);

		scene.add(spotLight);

		geometry = new THREE.PlaneGeometry(10, 10, 10);
		texture = new THREE.Texture(preloader.get('testPattern'), null, THREE.RepeatWrapping, THREE.RepeatWrapping);
		texture.repeat.x = 24;
		texture.repeat.y = 24;
		texture.needsUpdate = true;
		material = new THREE.MeshLambertMaterial({map:texture});

		// build box from planes
		cube = new THREE.Object3D();
		for(i = 0; i < 6; i++){
			mesh = new THREE.Mesh( geometry, material);
			switch(i){
				case 0:
					//floor
					mesh.rotation.x = -Math.PI/2;
					break;
				case 1:
					// ceiling
					mesh.rotation.x = Math.PI/2;
					mesh.position.y = 3;
					break;
				case 2:
					// back wall
					mesh.position.z = -5;
					break;
				case 3:
					//front wall
					mesh.rotation.x = Math.PI;
					mesh.position.z = 5;
					break;
				case 4:
					// right wall
					mesh.rotation.y = -Math.PI/2;
					mesh.position.x = 5;
					break;
				case 5:
					// left wall
					mesh.rotation.y = Math.PI/2;
					mesh.position.x = -5;
					break;
			}
			cube.add(mesh);
		}
		scene.add(cube);

		geometry = new THREE.CylinderGeometry(0.1, 0.1, 1);
		texture = new THREE.Texture(preloader.get('testPattern'), null, THREE.RepeatWrapping, THREE.RepeatWrapping);
		texture.repeat.x = 4;
		texture.repeat.y = 6;
		texture.needsUpdate = true;
		material = new THREE.MeshLambertMaterial({map:texture});
		colors = [null, 0xffffff, 0xFF0000, 0xff7700, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff, 0xffffff];
		for(i = 1; i < 10; i++){
			mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(5 - i, 0.5, 5 - i);
			scene.add(mesh);
		}

		geometry = new THREE.SphereGeometry(0.1);

		for(i = 1; i < 10; i++){
			material = new THREE.MeshBasicMaterial({color:colors[i]});
			mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(5 - i, 1.1, 5 - i);
			if(i === 5){
				controls.center.copy(mesh.position);
			}
			scene.add(mesh);
			pointLight = new THREE.PointLight(colors[i], 1, 1.5);
			pointLight.position.copy(mesh.position);
			scene.add(pointLight);
		}

	}


	function update(t){
		controls.update();
	}

	function render(){

		scene.overrideMaterial = depthMaterial;
		renderer.render( scene, camera, depthTarget );

		scene.overrideMaterial = null;

		composer.render();
		//renderer.render(scene, camera);
	}

	function transitionIn(){
		TweenLite.to(renderer.domElement, 2, {opacity:1, delay:0.75, onComplete:function(){
				//transition complete
			}
		});
	}

	function animate(t){
		update(t);
		render();
		window.requestAnimationFrame(animate, renderer.domElement);
	}

	function resizeHandler(){

		var width	= document.body.clientWidth * devicePixelRatio,
			height	= (width * aspectRatio) * devicePixelRatio,
			previousDepthTarget;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderer.setSize( width, height );
		composer.setSize(width, height);

		dof.uniforms[ 'tDepth' ].value = depthTarget;
		dof.uniforms[ 'size' ].value.set( width, height );
		dof.uniforms[ 'textel' ].value.set( 1.0/width, 1.0/height);

	}

	// debounce a callback function with delay being the longest acceptable time before seeing an effect
	// via https://gist.github.com/sansumbrella/4527653
	function debounce (fn, delay) {
		var timeout = null;
		return function () {
			if( timeout !== null ){ clearTimeout( timeout ); }
			timeout = setTimeout( fn, delay );
		};
	}

}());
