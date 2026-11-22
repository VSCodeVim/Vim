/**
 * Every `*.test.ts` file under test/, paired with a function that runs it. esbuild.mts generates
 * this module when it builds the tests.
 */
declare module 'test-files' {
  const testFiles: Array<[file: string, load: () => Promise<unknown>]>;
  export default testFiles;
}
