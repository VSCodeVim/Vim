var gulp = require('gulp'),
    bump = require('gulp-bump'),
    git = require('gulp-git'),
    inject = require('gulp-inject-string'),
    merge = require('merge-stream'),
    tag_version = require('gulp-tag-version'),
    trimlines = require('gulp-trimlines'),
    tslint = require('gulp-tslint'),
    typings = require('gulp-typings'),
    shell = require('gulp-shell'),
    soften = require('gulp-soften');

var paths = {
  src_ts: "src/**/*.ts",
  tests_ts: "test/**/*.ts"
};

function versionBump(semver) {
  return gulp.src(['./package.json'])
    .pipe(bump({type: semver}))
    .pipe(gulp.dest('./'))
    .pipe(git.commit('bump package version'))
    .pipe(tag_version());
}

gulp.task('typings', function () {
  return gulp.src('./typings.json')
    .pipe(typings());
});

gulp.task('typings-vscode-definitions', ['typings'], function() {
  // add vscode definitions
  var vscodeTypings = '/// <reference path="vscode/index.d.ts" />\n';
  var vscodeNodeTypings = '/// <reference path="vscode/node.d.ts" />\n';
  return gulp.src('./typings/index.d.ts')
    .pipe(inject.replace(vscodeTypings, ''))
    .pipe(inject.replace(vscodeNodeTypings, ''))
    .pipe(inject.prepend(vscodeTypings))
    .pipe(inject.prepend(vscodeNodeTypings))
    .pipe(gulp.dest('./typings'));
})

gulp.task('fix-whitespace', function() {
  // 1. change tabs to spaces
  // 2. trim trailing whitespace
  return gulp.src([paths.src_ts, paths.tests_ts], { base: "./" })
    .pipe(soften(2))
    .pipe(trimlines({
      leading: false
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('tslint', ['fix-whitespace'], function() {
  var tslintOptions = {
    summarizeFailureOutput: true
  };

  var srcs = gulp.src(paths.src_ts)
    .pipe(tslint({ formatter: 'verbose' }))
    .pipe(tslint.report(tslintOptions));
  var tests = gulp.src(paths.tests_ts)
    .pipe(tslint({ formatter: 'verbose' }))
    .pipe(tslint.report(tslintOptions));
  return merge(srcs, tests);
});

gulp.task('default', ['tslint', 'compile']);
gulp.task('nothing', []);

gulp.task('compile', shell.task(['npm run vscode:prepublish']));
gulp.task('watch', shell.task(['npm run compile']));
gulp.task('init', ['typings', 'typings-vscode-definitions']);

gulp.task('patch', ['default'], function() { return versionBump('patch'); })
gulp.task('minor', ['default'], function() { return versionBump('minor'); })
gulp.task('major', ['default'], function() { return versionBump('major'); })
