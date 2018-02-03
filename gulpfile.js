var gulp = require('gulp'),
  bump = require('gulp-bump'),
  filter = require('gulp-filter'),
  git = require('gulp-git'),
  tag_version = require('gulp-tag-version'),
  tslint = require('gulp-tslint'),
  ts = require('gulp-typescript');

// compile
gulp.task('compile', function(){
  var tsProject = ts.createProject('./tsconfig.json');
  return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest('out'));
});

// tslint
gulp.task('tslint', function() {
  return gulp
    .src([
      '**/*.ts',
      '!node_modules/**',
      '!typings/**',
    ])
    .pipe(tslint({ formatter: 'verbose' }))
    .pipe(tslint.report({ summarizeFailureOutput: true }));
});

// prettier
function runPrettier(command) {
  let exec = require('child_process').exec;
  exec(command, function(err, stdout, stderr) {
    const files = stdout.split('\n');
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        exec(
          `node ./node_modules/prettier/bin/prettier.js --write --print-width 100 --single-quote --trailing-comma es5 ${file}`
        );
      }
    }
  });
}

gulp.task('prettier', function() {
  runPrettier('git diff --name-only HEAD');
});

gulp.task('forceprettier', function() {
  // files managed by git
  runPrettier('git ls-files');
  // untracked files
  runPrettier('git ls-files --others --exclude-standard');
});


// test
gulp.task('test', function(cb) {
  let spawn = require('child_process').spawn;

  const dockerTag = 'vscodevim'

  console.log("Building container...")
  let dockerBuildCmd = spawn('docker', ['build', '-f', './build/Dockerfile', '.', '-t', dockerTag], {
    cwd : process.cwd(),
    stdio: 'inherit',
  });

  dockerBuildCmd.on('exit', function (code) {
    if (code !== 0) {
      cb(code);
      return;
    }

    console.log("Running tests inside container...")
    let dockerRunCmd = spawn('docker', ['run', '-v', '$PWD:/app', dockerTag], {
      cwd : process.cwd(),
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });

    dockerRunCmd.on('exit', function (code) {
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