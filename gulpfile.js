/*eslint-disable */

/* 
/**
 * 84.Boilerplate
 * ==============
 *
 * This is a default configuration for your projects.
 *
 *
 * It use :
 * ========
 * - Browserify for your javascripts files
 * - Sass & Autoprefixr for your stylesheets
 * - YML for your datas, you can use json if you prefer
 * - Simple copy of fonts, images, videos, sounds
 *
 *
 * In this configuration, images, videos & sounds are
 * not watched by gulp to prevent bash memory errors
 * with gulp instance in case of too much files.
 *
 *
 * Use gulp --env=production to minify scripts/css/datas
 *
 */

'use strict';

var gulp         = require('gulp');
var fs           = require('fs');
var del          = require('del');
var watchify     = require('watchify');
var browserify   = require('browserify');
var shimify      = require('browserify-shim');
var babelify     = require('babelify');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var gutil        = require('gulp-util');
var sourcemaps   = require('gulp-sourcemaps');
var gulpif       = require('gulp-if');
var sass         = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS     = require('gulp-clean-css');
var uglify       = require('gulp-uglify');
var notify       = require('gulp-notify');
var yaml         = require('gulp-yaml');
var jsonminify   = require('gulp-jsonminify');
var stripDebug   = require('gulp-strip-debug');
var browserSync  = require('browser-sync').create();
var eslint       = require('gulp-eslint');
var plumber      = require('gulp-plumber');


// Create a configuration with the specific paths
// .root is the only property to be an array, it refers all
// your root files you need to copy (.html, .htaccess, etc)
const copyRoot = [ './dev/index.html' ];


// Utils methods
var isDirectoryEmpty = function(directory) {
	var files = fs.readdirSync(directory);
	if (files.indexOf('.gitkeep') > -1) { files.splice(files.indexOf('.gitkeep'), 1); }
	return files.length === 0;
};

// If the env is equal to production, we will minify
var minify = gutil.env.env === 'production' ? true : false;

//---------------------------------------------------------------------------------------------
//    CLEAN
//---------------------------------------------------------------------------------------------

gulp.task('clean', function(){
	return del.sync([
		'/dist/**',
		'!/dist',
		'!/dist/images',
		'!/dist/videos',
		'!/dist/sounds',
		'!/dist/fonts'
	], { force: true });
});

//---------------------------------------------------------------------------------------------
//    BROWSERIFY
//---------------------------------------------------------------------------------------------

gulp.task('lint', () => {
	return gulp.src([ './dev/javascripts/**/*.js', '!./dev/javascripts/vendors/*.js' ])
		.pipe(eslint('./.eslintrc'))
		.pipe(eslint.format())
		.on('error', notify.onError({'title': 'Linter error'}))
});

function compile(watch) {
	var bsfy = browserify('./dev/javascripts/app.js', {
		debug: true,
		cache: {},
		packageCache: {}
	});

	var bundler = watch === true ? watchify(bsfy) : bsfy;

	bundler.transform(babelify.configure({ presets: [ 'es2015' ] }));
	bundler.transform(shimify);
	// b.transform('es3ify'); // IE8 Support for babelify


	function rebundle() {
		gulp.start('lint');

		return bundler.bundle()
		.on('error', notify.onError({
			'title': "Error when building Browserify",
			'subtitle': "<%= error.fileName %>",
			'message': "<%= error.message %>"
		}))
		.pipe(source('app.js'))
		// Optional, remove if you don't need to buffer file contents
		.pipe(buffer())
		// Initialize sourcemaps
		.pipe(gulpif(!minify, sourcemaps.init({ loadMaps: true }))) // loads map from browserify file
		// Remove console & debuggers
		.pipe(gulpif(minify, stripDebug()))
		// Uglify if necessary
		.pipe(gulpif(minify, uglify()))
		// Write .map file
		.pipe(gulpif(!minify, sourcemaps.write('.')))
		// Write output file
		.pipe(gulp.dest('./dist/javascripts/'));
	}

	if (watch) {
		bundler.on('update', function() {
			console.log('-> bundling...');
			rebundle();
		});
	}

	return rebundle();
}

function watch() {
  return compile(true);
};

gulp.task('javascripts:build', function() { return compile(); });
gulp.task('javascripts:watch', function() { return watch(); });
gulp.task('javascripts', [ 'lint', minify === true ? 'javascripts:build' : 'javascripts:watch' ]);


