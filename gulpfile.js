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
};

gulp.task('clean', function(cb) {
  del(['build'], cb);
});

gulp.task('test', function(){
    return gulp.src("./test/*")
    .pipe(mocha({reporter:"nyan"}));
})

gulp.task('engine_scripts', function() {
  return gulp.src(paths.engine_scripts)
      .pipe(browserify({
          insertGlobals:true,
          debug:true,
          ignore:["./three.min.node.js", "./three.node.js"]
      }))
      .pipe(rename('engine.min.js'))
    .pipe(gulp.dest('public/js/gl/'));
});

gulp.task('client_scripts',  function() {
  return gulp.src(paths.client_scripts)

  .pipe(sourcemaps.init())
    //.pipe(uglify())
    .pipe(concat('client.min.js'))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('public/js/gl/'));
});

gulp.task('console_scripts', function() {
  return gulp.src(paths.console_scripts)
  .pipe(sourcemaps.init())
    .pipe(concat('user-console.min.js'))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('public/js/'));
});


gulp.task('watch', function() {
  gulp.watch(paths.engine_scripts_dir, ['engine_scripts', "client_scripts"]);
  
  gulp.watch(paths.client_scripts, ['client_scripts']);
  
  gulp.watch(paths.console_scripts, ['console_scripts']);
  

});

gulp.task('build', gulp.series(['engine_scripts','client_scripts', 'console_scripts', function(cb){
    cb();
}]))
// The default task (called when you run `gulp` from cli)
// gulp.task('default', ['watch', 'scripts', 'images']);

gulp.task('default', function(){
    gulp.src('.').pipe(shell(['gulp build', 'gulp watch']));
});
