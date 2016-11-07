import * as React from 'react';
import * as classNames from 'classnames';
import * as moment from 'moment';

interface CalendarCellPropTypes {
  day: any;
}

export class Cell extends React.Component<CalendarCellPropTypes, {}> {
  public render() {
    let {day} = this.props;
    let date = moment(day.date);

    return (
      <div className={
        classNames('day-cell', 'calendar-cell',
          { 'day-off-cell': !day.workDay },
          { 'today-cell': day.today }
        )
      }>
        <div className="day-of-week">{date.format('dddd')}</div>
        <div className="date-of-day">{date.format('D')}</div>
      </div>
    );
  }
}
