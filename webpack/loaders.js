'use strict';
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const isProd = (process.env.NODE_ENV === 'production');

let tsxLoaders = [];
if (!isProd) tsxLoaders.push('react-hot-loader');
tsxLoaders.push('ts-loader');

exports.tsx = {
    test: /\.tsx?$/,
    loaders: tsxLoaders,
    exclude: /node_modules/,
};

exports.font = {
    test: /\.(woff|woff2|eot|ttf)(\?.*$|$)/,
    loader: 'url-loader?limit=100000'
};

exports.image = {
    test: /.*\.(gif|png|jpe?g|svg)(\?.*$|$)/i,
    loader: 'file-loader?limit=8192'
}

exports.css = {
    test: /\.css$/,
    loader: ExtractTextPlugin.extract("style-loader", "css-loader")
};

exports.less = {
    test: /\.less$/,
    loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
};

exports.glsl = {
    test: /\.glsl$/,
    loader: 'webpack-glsl'
};