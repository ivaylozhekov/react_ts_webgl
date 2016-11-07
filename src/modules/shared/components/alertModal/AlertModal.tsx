import * as React from 'react';
import { Modal } from 'react-bootstrap';

interface PropTypes {
  visible: boolean;
  backdrop: string | boolean;
  title: string;
  message: string;
  hideAlertModal();
}

export class AlertModal extends React.Component<PropTypes, {}> {
  private btn;
  public componentDidUpdate() {
    if (this.props.visible) {
      this.btn.focus();
    }
  }

  public render() {
    const {visible, title, message, backdrop} = this.props;

    return (
      <Modal className="uui-modal alert-modal" backdrop={backdrop} show={visible} onHide={() => this.close()}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message}
        </Modal.Body>
        <Modal.Footer>
          <button ref={ me => this.btn = me } onClick={() => this.close()} className="red uui-button" >Ok</button>
        </Modal.Footer>
      </Modal>
    );
  }

  private close() {
    this.props.hideAlertModal();
  }
}
