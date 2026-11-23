// Injected into the web build (see esbuild.mts) to provide the `process` global that some
// dependencies (e.g. util) expect
export { default as process } from 'process/browser';
