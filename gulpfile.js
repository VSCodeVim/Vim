const gulp = require('gulp');
const bump = require('gulp-bump');
const git = require('gulp-git');
const sourcemaps = require('gulp-sourcemaps');
const tag_version = require('gulp-tag-version');
const tslint = require('gulp-tslint');
const ts = require('gulp-typescript');
const PluginError = require('plugin-error');
const minimist = require('minimist');
const path = require('path');
const webpack = require('webpack');
const webpack_stream = require('webpack-stream');
const es = require('event-stream');

const webpack_config = require('./webpack.config.js');
const webpack_dev_config = require('./webpack.dev.js');

const { exec, spawn } = require('child_process');

const releaseOptions = {
  semver: '',
  gitHubToken: '',
};

// prettier
function runPrettier(command, done) {
  exec(command, function (err, stdout) {
    if (err) {
      return done(new PluginError('runPrettier', { message: err }));
    }

    if (!stdout) {
      return done();
    }

    const filetypes = ['.ts', '.js', '.json', '.md', '.yml'];
    const files = stdout
      .split(/\r?\n/)
      .filter((f) => filetypes.some((filetype) => f.endsWith(filetype)))
      .join(' ');

    if (!files) {
      return done();
    }

    const prettierPath = path.normalize('./node_modules/.bin/prettier');
    exec(`${prettierPath} --write ${files}`, function (err) {
      if (err) {
        return done(new PluginError('runPrettier', { message: err }));
      }
      return done();
    });
  });
}

function validateArgs(done) {
  const options = minimist(process.argv.slice(2), releaseOptions);
  if (!options.semver) {
    return done(
      new PluginError('updateVersion', {
        message: 'Missing `--semver` option. Possible values: patch, minor, major',
      })
    );
  }
  if (!['patch', 'minor', 'major'].includes(options.semver)) {
    return done(
      new PluginError('updateVersion', {
        message: 'Invalid `--semver` option. Possible values: patch, minor, major',
      })
    );
  }

  const gitHubToken = options.gitHubToken || process.env.CHANGELOG_GITHUB_TOKEN;
  if (!gitHubToken) {
    return done(
      new PluginError('createChangelog', {
        message:
          'Missing GitHub API Token. Supply token using `--gitHubToken` option or `CHANGELOG_GITHUB_TOKEN` environment variable.',
      })
    );
  }

  done();
}

function createChangelog(done) {
  const imageName = 'jpoon/github-changelog-generator';
  const version = require('./package.json').version;

  const options = minimist(process.argv.slice(2), releaseOptions);
  const gitHubToken = options.gitHubToken || process.env.CHANGELOG_GITHUB_TOKEN;

  var dockerRunCmd = spawn(
    'docker',
    [
      'run',
      '-it',
      '--rm',
      '-v',
      process.cwd() + ':/usr/local/src/your-app',
      imageName,
      '--token',
      gitHubToken,
      '--future-release',
      'v' + version,
    ],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
    }
  );

  dockerRunCmd.on('exit', function (exitCode) {
    done(exitCode);
  });
}

function createGitTag() {
  return gulp.src(['./package.json']).pipe(tag_version());
}

function createGitCommit() {
  return gulp
    .src(['./package.json', './yarn.lock', 'CHANGELOG.md'])
    .pipe(git.commit('bump version'));
}

function updateVersion(done) {
  var options = minimist(process.argv.slice(2), releaseOptions);

  return gulp
    .src(['./package.json', './yarn.lock'])
    .pipe(bump({ type: options.semver }))
    .pipe(gulp.dest('./'))
    .on('end', () => {
      done();
    });
}

function updatePath() {
  const input = es.through();
  const output = input.pipe(
    es.mapSync((f) => {
      const contents = f.contents.toString('utf8');
      const filePath = f.path;
      let platformRelativepath = path.relative(
        path.dirname(filePath),
        path.resolve(process.cwd(), 'out/src/platform/node')
      );
      platformRelativepath = platformRelativepath.replace(/\\/g, '/');
      f.contents = Buffer.from(
        contents.replace(
          /\(\"platform\/([^"]*)\"\)/g,
          '("' + (platformRelativepath === '' ? './' : platformRelativepath + '/') + '$1")'
        ),
        'utf8'
      );
      return f;
    })
  );
  return es.duplex(input, output);
}

function copyPackageJson() {
  return gulp.src('./package.json').pipe(gulp.dest('out'));
}

gulp.task('tsc', function () {
  var isError = false;

  var tsProject = ts.createProject('tsconfig.json', { noEmitOnError: true });
  var tsResult = tsProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .on('error', () => {
      isError = true;
    })
    .on('finish', () => {
      isError && process.exit(1);
    });

  return tsResult.js
    .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '' }))
    .pipe(updatePath())
    .pipe(gulp.dest('out'));
});

gulp.task('webpack', function () {
  return webpack_stream(
    {
      config: webpack_config,
      entry: ['./extension.ts', './extensionWeb.ts'],
    },
    webpack
  ).pipe(gulp.dest('out'));
});

gulp.task('webpack-dev', function () {
  return webpack_stream(
    {
      config: webpack_dev_config,
      entry: ['./extension.ts'],
    },
    webpack
  ).pipe(gulp.dest('out'));
});

gulp.task('tslint', function () {
  const program = require('tslint').Linter.createProgram('./tsconfig.json');
  return gulp
    .src(['**/*.ts', '!node_modules/**', '!typings/**'])
    .pipe(
      tslint({
        formatter: 'prose',
        program: program,
      })
    )
    .pipe(tslint.report({ summarizeFailureOutput: true }));
});

gulp.task('prettier', function (done) {
  // Files changed
  runPrettier('git diff --diff-filter=d --name-only HEAD', done);
});

gulp.task('forceprettier', function (done) {
  // Files managed by git
  // TODO: if any file is deleted, but not yet staged, this will fail
  runPrettier('git ls-files', done);
});

gulp.task('commit-hash', function (done) {
  git.revParse({ args: 'HEAD', quiet: true }, function (err, hash) {
    require('fs').writeFileSync('out/version.txt', hash);
    done();
  });
});

// test
gulp.task('run-test', function (done) {
  // the flag --grep takes js regex as a string and filters by test and test suite names
  var knownOptions = {
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
    }
  );

  dockerBuildCmd.on('exit', function (exitCode) {
    if (exitCode !== 0) {
      return done(
        new PluginError('test', {
          message: 'Docker build failed.',
        })
      );
    }

    const dockerRunArgs = [
      'run',
      '-it',
      '--rm',
      '--env',
      `MOCHA_GREP=${options.grep}`,
      '-v',
      process.cwd() + ':/app',
      dockerTag,
    ];
    console.log('Running tests inside container...');
    var dockerRunCmd = spawn('docker', dockerRunArgs, {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    dockerRunCmd.on('exit', function (exitCode) {
      done(exitCode);
    });
  });
});

gulp.task('build', gulp.series('prettier', gulp.parallel('webpack', 'tslint'), 'commit-hash'));
gulp.task(
  'build-dev',
  gulp.series('prettier', gulp.parallel('webpack-dev', 'tslint'), 'commit-hash')
);
gulp.task('prepare-test', gulp.parallel('tsc', copyPackageJson));
gulp.task('test', gulp.series('prepare-test', 'run-test'));
gulp.task('changelog', gulp.series(validateArgs, createChangelog));
gulp.task(
  'release',
  gulp.series(
    validateArgs,
    updateVersion,
    createChangelog,
    'prettier',
    createGitCommit,
    createGitTag
  )
);
gulp.task('default', gulp.series('build', 'test'));
