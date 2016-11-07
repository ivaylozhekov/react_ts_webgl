import * as React from 'react';
import {FormattedMessage as T} from 'react-intl';
import {CalendarModel} from '../../../models/Calendar';
import {Types as sectionTypes} from '../TableSection';
import * as Waypoint from 'react-waypoint';

interface PropTypes {
  label?: string;
  sectionType: sectionTypes;
  calendar: CalendarModel[];
  totalHours: number;
  onClick(e);
  setCurrentProject(project);
}

export class Header extends React.Component <PropTypes, {}> {
  private nonProjectLabel;
  private vacationLabel;

  public render() {
    let {sectionType, onClick, calendar, totalHours} = this.props;
    let label;

    switch (sectionType) {
      case sectionTypes.PROJECT:
        label = this.props.label;
        break;
      case sectionTypes.NON_PROJECT:
        label = <T id="journal.sections.header.non_project" ref={me => this.nonProjectLabel = me}/>;
        break;
      case sectionTypes.VACATION:
        label = <T id="journal.sections.header.vacation" ref={me => this.vacationLabel = me}/>;
        break;
      default:
        throw 'Unknown tableSection type.';
    }

    return (
      <div className="section-header" onClick={onClick}>
        <div className="title-column">
              <span className="project-name">
              <Waypoint
                scrollableAncestor={window}
                topOffset="95px"
                onLeave={(args) => {
                  this.setCurrentProject(args.currentPosition, label);
                }}/>
                { label }
              </span>
          <span className="reported">
            <T id="journal.sections.header.reported" />&nbsp;
              <strong>
                { (totalHours % 1 === 0) ? totalHours : totalHours.toFixed(2) }
              </strong>
          </span>
        </div>
        { calendar.map((week, index) =>
          <div className="week-column empty" key={index}/>
        )}
      </div>
    );
  }

  private setCurrentProject(labelPosition, labelObj) {
    let {sectionType, setCurrentProject} = this.props;
    if (labelPosition === 'above') {
      switch (sectionType) {
        case sectionTypes.PROJECT:
          setCurrentProject(labelObj);
          break;
        case sectionTypes.NON_PROJECT:
          if (this.nonProjectLabel) {
            let projectName = this.nonProjectLabel.context.intl.messages[this.nonProjectLabel.props.id];
            setCurrentProject(projectName);
          }
          break;
        case sectionTypes.VACATION:
          if (this.vacationLabel) {
            let projectName = this.vacationLabel.context.intl.messages[this.vacationLabel.props.id];
            setCurrentProject(projectName);
          }
          break;
        default:
          throw 'Unknown project label.';
      }
    }
  }
}
