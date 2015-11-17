var gulp = require('gulp');

var tslint = require('gulp-tslint');



var paths = {
    scripts_ts: "src/**/*.ts",
};

gulp.task('tslint', function() {
    gulp.src(paths.scripts_ts)
        .pipe(tslint())
        .pipe(tslint.report('verbose'));
});

gulp.task('default', ['tslint']);