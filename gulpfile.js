var gulp = require('gulp');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');
var mocha  = require('gulp-mocha');
var watch = require('gulp-watch');
var del = require('del');
var shell = require('gulp-shell');

var paths = {
    engine_scripts_dir: ["./server/*"],
    engine_scripts: ["./server/entry.js"],
    client_scripts: ["./client/*"],
    console_scripts:["./user-console/*"]
    
  // scripts: ['client/js/**/*.coffee', '!client/external/**/*.coffee'],
  
  // images: 'client/img/**/*'
};

// Not all tasks need to use streams
// A gulpfile is just another node program and you can use all packages available on npm
gulp.task('clean', function(cb) {
  // You can use multiple globbing patterns as you would with `gulp.src`
  del(['build'], cb);
});

gulp.task('test', function(){
    return gulp.src("./test/*")
    .pipe(mocha({reporter:"nyan"}));
})

gulp.task('engine_scripts', [], function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src(paths.engine_scripts)
  //.pipe(watch())
  
    //.pipe(sourcemaps.init())
      //.pipe(coffee())
      .pipe(browserify({
          insertGlobals:true,
          debug:true,
          ignore:["./three.min.node.js", "./three.node.js"]
      }))
      // .pipe(uglify())
      //.pipe(concat('engine.min.js'))
      .pipe(rename('engine.min.js'))
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest('public/js/gl/'));
});

gulp.task('client_scripts', [], function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src(paths.client_scripts)
  //.pipe(watch())
  
  .pipe(sourcemaps.init())
    //.pipe(coffee())
    .pipe(uglify())
    .pipe(concat('client.min.js'))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('public/js/gl/'));
});

gulp.task('console_scripts', [], function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src(paths.console_scripts)
  // .pipe(watch())
  .pipe(sourcemaps.init())
    //.pipe(coffee())
    // .pipe(uglify())
    .pipe(concat('user-console.min.js'))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('public/js/'));
});


// Copy all static images
/*
gulp.task('images', ['clean'], function() {
  return gulp.src(paths.images)
    // Pass in options to the task
    .pipe(imagemin({optimizationLevel: 5}))
    .pipe(gulp.dest('build/img'));
});
*/
// Rerun the task when a file changes

gulp.task('watch', function() {
  gulp.watch(paths.engine_scripts_dir, ['engine_scripts', "client_scripts"]);
  
  gulp.watch(paths.client_scripts, ['client_scripts']);
  
  gulp.watch(paths.console_scripts, ['console_scripts']);
  

});

gulp.task('build', ['engine_scripts','client_scripts', 'console_scripts'])
// The default task (called when you run `gulp` from cli)
// gulp.task('default', ['watch', 'scripts', 'images']);

gulp.task('default', function(){
    gulp.src('.').pipe(shell(['gulp build', 'gulp watch']));
});
