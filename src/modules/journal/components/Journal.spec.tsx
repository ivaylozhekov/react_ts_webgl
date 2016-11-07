import * as React from 'react';
import * as TestUtils from 'react-addons-test-utils';
import {Journal} from './Journal';


const setup = () => {
  let props = {
    actor: {},
    period: {},
    calendar: [],
    assignments: {
      projectAssignments: [],
      nonProjectAssignments: [],
    },
    totals: {},
    location: {
      query: '',
    },
    saveActivity: (id: string, name: string, worklogs: any[]) => {
    },
    saveWorklog: () => {
    },
    showAlertModal: () => {
    },
    hideAlertModal: () => {
    }
  };
  let renderer = TestUtils.createRenderer();
  renderer.render(<Journal {...props} />);
  let output = renderer.getRenderOutput();
  return {
    props,
    renderer,
    output,
  };

};

describe('Journal', () => {
  let {props, renderer, output} = setup();

  it('should render in div', () => {
    chai.assert.strictEqual(output.type, 'div');
  });

  it('should have class journal-table-tableSection', () => {
    chai.assert.strictEqual(output.props.className, 'journal-table-tableSection');
  });

});
