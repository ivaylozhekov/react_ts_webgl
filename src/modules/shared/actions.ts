import {createAction} from 'redux-actions';

const types = {
  SET_TITLE: 'SET_TITLE',
  SET_LOADER_STATUS: 'SET_LOADER_STATUS',
  SET_SAVING_STATUS: 'SET_SAVING_STATUS',
  SET_SERVICES_STATUS: 'SET_SERVICES_STATUS',

  SHOW_ALERT_MODAL: 'SHOW_ALERT_MODAL',
  HIDE_ALERT_MODAL: 'HIDE_ALERT_MODAL',
  SHOW_FEEDBACK_MODAL: 'SHOW_FEEDBACK_MODAL',
  HIDE_FEEDBACK_MODAL: 'HIDE_FEEDBACK_MODAL',
};

const showAlertModalHandler = (title: string, message: string, onHide?: Function) => {
  return {
    title,
    onHide,
    message,
  };
};

const showFeedbackModalHandler = (type: string) => {
  return {
    type,
  };
};

const setTitle = createAction(types.SET_TITLE);

const showAlertModal = createAction(types.SHOW_ALERT_MODAL, showAlertModalHandler);

const hideAlertModal = createAction(types.HIDE_ALERT_MODAL);

const showFeedbackModal = createAction(types.SHOW_FEEDBACK_MODAL, showFeedbackModalHandler);

const hideFeedbackModal = createAction(types.HIDE_FEEDBACK_MODAL);

const setLoader = createAction(types.SET_LOADER_STATUS);
const setSaving = createAction(types.SET_SAVING_STATUS);

const showLoader = () => {
  return (dispatch, getState) => {
    if (getState().shared.loader === false) dispatch(setLoader(true));
  };
};
const hideLoader = () => {
  return (dispatch, getState) => {
    if (getState().shared.loader === true) dispatch(setLoader(false));
  };
};

const setServicesStatus = createAction(types.SET_SERVICES_STATUS);

export {
  types as actionTypes,
  setTitle,
  showLoader,
  hideLoader,
  setSaving,
  setServicesStatus,
  showAlertModal,
  hideAlertModal,
  showFeedbackModal,
  hideFeedbackModal,
}
