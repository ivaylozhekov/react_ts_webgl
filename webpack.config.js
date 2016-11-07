'use strict';

const path = require('path');
const webpack = require('webpack');
const loaders = require('./webpack/loaders');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const isProd = (process.env.NODE_ENV === 'production');

let entries = [];
if (!isProd) entries.push('webpack/hot/only-dev-server')
entries.push('./src/bootstrap.tsx');

let plugins;
if (isProd) {
  plugins = [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ]
} else {
  plugins = [];
}

module.exports = {
  entry: entries,
  output: {
    path: path.resolve(__dirname, "server/public"),
    publicPath: "/",
    filename: "bundle.js"
  },
  devtool: (!isProd) ? 'inline-source-map' : null,
  resolve: {
    extensions: ["", ".tsx", ".ts", ".js"]
  },
  plugins: [
    new ExtractTextPlugin("style.css", {
      allChunks: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': (isProd) ? JSON.stringify('production') : undefined
    })
  ].concat(plugins),
  module: {
    loaders: [
      loaders.tsx,
      loaders.font,
      loaders.image,
      loaders.css,
      loaders.less,
      loaders.glsl
    ]
  }
}
