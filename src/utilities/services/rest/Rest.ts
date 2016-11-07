import LocalStorage from '../LocalStorage';
import IRest from './IRest';
import * as axios from 'axios';
import {browserHistory} from 'react-router';

// Improve: Add ability to pass optional axios options to be merged with the default config
// Improve: Handling of missing token for protected resource
// Improve: Connection status check
export class Rest implements IRest {

  private baseUrl: string;
  private tokenProtected: boolean;
  private retries = {
    GET: 2,
  };

  constructor(baseUrl: string, tokenProtected: boolean = true) {
    this.baseUrl = baseUrl;
    this.tokenProtected = tokenProtected;
    this.setInterceptors();
  }

  public head(url: string) {
    return this.request('HEAD', url);
  }

  public get(url: string, retries: number = 0) {
    let item = `GET@${this.baseUrl}${url}`;

    if (this.isOnline()) {
      return this.request('GET', url).catch(err => {
        if (retries < this.retries.GET) return this.get(url, retries + 1);
        else throw err;
      });
    } else {
      return new Promise((resolve, reject) => {
        if (LocalStorage.hasItem(item)) resolve(JSON.parse(LocalStorage.getItem(item)));
        else reject(Error(`Application is offline and there is no cache available for ${item}`));
      });
    }
  }

  public post(url: string, payload) {
    return this.request('POST', url, payload);
  }

  public put(url: string, payload) {
    return this.request('PUT', url, payload);
  }

  public delete(url: string, payload) {
    return this.request('DELETE', url, payload);
  }

  private request(method: string, url: string, payload?: Object) {
    if (this.tokenProtected && !LocalStorage.hasItem('access_token')) {
      browserHistory.push('/login');
    } else {
      let config = {
        method: method,
        url: this.baseUrl + url,
        data: payload,
        timeout: 90000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': (this.tokenProtected) ? LocalStorage.getItem('access_token') : '',
        },
      };

      return axios(config);
    }
  }

  private setInterceptors() {

    axios.interceptors.request.use(
      config => {
        if (config.method === 'GET') {
          config.params = {
            _dc: Date.now(),
          };
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        if (error.status === 401 && LocalStorage.hasItem('access_token')) {
          // TODO: Extend user session
          if (window.location.pathname !== '/login') {
            LocalStorage.removeItem('access_token');
            return browserHistory.push('/login');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private isOnline() {
    return navigator.onLine;
  }
}
