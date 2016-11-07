import * as React from 'react';
import * as moment from 'moment';
import * as classNames from 'classnames';
import {browserHistory} from 'react-router';
import {DatePicker} from '../../../../shared/components/datepicker';
import {URL_DATE_FORMAT} from '../../../../../constants/formats';
import {FormattedMessage as T} from 'react-intl';

interface PropTypes {
  actor: any;
  period: {
    timespan: string;
    date: string;
  };
  calendar: any[];
  location: any;
}

export class Navigator extends React.Component <PropTypes, {}> {

  private picker: DatePicker;

  public render() {
    let {timespan, date} = this.props.period;
    let {startDate, endDate} = this.setup(this.props.calendar, timespan);

    return (
      <div className="time-navigation">
        <div className="datepicker-container">
          <div className="datepicker-trigger" id="qa-datepicker-trigger"
               onClick={(e) => {this.picker.toggle(true, startDate.format(URL_DATE_FORMAT));
          }}>
            <span className="selected-period">{startDate.format('MMM DD')} - {endDate.format('MMM DD')}</span>
            <span className="calendar-icon"><i className="fa fa-calendar white"></i></span>
          </div>
          <DatePicker ref={(picker) => this.picker = picker}
                      onChange={(newDate) => {this.changeDate(newDate, timespan);}}
                      period={this.props.period}
                      startDate={startDate.format(URL_DATE_FORMAT)}
                      endDate={endDate.format(URL_DATE_FORMAT)}/>
        </div>
        <a className={
            classNames('current-week-button',
                       'btn',
                      {'disabled': moment().isBetween(startDate, endDate)}
            )}
           title="current week"
           id="qa-current-week-btn"
           onClick={() => {
             this.changeDate(moment().format('YYYY-MM-DD'), timespan);
           }}>
          <span className="current-week-btn-label">
            <T id="journal.header.current_week"/>
          </span>
        </a>
        <a className="previous-period-button"
           id="qa-previous-period-btn"
           onClick={() => {
             let newDate = moment(date, 'YYYY-MM-DD').subtract(1, 'week').format('YYYY-MM-DD');
             this.changeDate(newDate, timespan);
           }}>
        </a>
        <a className="next-period-button"
           id="qa-next-period-btn"
           onClick={() => {
             let newDate = moment(date, 'YYYY-MM-DD').add(1, 'week').format('YYYY-MM-DD');
             this.changeDate(newDate, timespan);
           }}>
        </a>
      </div>
    );
  }

  private changeDate(date: string, timespan: string) {
    browserHistory.push(`/journal/${date}/${timespan}${this.props.location.search}`);
  }

  private setup(calendar, timespan) {
    let startDate: moment.Moment;
    let endDate: moment.Moment;

    startDate = moment(calendar[0].days[0].date, 'YYYY-MM-DD');
    switch (timespan) {
      case 'week':
        endDate = moment(calendar[0].days[6].date, 'YYYY-MM-DD');
        break;
      case 'two_weeks':
        endDate = moment(calendar[1].days[6].date, 'YYYY-MM-DD');
        break;
      default:
        throw Error('Navigator error.');
    }

    return {
      startDate: startDate,
      endDate: endDate,
    };
  }
}
