var gulp = require('gulp'),
    tslint = require('gulp-tslint'),
    typings = require('gulp-typings'),
    shell = require('gulp-shell'),
    soften = require('gulp-soften'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    filter = require('gulp-filter'),
    tag_version = require('gulp-tag-version'),
    inject = require('gulp-inject-string'),
    trimlines = require('gulp-trimlines'),
    merge = require('merge-stream');

var paths = {
    src_ts: "src/**/*.ts",
    tests_ts: "test/**/*.ts"
};

function versionBump(importance) {
    return gulp.src(['./package.json'])
        .pipe(bump({type: importance}))
        .pipe(gulp.dest('./'))
        .pipe(git.commit('bump package version'))
        .pipe(filter('package.json'))
        .pipe(tag_version());
}

gulp.task('patch', function() { return versionBump('patch'); })
gulp.task('minor', function() { return versionBump('minor'); })
gulp.task('major', function() { return versionBump('major'); })

gulp.task('typings', function () {
    return gulp.src('./typings.json')
        .pipe(typings());
});

gulp.task('typings-vscode-definitions', ['typings'], function() {
    // add vscode definitions
    var vscodeTypings = '/// <reference path="../node_modules/vscode/typings/index.d.ts" />\n';
    var vscodeNodeTypings = '/// <reference path="../node_modules/vscode/typings/node.d.ts" />\n';
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
        .pipe(tslint())
        .pipe(tslint.report('prose', tslintOptions));
    var tests = gulp.src(paths.tests_ts)
        .pipe(tslint({
            configuration: 'test/tslint.json'
        }))
        .pipe(tslint.report('prose', tslintOptions));
    return merge(srcs, tests);
});

gulp.task('compile', shell.task(['npm run vscode:prepublish']));
gulp.task('watch', shell.task(['npm run compile']));
gulp.task('init', ['typings']);
gulp.task('default', ['tslint', 'compile']);
gulp.task('release', ['default', 'patch']);
