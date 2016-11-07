import * as Immutable from 'object-path-immutable';
import * as uuid from 'uuid';
import {handleActions} from 'redux-actions';
import {actionTypes} from './actions';

export const enum ErrorLevels {
  NONE,
  WARNING,
  CRITICAL
}

const initialState = {
  period: {
    timespan: '',
    date: '',
  },
  calendar: [],
  assignments: [],
  totals: {},
  error: {
    level: ErrorLevels.NONE,
    data: {},
  },
  silentFocus: null,
  UI: {
    nonProjectExpanded: undefined,
    vacationExpanded: undefined,
  },
};

const addTotalsPerProject = (assignments) => {
  let projects = assignments.entities.assignment;

  Object.keys(projects).forEach(assignmentKey => {
    let totals = 0;
    let project = projects[assignmentKey];
    project.tasks.forEach(taskKey =>
      assignments.entities.task[taskKey].activities.forEach(activityKey =>
        assignments.entities.activity[activityKey].worklogs.forEach(worklogKey => {
          totals += assignments.entities.worklog[worklogKey].duration;
        })
      ));
    assignments.entities.assignment[assignmentKey].totalHours = totals;
  });
  return assignments;
};

const calculateTotals = (assignments) => {
  let worklogs: any = assignments.entities.worklog || [];
  return Object.keys(worklogs).reduce((a: any, b: string, index) => {
    let duration: number = (worklogs[b].duration) ? parseFloat(worklogs[b].duration.toFixed(2)) : 0;
    if (a[worklogs[b].date]) {
      a[worklogs[b].date] += duration;
    } else {
      a[worklogs[b].date] = duration;
    }
    return a;
  }, {});
};

const journal = handleActions({

  [actionTypes.SET_JOURNAL]: (state, action: any) => {
    const {period, calendar, assignments} = action.payload;
    let nextState;

    if (action.error) {
      return Immutable.set(state, 'error', {
        level: ErrorLevels.CRITICAL,
        data: action.payload,
      });
    } else {
      nextState = Immutable.set(state, 'period', period);
      nextState = Immutable.set(nextState, 'calendar', calendar);
      nextState = Immutable.set(nextState, 'totals', calculateTotals(assignments));
      return Immutable.set(nextState, 'assignments', addTotalsPerProject(assignments));
    }

  },

  [actionTypes.GET_VACATION]: (state, action: any) => {
    let nextState;

    if (action.error) return Immutable.set(state, 'error', {
      level: ErrorLevels.WARNING,
      data: action.payload,
    });

    nextState = Immutable.assign(state, 'assignments.entities.task.VAC.activities', action.payload.result);
    nextState = Immutable.assign(nextState, `assignments.entities.activity`, action.payload.entities.activity);
    nextState = Immutable.assign(nextState, 'assignments.entities.worklog', action.payload.entities.worklog);

    return nextState;
  },

  [actionTypes.SET_ACTIVITY]: (state, action: any) => {
    let {id, name, worklogs} = action.payload;

    if (action.error) return Immutable.set(state, 'error', {
      level: ErrorLevels.WARNING,
      data: action.payload,
    });

    return Immutable.set(state, `assignments.entities.activity.${id}`, {
      name: name,
      worklogs: worklogs.map(worklog => {
        return worklog.id;
      }),
    });

  },

  [actionTypes.CLEAR_SILENT_FOCUS]: (state, action: any) => {
    return Immutable.set(state, 'silentFocus', null);
  },

  // TODO: BRAKE into three different actions CREATE, UPDATE, DELETE
  [actionTypes.CUD_WORKLOG]: (state, action: any) => {
    if (!action.payload) return state;
    let {operation, taskId, activityId, activityName, worklog} = action.payload;
    let nextState;
    if (action.error) {
      return Immutable.set(state, 'error', {
        level: ErrorLevels.WARNING,
        data: action.payload,
      });
    }

    if (operation === 'CREATE') {
      nextState = Immutable.set(state, 'silentFocus', action.payload.silentFocus);
      nextState = Immutable.set(nextState, `assignments.entities.worklog.${worklog.id}`, worklog);

      if (state.assignments.entities.activity && state.assignments.entities.activity[activityId]) {
        nextState = Immutable.push(nextState, `assignments.entities.activity.${activityId}.worklogs`, worklog.id);
      } else {
        activityId = uuid.v4();
        nextState = Immutable.set(nextState, `assignments.entities.activity.${activityId}`, {
          name: activityName,
          worklogs: [worklog.id],
        });
        nextState = Immutable.push(nextState, `assignments.entities.task.${taskId}.activities`, activityId);
      }

    }

    if (operation === 'UPDATE') {
      nextState = Immutable.set(state, `assignments.entities.worklog.${worklog.id}.duration`, worklog.duration);
    }

    if (operation === 'DELETE') {
      let worklogIndex = state.assignments.entities.activity[activityId].worklogs.indexOf(worklog.id);
      nextState = Immutable.del(state, `assignments.entities.activity.${activityId}.worklogs.${worklogIndex}`);
      nextState = Immutable.del(nextState, `assignments.entities.worklog.${worklog.id}`);
    }

    nextState = Immutable.set(nextState, 'totals', calculateTotals(nextState.assignments));

    return Immutable.set(nextState, 'assignments', addTotalsPerProject(nextState.assignments));
  },

  [actionTypes.SET_NON_PROJECT_EXPANDED]: (state, action: any) => {
    return Immutable.set(state, 'UI.nonProjectExpanded', action.payload);
  },
   [actionTypes.SET_VACATION_EXPANDED]: (state, action: any) => {
    return Immutable.set(state, 'UI.vacationExpanded', action.payload);
  },
}, initialState);

export {journal}
