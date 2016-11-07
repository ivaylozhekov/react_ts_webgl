import {isFSA} from 'flux-standard-action';
import assign = require('object-assign');

const isPromise = (val) => {
  return val && typeof val.then === 'function';
};

const handler = (dispatch, action) => {
  dispatch(action);
};

export default
function promiseMiddleware({dispatch}) {
  return next => action => {

    if (!isFSA(action)) {
      return isPromise(action) ? action.then(dispatch) : next(action);
    }

    return isPromise(action.payload)
      ? action.payload.then(
        result => handler(dispatch, assign({}, action, {payload: result})),
        error => { return handler(dispatch, assign({}, action, {payload: error, error: true})); }
      )
      : next(action);
  };
}
