const merge = require('webpack-merge');
const prod_configs = require('./webpack.config.js');

module.exports = prod_configs.map((config) =>
  merge.merge(prod_configs[0], {
    mode: 'development',
    devtool: 'inline-source-map',
  })
);
