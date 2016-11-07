export { default as Header } from './JournalHeader';

import { URL_DATE_FORMAT, JOURNAL } from '../../../constants';
import * as React from 'react';
import * as moment from 'moment';
import * as classNames from 'classnames';
import * as Waypoint from 'react-waypoint';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { getJournal, saveActivity, saveWorklog, clearSilentFocus } from '../actions';
import { setNonProjectExpanded, setVacationExpanded } from '../actions';

import { CalendarModel } from '../models/Calendar';
import { WorklogModel } from '../models/Worklog';

import { Header } from './table/TableHeader';
import { Section, Types as SectionTypes } from './table/TableSection';
import { fadeIn, fadeOut } from '../../../utilities/helpers/FadingEffects';
import { showAlertModal, hideAlertModal, hideLoader } from '../../shared/actions';
import { DataLoader } from '../../shared/components/dataLoader/DataLoader';

interface PropTypes {
  actor: any;
  period: any;
  calendar: CalendarModel[];
  assignments: any;
  totals: any;
  location?: any;
  UI: any;
  silentFocus: {
    path: string;
  };

  saveActivity(id: string, name: string, worklogs: WorklogModel[]);
  saveWorklog();
  clearSilentFocus();
  showAlertModal();
  hideAlertModal();
  hideLoader();
  setNonProjectExpanded();
  setVacationExpanded();
}

const mapStateToProps = (state, ownProps = {}) => {
  return {
    actor: state.actor,
    period: state.journal.period,
    calendar: state.journal.calendar,
    assignments: state.journal.assignments,
    totals: state.journal.totals,
    silentFocus: state.journal.silentFocus,
    UI: state.journal.UI,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    saveActivity,
    saveWorklog,
    clearSilentFocus,
    showAlertModal,
    hideAlertModal,
    hideLoader,
    setNonProjectExpanded,
    setVacationExpanded,
  }, dispatch);
};

export class Journal extends React.Component<PropTypes, {}> {
  private header;
  private fadingTimer;
  private scrollable;
  private scrollLeft;
  private scollHandlerAdded: boolean = false;
  private journalSection;

  public componentDidMount() {
    if (!this.props.assignments.result) {
      this.props.hideLoader();
    }
  }

  public componentWillUnmount() {
    if (this.scrollable) {
      this.scrollable.removeEventListener('scroll', e => this.handleScroll(e));
      this.scollHandlerAdded = false;
    }
  }

  public handleScroll(e) {
    this.scrollLeft = e.target.scrollLeft;
    this.setScrollLeft();
  }

  public componentDidUpdate() {
    if (this.props.assignments.result && !this.scollHandlerAdded) {
      this.scrollable.addEventListener('scroll', e => this.handleScroll(e));
      this.scollHandlerAdded = true;
    }

    if (this.props.silentFocus) {
      let path = this.props.silentFocus.path.split('/');
      let project: any = this.refs[path[0]];
      let task: any = project.refs[path[1]];
      let activity: any = task.refs[path[2]];
      let week: any = activity.refs[path[3]];
      if (week.refs[Number(path[4]) + 1]) {
        week.refs[Number(path[4]) + 1].input.focus();
      }

      this.props.clearSilentFocus();
    }

    if ( this.journalSection && this.journalSection.clientHeight < window.innerHeight ) {
      this.header.headerWrapper.className = 'header-section';
    }
  }

  public shouldComponentUpdate(nextProps, nextState) {
    return !(this.props.silentFocus && !nextProps.silentFocus);
  }

  public setScrollLeft() {
    if (this.header.headerWrapper.classList.contains('fixed-header')) {
      this.header.counter.block.scrollable.style.marginLeft = `${-this.scrollLeft}px`;
      this.header.calendar.scrollable.style.marginLeft = `${-this.scrollLeft}px`;
    }
  }

