// Appartently there are missing features in TS
// Object.assing - https://github.com/Microsoft/TypeScript/issues/3429
// ... spread - https://github.com/Microsoft/TypeScript/issues/2103

import assign = require('object-assign');
import {handleActions} from 'redux-actions';
import {actionTypes} from './actions';
import * as Immutable from 'object-path-immutable';

interface BooleanPayload {
  payload: boolean;
}

const initialState = {
  title: 'TIME',
  loader: false,
  saving: false,
  offline: false,
  services: {
    rest: true,
    pmc: true,
    vacation: true,
    telescope: true,
    staffing: true,
    upsa: true,
  },
  alertModal: {
    visible: false,
    onHide: null,
    title: '',
    message: '',
  },
  feedbackModal: {
    visible: false,
    type: null,
  },
};

const shared = handleActions({

  [actionTypes.SET_TITLE]: (state, action: any) => {
    return assign({}, state, {title: action.payload});
  },

  [actionTypes.SET_LOADER_STATUS]: (state, action: BooleanPayload) => {
    return Immutable.set(state, 'loader', action.payload);
  },

  [actionTypes.SET_SAVING_STATUS]: (state, action: BooleanPayload) => {
    return Immutable.set(state, 'saving', action.payload);
  },

  [actionTypes.SET_SERVICES_STATUS]: (state, action: any) => {
    let errors = action.payload;
    let services = Immutable.assign(state.services, '', {});
    for (let service in services) {
      if (errors.find(error => error.service.toLowerCase() === service)) {
        services[service] = false;
      } else {
        services[service] = true;
      }
    }
    return Immutable.set(state, `services`, services);
  },

  [actionTypes.SHOW_ALERT_MODAL]: (state, action: any) => {
    let {title, message, onHide} = action.payload;
    return Immutable.set(state, `alertModal`, {
      visible: true,
      onHide: onHide,
      title: title,
      message: message,
    });

  },

  [actionTypes.HIDE_ALERT_MODAL]: (state, action) => {
    if (state.alertModal.onHide && typeof state.alertModal.onHide === 'function') {
      state.alertModal.onHide();
    }
    return Immutable.set(state, `alertModal`, {
      visible: false,
      onHide: null,
      title: '',
      message: '',
    });
  },

  [actionTypes.SHOW_FEEDBACK_MODAL]: (state, action: any) => {
    let {type} = action.payload;
    return Immutable.set(state, `feedbackModal`, {
      visible: true,
      type: type,
    });

  },

  [actionTypes.HIDE_FEEDBACK_MODAL]: (state, action) => {
    return Immutable.set(state, `feedbackModal`, {
      visible: false,
    });
  },

}, initialState);

export {shared}
