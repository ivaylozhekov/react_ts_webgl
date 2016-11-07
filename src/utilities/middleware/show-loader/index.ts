import {isFSA} from 'flux-standard-action';
// import assign = require('object-assign');


const isPromise = (val) => {
  return val && typeof val.then === 'function';
};

const handler = (dispatch: any, action: any, next: any) => {
  dispatch({type: 'SHOW_LOADER'});
  next(action);
};

export default
function promiseMiddleware({dispatch}) {
  return next => action => {
    if (!isFSA(action)) {
      return isPromise(action) ? action.then(dispatch) : next(action);
    }
    return isPromise(action.payload) ? handler(dispatch, action, next) : next(action);
  };
}
