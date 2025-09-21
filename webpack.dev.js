import merge from 'webpack-merge';
import { config } from './webpack.config.js';

export const devConfig = merge.merge(config, {
  mode: 'development',
  devtool: 'source-map',
  optimization: {
    minimize: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
});
