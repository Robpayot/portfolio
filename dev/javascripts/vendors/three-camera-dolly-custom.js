/**
 * @author DPR / http://ivxvixviii.io
 */

import * as THREE from 'three';

const CameraDolly = function ( camera, scene, points, gui, debug ){

	this.cameraPosition = 0;
	this.lookatPosition = 0;

	this.camera 	  = camera;
	this.scene 		  = scene;
	this.cameraPoints = points.camera;
	this.lookatPoints = points.lookat;
	this.bounds 	  = 400;
	this.gui 		  = gui;
	this.debug		  = debug;

	this.createCurves = this.createCurves.bind(this);

	// Lookat position Marker

	this.lookatPositionMarker = this.createMarker(0xFF0000);

	this.scene.add(this.lookatPositionMarker);

	// Camera path markers
	this.markers = [];

	if (this.gui) {

		this.gui.addGroup({
			label: 'cameraPointsFolder',
			enable: false
		});
	}

	var _this = this;

	for( var i = 0; i < this.cameraPoints.length; ++i){

		if(this.gui){
			var point = this.cameraPoints[i];
			point.range = [-this.bounds, this.bounds];

			this.gui.addSubGroup({
				label: 'marker-' + i
			});
			this.gui.addSlider(point, 'x', 'range', {
				onChange: _this.createCurves
			});
			this.gui.addSlider(point, 'y', 'range', {
				onChange: _this.createCurves
			});
			this.gui.addSlider(point, 'z', 'range', {
				onChange: _this.createCurves
			});
		}

		var marker = this.createMarker(0x00FF00);

		this.scene.add( marker );
		this.markers.push( marker );
	};

	// Camera lookat path markers
	this.lookatMarkers = [];

	if(this.gui){

		this.gui.addGroup({
			label: 'lookatPointsFolder',
			enable: false
		});
	}

	for( var i = 0; i < this.lookatPoints.length; ++i){

		if(this.gui){
			var point = this.lookatPoints[i];
			point.range = [-this.bounds, this.bounds];

			this.gui.addSubGroup({
				label: 'marker-' + i
			});
			this.gui.addSlider(point, 'x', 'range', {
				onChange: _this.createCurves
			});
			this.gui.addSlider(point, 'y', 'range', {
				onChange: _this.createCurves
			});
			this.gui.addSlider(point, 'z', 'range', {
				onChange: _this.createCurves
			});
		}

		var marker = this.createMarker(0x0000FF);

		this.scene.add( marker );
		this.lookatMarkers.push( marker );
	};

	this.createCurves();
	this.update();
};

CameraDolly.prototype.createCurves = function(){

	// Camera curve

	this.scene.remove(this.pathCurve);

	var points = [];

	for (var i = 0; i < this.cameraPoints.length ; ++i) {
		var point = this.cameraPoints[i];
		var vec   = new THREE.Vector3( point.x, point.y, point.z );
		this.markers[i].position.set( point.x, point.y, point.z );
		points.push(vec);
	};

	var spline = this.createSpline( points );
	var points = spline.getPoints( 50 );

	this.cameraSpline = this.createSpline(points);

	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial({
		color: this.debug === true ? 0xFF0000 : ''
	});
	material.visible = this.debug;



	points.forEach(function(point){
		geometry.vertices.push( point.clone() );
	});

	this.pathCurve = new THREE.Line( geometry, material );

	this.scene.add( this.pathCurve );


	// Lookat curve

	this.scene.remove(this.pathLookatCurve);

	var points = [];

	for (var i = 0; i < this.lookatPoints.length ; ++i) {
		var point = this.lookatPoints[i];
		var vec   = new THREE.Vector3( point.x, point.y, point.z );
		this.lookatMarkers[i].position.set( point.x, point.y, point.z );
		points.push(vec);
	};

	var spline = this.createSpline( points );
	var points = spline.getPoints( 50 );

	this.cameralookatSpline = this.createSpline(points);

	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial({
		color: this.debug === true ? 0x00FF00 : ''
	});
	material.visible = this.debug;

	points.forEach(function(point){
		geometry.vertices.push( point.clone() );
	});

	this.pathLookatCurve = new THREE.Line( geometry, material );

	this.scene.add( this.pathLookatCurve );

	this.update();
};


CameraDolly.prototype.createSpline = function( points ) {

	var tmp = [];

	for( var i = 0; i < points.length; ++i){
		tmp.push( points[i].clone() );
	};

	return new THREE.CatmullRomCurve3( tmp );
}

CameraDolly.prototype.createMarker = function(color){
	var geometry = new THREE.SphereGeometry( 1, 4, 4 );
	var material = new THREE.MeshBasicMaterial({color: color});
	var mesh = new THREE.Mesh(geometry, material);

	mesh.visible = this.debug;

	return mesh;
};

CameraDolly.prototype.update = function(){

	var position = this.cameraSpline.getPointAt( this.cameraPosition );

	this.camera.position.copy( position );

	position = this.cameralookatSpline.getPointAt( this.lookatPosition );

	this.lookatPositionMarker.position.copy( position );

	this.camera.lookAt( this.lookatPositionMarker.position );
};

CameraDolly.prototype.exportPositions = function(){

	var data = {
		camera: [],
		lookat: []
	};

	this.cameraPoints.forEach(function(point){
		data.camera.push({
			x: point.x,
			y: point.y,
			z: point.z
		})
	});

	this.lookatPoints.forEach(function(point){
		data.lookat.push({
			x: point.x,
			y: point.y,
			z: point.z
		})
	});

	var json = JSON.stringify( data, undefined, 4 );

	window.prompt('Copy to clipboard: Ctrl+C, Enter', json );
};

export { CameraDolly };
