import * as React from 'react';

interface PropTypes {}

export class App extends React.Component <PropTypes, {}> {
  public render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }

}

export const onEnter = (next, replace) => {

};
