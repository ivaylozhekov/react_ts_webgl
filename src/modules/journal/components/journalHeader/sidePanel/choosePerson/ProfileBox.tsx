import * as React from 'react';
import {FormattedMessage as T} from 'react-intl';

interface PropTypes {
  profile: {
    img: any;
    fullName: string;
  };
  onClose();
}

export class ProfileBox extends React.Component<PropTypes, {}> {
  public render() {
    let {profile, onClose} = this.props;
    return (
      <div className="profile-box">
        <div className="row">
          <div className="photo">
            <img src={profile.img}/>
          </div>
          <div className="name">
            <span><T id="choose_person.journal_of"/></span>
            <br/>
            <span>{profile.fullName}</span>
          </div>
          <span className="close" onClick={ onClose }>×</span>
        </div>
      </div>
    );
  }
}
