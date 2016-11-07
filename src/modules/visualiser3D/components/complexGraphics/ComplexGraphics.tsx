import * as React from 'react';
import { webGLStart, webGLStop } from './ComplexGraphicsWebGL'

interface PropTypes {}


export class ComplexGraphics extends React.Component <PropTypes, {}> {
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
          height={window.innerHeight-60}
          style={{overflow: 'hidden'}}
          ref={ me => this.canvas = me}>
        </canvas>
      </div>
    );
  }
}
