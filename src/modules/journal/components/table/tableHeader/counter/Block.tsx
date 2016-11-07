import * as React from 'react';
import * as classNames from 'classnames';
import {DayCell} from './DayCell';
import {WeekCell} from './WeekCell';

interface CounterBlockPropTypes {
  calendar: any;
  limits: any[];
  totalHours: any;
}

export class Block extends React.Component <CounterBlockPropTypes, {}> {
  private scrollable;

  public render() {
    let {calendar, limits, totalHours} = this.props;

    return (
      <div className="data-column-scroll" ref={me => this.scrollable = me}>
        {
          calendar.map((week, i) => {
            return (
              <div key={i}
                   className={classNames('week-column', { 'current-week': week.currentWeek})}>
                <WeekCell
                  week={week}
                  totalHours={totalHours}
                  limit={limits[i]}
                  showWeeklyTotals={(calendar.length > 1)}
                />
                <div className="daily-totals-row">
                  {
                    week.days.map(day => {
                      return (
                        <DayCell key={day.date} day={day} totalHours={totalHours}/>
                      );
                    })
                  }
                </div>
              </div>
            );
          })
        }
      </div>
    );
  }
}
