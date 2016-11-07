import * as React from 'react';
import {Block} from './counter/Block';
import {FormattedMessage as T} from 'react-intl';

interface CounterPropTypes {
  calendar: any;
  totalHours: any;
}

interface CounterStateTypes {
  periodLimit: number;
  weekLimits: any[];
}

export class Counter extends React.Component <CounterPropTypes, CounterStateTypes> {
  private currentProjectName;
  private block;

  constructor(props: any) {
    super(props);
    this.state = {
      periodLimit: 0,
      weekLimits: [],
    };
  }

  public componentWillMount() {
    this.calculateTotals(this.props.calendar);
  }

  public componentWillReceiveProps(props) {
    this.calculateTotals(props.calendar);
  }

  public calculateTotals(calendar) {
    let weekLimits = [];
    calendar.map((week, i) => {
        let weekTotal = 0;
        week.days.map(day => {
            weekTotal += day.normHours;
          }
        );
        weekLimits.push(weekTotal);
      }
    );
    let periodLimit = weekLimits.reduce((a, b) => {
      return a + b;
    });
    this.setState({weekLimits, periodLimit});
  }

  public render() {
    let {calendar, totalHours} = this.props;
    let total = 0;
    Object.keys(totalHours).forEach(key => total += totalHours[key]);
    return (
      <div className="header-row hours-counter">

        <div className="title-column">
          <div className="total-hours" id="qa-period-total-hours">
            <T id="journal.totals.total_for_period"
               values={{total: (total % 1 === 0) ? String(total) : total.toFixed(2), limit: this.state.periodLimit }}
            />
          </div>
          <div className="current-project-name" ref={me => this.currentProjectName = me}></div>
        </div>

        <div className="data-column-container">
          <Block
            calendar={calendar}
            limits={this.state.weekLimits}
            totalHours={totalHours}
            ref={me => this.block = me}
          />
        </div>
      </div>
    );
  }
}
