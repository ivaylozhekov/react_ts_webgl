import * as React from 'react';
import {LoaderSpinner} from '../loaderSpinner/LoaderSpinner';
import assign = require('object-assign');

interface PropTypes {
  visible: boolean;
  showSpinner?: boolean;
}

interface StateTypes {
  visible: boolean;
  showSpinner: boolean;
}

export class Loader extends React.Component<PropTypes, StateTypes> {
  private progress;
  private worker;
  private closing: boolean = true;
  private listenerAdded: boolean = false;

  constructor(props) {
    super(props);
    const myWorker = require('webworker-loader!./LoaderWorker.js');
    this.worker = new myWorker();
    this.state = {
      visible: props.visible,
      showSpinner: false,
    };
  }

  public componentDidMount() {
    this.worker.onmessage = (event) => {
      if (this.props.visible) {
        if (this.progress) this.progress.style.width = `${event.data}%`;
        if (event.data === 100) {
          setTimeout(() => {
            if (!this.closing) {
              this.setState(assign({}, this.state, {
                showSpinner: true,
              }));
            }
          }, 500);
        }
      }
    };
  }

  public componentWillReceiveProps(nextProps) {
    if (nextProps.visible) {
      if (this.closing) {
        if (this.progress) this.progress.style.width = '0%';
        this.closing = false;
        this.setState(assign({}, this.state, {
          visible: true,
          showSpinner: false,
        }));
        this.worker.postMessage('start');
      }
    } else {
      if (this.progress) {
        this.progress.classList.add('fast-closing');
        this.closing = true;
        if (this.state.showSpinner) {
          this.setState(assign({}, this.state, {
            visible: false,
            showSpinner: false,
          }));
        } else {
          if (!this.listenerAdded) {
            this.listenerAdded = true;
            setTimeout(() => {
              const transitionEvent = this.whichTransitionEvent(this.progress);
              this.progress.addEventListener(transitionEvent, this.onTransitionEnd(this.progress));
            }, 0);
          }
        }
      }
    }
  }

  public render(): JSX.Element {
    if (this.state.visible === true) {
      return (
        <div>
          <div className="uui-progress-bar small main-loader">
            <div
              ref={me => this.progress = me}
              className="uui-progress raspberry">
            </div>
          </div>
          <div className="transparent-overlay"></div>
          <LoaderSpinner visible={this.state.showSpinner}/>
        </div>
      );
    } else {
      return null;
    }
  }

  private whichTransitionEvent(element) {
    let t;
    const transitions = {
      'transition': 'transitionend',
      'OTransition': 'oTransitionEnd',
      'MozTransition': 'transitionend',
      'WebkitTransition': 'webkitTransitionEnd',
    };

    for (t in transitions) {
      if (element.style[t] !== undefined) {
        return transitions[t];
      }
    }
  }

  private onTransitionEnd(element) {
    if (this.closing) {
      setTimeout(() => {
        this.setState(assign({}, this.state, {
          visible: false,
        }));
        element.classList.remove('fast-closing');
        this.listenerAdded = false;
        setTimeout(() => {
          element.style.width = '0%';
        }, 0);
      }, 300);
    }
  }
}
