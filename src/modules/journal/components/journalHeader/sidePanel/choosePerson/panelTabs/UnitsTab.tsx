import * as React from 'react';
// import {FormattedMessage as T} from 'react-intl';
import {MemberList} from './MemberList';

interface PropTypes {
  visible: boolean;
  unitData: any;
  activeIdentity: number;
  setActiveIdentity(memberId: number);
}

export class UnitsTab extends React.Component<PropTypes, {}> {
  public render() {
    if (!this.props.visible) return null;
    let {unitData, activeIdentity, setActiveIdentity} = this.props;
    // <T id="choose_person.units.direct_only" />
    return (
      <div className="units-tab">
        <div className="tab-body">
          <div className="tab-body-units">
            <select className="uui-form-element">
              <option key="0">DIRECT ONLY</option>
            </select>
          </div>
          <MemberList
            members={ unitData.members }
            highlight={ false }
            activeMember={ activeIdentity }
            selectActiveMember={ setActiveIdentity }/>
        </div>
      </div>
    );
  }
}
