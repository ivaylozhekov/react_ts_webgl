// todo: create a singleton class to avoid this object duplications on import.

import {Rest} from './Rest';
import {REST_API, REST_PMC, REST_OAUTH, REST_OAUTH_LOGOUT} from '../../../constants';

const api = new Rest(REST_API);
const pmc = new Rest(REST_PMC);
const oauth = new Rest(REST_OAUTH, false);
const logout = new Rest(REST_OAUTH_LOGOUT);

export {
  api,
  pmc,
  oauth,
  logout
}
