import * as React from 'react';
import {ProjectsTab} from './panelTabs/ProjectsTab';
import {UnitsTab} from './panelTabs/UnitsTab';
import {SearchResultTab} from './panelTabs/SearchResultTab';
import {TabsHeader} from './panelTabs/TabsHeader';

interface PropTypes {
  unitData: any;
  filteredMembers: any[];
  activeTab: number;
  activeIdentity: number;
  setActiveTab(tabIndex: number);
  setActiveIdentity(memberId: number);
}

export class PanelTabs extends React.Component<PropTypes, {}> {
  public render() {
    return (
      <div className="tabs">
        <TabsHeader
          tabs={['Projects', 'Units']}
          activeTab={this.props.activeTab}
          setActiveTab={this.props.setActiveTab}>
        </TabsHeader>
        <div className="tabs-content">
          <SearchResultTab { ...this.props } visible={this.props.activeTab === -1}></SearchResultTab>
          <ProjectsTab { ...this.props } visible={this.props.activeTab === 0}></ProjectsTab>
          <UnitsTab { ...this.props } visible={this.props.activeTab === 1}></UnitsTab>
        </div>
      </div>
    );
  }
}
