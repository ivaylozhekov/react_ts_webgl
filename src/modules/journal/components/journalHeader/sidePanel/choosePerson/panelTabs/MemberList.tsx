import * as React from 'react';
import * as classNames from 'classnames';

interface PropTypes {
  members: any[];
  highlight: boolean;
  activeMember: number;
  selectActiveMember(memberId: number);
}

export class MemberList extends React.Component<PropTypes, {}> {
  public render() {
    let {members, highlight, activeMember, selectActiveMember} = this.props;
    return (
      <div>
        {(() => {
          return members ? members.map((member, index) => {
            let fullName = highlight ? member.fullNameWithHighlight : member.fullName;
            return (
              <div
                className={classNames('project-content-item', { 'active': member.id === activeMember })}
                key={index}>
                <a
                  onClick={selectActiveMember.bind(null, member.id)}
                  dangerouslySetInnerHTML={{__html: fullName}}>
                </a>
              </div>
            );
          }) : null;
        })()}
      </div>
    );
  }
}
