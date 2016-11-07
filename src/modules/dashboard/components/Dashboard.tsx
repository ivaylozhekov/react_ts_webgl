import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Visualiser3D } from '../../visualiser3D/components/Visualiser3D';

interface PropTypes {
  mainComponent: any
}

const mapStateToProps = (state, ownProps = {}) => {
  return {
    /* ... */
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    /* ... */
  }, dispatch);
};

export class Dashboard extends React.Component<PropTypes, {}> {

  public render() {
    const {mainComponent} = this.props;
    return (
      <div className="dashboard">
        {mainComponent}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);

export const onEnter = (store, next, replace, callback) => {
  callback();
};
