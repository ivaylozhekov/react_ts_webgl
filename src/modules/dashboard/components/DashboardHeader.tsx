import {JOURNAL} from '../../../constants';
import * as React from 'react';
import {browserHistory} from 'react-router';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import * as classNames from 'classnames';

interface PropTypes {}

interface StateTypes {
  activeTab: number;
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

export class Header extends React.Component <PropTypes, StateTypes> {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 0,
    };
  }
  public render() {
    return (
      <section className="dashboard-header">
        <span className={classNames('tab', {'active': this.state.activeTab === 0})} onClick={ () => {
          this.setState({activeTab: 0});
          browserHistory.push('/visualiser/intro');
        }}>Intro</span>
        <span className={classNames('tab', {'active': this.state.activeTab === 2})} onClick={ () => {
          this.setState({activeTab: 2});
          browserHistory.push('/visualiser/simpleColors');
        }}>Simple Colors</span>
        <span className={classNames('tab', {'active': this.state.activeTab === 3})} onClick={ () => {
          this.setState({activeTab: 3});
          browserHistory.push('/visualiser/lighting');
        }}>Lighting</span>
        <span className={classNames('tab', {'active': this.state.activeTab === 4})} onClick={ () => {
          this.setState({activeTab: 4});
          browserHistory.push('/visualiser/lighting');
        }}>Transformations</span>
        <span className={classNames('tab', {'active': this.state.activeTab === 5})} onClick={ () => {
          this.setState({activeTab: 5});
          browserHistory.push('/visualiser/lighting');
        }}>Picking</span>
      </section>
    );
  }

// <span className={classNames('tab', {'active': this.state.activeTab === 1})} onClick={ () => {
//   this.setState({activeTab: 1});
//   browserHistory.push('/visualiser/complexGraphics');
// }}>Complex Graphics</span>

}
export default connect(mapStateToProps, mapDispatchToProps)(Header);
