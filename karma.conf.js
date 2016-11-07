// Karma configuration
// Generated on Sat Jul 30 2016 09:06:09 GMT+0300 (EEST)
var webpackConfig = require("./webpack.config");

webpackConfig.module.postLoaders = [{
  test: /\.tsx?$/,
  loader: 'istanbul-instrumenter-loader',
  exclude: [
    'node_modules',
    /\.(spec)\.tsx?$/
  ]
}]

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon', 'source-map-support'],

    // list of files / patterns to load in the browser
    files: [
      './src/**/*.spec.+(ts|tsx)',
    ],

    // list of files to exclude
    exclude: [],

    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "./src/**/*.+(ts|tsx)": ["webpack"]
    },

    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage'],

    coverageReporter: {
      dir: './coverage',
      reporters: [{
        type: 'json',
        subdir: '.',
        file: 'coverage.json'
      }]
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: {
      module: webpackConfig.module,
      resolve: webpackConfig.resolve
    }

  });
}