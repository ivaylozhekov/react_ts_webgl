declare var require: any;
/* tslint:disable:no-var-requires */
require('file?name=[name].[ext]!./index.html');
require('./styles.less');
require('./utilities/polyfills/array/find.js');
/* tslint:enable:no-var-requires */

import * as ES6Promise from 'es6-promise';
ES6Promise.polyfill();

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Router, browserHistory} from 'react-router';
import {Provider as ReduxProvider} from 'react-redux';
import {syncHistoryWithStore} from 'react-router-redux';
import store from './store';
import routes from './routes';

ReactDOM.render(
  <ReduxProvider store={store}>
    <Router history={syncHistoryWithStore(browserHistory, store)}>
      {routes(store)}
    </Router>
  </ReduxProvider>,
  document.getElementById('root')
);
