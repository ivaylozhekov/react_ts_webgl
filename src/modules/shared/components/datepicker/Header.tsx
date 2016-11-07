import * as React from 'react';
import {Mode, Navigate} from './DatePicker';

interface PropTypes {
  title: string;
  mode: Mode;
  weekStart?: number;
  navigate(direction: Navigate);
  changeMode();
}

export class Header extends React.Component <PropTypes, {}> {

  public render() {
    const {navigate, changeMode} = this.props;
    let weekDays = this.setWeekDays(this.props.weekStart);

    return (
      <thead>
      <tr>
        <th onClick={() => {navigate(Navigate.BACK);}}
            className="prev" style={{visibility: 'visible'}}>«
        </th>
        <th colSpan={5}
            className="datepicker-switch"
            onClick={changeMode}>{this.props.title}
        </th>
        <th onClick={() => {navigate(Navigate.FORWARD);}}
            className="next" style={{visibility: 'visible'}}>»
        </th>
      </tr>
      {(() => {
        if (this.props.mode === Mode.DAYS) {
          return (
            <tr>
              {
                weekDays.map((day, index) => {
                  return <th key={index} className="dow"> {day}</th>;
                })
              }
            </tr>
          );
        }
      })()}
      </thead>
    );
  }

  private setWeekDays(startDay) {
    let defaultWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    let transitDays = defaultWeek.splice(0, startDay);
    let week = defaultWeek.concat(transitDays);
    return week;
  }
}
