import * as React from 'react';
import {Cell} from './calendar/Cell';

interface CalendarPropTypes {
  calendar: any[];
}

export class Calendar extends React.Component <CalendarPropTypes, {}> {
  private scrollable;

  public render() {
    let {calendar} = this.props;

    return (
      <div className="data-column-scroll" ref={me => this.scrollable = me}>
        {
          calendar.map((week, i) => {
            return (
              <div key={i} className="week-column">
                {
                  week.days.map(day => {
                    return (
                      <Cell key={day.date} day={day}/>
                    );
                  })
                }
              </div>
            );
          })
        }
      </div>
    );
  }
}
