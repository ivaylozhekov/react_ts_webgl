import * as React from 'react';
import {Modal} from 'react-bootstrap';
import {FEEDBACK_TYPE} from '../models/FeedbackType';
import {FormattedMessage as T} from 'react-intl';

interface PropTypes {
  visible: boolean;
  type: FEEDBACK_TYPE;
  hideFeedbackModal();
}

export class FeedbackModal extends React.Component <PropTypes, {}> {
  public render() {
    const {visible, type} = this.props;
    let modalTitle;
    switch (type) {
      case FEEDBACK_TYPE.BUG:
        modalTitle = <T id="feedback.report_a_bug"/>;
        break;
      case FEEDBACK_TYPE.IDEA:
        modalTitle = <T id="feedback.submit_an_idea"/>;
        break;
      default:
        break;
    }

    return (
      <Modal className="feedback-modal uui-modal" show={visible} onHide={() => this.close()}>
        <Modal.Header closeButton>
          <Modal.Title>{ modalTitle }</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ul className="feedback-form">
            <li className="control">
              <p className="form-label">Summary<span className="red">*</span></p>
              <input type="text" className="uui-form-element" placeholder="Summary" id="summary"/>
            </li>
            <li className="control">
              <p className="form-label">Description</p>
              <textarea className="uui-form-element" placeholder="Description" id="description"></textarea>
            </li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <button className="uui-button lime-green" onClick={() => this.close()}>Submit</button>
        </Modal.Footer>
      </Modal>
    );
  }

  private close() {
    this.props.hideFeedbackModal();
  }
}
