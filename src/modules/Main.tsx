import * as React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Header} from './shared/components/header/Header';


interface PropTypes {
  stage: any;
  stageHeader: any;
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

@connect(mapStateToProps, mapDispatchToProps)
export class Main extends React.Component<PropTypes, {}> {
  public render() {
    const {stage, stageHeader} = this.props;
    return (
      <div className="main-container">
        <Header
            {...this.props}
            title={"React & TS & WebGL & Webpack"}
          />
        <main>
          {stageHeader}
          {stage}
        </main>
      </div>
    );
  }
}
;

export const onEnter = (store, next, replace, callback) => {
  callback();
};
