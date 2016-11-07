import * as React from 'react';
import * as classNames from 'classnames';

import {CalendarModel} from '../../models/Calendar';
import {WorklogModel} from '../../models/Worklog';
import {Header} from './tableSection/SectionHeader';
import {Task} from './tableSection/Task';
import * as Waypoint from 'react-waypoint';

interface PropTypes {
  sectionType: Types;
  data: any;
  name?: string;
  path: string;
  tasks: any[];
  totals: any;
  totalProjectHours: any;
  timelocks?: any[];
  calendar: CalendarModel[];
  active: boolean;
  expanded: boolean;
  saveActivity(id: string, name: string, worklogs: WorklogModel[]);
  saveWorklog();
  setCurrentProject(project);
  showAlertModal();
  setNonProjectExpanded(expanded: boolean);
  setVacationExpanded(expanded: boolean);
}

interface StateTypes {
  expanded: boolean;
}

export enum Types {
  PROJECT,
  NON_PROJECT,
  VACATION
}

export class Section extends React.Component <PropTypes, StateTypes> {
  constructor(props) {
    super(props);
    this.state = {
      expanded: this.props.expanded,
    };
  }

  public componentWillReceiveProps(nextProps) {
    if (this.state.expanded !== nextProps.expanded) {
      this.setState({expanded: nextProps.expanded});
    }
  }

  public render() {

    let {name, tasks, sectionType, setCurrentProject, totalProjectHours} = this.props;

    let active = (sectionType === Types.VACATION) ? false : this.props.active;

    let sectionClassNames = classNames(
      'table-section',
      {
        'project': sectionType === Types.PROJECT,
        'non-project': sectionType === Types.NON_PROJECT,
        'vacation': sectionType === Types.VACATION,
        'open': this.state.expanded,
      }
    );

    return (
      <div
        className={ sectionClassNames }>
        <Header {...this.props}
          label={ name }
          totalHours={totalProjectHours}
          onClick={() => { this.toggleExpadedView(); }}
        />
        {(() => {
          if (!tasks || (tasks && !tasks.length)) {
            // TODO: this is for the down arrow do be displayed properly.
            //       Must be investigated and removed!!!
            return  <div className="journal-table__activities-section" key={0}/>;
          }
        })()}
        { tasks ? tasks.map(taskId =>
          <Task {...this.props}
            ref={this.props.data.entities.task[taskId].name}
            path={ `${this.props.path}/${this.props.data.entities.task[taskId].name}` }
            key={ taskId }
            taskId={ taskId }
            active={ active }/>
        ) : null /* TODO: maybe remove this, tasks will always be array */ }
        <Waypoint
          scrollableAncestor={window}
          topOffset="95px"
          onEnter={(args) => {
                        if(args.previousPosition === 'above') {
                          setCurrentProject(name);
                        }
                      }
                    }
        />
      </div>
    );
  }

  private toggleExpadedView() {
    if (this.props.sectionType !== Types.PROJECT) {
      this.setState({expanded: !this.state.expanded});
    }
    if (this.props.sectionType === Types.NON_PROJECT) {
      this.props.setNonProjectExpanded(!this.state.expanded);
    }
    if (this.props.sectionType === Types.VACATION) {
      this.props.setVacationExpanded(!this.state.expanded);
    }
  }
}
