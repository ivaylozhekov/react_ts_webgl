import * as React from 'react';
import * as classNames from 'classnames';
import {URL_DATE_FORMAT} from '../../../../../../constants/formats';
import * as moment from 'moment';

interface PropTypes {
  day: any;
  totalHours: any;
}

export class DayCell extends React.Component <PropTypes, {}> {

  public render() {
    let {day, totalHours} = this.props;
    let date = moment(day.date);
    let today = moment().format(URL_DATE_FORMAT);
    let value = totalHours[day.date] || 0;

    if (value && value % 1 !== 0) value = value.toFixed(2);

    return (
      <div className="day-cell counter-cell">
              <span className={
                      classNames('sum-circle ', {
                                 'past': date.isBefore(today),
                                 'future': date.isSameOrAfter(today),
                                })
              }>
              { (date.isSameOrBefore(today) || value > 0) ? value : '' }
              </span>
      </div>
    );
  }

}
