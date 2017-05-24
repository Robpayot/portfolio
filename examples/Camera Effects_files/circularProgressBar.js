circularProgressBar = (function(){
	
	var canvas		= document.createElement('canvas'),
		ctx			= canvas.getContext('2d'),
		halfPI		= 1.5707963267948966,
		twoPI		= 6.283185307179586,
		radius		= 15,
		lineWidth	= 10,
		position	= radius + lineWidth,
		size		= position * 2,
		startAngle	= halfPI,

		setProgress = function(per){

			var endAngle = startAngle+(twoPI*per);
			
			ctx.clearRect ( 0 , 0, size, size );
			ctx.beginPath();
			ctx.arc(position,position,radius,startAngle,endAngle);
			ctx.strokeStyle = '#666';
			ctx.lineWidth = lineWidth;
			ctx.stroke();
		},

		hide = function(){
			canvas.setAttribute('style','display:none');
		},

		transitionOut = function(){

			TweenLite.to(canvas, 1, {opacity:0, onComplete:hide});

		},

		_end;

	
	canvas.setAttribute('width', size);
	canvas.setAttribute('height', size);
	canvas.setAttribute('style','margin-left: -'+position+'px; margin-top:-'+position+'px; position: fixed; top:50%; left:50%; z-index:10');
	document.body.appendChild(canvas);

	return {
		setProgress: setProgress,
		hide: hide,
		transitionOut: transitionOut
	};

}());