//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  mode: 'production',

  entry: './extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'out' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
    alias: {
      path: 'path-browserify',
      platform: path.resolve(__dirname, 'src', 'platform', 'node'),
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
  ],
};

/**@type {import('webpack').Configuration}*/
const nodelessConfig = {
  target: 'webworker', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  mode: 'development',

  entry: './extensionWeb.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'out' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'out'),
    filename: 'extensionWeb.js',
    libraryTarget: 'umd',
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
    alias: {
      path: 'path-browserify',
      os: 'os-browserify',
      process: 'process/browser',
      platform: path.resolve(__dirname, 'src', 'platform', 'browser'),
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
    new ForkTsCheckerWebpackPlugin(),
  ],
};

module.exports = [config, nodelessConfig];
