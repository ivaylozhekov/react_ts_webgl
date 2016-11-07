import * as React from 'react';
import * as classNames from 'classnames';
import * as uuid from 'uuid';

import {CalendarModel} from '../../../models/Calendar';
import {WorklogModel} from '../../../models/Worklog';

import {Types as SectionTypes} from '../TableSection';
import {Header} from './task/TaskHeader';
import {Activity, Modes as ActivityModes} from './task/Activity';

interface PropTypes {
  data: any;
  taskId?: number;
  calendar: CalendarModel[];
  active: boolean;
  sectionType: SectionTypes;
  className?: string;
  totals: any;
  path: string;
  saveActivity(id: string, name: string, worklogs: WorklogModel[]);
  saveWorklog(worklog: WorklogModel, data: {
    taskId: number;
    activityId: number;
    activityName?: string;
    duration: number;
    path: Object;
  });
  showAlertModal();
}

export class Task extends React.Component <PropTypes, {}> {
  public render() {

    let {data, taskId, calendar, active} = this.props;
    let task = data.entities.task[taskId];

    return (
      <div
        className={classNames('task-block')}>
        {(() => {
          if (task.name) {
            return <Header title={task.name} calendar={calendar}/>;
          }
        })()}
        <div className="task-activities">
          { task.activities ? task.activities.map((activityId) =>
            <Activity {...this.props}
              ref={this.props.data.entities.activity[activityId].name}
              path={ `${this.props.path}` }
              key={activityId}
              activityId={activityId}
              mode={active ? ActivityModes.ACTIVE : ActivityModes.LOCKED}
            />
          ) : null }
          {
            (() => {
              if (active) {
                return (
                  <Activity {...this.props}
                    key={uuid.v4()}
                    path={ `${this.props.path}` }
                    mode={ActivityModes.CREATE}
                  />
                );
              }
            })()
          }
        </div>
      </div>
    );
  }

}
