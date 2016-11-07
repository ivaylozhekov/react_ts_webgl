import {createAction} from 'redux-actions';
import {normalize, arrayOf} from 'normalizr';
import {api} from '../../utilities/services/rest';

import schemas from './schemas';
import {WorklogModel} from './models/Worklog';

import {showLoader, hideLoader, setServicesStatus, setSaving} from '../shared/actions';

import * as JournalServices from './services';

const types = {
  SET_JOURNAL: 'SET_JOURNAL',
  SET_ACTIVITY: 'SET_ACTIVITY',
  CUD_WORKLOG: 'CUD_WORKLOG', // TODO: BRAKE into three different actions CREATE, UPDATE, DELETE

  GET_VACATION: 'GET_VACATION', // TODO: rename to SET_VACATION and wrap in thunk,
  SET_NON_PROJECT_EXPANDED: 'SET_NON_PROJECT_EXPANDED',
  SET_VACATION_EXPANDED: 'SET_VACATION_EXPANDED',
  CLEAR_SILENT_FOCUS: 'CLEAR_SILENT_FOCUS',
};

const setJournal = createAction(types.SET_JOURNAL);
const setNonProjectExpanded = createAction(types.SET_NON_PROJECT_EXPANDED);
const setVacationExpanded = createAction(types.SET_VACATION_EXPANDED);

const getJournal = (pmcId, date, timespan) => {
  return (dispatch, getState) => {
    dispatch(showLoader());
    JournalServices.getJournalData(pmcId, date, timespan)
      .then(journal => {
        dispatch(setServicesStatus(journal.errors));
        dispatch(setJournal(journal.data));
        dispatch(hideLoader());
        setTimeout(() => {
          JournalServices.getJournalOfflineData(pmcId, date, timespan);
        }, 0);
      })
      .catch(err => {
        // TODO: Implement error handling
      });
  };
};

const getVacationHandler = (pmcId, date, timespan) => {
  return api.get(`/${pmcId}/vacation/${date}/${timespan}`)
    .then(res => {
      return normalize(res.data, arrayOf(schemas.Activity));
    });
};
const getVacation = createAction(types.GET_VACATION, getVacationHandler);

const setActivity = createAction(types.SET_ACTIVITY);
const saveActivity = (id: string, name: string, worklogs: WorklogModel[]) => {
  return (dispatch, getState) => {

    if (worklogs.length === 0) {
        dispatch(setActivity({id, name, worklogs}));
        return;
    }

    dispatch(setSaving(true));
    JournalServices.updateActivity(id, name, worklogs)
      .then(res => {
        dispatch(setSaving(false));
        dispatch(setActivity(res));
      });
  };
};

const cudWorklog = createAction(types.CUD_WORKLOG);
const clearSilentFocus = createAction(types.CLEAR_SILENT_FOCUS);
const saveWorklog = (worklog: WorklogModel, data) => {

  return (dispatch, getState) => {
    dispatch(setSaving(true));

    if (worklog.id && data.duration === 0) {
      JournalServices.deleteWorklog(worklog, data)
        .then(res => {
          dispatch(setSaving(false));
          dispatch(cudWorklog(res));
        });
    } else if (worklog.id) {
      JournalServices.updateWorklog(worklog, data)
        .then(res => {
          dispatch(setSaving(false));
          dispatch(cudWorklog(res));
        });
    } else {
      JournalServices.createWorklog(worklog, data)
        .then(res => {
          dispatch(setSaving(false));
          dispatch(cudWorklog(res));
        });
    }

  };
};

export {
  types as actionTypes,
  getJournal,
  getVacation,
  saveActivity,
  saveWorklog,
  setNonProjectExpanded,
  setVacationExpanded,
  clearSilentFocus,
}