//---------------------------------------------------------------------------------------------
//    SASS
//---------------------------------------------------------------------------------------------

var sassNotify = function(error) {
	notify.onError({
		'title': "Error when building Stylesheets",
		'subtitle': "<%= error.fileName %>",
		'message': "<%= error.message %>"
	})(error);

	this.emit('end');
};

gulp.task('stylesheets', function() {
	return gulp.src('./dev/stylesheets/**/*.scss')
		// Concat all errors
		.pipe(plumber({ errorHandler: sassNotify }))
		// Sourcemaps on CSS
		.pipe(sourcemaps.init())
		// Sass
		.pipe(sass({ precision: 10 }))
		// Autoprefixr
		.pipe(autoprefixer({
			browsers: [ '> 1%', 'last 4 versions' ],
			cascade: false
		}))
		// Minify CSS in production mode
		// Compatibility can be ie7, ie8,
		// see https://github.com/jakubpawlowicz/clean-css#how-to-set-a-compatibility-mode
		.pipe(gulpif(minify, cleanCSS({ compatibility: '*' })))
		// Apply Sourcemaps
		.pipe(sourcemaps.write('.'))
		// Copy stream
		.pipe(gulp.dest('./dist/stylesheets/'))
});


//---------------------------------------------------------------------------------------------
//    DATAS
//---------------------------------------------------------------------------------------------

var datasNotify = function(error) {
	notify.onError({
		'title': "Error when building Datas",
		'subtitle': "<%= error.fileName %>",
		'message': "<%= error.message %>"
	})(error);

	this.emit('end');
};

gulp.task('datas', function() {
	if (isDirectoryEmpty('./dev/datas')) { return gulp; }

	return gulp.src('./dev/datas/**')
		// Concat all errors
		.pipe(plumber({ errorHandler: datasNotify }))
		// Check if we need to convert yaml to json
		.pipe(yaml())
		// Minify JSON for production
		.pipe(gulpif( minify, jsonminify() ))
		// Copy stream
		.pipe(gulp.dest('./dist/datas'))
});


//---------------------------------------------------------------------------------------------
//    COPY
//---------------------------------------------------------------------------------------------

var copyNotify = function(error) {
	notify.onError({
		'title': "Error when building Datas",
		'subtitle': "<%= error.fileName %>",
		'message': "<%= error.message %>"
	})(error);

	this.emit('end');
};

// HTML FILE
gulp.task('copy:root', function() {
	return gulp.src(copyRoot)
		// Concat all errors
		.pipe(plumber({ errorHandler: copyNotify }))
		.pipe(gulp.dest('./dist'))
});


// sound files
gulp.task('copy:sound', function() {
	return gulp.src('./dev/sounds/**')
		// Concat all errors
		.pipe(plumber({ errorHandler: copyNotify }))
		.pipe(gulp.dest('./dist/sounds'))
});

// Registering main copy task
gulp.task('copy', ['copy:root']);

// Registering main copy task
gulp.task('copy', ['copy:sound']);


//---------------------------------------------------------------------------------------------
//    GULP TASKS
//---------------------------------------------------------------------------------------------

gulp.task('watch', function() {
	gulp.watch('./dev/stylesheets/**', ['stylesheets']);
	gulp.watch('./dev/datas/**', ['datas']);
	gulp.watch(copyRoot, ['copy:root']);
	gulp.watch('./dev/sounds/**', ['copy:sound']);

	browserSync.watch([
		'./dist/datas/**',
		'./dist/stylesheets/**',
		'./dist/javascripts/**',
		copyRoot
	], {
		ignored: '**/*.map'
	}).on('change', browserSync.reload);
});

gulp.task('default', ['clean'], function() {
	gulp.start('stylesheets');
	gulp.start('javascripts');
	gulp.start('datas');
	gulp.start('copy');

	if (minify === false) {
		browserSync.init({
			port: 1234,
			ui: false,
			// This is if you need PHP execution on your BrowserSync server
			// proxy: 'myproxy.dev',
			server: {
				baseDir: "./dist"
				// This is used if you need to redirect your BrowserSync server on another file
				// middleware: [ historyApiFallback({ index: '/myfile.html' }) ]
			},
			ghostMode: {
				clicks: false,
				forms: false,
				scroll: false
			}
		});

		gulp.start('watch');
	}
});
