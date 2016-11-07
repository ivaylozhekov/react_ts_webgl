declare var require: any;
import * as React from 'react';
import {ActorIdentity} from '../../../../login/models/ActorIdentity';
import * as classNames from 'classnames';
import {handleOpenClose} from '../../../../../utilities/helpers/HandleOpenClose';

interface PropTypes {
  actor: ActorIdentity;
  isOpened?: boolean;
  logoutActor();
  handleOpenClose?();
}

@handleOpenClose
export class ProfileMenu extends React.Component <PropTypes, {}> {
  public render() {
    const {actor, isOpened, handleOpenClose, logoutActor} = this.props;
    const defaultUserPhoto = require('../../../../../assets/images/timesheet_logo.png');
    const currentUserPhoto = `data:image/png;base64,${actor.photo}`;
    const userPhoto = actor.photo ? currentUserPhoto : defaultUserPhoto;
    const userName = actor.fullName ? actor.fullName : '';

    return (
      <ul className="profileMenu uui-navigation nav navbar-nav uui-header-tools">
        <li className={classNames('dropdown uui-profile-menu', {'open': isOpened})}>
          <a href="#" className="dropdown-toggle" data-toggle="dropdown" onClick={handleOpenClose}>
            <div className="profile-photo">
              <img src={userPhoto} alt=""/>
            </div>
            <i className={isOpened ? 'fa fa-chevron-circle-up' : 'fa fa-chevron-circle-down'}/>
          </a>
          <ul className="dropdown-menu" role="menu">
            <li className="dropdown-menu-links">
              <a target="_blank" className="user-name">{userName}</a>
            </li>
            <li className="dropdown-menu-links">
              <a
                onClick={logoutActor}
                target="_blank">
                <i className="fa fa-sign-out"></i>
                Logout
              </a>
            </li>
          </ul>
        </li>
      </ul>
    );
  }
}
