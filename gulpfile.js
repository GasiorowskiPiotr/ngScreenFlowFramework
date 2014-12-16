'use strict';

var gulp = require('gulp');

require('require-dir')('./gulpfiles');

gulp.task('default', ['clean'], function () {
    gulp.start('dist');
});
