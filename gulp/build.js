'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('injector:css', ['wiredep'], function () {
  return gulp.src('src/index.html')
    .pipe($.inject(gulp.src([
        'src/{app,components}/**/*.css'
      ], {read: false}), {
      ignorePath: 'src',
      addRootSlash: false
    }))
    .pipe(gulp.dest('src/'));
});

gulp.task('jshint', function () {
  return gulp.src('src/{app,components}/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('injector:js', ['jshint', 'injector:css'], function () {
  return gulp.src('src/index.html')
    .pipe($.inject(gulp.src([
        'src/{app,components}/**/*.js',
        '!src/{app,components}/**/*.spec.js',
        '!src/{app,components}/**/*.mock.js'
      ]).pipe($.angularFilesort()), {
      ignorePath: 'src',
      addRootSlash: false
    }))
    .pipe(gulp.dest('src/'));
});

gulp.task('clean', function (done) {
  $.del(['dist/', '.tmp/'], done);
});
