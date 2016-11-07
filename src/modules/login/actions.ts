import {createAction} from 'redux-actions';
import {logout} from '../../utilities/services/rest';
import {browserHistory} from 'react-router';
import LocalStorage from '../../utilities/services/LocalStorage';

import * as SharedActions from '../shared/actions';
import * as ActorServices from './services';

const types = {
  SET_ACTOR: 'SET_ACTOR',
  SET_ACTOR_PROJECTS: 'SET_ACTOR_PROJECTS',
  SET_ERROR: 'SET_ERROR',
  SET_ACTOR_UNITS: 'SET_ACTOR_UNITS',
  SET_ACTIVE_IDENTITY: 'SET_ACTIVE_IDENTITY',
};

const setActor = createAction(types.SET_ACTOR);
const setActorProjects = createAction(types.SET_ACTOR_PROJECTS);
const setActorUnits = createAction(types.SET_ACTOR_UNITS);
const setActiveIdentity = createAction(types.SET_ACTIVE_IDENTITY);

const getActor = (withProjects: boolean = false, onSuccess?) => {
  return (dispatch, getState) => {

    dispatch(SharedActions.showLoader());
    ActorServices
      .fetchActor()
      .then(actor => {
        dispatch(setActor(actor));
        if (withProjects === false && onSuccess && typeof onSuccess === 'function') {
          dispatch(SharedActions.hideLoader());
          onSuccess();
        }
      })
      .catch(err => {
        dispatch(SharedActions.setServicesStatus('rest'));
      });

    if (withProjects === true) {
      ActorServices
        .fetchActorProjects()
        .then(projects => {
          dispatch(setActorProjects(projects));
          if (onSuccess && typeof onSuccess === 'function') {
            dispatch(SharedActions.hideLoader());
            onSuccess();
          }
        })
        .catch(err => {
          console.warn('TODO: ERROR HANDLER');
        });
    }
  };
};

const getActorProjects = () => {
  return (dispatch, getState) => {
    ActorServices.fetchActorProjects()
      .then(projects => {
        dispatch(setActorProjects(projects));
      })
      .catch(error => {
        console.warn('TODO: ERROR HANDLER');
      });
  };
};

const logoutActor = () => {
  logout.post('', null).then(() => {
    LocalStorage.removeAllItems();
    browserHistory.push('login');
  });
};

const getActorUnits = () => {
  return (dispatch, getState) => {
    ActorServices.fetchActorUnits()
      .then(units => {
        dispatch(setActorUnits(units));
      })
      .catch(error => {
        console.warn('TODO: ERROR HANDLER');
      });
  };
};

export {
  types as actionTypes,
  getActor,
  getActorProjects,
  logoutActor,
  getActorUnits,
  setActiveIdentity,
}
