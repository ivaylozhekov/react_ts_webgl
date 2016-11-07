import assign = require('object-assign');
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as moment from 'moment';
import {URL_DATE_FORMAT} from '../../../../constants/formats';

import {Days} from './Days';
import {Months} from './Months';
import {Years} from './Years';

export const enum Mode {
  DAYS, MONTHS, YEARS
}

export const enum Navigate {
  BACK, FORWARD
}

const enum WeekStartDay {
  SUNDAY, MONDAY,
}

interface PropTypes {
  period: {
    timespan: string;
    date: string;
  };
  startDate: string;
  endDate: string;
  onChange(date: string);
}

interface StateTypes {
  visible: boolean;
  date: moment.Moment;
  mode: Mode;
  weekStart: WeekStartDay;
}

export class DatePicker extends React.Component <PropTypes, StateTypes> {

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      date: moment(),
      mode: Mode.DAYS,
      weekStart: WeekStartDay.MONDAY,
    };
  }

  public componentDidMount() {
    document.addEventListener('click', this.hidePicker.bind(this), true);
  }

  public componentWillUnmount() {
    document.removeEventListener('click', this.hidePicker.bind(this), true);
  }

  public hidePicker(e: Event) {
    let target: any = e.target;
    if (!ReactDOM.findDOMNode(this).contains(target) && this.state.visible === true) {
      this.setState(assign({}, this.state, {visible: false}));
    }
  }

  public render() {

    let body: React.ReactElement <{}>;

    switch (this.state.mode) {
      case Mode.DAYS:
        body = <Days title={this.state.date.format('MMMM YYYY')}
                     date={this.state.date}
                     weekStart={this.state.weekStart}
                     startDate={this.props.startDate}
                     endDate={this.props.endDate}
                     navigate={(direction) => {this.navigate(direction);}}
                     changeMode={() => {this.changeMode();}}
                     changeDate={(value, offset) => {this.changeDate(value, offset); }}/>;
        break;
      case Mode.MONTHS:
        body = <Months title={this.state.date.format('YYYY')}
                       timeParams={this.props.period}
                       navigate={(direction) => {this.navigate(direction);}}
                       changeMode={() => {this.changeMode();}}
                       changeDate={(value) => {this.changeDate(value);}}/>;
        break;
      case Mode.YEARS:
        body = <Years title={this.state.date.format('YYYY - YYYY')}
                      date={this.state.date}
                      timeParams={this.props.period}
                      navigate={(direction) => {this.navigate(direction);}}
                      changeMode={() => {this.changeMode();}}
                      changeDate={(value) => {this.changeDate(value);}}/>;
        break;
      default:
        throw Error('Datepicker require proper dispay mode.');
    }

    return (
      <div className="datepicker datepicker-dropdown dropdown-menu datepicker-orient-left datepicker-orient-top"
           style={{display: (this.state.visible) ? 'block' : 'none'}}
           id="qa-datepicker"
      >
        {body}
      </div>
    );
  }

  public toggle(visible: boolean, activeDate?: string) {

    let date: moment.Moment;

    if (moment(activeDate).isValid()) {
      date = moment(activeDate, URL_DATE_FORMAT);
    } else {
      date = moment();
    }

    this.setState(
      assign({}, this.state, {
        visible: visible,
        mode: (!this.state.visible) ? Mode.DAYS : this.state.mode,
        date: date,
      })
    );
  }

  private changeMode() {
    this.setState(
      assign({}, this.state, {
        mode: (this.state.mode !== Mode.YEARS) ? this.state.mode + 1 : this.state.mode,
      })
    );
  }

  private changeDate(value: number, offset?: number) {

    let date: moment.Moment;
    let callCallback: boolean = false;

    switch (this.state.mode) {
      case Mode.YEARS:
        date = moment(this.state.date).year(value);
        break;
      case Mode.MONTHS:
        date = moment(this.state.date).month(value);
        break;
      case Mode.DAYS:
        callCallback = true;
        date = moment(value);
        break;
      default:
        throw Error('Datepicker error.');

    }

    this.setState(
        assign({}, this.state, {
          visible: (this.state.mode === Mode.DAYS) ? false : this.state.mode,
          mode: (this.state.mode !== Mode.DAYS) ? this.state.mode - 1 : Mode.DAYS,
          date: date,
        })
    );

    if (callCallback) {
      this.props.onChange(date.format(URL_DATE_FORMAT));
    }

  }

  private navigate(direction: Navigate) {

    let operation: string;
    let offset: number;

    if (direction === Navigate.BACK) operation = 'subtract';
    else if (direction === Navigate.FORWARD) operation = 'add';
    else throw Error('Datepicker error.');

    switch (this.state.mode) {
      case Mode.DAYS:
        offset = 1;
        break;
      case Mode.MONTHS:
        offset = 12;
        break;
      case Mode.YEARS:
        offset = 132;
        break;
      default:
        throw Error('Datepicker error.');
    }

    this.setState(
      assign({}, this.state, {
        date: moment(this.state.date)[operation](offset, 'months'),
      })
    );
  }
}
