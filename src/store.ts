declare var window; // its for the devtools
import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import auth from './utilities/middleware/auth';
import promise from './utilities/middleware/redux-promise';
import * as logger from 'redux-logger';

import {routerReducer as routing} from 'react-router-redux';
import {shared, actor, journal} from './reducers';

const isProd = (process.env.NODE_ENV === 'production');

let middleware = [
  auth,
  promise,
  thunk,
];
if (!isProd) middleware.push(logger());

export default
createStore(
  combineReducers(
    {
      routing,
      shared,
      actor,
      journal,
    }),
  !isProd && window.devToolsExtension ? window.devToolsExtension() : f => f,
  applyMiddleware(...middleware)
);
