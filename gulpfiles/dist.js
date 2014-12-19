'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('dist:min', ['clean'], function() {
  return gulp
    .src('src/sff/**/*.js')
    .pipe($.ngAnnotate())
    .pipe($.uglify({preserveComments: $.uglifySaveLicense}))
    .pipe($.concat('ngScreenFlowFramework.min.js'))
    .pipe(gulp.dest('dist/'))
    .pipe($.size({ title: 'dist/', showFiles: true }));

});

gulp.task('dist:src', function() {
  return gulp
    .src('src/sff/**/*.js')
    .pipe($.ngAnnotate())
    .pipe($.concat('ngScreenFlowFramework.js'))
    .pipe(gulp.dest('dist/'))
    .pipe($.size({ title: 'dist/', showFiles: true }));
});

gulp.task('dist', ['clean', 'dist:src', 'dist:min']);
