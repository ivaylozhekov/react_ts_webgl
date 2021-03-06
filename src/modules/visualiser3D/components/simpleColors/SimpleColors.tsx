import * as React from 'react';
import { webGLStart } from './SimpleColorsWebGL'

interface PropTypes {}


export class SimpleColors extends React.Component <PropTypes, {}> {
  private canvas;

  public componentDidMount() {
    webGLStart(this.canvas);
  }

  public render() {
    return (
      <div className="visualiser">
        <canvas
          id="world"
          width={window.innerWidth}
          height={window.innerHeight - 60}
          style={{overflow: 'hidden'}}
          ref={ me => this.canvas = me}>
        </canvas>
      </div>
    );
  }
}
