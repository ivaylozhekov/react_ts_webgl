import * as React from 'react';
import * as classNames from 'classnames';

interface PropTypes {
  visible: boolean;
}

export class LoaderSpinner extends React.Component <PropTypes, {}> {
  public render() {
    const {visible} = this.props;
    return (
      <div className={classNames('loader', {'open': visible})}>
        <span><i className="fa fa-spin fa-cog"/></span>
      </div>
    );
  }
}
