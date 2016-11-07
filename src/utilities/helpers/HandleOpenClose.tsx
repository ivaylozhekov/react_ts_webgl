import * as React from 'react';
import * as ReactDOM from 'react-dom';

export function handleOpenClose(Component) {
  class Wrapper extends React.Component<any, any> {
    private container;

    constructor(props) {
      super(props);
      this.state = {
        isOpened: props.isOpened !== undefined ? props.isOpened : false,
      };
    }

    public componentWillMount() {
      document.addEventListener('click', this.onClick);
    }

    public componentWillUnmount() {
      document.removeEventListener('click', this.onClick);
    }

    public componentWillReceiveProps(nextProps) {
      if (nextProps.isOpened !== undefined) {
        this.setState({isOpened: nextProps.isOpened});
      }
    }

    public render() {
      return (
        <Component
          {...this.props}
          ref={(me) => this.container = me}
          isOpened={this.state.isOpened}
          handleOpenClose={() => this.handleOpenClose()}>
        </Component>
      );
    }

    private generateOutsideCheck(current, componentNode) {
      if (!ReactDOM.findDOMNode(componentNode).contains(current) && this.state.isOpened) {
        this.handleOpenClose();
      }
    }

    private onClick = (e) => {
      this.generateOutsideCheck(e.target, this.container.targetElement ? this.container.targetElement : this.container);
    }

    private handleOpenClose() {
      if (this.state.isOpened && this.container.handleClose && typeof this.container.handleClose === 'function') {
        this.container.handleClose();
      } else {
        this.setState({isOpened: !this.state.isOpened});
      }
    }
  }
  return Wrapper;
};
