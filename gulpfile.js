var gulp = require('gulp'),
    tslint = require('gulp-tslint'),
    tsd = require('gulp-tsd'),
    shell = require('gulp-shell'),
    mocha = require('gulp-mocha'),
    soften = require('gulp-soften'),
    trimlines = require('gulp-trimlines');

var paths = {
    scripts_ts: "src/**/*.ts",
    tests_ts: "test/**/*.ts"
};

gulp.task('tsd', function (callback) {
    return gulp.src('./gulp_tsd.json').pipe(tsd({
        command: 'reinstall',
        config: './tsd.json'
    }, callback));
});

gulp.task('fix-whitespace', function() {
    return gulp.src([paths.scripts_ts, paths.tests_ts], { base: "./" })
        .pipe(soften(4))
        .pipe(trimlines({
            leading: false
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('compile', ['fix-whitespace'], shell.task([
  'node ./node_modules/vscode/bin/compile -p ./',
]));

gulp.task('tslint', ['fix-whitespace'], function() {
    return gulp.src([paths.scripts_ts, paths.tests_ts])
        .pipe(tslint())
        .pipe(tslint.report('prose', {
          summarizeFailureOutput: true
        }));
});

gulp.task('init', ['tsd']);
gulp.task('default', ['fix-whitespace', 'tslint']);
