// Appartently there are missing features in TS
// Object.assing - https://github.com/Microsoft/TypeScript/issues/3429
// ... spread - https://github.com/Microsoft/TypeScript/issues/2103
import assign = require('object-assign');
import {handleActions} from 'redux-actions';
import {actionTypes} from './actions';
const initialState = {
  error: '',
  identity: {},
  activeIdentity: -1,
  units: {},
  projects: [],
};

const actor = handleActions({

  [actionTypes.SET_ACTOR]: (state, action: any) => {
    if (action.error) return assign({}, state, {error: 'Unable to determine user'});
    return assign({}, state, {identity: action.payload});
  },

  [actionTypes.SET_ACTOR_PROJECTS]: (state, action: any) => {
    if (action.error) return assign({}, state, {error: 'Unable to determine user projects'});
    return assign({}, state, {projects: action.payload});
  },

  [actionTypes.SET_ACTOR_UNITS]: (state, action: any) => {
    if (action.error) return assign({}, state, {error: 'Unable to determine user units'});
    return assign({}, state, {units: action.payload});
  },

  [actionTypes.SET_ACTIVE_IDENTITY]: (state, action: any) => {
    if (action.error) return assign({}, state, {error: 'Unable to set active identity'});
    return assign({}, state, {activeIdentity: action.payload});
  },

}, initialState);

export {actor}
