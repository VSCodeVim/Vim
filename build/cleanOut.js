// Empties out/ before a test build. tsc never deletes output, so a test whose source was deleted or
// renamed would otherwise keep running. out/ is emptied rather than removed because it's a mount
// point in the Docker test container.
const fs = require('fs');
const path = require('path');

const out = path.resolve(__dirname, '..', 'out');
if (fs.existsSync(out)) {
  for (const entry of fs.readdirSync(out)) {
    try {
      fs.rmSync(path.join(out, entry), { recursive: true, force: true, maxRetries: 3 });
    } catch (error) {
      if (error.code === 'EBUSY' || error.code === 'EPERM') {
        console.error(
          `Couldn't delete ${error.path ?? path.join(out, entry)} because another process is ` +
            'using it. Close any VS Code instances running the tests, then try again.',
        );
        process.exit(1);
      }
      throw error;
    }
  }
}
