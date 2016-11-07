import {JOURNAL} from '../../../constants';
import * as React from 'react';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import {bindActionCreators} from 'redux';
import {SidePanel} from './journalHeader/SidePanel';
import {ProjectsDropdown} from './journalHeader/ProjectsDropdown';
import {TimespanSwitcher} from './journalHeader/TimespanSwitcher';
import {NotificationBar} from './journalHeader/NotificationBar';
import {getActorUnits, setActiveIdentity} from '../../login/actions';

interface PropTypes {
  routeParams: {
    date: string;
    timespan: string;
  };
  actor: {
    identity: {
      fullName: string
    };
    projects: string[];
    units: any[];
  };
  services: any;
  saving: boolean;
  offline: boolean;
  isDisplaying: boolean;
  activeIdentity: number;
  messageQueue: any[];
  location?: any;
  toggleProject();
  getActorUnits();
  setActiveIdentity(memberId: number);
}

const mapStateToProps = (state, ownProps = {}) => {
  return {
    actor: state.actor,
    services: state.shared.services,
    saving: state.shared.saving,
    offline: state.shared.offline,
    toggleProject: state.toggleProject,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    getActorUnits,
    setActiveIdentity,
  }, dispatch);
};

export class Header extends React.Component <PropTypes, {}> {

  public componentWillReceiveProps(props) {
    this.updateNotifications(props.services);
  }

  public componentDidMount() {
    this.props.getActorUnits();
  }

  public updateNotifications(services) {
    // a
  }

  public render() {
    const {identity, projects} = this.props.actor;
    const {routeParams, services, saving, offline} = this.props;
    return (
      <section className="subheader">
        <SidePanel {...this.props} />
        <ProjectsDropdown
          {...this.props}
          fullName={identity.fullName}
          projects={projects}
        />
        <NotificationBar services={services} saving={saving} offline={offline}/>
        <TimespanSwitcher
          currentTimespan={routeParams.timespan}
          changeTimespan={(timespan) => { this.changeTimespan(timespan); }}
        />
      </section>
    );
  }

  private changeTimespan(timespan: string) {
    const {date} = this.props.routeParams;
    if (timespan && JOURNAL.VALID_TIMESPANS.indexOf(timespan) === -1) {
      timespan = this.props.routeParams.timespan;
    }
    browserHistory.push(`/journal/${date}/${timespan}${this.props.location.search}`);
  }

}
export default connect(mapStateToProps, mapDispatchToProps)(Header);
