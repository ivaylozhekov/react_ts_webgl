import * as React from 'react';
import * as moment from 'moment';
import * as classNames from 'classnames';
import {URL_DATE_FORMAT} from '../../../../constants/formats';

import {Header} from './Header';

import {Mode, Navigate} from './DatePicker';

interface PropTypes {
  title: string;
  date: moment.Moment;
  weekStart: number;
  startDate: string;
  endDate: string;
  navigate(direction: Navigate);
  changeMode();
  changeDate(value: number, offset: number);
}

export class Days extends React.Component <PropTypes, {}> {

  public render() {
    let weeks = this.getWeeks(this.props.date);

    return (
      <div className="datepicker-days" style={{display: 'block'}}>
        <table className=" table-condensed">
          <Header {...this.props} mode={Mode.DAYS} weekStart={this.props.weekStart}/>
          <tbody>
          {
            weeks.map((week, index) => {
              return (
                <tr key={index}>
                  {
                    week.map(day => {
                      return (
                        <td
                          key={day.day}
                          className={
                              classNames('day',
                                        {'old': day.offset === -1},
                                        {'new': day.offset === 1},
                                        // {'today': day.today},
                                        {'selected': day.selected}
                              )}
                          onClick={() => {this.props.changeDate(day.date, day.offset);}}
                        >{day.day}
                        </td>);
                    })
                  }
                </tr>
              );
            })

          }
          </tbody>
        </table>
      </div>
    );

  }

  private getWeeks(date: moment.Moment) {

    let today = moment().format(URL_DATE_FORMAT);
    let initialDate = moment(date).format(URL_DATE_FORMAT);
    let weekStart = this.props.weekStart;
    let periodStart = this.props.startDate;
    let periodEnd = this.props.endDate;

    date.date(1).format('d');
    let firstWeekDay = moment(date).isoWeekday();
    let startDate = moment(date).subtract({days: firstWeekDay - weekStart}).format(URL_DATE_FORMAT);

    let days = [];
    let weeks = [];

    for (let i = 0; i < 42; i++) {
      let day = moment(startDate).add({days: i});
      days.push({
        offset: this.getOffset(day, initialDate),
        day: moment(day).format('D'),
        date: moment(day).format(URL_DATE_FORMAT),
        selected: moment(day).isBetween(periodStart, periodEnd, null, '[]'),
        today: moment(day).isSame(today, 'day'),
      });
    }

    for (let i = 0; i < 41; i = i + 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  }

  private getOffset(comparedDate, initialDate) {
    let offset = moment(comparedDate).month() - moment(initialDate).month();
    switch (offset) {
      case 11:
        return -1;
      case -11:
        return 1;
      default:
        return offset;
    }
  }
}
