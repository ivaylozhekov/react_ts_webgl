import * as React from 'react';

interface PropTypes {
  title: string;
  hidePanel();
}

export class ChoosePersonHeader extends React.Component<PropTypes, {}> {
  public render() {
    return (
      <div className="header">
        <a className="row">
          <i className="fa fa-arrow-left" onClick={this.props.hidePanel}></i>
          <span className="title">{this.props.title}</span>
        </a>
      </div>
    );
  }
}