  public render() {
    const {actor, period, calendar, assignments, totals, location, UI} = this.props;

    let selectedProjects;
    if (location.query.projects) {
      selectedProjects = location.query.projects.split(',');
    }
    if (!assignments.result) {
      return <DataLoader />;
    }
    return (
      <div>
        <div className="journal-table-section" ref={me => this.journalSection = me}>
          <div className={
            classNames('journal-table', {
              'week-view': period.timespan === 'week',
              'two_weeks-view': period.timespan === 'two_weeks',
            })
          }
            ref={me => this.scrollable = me}>
            <Header
              actor={actor}
              calendar={calendar}
              period={period}
              totalHours={totals}
              location={location}
              ref={me => this.header = me}
              />
            <Waypoint
              scrollableAncestor={window}
              topOffset="95px"
              onEnter={(args) => {
                if (args.previousPosition === 'above') {
                  this.header.counter.block.scrollable.style.marginLeft = '0px';
                  this.header.calendar.scrollable.style.marginLeft = '0px';
                  this.setCurrentProject('');
                }
              } }
              onLeave={(args) => {
                this.setScrollLeft();
              } }
              />
            <div className="table-content-block" id="qa-table-content-block">
              {
                (() => {
                  return assignments.result.map(projectId => {
                    let assignment = assignments.entities.assignment[projectId];
                    let type = SectionTypes.PROJECT;
                    let expanded = false;

                    if (assignment.id === 'NPA') type = SectionTypes.NON_PROJECT;
                    if (assignment.id === 'VAC') type = SectionTypes.VACATION;
                    let hiddenProject = selectedProjects && selectedProjects.indexOf(assignment.name) === -1;
                    if (type !== SectionTypes.NON_PROJECT && type !== SectionTypes.VACATION && hiddenProject) {
                      return null;
                    }

                    let noProjectsToShow = assignments.result.length === 2;
                    let hasWorklogs = false;

                    if (type === SectionTypes.NON_PROJECT) {
                      if (UI.nonProjectExpanded === undefined) {
                        hasWorklogs = this.hasWorklogs(assignments, assignment);
                        expanded = noProjectsToShow || hasWorklogs;
                      } else {
                        expanded = UI.nonProjectExpanded;
                      }
                    }

                    if (type === SectionTypes.VACATION) {
                      if (UI.vacationExpanded === undefined) {
                        hasWorklogs = this.hasWorklogs(assignments, assignment);
                        expanded = noProjectsToShow || hasWorklogs;
                      } else {
                        expanded = UI.vacationExpanded;
                      }
                    }
                    return (
                      <Section {...this.props}
                        ref={assignment.id}
                        path={assignment.id}
                        key={projectId}
                        sectionType={type}
                        data={assignments}
                        totals={totals}
                        name={assignment.name}
                        tasks={assignment.tasks}
                        totalProjectHours={assignment.totalHours}
                        timelocks={assignment.timelocks}
                        calendar={calendar}
                        active={assignment.active}
                        expanded={expanded}
                        setCurrentProject={(project) => { this.setCurrentProject(project); } }
                        />
                    );
                  });
                })()
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  private hasWorklogs(assignments, assignment) {
    let hasWorklogs = false;
    for (let taskId of assignment.tasks) {
      if (assignments.entities.task[taskId].activities.length > 0) {
        hasWorklogs = true;
        break;
      }
    }
    return hasWorklogs;
  }

  private setCurrentProject(project) {
    const fadeTime = 120;
    if (this.fadingTimer) clearInterval(this.fadingTimer);
    let currentProjectName = this.header.counter.currentProjectName;
    if (project !== '') {
      currentProjectName.innerHTML = project;
      this.fadingTimer = fadeIn(currentProjectName, fadeTime);
    } else {
      this.fadingTimer = fadeOut(currentProjectName, fadeTime);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Journal);

export const onEnter = (store, next, replace, callback) => {
  const pmcId = store.getState().actor.identity.pmcId;
  let date = next.params.date;
  let timespan = next.params.timespan;
  let redirect = false;
  let query = (next.location) ? next.location.search : '';

  if (!moment(next.params.date, URL_DATE_FORMAT).isValid()) {
    date = moment().isoWeekday('monday').format(URL_DATE_FORMAT);
    redirect = true;
  } else if (moment(next.params.date, URL_DATE_FORMAT).isoWeekday() !== 1) {
    date = moment(next.params.date, URL_DATE_FORMAT).isoWeekday('monday').format(URL_DATE_FORMAT);
    redirect = true;
  }

  if (JOURNAL.VALID_TIMESPANS.indexOf(next.params.timespan) === -1) {
    timespan = JOURNAL.DEFAULT_TIMESPAN;
    redirect = true;
  }

  if (redirect) {
    replace(`/journal/${date}/${timespan}${query}`);
    callback();
  } else {
    store.dispatch(getJournal(pmcId, date, timespan));
  }
  callback();
};
