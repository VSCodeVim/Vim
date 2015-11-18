var gulp = require('gulp');
var tslint = require('gulp-tslint');
var shell = require('gulp-shell');
var mocha = require('gulp-mocha');

var paths = {
    scripts_ts: "src/**/*.ts",
    tests_js: [
        // test with dependencies on 'vscode' do not run
        "out/test/extension.test.js",
        "out/test/lexer.test.js",
        "out/test/scanner.test.js"
    ]
};

gulp.task('tslint', function() {
    return gulp.src(paths.scripts_ts)
        .pipe(tslint())
        .pipe(tslint.report('prose', {
          summarizeFailureOutput: true
        }));
});

gulp.task('compile', shell.task([
  'node ./node_modules/vscode/bin/compile -p ./',
]));

gulp.task('test', ['compile'], function () {
    return gulp.src(paths.tests_js, {
            read: false
        })
        .pipe(mocha({
            ui: 'tdd',
            reporter: 'spec'
        }));
});

gulp.task('default', ['tslint', 'test']);