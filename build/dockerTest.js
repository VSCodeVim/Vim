// Builds the test container and runs the tests inside it.
//   --grep <REGEX>  only run tests whose suite or test name matches REGEX
//   --crlf          make test documents use CRLF line endings, as they do on Windows
const { spawnSync } = require('child_process');
const path = require('path');
const { parseArgs } = require('util');

const { values: options } = parseArgs({
  options: {
    grep: { type: 'string', default: '' },
    crlf: { type: 'boolean', default: false },
  },
});

const root = path.resolve(__dirname, '..');
const dockerTag = 'vscodevim';

function docker(args) {
  const result = spawnSync('docker', args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(`Couldn't run docker: ${result.error.message}`);
    process.exit(1);
  }
  return result.status ?? 1;
}

console.log('Building container...');
if (docker(['build', '-f', './build/Dockerfile', './build/', '-t', dockerTag]) !== 0) {
  console.error('Docker build failed.');
  process.exit(1);
}

console.log('Running tests inside container...');
process.exit(
  docker([
    'run',
    // Docker refuses `-it` without a terminal (e.g. when run from a script or agent)
    ...(process.stdin.isTTY ? ['-i'] : []),
    ...(process.stdout.isTTY ? ['-t'] : []),
    '--rm',
    // Docker's default 64MB /dev/shm is too small for VS Code's renderer, which crashes
    '--shm-size=2g',
    '--env',
    `MOCHA_GREP=${options.grep}`,
    '--env',
    `TEST_EOL=${options.crlf ? 'crlf' : ''}`,
    '-v',
    `${root}:/app`,
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
  ]),
);
