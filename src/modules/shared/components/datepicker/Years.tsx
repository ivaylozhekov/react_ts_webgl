import * as React from 'react';
import * as moment from 'moment';
import * as classNames from 'classnames';

import {Header} from './Header';
import {Mode, Navigate} from './DatePicker';

interface PropTypes {
  title: string;
  date: moment.Moment;
  timeParams: {
    date: string;
    timespan: string;
  };
  navigate(direction: Navigate);
  changeMode();
  changeDate(value);
}

interface StateTypes {
  date: moment.Moment;
}

export class Years extends React.Component <PropTypes, {}> {

  public render() {

    let setup = this.setup(this.props.date.format('YYYY'));
    let selectedYear = parseInt(moment(this.props.timeParams.date).format('YYYY'), 10);
    let {years, title} = setup;

    return (
      <div className="datepicker-years" style={{display: 'block'}}>
        <table className="table-condensed">
          <Header {...this.props} title={title} mode={Mode.YEARS}/>
          <tbody>
          <tr>
            <td colSpan={7}>
              {
                years.map(year => {
                  return (
                    <span className={
                                    classNames('year',
                                              {'old': years.indexOf(year) === 0 },
                                              {'new': years.indexOf(year) === 11 },
                                              {'selected': year === selectedYear }
                                  )}
                          onClick={() => {this.props.changeDate(year); }}
                          key={year}>{year}
                            </span>
                  );
                })
              }
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    );
  }

  private setup(year: string) {
    let startYear = parseInt(moment(year, 'YYYY', true).subtract(5, 'years').format('YYYY'), null);
    let endYear = 0;
    let years = [];
    for (let i = startYear; i <= startYear + 11; i++) {
      years.push(i);
      endYear = i;
    }
    return {
      years: years,
      title: `${startYear} - ${endYear}`,
    };
  }

}
