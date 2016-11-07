import * as React from 'react';
import * as moment from 'moment';
import * as classNames from 'classnames';
import {URL_DATE_FORMAT} from '../../../../constants/formats';

import {Header} from './Header';
import {Mode, Navigate} from './DatePicker';

interface PropTypes {
  title: string;
  timeParams: {
    date: string;
    timespan: string;
  };
  navigate(direction: Navigate);
  changeMode();
  changeDate(value);
}

export class Months extends React.Component <PropTypes, {}> {

  public render() {
    return (
      <div className="datepicker-months" style={{display: 'block'}}>
        <table className="table-condensed">
          <Header {...this.props} mode={Mode.MONTHS}/>
          <tbody>
          <tr>
            <td colSpan={7}>
              {
                moment.monthsShort().map(month => {
                  return (
                    <span key={month}
                          className={
                                        classNames('month',
                                                  {'selected': this.isSelected(month)}
                                        )}
                          onClick={() => {this.props.changeDate(month); }}>{month}
                              </span>
                  );
                })
              }
            </td>
          </tr>
          </tbody>
        </table>
      </div>);
  }

  private isSelected(month: string) {
    let selectedDate = this.props.timeParams.date;
    let yearInView = parseInt(this.props.title, 10);
    let currentMonth = moment().year(yearInView).month(month).date(1).format(URL_DATE_FORMAT);
    return moment(selectedDate).isSame(currentMonth, 'month');
  }
}
