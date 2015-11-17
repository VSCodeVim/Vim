var gulp = require('gulp');
var tslint = require('gulp-tslint');

var paths = {
    scripts_ts: "src/**/*.ts",
};

gulp.task('tslint', function() {
    return gulp.src(paths.scripts_ts)
        .pipe(tslint())
        .pipe(tslint.report('prose', {
          summarizeFailureOutput: true
        }));
});

gulp.task('default', ['tslint']);