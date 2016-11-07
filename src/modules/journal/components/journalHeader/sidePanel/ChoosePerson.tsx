import * as React from 'react';
import {ChoosePersonHeader as Header} from './choosePerson/ChoosePersonHeader';
import {ProfileBox} from './choosePerson/ProfileBox';
import {SearchPanel} from './choosePerson/SearchPanel';
import {PanelTabs} from './choosePerson/PanelTabs';
import assign = require('object-assign');

interface PropTypes {
  unitData: any;
  activeIdentity: number;
  setActiveIdentity(memberId: number);
}

interface StateTypes {
  activeTab: number;
  filteredMembers: any[];
}

export class ChoosePerson extends React.Component<PropTypes, StateTypes> {
  private container;

  constructor(props) {
    super(props);
    this.state = {
      filteredMembers: [],
      activeTab: 0,
    };
  }

  public render() {
    let {unitData, activeIdentity} = this.props;

    return (
      <div className="choose-person-panel" ref={me => this.container = me}>
        <Header title="Choose Person" hidePanel={() => this.hidePanel()}/>
        {(() => {
          if (!unitData.members || activeIdentity === -1) return null;
          else return (
            <ProfileBox
              profile={{
                img: unitData.members[activeIdentity].imgSrc,
                fullName: unitData.members[activeIdentity].fullName,
              }}
              onClose={() => this.clearPerson()}/>
          );
        })()}
        <SearchPanel searchPerson={(queryText) => this.searchPerson(queryText)}/>
        <PanelTabs  {...this.props}
          filteredMembers={this.state.filteredMembers}
          activeTab={this.state.activeTab}
          setActiveTab={(tabIndex) => this.setActiveTab(tabIndex)}/>
      </div>
    );
  }

  private hidePanel() {
    this.container.classList.remove('open');
  }

  private searchPerson(queryText: string) {
    queryText = queryText.toLowerCase();
    let queryResult = [];
    this.props.unitData.members.forEach((person) => {
      person.fullNameWithHighlight = person.fullName;
      if (person.fullName.toLowerCase().indexOf(queryText) !== -1) {
        person.fullNameWithHighlight = this.highlightQuery(person.fullName, queryText);
        queryResult.push(person);
      }
    }, this);
    this.setState(assign({}, this.state, {
      activeTab: -1,
      filteredMembers: queryResult,
    }));
  }

  private highlightQuery = (name, query) => {
    let regex = new RegExp('(' + query + ')', 'gi');
    return name.replace(regex, '<b>$1</b>');
  }

  private clearPerson() {
    this.props.setActiveIdentity(-1);
  }

  private setActiveTab(tabIndex) {
    this.setState(assign({}, this.state, {
      activeTab: tabIndex,
    }));
  }
}
