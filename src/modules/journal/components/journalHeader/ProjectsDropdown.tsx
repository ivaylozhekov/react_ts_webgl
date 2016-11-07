import * as React from 'react';
import {FormattedMessage as T} from 'react-intl';
import {CheckboxDropdown} from '../../../shared/components/checkboxDropdown/CheckboxDropdown';
import {DropdownElement} from '../../../shared/components/checkboxDropdown/models/DropdownElement';
import {browserHistory} from 'react-router';

interface PropTypes {
  fullName: string;
  projects;
  location?: any;
  toggleProject(project);
}

interface StateTypes {
  reducedProjects: DropdownElement[];
}

export class ProjectsDropdown extends React.Component <PropTypes, StateTypes> {

  constructor(props) {
    super(props);
    const selectedProjects = this.getSelectedProjects(props);
    this.state = {
      reducedProjects: props.projects.reduce((a, b, index) => {
        a[index] = {
          id: index,
          name: b,
          selected: selectedProjects.indexOf(b) !== -1,
        };
        return a;
      }, []),
    };
  }

  public render() {
    const {fullName} = this.props;
    const {reducedProjects} = this.state;
    return (
      <nav className="user-projects-navigation">
        <div className="user-name">{fullName}</div>
        <CheckboxDropdown
          elements={reducedProjects}
          onChange={(project) => this.toggleProject(project)}
          selectAll={() => this.selectAllProjects()}
          noElementsTitle={<T id="journal.no_projects" />}
          allElementsTitle={<T id="journal.all_projects" />}
        />
      </nav>
    );
  }

  private toggleProject(current) {
    let selectedProjects = this.getSelectedProjects(this.props);
    const {projects} = this.props;
    const {reducedProjects} = this.state;

    let currentProjectIndex = selectedProjects.indexOf(current.name);
    if (currentProjectIndex === -1) {
      selectedProjects.push(current.name);
    } else {
      if (selectedProjects.length === 1) return;
      selectedProjects.splice(currentProjectIndex, 1);
    }

    reducedProjects.forEach(project => {
      if (selectedProjects.indexOf(project.name) !== -1) {
        project.selected = true;
      } else {
        project.selected = false;
      }
    });

    if (selectedProjects.length === projects.length) {
      browserHistory.push(this.props.location.pathname);
    } else {
      browserHistory.push({pathname: this.props.location.pathname, query: {projects: selectedProjects.toString()}});
    }
  }

  private selectAllProjects() {
    let {reducedProjects} = this.state;

    reducedProjects.forEach(project => project.selected = true);
    browserHistory.push(this.props.location.pathname);
  }

  private getSelectedProjects(props) {
    let selectedProjects;

    if (props.location.query.projects) {
      selectedProjects = props.location.query.projects.split(',');
    } else {
      selectedProjects = JSON.parse(JSON.stringify(props.projects));
    }
    return selectedProjects;
  }
}
