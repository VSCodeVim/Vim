var gulp = require('gulp'),
    bump = require('gulp-bump'),
    git = require('gulp-git'),
    inject = require('gulp-inject-string'),
    merge = require('merge-stream'),
    tag_version = require('gulp-tag-version'),
    tslint = require('gulp-tslint'),
    typings = require('gulp-typings'),
    shell = require('gulp-shell');

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
  return gulp.src('./typings/index.d.ts').pipe(gulp.dest('./typings'));
})

gulp.task('tslint', function() {
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

gulp.task('compile', shell.task(['npm run vscode:prepublish']));
gulp.task('watch', shell.task(['npm run compile']));
gulp.task('init', ['typings', 'typings-vscode-definitions']);

gulp.task('patch', ['default'], function() { return versionBump('patch'); })
gulp.task('minor', ['default'], function() { return versionBump('minor'); })
gulp.task('major', ['default'], function() { return versionBump('major'); })
