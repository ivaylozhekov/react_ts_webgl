import assign = require('deep-assign');
import * as dot from 'dot-object';
import {addLocaleData} from 'react-intl';
import * as en from 'react-intl/locale-data/en';
import * as bg from 'react-intl/locale-data/bg';
import * as es from 'react-intl/locale-data/es';

// Import locales from modules
import * as shared from './modules/shared/i18n';
import * as journal from './modules/journal/i18n';
import * as login from './modules/login/i18n';

// Merge all locales
const allLocales = assign({}, journal, shared, login);

// Transform nested objects to dot notation
let locales: Object = {};
for (let lang in allLocales) {
  if (allLocales.hasOwnProperty(lang)) {
    let current: Object = allLocales[lang];
    locales[lang] = dot.dot(current, {});
  }
}

export default locales;

addLocaleData(en);
addLocaleData(bg);
addLocaleData(es);
