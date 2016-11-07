// TODO: Track dirty value and do not submit if field is reset back to the persisted value

import assign = require('object-assign');

import * as React from 'react';
import * as classNames from 'classnames';
import { WorklogModel } from '../../../../../models/Worklog';
import { Modes as ActivityModes } from '../../task/Activity';

import { FormattedMessage as T } from 'react-intl';

interface PropTypes {
  workDay: boolean;
  worklog: any;
  activityMode: ActivityModes;
  locked: boolean;
  innerPath: string;
  onChange(worklog: WorklogModel, value: number, innerPath: string, vallidationErrorCallback: Function);
  showAlertModal(title, message, callback?);
}

const Modes = {
  LOCKED: 'locked-cell',
  DISPLAY: 'input-field',
  EDIT: 'editing',
  DIRTY: 'dirty',
};

export class Cell extends React.Component<PropTypes, {}> {
  private input;
  private silentFocus: Boolean;
  private resetStyle: boolean;
  private oldValue: Number;
  private isDirty: boolean;

  constructor(props) {
    super(props);
    this.silentFocus = false;
    this.resetStyle = true;
    this.isDirty = false;

  }

  public componentDidUpdate(prevProps) {
    if (Number(this.input.value) === 0) {
      this.input.value = '';
    } else if (Number(this.input.value).toString() !== this.input.value) {
      this.input.value = Number(this.input.value);
    }
  }

  public componentWillReceiveProps(props) {
    let mode;
    let value = Number(this.input.value);
    if (props.locked) mode = Modes.LOCKED;
    else if (this.resetStyle) mode = Modes.DISPLAY;
    else mode = Modes.EDIT;

    let editing = mode === Modes.EDIT;
    let edited = this.isDirty && value === props.worklog.duration;
    let deleted = this.isDirty && props.worklog.duration === null;
    if (editing || edited || deleted) {
      this.isDirty = false;
      this.input.className = `${Modes.DISPLAY} ${mode}`;
    }
  }

  public shouldComponentUpdate(props) {
    return this.input.value !== props.worklog.duration;
  }

  public render() {
    let {workDay, worklog} = this.props;
    let disabled = this.props.locked;
    return (
      <div className={
        classNames('day-cell', {
          'locked-cell': this.props.locked,
          'day-off-cell': workDay === false,
        })
      }>
        <input
          ref={(me) => this.input = me}
          type="string"
          className="input-field"
          max="200"
          disabled={disabled}
          defaultValue={(worklog.duration) ? worklog.duration.toString() : ''}
          onChange={e => this.onChange(e)}
          onKeyPress={e => this.keyPressValidate(e)}
          onFocus={e => this.onFocus(e)}
          onBlur={e => this.onBlur(e)}
          />
      </div>
    );
  }

  private keyPressValidate(e) {
    if (this.isDirty && e.charCode === 13) { // Enter key
      if (e.target.value === '.') e.target.value = 0;
      let validDuration = this.props.worklog.id ? true : this.validateDuration(e.target.value);
      if (validDuration) {
        this.resetStyle = false;
        this.saveWorklog();
      } else {
        this.isDirty = false;
        this.resetStyle = true;
        e.target.className = `${Modes.DISPLAY} ${Modes.EDIT}`;
        this.input.value = '';
      }
    }

    let value = `${e.target.value}${e.key}`;
    if (!this.validateFormat(value) && !this.isSelected()) {
      e.preventDefault();
    }
  }

  private validateDuration(duration) {
    return Number(duration) !== 0;
  }

  private validateFormat(value) {
    if (value === '') return true;
    else return value.match(/^([\.]((\d{1,2})?)|(\d{1,2}[\.](\d{1,2}$)?)|(\d{1,2}([\.](\d{1,2})$)?)|(\.d{1,2}))$/g);
  }

  private onChange(e) {
    let value = e.target.value;
    if (this.oldValue !== value) {
      this.isDirty = true;
      this.input.className = `${Modes.DISPLAY} ${Modes.DIRTY}`;
    }
    this.input.value = value;
  }

  private isSelected() {
    return this.input.selectionStart !== this.input.selectionEnd;
  }

  private onFocus(e) {
    if (!this.silentFocus) {
      this.oldValue = e.target.value;
      e.target.select();
      this.isDirty = false;
      e.target.className = `${Modes.DISPLAY} ${Modes.EDIT}`;
    }
  }

  private onBlur(e) {
    if (e.target.value === '.') e.target.value = 0;
    let validDuration = this.props.worklog.id ? true : this.validateDuration(e.target.value);
    if (validDuration) {
      if (!this.silentFocus) {
        this.saveWorklog();
      } else {
        setTimeout(() => {
          this.input.select();
          setTimeout(() => {
            this.silentFocus = false;
          }, 0);
        }, 200);
      }
    } else {
      this.isDirty = false;
      e.target.className = Modes.DISPLAY;
      this.input.value = '';
    }
    this.resetStyle = true;
  }

  private vallidationErrorCallback() {
    this.oldValue = 0;
    this.showAlertModal(
      <T id={'alert.error'} />,
      <T id={'alert.hours_exceded'} />
    );
  }

  private showAlertModal(title, message) {
    this.props.showAlertModal(title, message,
      () => {
        this.silentFocus = true;
        this.isDirty = true;
        this.input.className = `${Modes.DISPLAY} ${Modes.DIRTY}`;
        this.input.focus();
      }
    );
  }

  private saveWorklog() {
    let {worklog, onChange} = this.props;
    let isDirty = this.input.value !== this.oldValue;

    let shouldSave = isDirty && (worklog.id || this.input.value !== '');

    if (shouldSave) {
      if (this.validateFormat(this.input.value)) {
        this.oldValue = this.input.value;
        onChange(worklog, Number(this.input.value), this.props.innerPath, () => this.vallidationErrorCallback());
      } else {
        this.showAlertModal(
          <T id={'alert.error'} />,
          <T id={'alert.format_error'} />
        );
      }
    } else {
      this.isDirty = false;
      this.input.className = Modes.DISPLAY;
    }
  }
}
