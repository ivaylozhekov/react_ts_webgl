import * as uuid from 'uuid';
import {Schema, arrayOf} from 'normalizr';

const schemas = {
  Assignment: new Schema('assignment'),
  Task: new Schema('task'),
  Activity: new Schema('activity', {
    idAttribute: () => {
      return uuid.v4();
    },
  }),
  Worklog: new Schema('worklog', {
    idAttribute: (entity) => {
      if (entity.id !== null) return entity.id;
      else return uuid.v4();
    },
    assignEntity: (output, key, value, input) => {
      if (key === 'timestamp') delete output.timestamp; // Removing timestamp, not seeing use of it at the moment
    },
  }),
  Timelock: new Schema('timelock', {
    idAttribute: (entity) => {
      return `${entity.date}@PROJECT#${entity.projectId}`;
    },
  }),
};

schemas.Activity.define({
  worklogs: arrayOf(schemas.Worklog),
});

schemas.Task.define({
  activities: arrayOf(schemas.Activity),
});

schemas.Assignment.define({
  tasks: arrayOf(schemas.Task),
  timelocks: arrayOf(schemas.Timelock),
});

export default schemas;
