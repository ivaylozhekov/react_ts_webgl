import {REST_PMC, SESSION_EXPIRATION_INTERVAL} from '../../../constants';
import LocalStorage from '../../../utilities/services/LocalStorage';
import assign = require('object-assign');
import * as React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import * as axios from 'axios';
import {oauth} from '../../../utilities/services/rest';
import {getActor} from '../actions';
import {ActorIdentity} from '../models/ActorIdentity';
import {DataLoader} from '../../shared/components/dataLoader/DataLoader';
import * as classNames from 'classnames';
import { FormattedMessage as T} from 'react-intl';

interface PropTypes {
  location: {
    query: {
      code: string;
      state: string;
    };
  };
  // router: any;
  identity: ActorIdentity;
  services: any;

  getActor();
  pmcLogin(username: string, password: string);
}

interface StateTypes {
  error?: string;
  username: string;
  password: string;
  isSubmitted: boolean;
}

const mapStateToProps = (state, ownProps = {}) => {
  return {
    identity: state.actor.identity,
    services: state.shared.services,
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({getActor}, dispatch);
}

@connect(mapStateToProps, mapDispatchToProps)
export class Login extends React.Component <PropTypes, StateTypes> {

  private passwordField;

  constructor() {
    super();
    if (!LocalStorage.isSupported()) throw new Error('The browser does not support localstorage');
    this.state = {
      error: '',
      username: '',
      password: '',
      isSubmitted: false,
    };
  }

  public componentWillReceiveProps(props) {
    this.resetState(props);
  }

  public componentWillMount() {
    if (!LocalStorage.hasItem('access_token')) return this.ssoLogin();
    if (Object.keys(this.props.identity).length === 0) this.props.getActor();
    else this.resetState(this.props);
  }

  public render() {
    if (this.passwordField && this.state.error && this.state.isSubmitted === false) this.passwordField.value = '';
    if (!LocalStorage.hasItem('access_token') || Object.keys(this.props.identity).length === 0) {
      return <DataLoader/>;
    }
    return (
      <div className="login-page">
        <main>
          <div data-reactroot="" className="login-block">
            <div className="heading">
              Time
            </div>
            {
              (() => {
                if (this.state.error) {
                  return (
                    <div className="uui-alert-messages fuchsia">
                      <i className="fa fa-exclamation-triangle"/> {this.state.error}
                    </div>
                  );
                }
              })()
            }
            <form id="qa-login-form"
                  className="login-form"
                  onSubmit={ e => {
                                  e.preventDefault();
                                  let {username, password} = this.state;
                                  this.pmcLogin(username, password);
                            } }
                  onChange={ e => {this.onChange(e);} }>

              <input type="text" name="username" className="uui-form-element"
                     id="qa-loginUser" defaultValue={this.state.username}
                     disabled={this.state.isSubmitted && !this.state.error}
              />
              <i className="fa fa-envelope"/>

              <input type="password" name="password" className="uui-form-element"
                     id="qa-loginPass"
                     ref={me => this.passwordField = me}
                     defaultValue={this.state.password}
                     disabled={this.state.isSubmitted && !this.state.error}
              />
              <i className="fa fa-lock"/>

              <button type="submit" name="login-submit"
                      className="uui-button large lime-green" value="Login"
                      disabled={this.state.isSubmitted && !this.state.error}
              >
                Login
                <span className={
                    classNames({
                      'show-progress': this.state.isSubmitted && !this.state.error,
                    })}>
                    <i className="fa fa-gear fa-spin"/>
                </span>
              </button>
            </form>
            <p className="warning">
              <T id="login.warning" />
            </p>
          </div>
        </main>
        <footer>
          <div className="uui-footer">
            <div className="footer-logo-copyright">
              <div className="epam-logo">
                <img src={require('../../../assets/uui/images/Logo_Epam_Color.svg')} alt=""/>
              </div>
              <p className="copyright"><T id="login.copyright" /></p>
            </div>
            <div className="footer-build">
              <p className="build">Version |
                <a href="https://en.wikipedia.org/wiki/Aurora" target="_blank"> beta 1.1</a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  private resetState(props) {
    this.setState({
      error: '',
      username: props.identity.userPrincipalName ? props.identity.userPrincipalName.split('@')[0] : '',
      password: '',
      isSubmitted: false,
    });
  }

  private onChange(e) {
    this.state[e.target.name] = e.target.value;
  }

  private ssoLogin() {
    const params = this.props.location.query;

    if (Object.keys(params).length === 0) {
      oauth.get(`/authorize?redirect_uri=${window.location.protocol}//${window.location.host}/login/`)
        .then(res => {
          let data: any = res.data;
          window.location.assign(data.follow);
        }).catch(err => {
        this.setState(assign({}, this.state, {error: err.message || err.data.message || 'Unknown error'}));
      });
    } else if (params.code && params.state) {
      oauth.get(`/token?state=${params.state}&code=${params.code}`)
        .then(res => {
          let data: any = res.data;
          LocalStorage.removeAllItems();
          LocalStorage.setItem('access_token', data.access_token, true);
          let sessionExpirationDate = new Date((new Date()).getTime() + SESSION_EXPIRATION_INTERVAL * 60000);
          localStorage.setItem('token_expiration', sessionExpirationDate.toString());
          window.location.assign('/login');
        }).catch(err => {
        this.setState(assign({}, this.state, {error: err.data.message}));
      });
    } else {
      this.setState(assign({}, this.state, {error: 'sso authentication failed'}));
    }
  }

  private pmcLogin(username: string, password: string) {

    if (!username || !password) return;

    this.setState(assign({}, this.state, {isSubmitted: true, error: ''}));
    axios({
      url: `${REST_PMC}/login`,
      method: 'post',
      data: `pmcLogin=${username}&pmcPassword=${password}`,
      headers: {
        'authorization': LocalStorage.getItem('access_token'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then(res => {
      window.location.assign('/');
    })
    .catch(err => {
      if (err.status && err.status === 401) {
        this.setState(assign({}, this.state, {error: 'Invalid credentials, please try again.', isSubmitted: false}));
      } else {
        this.setState(assign({}, this.state, {error: err.data.message, isSubmitted: false}));
      }
    });
  }

}
