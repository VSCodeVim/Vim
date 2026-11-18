// Writes out/package.json so that out/ can be loaded as the extension under test. Tests must run
// against the tsc build in out/ (not the webpack bundle in dist/) so that they share module state,
// such as `Globals`, with the extension.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
manifest.main = './extension';
manifest.browser = './extensionWeb';
fs.writeFileSync(path.join(root, 'out', 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
