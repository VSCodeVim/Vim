var gulp = require('gulp'),
  bump = require('gulp-bump'),
  filter = require('gulp-filter'),
  git = require('gulp-git'),
  sourcemaps = require('gulp-sourcemaps'),
  tag_version = require('gulp-tag-version'),
  tslint = require('gulp-tslint'),
  ts = require('gulp-typescript');

// compile
gulp.task('compile', function() {
  var tsProject = ts.createProject('tsconfig.json');
  return tsProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .js.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '' }))
    .pipe(gulp.dest('out'));
});

// tslint
gulp.task('tslint', function() {
  return gulp
    .src(['**/*.ts', '!node_modules/**', '!typings/**'])
    .pipe(tslint({ formatter: 'prose' }))
    .pipe(tslint.report({ summarizeFailureOutput: true }));
});

// prettier
function runPrettier(command, cb) {
  var exec = require('child_process').exec;
  exec(command, function(err, stdout, stderr) {
    if (err) {
      return cb(err);
    }

    if (!stdout) {
      return cb();
    }

    var files = stdout
      .split('\n')
      .filter(f => {
        return f.endsWith('.ts') || f.endsWith('.js');
      })
      .join(' ');

    exec(
      `node ./node_modules/.bin/prettier --write --print-width 100 --single-quote --trailing-comma es5 ${files}`,
      function(err, stdout, stderr) {
        cb(err);
      }
    );
  });
}

gulp.task('prettier', function(cb) {
  // files changed
  runPrettier('git diff --name-only HEAD', cb);
});

gulp.task('forceprettier', function(cb) {
  // files managed by git
  runPrettier('git ls-files', cb);
});

// test
gulp.task('test', function(cb) {
  var spawn = require('child_process').spawn;
  const dockerTag = 'vscodevim';

  console.log('Building container...');
  var dockerBuildCmd = spawn(
    'docker',
    ['build', '-f', './build/Dockerfile', '.', '-t', dockerTag],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
    }
  );

  dockerBuildCmd.on('exit', function(code) {
    if (code !== 0) {
      cb(code);
      return;
    }

    console.log('Running tests inside container...');
    console.log('To break, run `docker kill` in a separate terminal.');
    var dockerRunCmd = spawn('docker', ['run', '-v', process.cwd() + ':/app', dockerTag], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    dockerRunCmd.on('exit', function(code) {
      cb(code);
    });
  });
});

// version bump
function versionBump(semver) {
  return gulp
    .src(['./package.json', './package-lock.json'])
    .pipe(bump({ type: semver }))
    .pipe(gulp.dest('./'))
    .pipe(git.commit('bump version'))
    .pipe(filter('package.json'))
    .pipe(tag_version());
}

gulp.task('patch', ['default'], function() {
  return versionBump('patch');
});

gulp.task('minor', ['default'], function() {
  return versionBump('minor');
});

gulp.task('major', ['default'], function() {
  return versionBump('major');
});

gulp.task('default', ['prettier', 'tslint', 'compile']);
