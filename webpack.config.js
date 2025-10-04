//@ts-check

'use strict';

import path from 'path';
import webpack from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import CircularDependencyPlugin from 'circular-dependency-plugin';

/**@type {import('webpack').Configuration}*/
export const config = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  mode: 'production',

  entry: './extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'out' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(import.meta.dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
    alias: {
      path: 'path-browserify',
      platform: path.resolve(import.meta.dirname, 'src', 'platform', 'node'),
    },
  },
  optimization: {
    minimize: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          // Don't type check - ForkTsCheckerWebpackPlugin does this faster
          transpileOnly: true,
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [], // disable initial clean
    }),
    new ForkTsCheckerWebpackPlugin(),
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp
      exclude: /node_modules/,
      // include specific files based on a RegExp
      include: /src/,
      // add errors to webpack instead of warnings
      failOnError: true,
      // allow import cycles that include an asyncronous import,
      // e.g. via import(/* webpackMode: "weak" */ './file.js')
      allowAsyncCycles: true,
      // set the current working directory for displaying module paths
      cwd: process.cwd(),
    }),
  ],
};

/**@type {import('webpack').Configuration}*/
export const nodelessConfig = {
  target: 'webworker', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  mode: 'development',

  entry: './extensionWeb.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'out' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(import.meta.dirname, 'out'),
    filename: 'extensionWeb.js',
    libraryTarget: 'umd',
  },
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
    alias: {
      platform: path.resolve(import.meta.dirname, 'src', 'platform', 'browser'),
    },
    fallback: {
      os: import.meta.resolve('os-browserify/browser'),
      path: import.meta.resolve('path-browserify'),
      process: import.meta.resolve('process/browser'),
      util: import.meta.resolve('util'),
    },
  },
  optimization: {
    minimize: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          // Don't type check - ForkTsCheckerWebpackPlugin does this faster
          transpileOnly: true,
        },
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /\/neovim$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /\/imswitcher$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /\/vimrc$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /child_process$/,
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser', // util requires this internally
    }),
    new ForkTsCheckerWebpackPlugin(),
  ],
};
