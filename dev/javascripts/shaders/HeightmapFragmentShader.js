// This is the water visualization shader, copied from the MeshPhongMaterial and modified:

class HeightmapFragmentShader {

	constructor() {

		this.fragmentShader = [
			'#include <common>',

			'uniform vec2 mousePos;',
			'uniform vec2 debug;',
			'uniform float mouseSize;',
			'uniform float viscosityConstant;',

			'#define deltaTime ( 1.0 / 60.0 )',
			'#define GRAVITY_CONSTANT ( resolution.x * deltaTime * 3.0 )',

			'void main()	{',

				'vec2 cellSize = 1.0 / resolution.xy;',

				'vec2 uv = gl_FragCoord.xy * cellSize;',

				// heightmapValue.x == height
				// heightmapValue.y == velocity
				// heightmapValue.z, heightmapValue.w not used
				'vec4 heightmapValue = texture2D( heightmap, uv );',

				// Get neighbours
				'vec4 north = texture2D( heightmap, uv + vec2( 0.0, cellSize.y ) );',
				'vec4 south = texture2D( heightmap, uv + vec2( 0.0, - cellSize.y ) );',
				'vec4 east = texture2D( heightmap, uv + vec2( cellSize.x, 0.0 ) );',
				'vec4 west = texture2D( heightmap, uv + vec2( - cellSize.x, 0.0 ) );',

				'float sump = north.x + south.x + east.x + west.x - 4.0 * heightmapValue.x;',

				'float accel = sump * GRAVITY_CONSTANT;',

				// Dynamics
				'heightmapValue.y += accel;', // ça monte lentement si += accel. Il faut réussir à clamp cette valeur
				// 'heightmapValue.y = clamp(heightmapValue.y,0.0,3.0);',
				'heightmapValue.x += heightmapValue.y * deltaTime;',

				// Viscosity
				'heightmapValue.x += sump * viscosityConstant;',
				// Mouse influence,
				'float mousePhase = clamp( length( ( uv - vec2( 0.5 ) ) * BOUNDS - vec2( mousePos.x, - mousePos.y ) ) * PI / mouseSize, 0.0, PI );',
				'heightmapValue.x += cos( mousePhase ) + 1.0;',
				// 'heightmapValue.x = -10.0;',

				// 'heightmapValue.x = clamp(heightmapValue.x,-10.0,1.0);', // clamp wave height and depth
				// 'heightmapValue.x = 5.0;',

				// Problem : Waves go up
				// if x and y = constant. Problem is resolved, but no waves
				// If y constant, it's constant but no wave cause x is based on y
				// If x constant, and y move, it's constant, but no waves.
				// If y = accel, it's constant but weird waves Or its going up but very slowly

				// Plus heightmapValue.x est fort, plus son heightmapValue.y est haut, pareil négatif

				'gl_FragColor = heightmapValue;',

			'}'

		].join('\n');
	}

}

export default new HeightmapFragmentShader();
