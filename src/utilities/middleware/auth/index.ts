import {isFSA} from 'flux-standard-action';
import assign = require('object-assign');
import {browserHistory} from 'react-router';
import LocalStorage from '../../services/LocalStorage';

const isPromise = (val) => {
  return val && typeof val.then === 'function';
};

const handler = (dispatch, action, next: any) => {
  if (action.payload.data && action.payload.data.status === 401) {
    switch (action.payload.data.reason) {
      case 'SSO':
        if (LocalStorage.hasItem('access_token')) LocalStorage.removeItem('access_token');
      case 'PMC':
        browserHistory.push('/login');
        break;
      default:
        alert('You are not authorized to access this resource');
    }
  } else {
    dispatch(action);
  }
};

export default
function promiseMiddleware({dispatch}) {
  return next => action => {

    if (!isFSA(action)) {
      return isPromise(action) ? action.then(dispatch) : next(action);
    }

    return isPromise(action.payload)
      ? action.payload.then(
      result => next(action),
      error => {
        return handler(dispatch, assign({}, action, {payload: error, error: true}), next);
      }
    )
      : next(action);
  };
}
