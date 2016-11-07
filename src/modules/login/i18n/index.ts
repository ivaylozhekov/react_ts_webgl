import assign = require('object-assign');
import base from './en';
import bg from './bg';
import es from './es';

const bulgarian = assign({}, base, bg);
const spanish = assign({}, base, es);

export {
  base as en,
  bulgarian as bg,
  spanish as es
}
