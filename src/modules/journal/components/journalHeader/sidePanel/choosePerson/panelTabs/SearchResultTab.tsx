import * as React from 'react';
// import {FormattedMessage as T} from 'react-intl';
import {MemberList} from './MemberList';

interface PropTypes {
  visible: boolean;
  filteredMembers: any[];
  activeIdentity: number;
  setActiveIdentity(memberId: number);
}

export class SearchResultTab extends React.Component<PropTypes, {}> {
  public render() {
    if (!this.props.visible) return null;
    let {filteredMembers, activeIdentity, setActiveIdentity} = this.props;
    return (
      <div className="units-tab">
        <div className="tab-body">
          <MemberList
            members={ filteredMembers }
            highlight={true}
            activeMember={ activeIdentity }
            selectActiveMember={ setActiveIdentity }/>
        </div>
      </div>
    );
  }
}
