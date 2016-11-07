import * as React from 'react';
import {FormattedMessage as T} from 'react-intl';
import {IFeedbackModal, FEEDBACK_TYPE} from './models';
// import { FeedbackModal } from './feedbackModal/FeedbackModal';
import {initiateFeedbackTrigger} from '../../../../utilities/services/FeedbackTrigger';

interface PropTypes {
  shared: {
    feedbackModal: IFeedbackModal;
  };
  showFeedbackModal(type: FEEDBACK_TYPE);
  hideFeedbackModal();
}

export class Feedback extends React.Component <PropTypes, {}> {
  private bugTrigger;
  private ideaTrigger;

  public componentDidMount() {
    initiateFeedbackTrigger(this.bugTrigger, this.ideaTrigger);
  }

  public render() {
    return (
      <div className="feedback-wrapper">
        <a
          id="bug-trigger"
          ref={ me => this.bugTrigger = me}
          className="side-trigger side-RIGHT">
          <T id="feedback.report_a_bug"/>
        </a>
        <a
          id="idea-trigger"
          ref={ me => this.ideaTrigger = me}
          className="side-trigger side-RIGHT">
          <T id="feedback.submit_an_idea"/>
        </a>
      </div>

    );
  }
}
