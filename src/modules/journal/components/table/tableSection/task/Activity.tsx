import * as React from 'react';
import {Types as SectionTypes} from '../../TableSection';
import {WorklogModel} from '../../../../models/Worklog';
import {CalendarModel} from '../../../../models/Calendar';
import {Week} from './activity/Week';
import {Title} from './activity/Title';

interface PropTypes {
  mode: Modes;
  data: any;
  activityId?: string;
  projectId?: number;
  path: string;
  calendar: CalendarModel[];
  totals: Object;
  active: boolean;
  sectionType: SectionTypes;
  className?: string;
  taskId: number;
  saveActivity(id: string, name: string, worklogs: WorklogModel[]);
  saveWorklog(worklog, data);
  showAlertModal(title, message, callback?);
}

interface StateTypes {
  name: string;
}

export enum Modes  {
  ACTIVE,
  LOCKED,
  INVALID,
  CREATE
}

export class Activity extends React.Component <PropTypes, StateTypes> {

  constructor(props) {
    super(props);
    this.state = {
      name: this.getTitle(props),
    };
  }

  public componentWillReceiveProps(props) {
    this.setState({name: this.getTitle(props)});
  }

  public render() {

    let {mode, data, activityId, calendar} = this.props;
    let worklogs;

    if (mode !== Modes.CREATE) {
      let activity = data.entities.activity[activityId];
      worklogs = activity.worklogs.map(worklogId => {
        return data.entities.worklog[worklogId];
      });
    } else {
      worklogs = [];
    }

    return (
      <div className="activity-row">
        <Title {...this.props}
          activityMode={this.props.mode}
          value={this.state.name}
          onTitleChange={
                      (title, activityMode, callback) =>  this.onTitleChange(title, activityMode, callback)
                    }
        />
        { calendar.map((week, index) =>
          <Week {...this.props}
            ref={index.toString()}
            innerPath={ index.toString() }
            activityMode={this.props.mode}
            key={ index }
            data={ data }
            worklogs={worklogs}
            calendar={week}
            onWorklogChange={(worklog, duration, innerPath, callback) => {
                          this.onWorklogChange(worklog, duration, innerPath, callback);}
                        }
          />
        )}
      </div>
    );
  }

  private onTitleChange(name: string, activityMode: Modes, vallidationErrorCallback) {
    let activity = this.props.data.entities.activity[this.props.activityId];
    if (this.isExisting(name)) {
      if (name !== '' || (name === '' && activityMode !== Modes.CREATE)) {
        vallidationErrorCallback();
        return;
      } else {
        name = this.generateDefaultName();
      }
    }
    if (activity) {
      let worklogs = this.props.data.entities.activity[this.props.activityId].worklogs.map(worklogId => {
        return this.props.data.entities.worklog[worklogId];
      });
      this.props.saveActivity(this.props.activityId, name, worklogs);
    } else {
      this.setState({name: name});
    }
  }

  private onWorklogChange(worklog, duration, innerPath, vallidationErrorCallback) {
    let name = this.state.name;
    if (this.props.mode === Modes.CREATE && name === '' && this.isExisting(name)) name = this.generateDefaultName();

    let data = {
      taskId: this.props.taskId,
      activityId: this.props.activityId,
      activityName: name,
      duration: duration,
      silentFocus: this.props.mode === Modes.CREATE ? {
        path: `${this.props.path}/${name}/${innerPath}`,
      } : null,
    };
    let totalHoursForDay = this.props.totals[worklog.date] || 0;
    let updatedHoursForDay = totalHoursForDay - worklog.duration + duration;
    if (updatedHoursForDay > 24) {
      vallidationErrorCallback();
    } else {
      this.props.saveWorklog(worklog, data);
    }
  }

  private getTitle(props): string {
    return (props.mode === Modes.CREATE) ? '' : props.data.entities.activity[props.activityId].name;
  }

  private getActivityNamesByTaskId(taskId: number) {
    let activityIds = this.props.data.entities.task[this.props.taskId].activities;
    let activityNames = [];

    activityIds.forEach(activityId => {
      activityNames.push(this.props.data.entities.activity[activityId].name);
    });

    return activityNames;
  }

  private isExisting(name: string): boolean {
    let filteredList = this.props.data.entities.task[this.props.taskId].activities.filter(activityId => {
      return this.props.data.entities.activity[activityId].name === name;
    });
    return filteredList.length > 0;
  }

  private generateDefaultName(): string {
    let maxNumber = 0;

    this.getActivityNamesByTaskId(this.props.taskId).forEach(activityName => {
      if (activityName.match(/^Activity \d+$/)) {
        let activityNumber = parseInt(activityName.split(' ')[1], 10);
        maxNumber = (activityNumber > maxNumber) ? activityNumber : maxNumber;
      }
    });

    return `Activity ${maxNumber + 1}`;
  }

}
