import {JOURNAL} from '../../../../constants';
import * as React from 'react';
import * as classNames from 'classnames';
import {FormattedMessage as T} from 'react-intl';

interface PropTypes {
  currentTimespan: string;
  changeTimespan(timespan: string): void;
}

export class TimespanSwitcher extends React.Component <PropTypes, {}> {

  public render() {
    const {WEEK, TWO_WEEKS} = JOURNAL.URL;
    const {currentTimespan, changeTimespan} = this.props;

    return (
      <nav className="time-period-navigation">
        <ul>
          <li className={classNames('time-period--week', {'disabled': currentTimespan === WEEK})}>
            <a onClick={(e) => {
                            if (currentTimespan !== WEEK) changeTimespan(WEEK);
                        }}>
              <T id="journal.timespan.week"/></a>
          </li>
          <li className={classNames('time-period--two_weeks', {'disabled': currentTimespan === TWO_WEEKS})}>
            <a onClick={() => {
                            if (currentTimespan !== TWO_WEEKS) changeTimespan(TWO_WEEKS);
                        }}>
              <T id="journal.timespan.two_weeks"/></a>
          </li>
        </ul>
      </nav>
    );
  }
}
