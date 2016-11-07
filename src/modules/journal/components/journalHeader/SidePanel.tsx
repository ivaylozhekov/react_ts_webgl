import * as React from 'react';
import {ChoosePerson} from './sidePanel/ChoosePerson';

interface PropTypes {
  actor: any;
  activeIdentity: number;
  setActiveIdentity(memberId: number);
}

export class SidePanel extends React.Component<PropTypes, {}> {
  private panel;

  public render() {
    return (
      <div>
        <div className="side-panel-toggle-button" onClick={() => this.togglePanel()}></div>
        <ChoosePerson {...this.props}
          unitData={ this.props.actor.units}
          activeIdentity={ this.props.actor.activeIdentity}
          ref={ me => this.panel = me }/>
      </div>
    );
  }

  private togglePanel() {
    let panelEnabled: boolean = false;
    if (panelEnabled) this.panel.container.classList.toggle('open');
  }
}
