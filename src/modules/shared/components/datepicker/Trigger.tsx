// This is example showing how to integrate the Picker component

import * as React from 'react';
import {DatePicker} from './DatePicker';

interface StateProps {
  pickerVisible: boolean;
  date: string;
}

export class Trigger extends React.Component <{}, StateProps> {

  private picker: DatePicker;

  constructor(props) {
    super(props);
    this.state = {
      date: '2010-05-05',
      pickerVisible: false,
    };
  }

  public render() {
    return (
      <div style={{height: '20px'}}>
        <a onClick={() => {this.showPicker(this.state.date);}}> Open DatePicker - {this.state.date} </a>
        <DatePicker ref={(picker) => this.picker = picker}
                    onChange={(date) => {this.onChange(date);} }/>
      </div>
    );
  }

  private showPicker(defaultDate?: string) {
    let date = defaultDate || '';
    this.picker.toggle(true, date);
  }

  private onChange(date: string) {
    this.setState({date: date, pickerVisible: false});
  }
}
