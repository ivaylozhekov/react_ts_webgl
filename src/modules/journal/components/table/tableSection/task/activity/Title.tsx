import assign = require('object-assign');
import * as React from 'react';
import * as classNames from 'classnames';
import { FormattedMessage as T } from 'react-intl';
import { defineMessages } from 'react-intl';

import { Modes as ActivityModes } from '../../task/Activity';

interface PropTypes {
  activityMode: ActivityModes;
  value: string;
  active: boolean;
  className?: string;
  onTitleChange: Function;
  showAlertModal(title, message, callback?);
}

interface IContext {
  intl: any;
}

interface StateTypes {
  mode: Modes;
  value: string;
}

const enum Modes {
  DISPLAY,
  EDIT,
  DIRTY,
}

export class Title extends React.Component<PropTypes, StateTypes> {

  public static contextTypes = {
      intl: React.PropTypes.object.isRequired,
  };
  public context: IContext;

  private input;
  private silentFocus: boolean = false;
  private resetStyle: boolean = true;


  constructor(props, context) {
    super(props, context);
    this.state = {
      mode: Modes.DISPLAY,
      value: props.value,
    };
  }

  public componentDidMount() {
    this.setTooltip();
  }

  public componentWillReceiveProps(props) {
    let isCreateMode: boolean = this.props.activityMode === ActivityModes.CREATE;
    if (!isCreateMode && (this.state.mode === Modes.DIRTY && this.state.value === props.value) || !this.resetStyle) {
      this.setState(assign({}, this.state, {
        mode: this.resetStyle ? Modes.DISPLAY : Modes.EDIT,
        value: props.value,
      }));
    }
  }

  public componentDidUpdate() {
    if (this.state.mode === Modes.EDIT || this.props.activityMode === ActivityModes.INVALID) this.input.focus();
  }

  public render() {
    const messages = defineMessages({
      addActivity: {
        id: 'journal.sections.add_activity',
        defaultMessage: 'Add Activity...',
      },
    });
    let {activityMode} = this.props;
    let {value} = this.state;
    let placeholder = activityMode === ActivityModes.CREATE && this.state.mode === Modes.DISPLAY && !value;
    const {formatMessage} = this.context.intl;

    return (

      <div className="title-column">
        <input
          placeholder={placeholder ? formatMessage(messages.addActivity) : ''}
          ref={(me) => this.input = me}
          type="text"
          className={classNames(
            'activity-name',
            'input-field',
            {
              'locked-cell': activityMode === ActivityModes.LOCKED,
              'editing': this.state.mode === Modes.EDIT,
              'dirty': this.state.mode === Modes.DIRTY,
            })}
          max="200"
          value={this.state.value}
          onChange={(e) => { this.onChange(e); } }
          onKeyDown={(e) => { this.onKeyDown(e); } }
          onFocus={(e) => { this.onFocus(e); } }
          onBlur={(e) => { this.onBlur(e); } }
          disabled={this.props.activityMode === ActivityModes.LOCKED}
          />
      </div>
    );

  }

  private ieOverflowDetect(text, inputStyles, inputWidth) {
    var tag = document.createElement("div");
    tag.style.position = "absolute";
    tag.style.left = "-999em";
    tag.style.whiteSpace = "nowrap";
    tag.style.font = inputStyles.fontWeight + " " + inputStyles.fontSize + " " + inputStyles.fontFamily;
    tag.style.padding = inputStyles.padding;
    tag.innerHTML = text;

    document.body.appendChild(tag);
    var result = tag.clientWidth;
    document.body.removeChild(tag);

    return result >= inputWidth;
  }

  private setTooltip(){
    if ( this.input.scrollWidth > this.input.offsetWidth ) {
      this.input.title = this.input.value;
    } else {
      this.input.title = '';
    }
    // IE fix for tooltip and ellipsis
    if (this.input.currentStyle && this.input.value.length > 20){
      if(this.ieOverflowDetect(this.input.value, this.input.currentStyle, this.input.clientWidth)){
        this.input.title = this.input.value;
        this.input.setAttribute("readonly", true);
      }
    }
  }

  private onFocus(e) {
    if(this.input.readOnly){   // IE fix ...
      this.input.removeAttribute("readonly");
      this.input.select();
    }
    if (!this.silentFocus && this.state.mode === Modes.DISPLAY) {
      this.setState(assign({}, this.state, { mode: Modes.EDIT }));
    }
  }

  private onBlur(e) {
    this.setTooltip();
    if (this.props.activityMode === ActivityModes.CREATE && !this.state.value) {
      this.setState(assign({}, this.state, { mode: Modes.DISPLAY }));
      this.props.onTitleChange('', ActivityModes.CREATE);
    } else if (!this.silentFocus) {
      this.resetStyle = true;
      this.saveTitle();
    } else {
      setTimeout(() => {
        this.input.select();
        setTimeout(() => {
          this.silentFocus = false;
        }, 0);
      }, 200);
    }
  }

  private onKeyDown(e) {
    let isInCreateMode = this.props.activityMode === ActivityModes.CREATE;
    let isInEditMode = this.state.mode === Modes.EDIT;
    if (!isInCreateMode && !isInEditMode && e.keyCode === 13) { // Enter key
      this.resetStyle = false;
      this.saveTitle();
    }
  }

  private saveTitle() {
    if (this.props.value !== this.state.value) {
      this.props.onTitleChange(this.state.value, this.props.activityMode, () => this.onVallidationError());
    } else if (this.props.activityMode !== ActivityModes.CREATE) {
      this.setState(assign({}, this.state, { mode: Modes.DISPLAY }));
    }
  }

  private onVallidationError() {
    this.props.showAlertModal(
      <T id={'alert.error'} />,
      <T id={'alert.activity_exists'} values={{ name: <strong>{name}</strong> }} />,
      () => {
        this.silentFocus = true;
        this.setState(assign({}, this.state, { mode: Modes.DIRTY }));
        this.input.focus();
      }
    );
  }

  private onChange(e) {
    let value = e.target.value;
    this.setState(assign({}, this.state, { value: value, mode: Modes.DIRTY }));
  }
}
