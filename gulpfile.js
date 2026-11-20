const gulp = require('gulp');
const bump = require('gulp-bump');
const tag_version = require('gulp-tag-version');
const PluginError = require('plugin-error');
const minimist = require('minimist');
const shell = require('gulp-shell');

const releaseOptions = {
  semver: '',
};

function validateArgs(done) {
  const options = minimist(process.argv.slice(2), releaseOptions);
  if (!options.semver) {
    return done(
      new PluginError('updateVersion', {
        message: 'Missing `--semver` option. Possible values: patch, minor, major',
      }),
    );
  }
  if (!['patch', 'minor', 'major'].includes(options.semver)) {
    return done(
      new PluginError('updateVersion', {
        message: 'Invalid `--semver` option. Possible values: patch, minor, major',
      }),
    );
  }

  done();
}

function createGitTag() {
  return gulp.src(['./package.json']).pipe(tag_version());
}

function updateVersion(done) {
  var options = minimist(process.argv.slice(2), releaseOptions);

  return gulp
    .src(['./package.json'])
    .pipe(bump({ type: options.semver }))
    .pipe(gulp.dest('./'))
    .on('end', () => {
      done();
    });
}

// test
gulp.task('run-test', (done) => {
  // the flag --grep takes js regex as a string and filters by test and test suite names
  var knownOptions = {
    // eslint-disable-next-line id-denylist -- minimist option name
    string: 'grep',
    default: { grep: '' },
  };
  var options = minimist(process.argv.slice(2), knownOptions);

  var spawn = require('child_process').spawn;
  const dockerTag = 'vscodevim';

  console.log('Building container...');
  var dockerBuildCmd = spawn(
    'docker',
    ['build', '-f', './build/Dockerfile', './build/', '-t', dockerTag],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
    },
  );

  dockerBuildCmd.on('exit', (buildExitCode) => {
    if (buildExitCode !== 0) {
      return done(
        new PluginError('test', {
          message: 'Docker build failed.',
        }),
      );
    }

    const dockerRunArgs = [
      'run',
      // Docker refuses `-it` without a terminal (e.g. when run from a script or agent)
      ...(process.stdin.isTTY ? ['-i'] : []),
      ...(process.stdout.isTTY ? ['-t'] : []),
      '--rm',
      // Docker's default 64MB /dev/shm is too small for VS Code's renderer, which crashes
      '--shm-size=2g',
      '--env',
      `MOCHA_GREP=${options.grep}`,
      '-v',
      process.cwd() + ':/app',
      // Keep the container's Linux dependencies, build output, VS Code download, and caches in
      // volumes rather than the host checkout
      '-v',
      `${dockerTag}-node_modules:/app/node_modules`,
      '-v',
      `${dockerTag}-out:/app/out`,
      '-v',
      `${dockerTag}-vscode-test:/app/.vscode-test`,
      '-v',
      `${dockerTag}-cache:/cache`,
      dockerTag,
    ];
    console.log('Running tests inside container...');
    var dockerRunCmd = spawn('docker', dockerRunArgs, {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    dockerRunCmd.on('exit', (exitCode) => {
      done(exitCode);
    });
  });
});

gulp.task('test', gulp.series('run-test'));
gulp.task(
  'release',
  gulp.series(
    validateArgs,
    updateVersion,
    shell.task('git commit -am "bump version"'),
    createGitTag,
  ),
);
gulp.task('default', shell.task('pnpm build-dev'));
