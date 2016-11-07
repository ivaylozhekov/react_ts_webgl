import * as React from 'react';

import {Types as SectionTypes} from '../../../TableSection';
import {CalendarModel} from '../../../../../models/Calendar';
import {WorklogModel} from '../../../../../models/Worklog';
// import { WorklogC } from '../../../../../schemas/projectAssignment';
import { Modes as ActivityModes } from '../../task/Activity';

import {Cell} from './Cell';

interface PropTypes {
  data: any;
  worklogs: WorklogModel[];
  activityMode: ActivityModes;
  timelocks?: any[];
  projectId: number;
  innerPath: string;
  sectionType: SectionTypes;
  calendar: CalendarModel;
  onWorklogChange(worklog: WorklogModel, duration: number, innerPath: string, vallidationErrorCallback: Function);
  showAlertModal(title, message, callback?);
}

export class Week extends React.Component <PropTypes, {}> {
  public render() {
    let {data, worklogs, timelocks, sectionType, calendar, onWorklogChange} = this.props;

    return (
      <div className="week-column">
        {calendar.days.map((day, index) => {

          let worklog: WorklogModel = worklogs.find(wl => wl.date === day.date);
          let locked: boolean = sectionType !== SectionTypes.NON_PROJECT;
          let timelock;

          if (!worklog) {
            worklog = {
              id: null,
              date: day.date,
              duration: null,
            };
          }

          if (timelocks && timelocks.length > 0) {
            let projectId = timelocks[0].split('#')[1];
            timelock = data.entities.timelock[`${worklog.date}@PROJECT#${projectId}`];
          }

          return (
            <Cell {...this.props}
              ref={ index.toString() }
              activityMode={this.props.activityMode}
              innerPath={ `${this.props.innerPath}/${index}` }
              key={ index }
              workDay={day.workDay}
              worklog={ worklog }
              locked={ (timelock) ? timelock.locked : locked }
              onChange={onWorklogChange}
            />
          );
        })}
      </div>
    );
  }
}
