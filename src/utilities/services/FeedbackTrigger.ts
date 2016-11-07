import assign = require('object-assign');
import {FEEDBACK_WIZARD_URL} from '../../constants/feedback';
import * as $ from 'jquery';

export const initiateFeedbackTrigger = (bugTrigger, ideaTrigger) => {
  window.jQuery = $;

  /*=== BUG COLLECTOR ===*/
  $.ajax({
    url: `${FEEDBACK_WIZARD_URL}&collectorId=6d4d14cb`,
    type: 'get',
    cache: true,
    dataType: 'script',
  });

  /*=== IDEA COLLECTOR ===*/
  $.ajax({
    url: `${FEEDBACK_WIZARD_URL}&collectorId=2621db9d`,
    type: 'get',
    cache: true,
    dataType: 'script',
  });

  window.ATL_JQ_PAGE_PROPS = assign({}, {
    '6d4d14cb': {
      triggerFunction: (showCollectorDialog) => {
        bugTrigger.onclick = (e) => {
          if (!document.body.classList.contains('feedback-wizard-fix')) {
            document.body.classList.add('feedback-wizard-fix');
          }
          e.preventDefault();
          showCollectorDialog();
        };
      },
    },
    '2621db9d': {
      triggerFunction: (showCollectorDialog) => {
        ideaTrigger.onclick = (e) => {
          if (!document.body.classList.contains('feedback-wizard-fix')) {
            document.body.classList.add('feedback-wizard-fix');
          }
          e.preventDefault();
          showCollectorDialog();
        };
      },
    },
  });
};
