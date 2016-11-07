import * as React from 'react';
import {Navigator} from './tableHeader/Navigator';
import {Calendar} from './tableHeader/Calendar';
import {Counter} from './tableHeader/Counter';
import * as Waypoint from 'react-waypoint';

interface PropTypes {
  actor: any;
  period: {
    timespan: string;
    date: string;
  };
  calendar: any[];
  totalHours: any;
  location?: any;
}

export class Header extends React.Component <PropTypes, {}> {
  private headerWrapper;
  private counter;
  private calendar;

  public render() {
    let {calendar, totalHours} = this.props;
    return (
      <div className="table-header">
        <Waypoint
          scrollableAncestor={window}
          onEnter={() => {
            if(this.headerWrapper) {
              this.headerWrapper.className = 'header-section';
            }
          }}
          onLeave={() => {
            if(this.headerWrapper) {
              this.headerWrapper.className = 'header-section fixed-header';
            }
          }}/>
        <div className="header-section" ref={me => this.headerWrapper = me}>
          {/* Todo need to extract the calendar section in separate container*/}
          <div className="header-row calendar-navigation">
            <div className="title-column">
              <Navigator {...this.props} />
            </div>

            <div className="data-column-container">
              <Calendar calendar={calendar}
                        ref={me => this.calendar = me}
              />
            </div>
          </div>
          <Counter calendar={calendar}
                   totalHours={totalHours}
                   ref={me => this.counter = me}
          />
        </div>
      </div>
    );
  }
}
