const merge = require('webpack-merge');
const prod_config = require('./webpack.config.js');

module.exports = merge(prod_config, {
  mode: 'development',
  devtool: 'inline-source-map',
});
