import * as React from 'react';
import * as classNames from 'classnames';
import assign = require('object-assign');

interface PropTypes {
  visible: boolean;
  unitData: any;
  activeIdentity: number;
  setActiveIdentity(memberId: number);
}

interface StateTypes {
  selectedAccordion: number;
}

export class ProjectsTab extends React.Component<PropTypes, StateTypes> {
  private activePanel: number = -1;
  private panels = {
    headers: {},
    wrappers: {},
    bodies: {},
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedAccordion: -1,
    };
  }

  public render() {
    if (!this.props.visible) return null;
    let {unitData, activeIdentity, setActiveIdentity} = this.props;
    return (
      <section className="uui-accordion">
        {(() => {
          return unitData.projects ? Object.keys(unitData.projects).map((projectKey, index) => {
            return (
              <div className="panel accordion-item"
                key={index}>
                <div className="accordion-heading"
                  onClick={() => {
                    if (this.activePanel === index) {
                      this.panels.headers[index].classList.add('collapsed');
                      this.panels.wrappers[index].style.height = '0px';
                      this.activePanel = -1;
                    } else {
                      if (this.activePanel !== -1) {
                        this.panels.headers[this.activePanel].classList.add('collapsed');
                        this.panels.wrappers[this.activePanel].style.height = '0px';
                      }
                      this.panels.headers[index].classList.remove('collapsed');
                      this.panels.wrappers[index].style.height = `${this.panels.bodies[index].clientHeight}px`;
                      this.activePanel = index;
                    }
                  } }>
                  <p className="accordion-title">
                    <a
                      className={'accordion-toggle collapsed'}
                      ref={me => this.panels.headers[index] = me}>
                      <span>{unitData.projects[projectKey]}</span>
                      <i className="fa down-icon"></i>
                    </a>
                  </p>
                </div>
                <div
                  className={'accordion-collapse'}
                  ref={me => this.panels.wrappers[index] = me}>
                  <div className="accordion-body tab-body"
                    ref={me => this.panels.bodies[index] = me}>
                    {(() => {
                      return unitData.members ? Object.keys(unitData.members).map((memberId: any) => {
                        let member = unitData.members[memberId];
                        if (member.projects.indexOf(Number(projectKey)) === -1) return null;
                        else return (
                          <div
                            className={classNames('project-content-item', { 'active': member.id === activeIdentity })}
                            key={memberId}>
                            <a onClick={setActiveIdentity.bind(null, member.id)}>{member.fullName}</a>
                          </div>
                        );
                      }) : null;
                    })()}
                  </div>
                </div>
              </div>
            );
          }) : null;
        })()}
      </section>
    );
  }
}
