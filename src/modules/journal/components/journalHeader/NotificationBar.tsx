import assign = require('object-assign');
import * as React from 'react';
import {FormattedMessage as T} from 'react-intl';

const enum Modes {
  INACTIVE, ERRORS, SAVING, OFFLINE
}

interface PropTypes {
  offline: boolean;
  saving: boolean;
  services: any[];
}

interface StateTypes {
  mode: Modes;
  errors: T[];
}

export class NotificationBar extends React.Component<PropTypes, StateTypes> {

  private errorRefs = {};
  private currentErrorIndex: number = 0;

  constructor(props: any) {
    super(props);
    this.state = {
      mode: Modes.INACTIVE,
      errors: [],
    };
  }

  public componentWillReceiveProps(props, state) {
    let errors = this.getServiceErrors(props);
    if (props.offline === true) this.setState(assign({}, this.state, {mode: Modes.OFFLINE}));
    else if (props.saving === true) this.setState(assign({}, this.state, {mode: Modes.SAVING}));
    else if (errors.length > 0) {
      this.currentErrorIndex = 0;
      this.setState(assign({}, this.state, {mode: Modes.ERRORS, errors: errors}));
    }
    else this.setState(assign({}, this.state, {mode: Modes.INACTIVE}));
  }

  public componentDidMount() {
    this.cycleErrors();
  }

  public render() {
    return (
      <div className="notification-bar">
        {
          (() => {
            switch (this.state.mode) {
              case Modes.INACTIVE:
                return null;
              case Modes.ERRORS:
                return (
                  <div className="errors-block">
                    <span className="tooltip-trigger">
                      <i className="fa fa-exclamation-circle fa-2x">
                      </i>
                      <span className="tooltip-body">
                        {
                          this.state.errors.map((error, index) => {
                            return <div key={index}> {error} </div>;
                          })
                        }
                      </span>
                    </span>
                    {
                      this.state.errors.map((error, index) => {
                        return (
                          <span className="error-message-container"
                                key={index}
                                ref={me => this.errorRefs[index] = me}
                                style={{ display: 'none' }}>
                            {error}
                          </span>
                        );
                      })
                    }
                  </div>
                );
              case Modes.SAVING:
                return (
                  <div className="saving-loader">
                    <span className="saving-loader__spinner">
                    </span>
                    <span className="saving-loader__label">
                      <T id="shared.saving"/>
                    </span>
                  </div>
                );
              case Modes.OFFLINE:
                return (
                  <div className="offline-indicator">
                    <T id="shared.offline"/>
                  </div>
                );
              default:
                throw 'Unknown notification type';
            }
          })()
        }
      </div>
    );
  }

  private cycleErrors() {
    setTimeout(() => {
      this.cycleErrors();
    }, 3500);
    if (this.state.mode === Modes.ERRORS) this.flashError();
  }

  private flashError() {
    if (this.state.errors.length === 0 || this.currentErrorIndex === -1) return; // Nobody home!

    this.errorRefs[this.currentErrorIndex].style.display = 'block';
    setTimeout(() => {
      this.errorRefs[this.currentErrorIndex].style.display = 'none';
      if (this.currentErrorIndex < this.state.errors.length - 1) this.currentErrorIndex++;
      else this.currentErrorIndex = -1;
    }, 3000);

  }

  private getServiceErrors(props) {
    let errors = [];
    for (let service in props.services) {
      if (props.services[service] === false) {
        errors.push(<T id={`shared.errors.connection.${service}`}/>);
      }
    }
    return errors;
  }

}
