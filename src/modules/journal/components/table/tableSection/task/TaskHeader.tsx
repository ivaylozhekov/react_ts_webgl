import * as React from 'react';
import {CalendarModel} from '../../../../models/Calendar';

interface PropTypes {
  title: string;
  calendar: CalendarModel[];
}

export class Header extends React.Component <PropTypes, {}> {
  public render() {
    let {title, calendar} = this.props;
    return (
      <div className="task-header">
        <div className="title-column">
                    <span className="task-name">
                        { title }
                    </span>
        </div>
        { calendar.map((week, index) =>
          <div className="week-column empty" key={index}/>
        )}
      </div>

    );
  }
}
