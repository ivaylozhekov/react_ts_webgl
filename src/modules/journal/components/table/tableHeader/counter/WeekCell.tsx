import * as React from 'react';
import * as classNames from 'classnames';
import {FormattedMessage as T} from 'react-intl';

interface CounterWeekCellPropTypes {
  week: any;
  limit: number;
  totalHours: any;
  showWeeklyTotals: boolean;
}

export class WeekCell extends React.Component <CounterWeekCellPropTypes, {}> {
  public render() {
    let {week, limit, totalHours, showWeeklyTotals} = this.props;
    let total = 0;
    week.days.forEach(day => {
      if (totalHours[day.date]) {
        total += totalHours[day.date];
      }
    });
    return (
      <div className={classNames('week-total-row', {'overtime-week': total > limit })}>
        {(() => {
          if(showWeeklyTotals === true) {
            return <T id="journal.totals.total_for_week"
                      values={{total: (total % 1 === 0) ? String(total) : total.toFixed(2), limit: limit}}
                   />;
          }
        })()}
        { week.currentWeek ? <span className="current-week-label">current week</span> : '' }
      </div>
    );
  }
}
