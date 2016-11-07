import assign = require('object-assign');
import * as moment from 'moment';
import {URL_DATE_FORMAT} from '../../constants/formats';
import {api} from '../../utilities/services/rest';
import {normalize, arrayOf} from 'normalizr';
import schemas from './schemas';
import {RestErrorHandler} from '../../utilities/services/rest/RestErrorHandler';

const extractData = (res) => {
  return res.data || res;
};

const generateCalendar = (date, timespan) => {
  let weeksCount = ({week: 1, two_weeks: 2, month: 4})[timespan] || 0;
  let calendar = [];

  if (weeksCount === 0) throw 'Generate calendar requires a valid timespan.';

  for (let i = 0; i < weeksCount; i++) {
    let monday = moment(date, URL_DATE_FORMAT).add(i, 'weeks');
    if (monday.format('ddd') !== 'Mon') throw 'Generate calendar requires supplied date to be for a monday.';

    calendar.push({
      curentWeek: moment().isBetween(monday, moment(monday).add(6, 'days')),
      days: [],
    });

    for (let j = 0; j < 7; j++) {
      let day = moment(monday).add(j, 'days');
      calendar[i].days.push({
        date: day.format(URL_DATE_FORMAT),
        dayOfWeek: day.format('dddd').toUpperCase(),
        normHours: 8,
        today: moment().startOf('day').isSame(day.startOf('day')),
        workDay: day.day() % 6 !== 0,
      });
    }
  }

  return calendar;

};

export const fetchCalendar = (pmcId, date, timespan) => {
  return api.get(`/${pmcId}/calendar/${date}/${timespan}`).then(extractData);
};

export const fetchTimejournal = (date, timespan) => {
  return api.get(`/timejournal/${date}/${timespan}`).then(extractData);
};

export const fetchTimelocks = (date, timespan) => {
  return api.get(`/timelock/${date}/${timespan}`).then(extractData);
};

export const fetchVacation = (pmcId, date, timespan) => {
  return api.get(`/${pmcId}/vacation/${date}/${timespan}`).then(extractData);
};

export const getJournalData = (pmcId, date, timespan) => {
  return Promise.all([
    fetchCalendar(pmcId, date, timespan).catch(err => RestErrorHandler(err)),
    fetchTimejournal(date, timespan).catch(err => RestErrorHandler(err)),
    fetchTimelocks(date, timespan).catch(err => RestErrorHandler(err)),
    fetchVacation(pmcId, date, timespan).catch(err => RestErrorHandler(err)),
  ]).then(([calendar, timejournal, timelocks, vacation]) => {
    let errors: any[] = [];
    if (calendar.error) {
      errors.push(calendar.error);
      calendar = generateCalendar(date, timespan);
    }

    if (timejournal.error) {
      errors.push(timejournal.error);
      timejournal = {projectAssignments: [], nonProjectAssignments: []};
    }

    if (timelocks.error) {
      errors.push(timelocks.error);
      timelocks = [];
    }

    if (vacation.error) {
      errors.push(vacation.error);
      vacation = [];
    }

    let assignments = timejournal.projectAssignments;

    // Merge non-project assignments(tasks)
    assignments.push({
      id: 'NPA',
      name: '',
      tasks: timejournal.nonProjectAssignments,
      active: true,
      totalHours: 0,
    });

    // Merge vacation records!
    assignments.push({
      id: 'VAC',
      name: '',
      active: true,
      totalHours: 0,
      tasks: [{
        id: 'VAC',
        name: '',
        status: 'active',
        activities: vacation,
      }],
    });

    assignments.forEach(project => {
      let match = timelocks.find(lock => lock.projectId === project.id);
      if (match) {
        for (let lock of match.timeLocks) {
          lock.projectId = match.projectId;
        }
      }
      project.timelocks = (match) ? match.timeLocks : {};
      project.totalHours = 0;
    });

    return {
      errors: errors,
      data: {
        period: {
          timespan: timespan,
          date: date,
        },
        calendar: calendar,
        assignments: normalize(assignments, arrayOf(schemas.Assignment)),
      },
    };
  });
};

export const updateActivity = (id, name, worklogs) => {
  let worklogIds = worklogs.map(wl => {
    return wl.id;
  });
  return api.put('/activity', {activityName: name, worklogIds: worklogIds})
    .then((res: any) => {
      return {
        id: id,
        name: res.data.name,
        worklogs: res.data.worklogs,
      };
    })
    .catch(err => {
      // TODO: handle error
    });
};

export const createWorklog = (worklog, data) => {
  const {taskId, activityId, activityName, duration} = data;
  let payload = {
    taskId: taskId,
    activityName: activityName,
    day: worklog.date,
    duration: duration,
  };
  return api.post('/worklog', payload)
    .then((res: any) => {
      return {
        operation: 'CREATE',
        taskId: taskId,
        activityId: activityId,
        activityName: activityName,
        worklog: assign({}, worklog, {id: res.data.worklogId}, {duration: duration}),
        silentFocus: data.silentFocus,
      };
    })
    .catch(err => {
      // TODO: handle error
    });

};

export const updateWorklog = (worklog, data) => {
  const {taskId, activityId, duration} = data;
  let payload = {};

  payload = assign({}, worklog, {duration: duration});
  return api.put('/worklog', payload)
    .then((res: any) => {
      return {
        operation: 'UPDATE',
        taskId: taskId,
        activityId: activityId,
        worklog: res.data,
      };
    })
    .catch(err => {
      // TODO: handle error
    });
};

export const deleteWorklog = (worklog, data) => {
  const {taskId, activityId, duration} = data;
  let payload = assign({}, worklog, {duration: duration});

  return api.delete('/worklog', payload).then(res => {
    return {
      operation: 'DELETE',
      taskId: taskId,
      activityId: activityId,
      worklog: worklog,
    };
  })
    .catch(err => {
      // TODO: handle error
    });
};

export const getJournalOfflineData = (pmcId, date, timespan) => {
  // console.info('FETCH OFFLINE DATA!!');
};
