import * as React from 'react';
import { SimpleColors } from './simpleColors/SimpleColors'

interface PropTypes {}


export class Visualiser3D extends React.Component <PropTypes, {}> {

  public render() {
    return (
      <SimpleColors/>
    );
  }
}
