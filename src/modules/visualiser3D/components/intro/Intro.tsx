import * as React from 'react';
import { webGLStart, webGLStop } from './IntroWebGL'

interface PropTypes {}


export class Intro extends React.Component <PropTypes, {}> {
  private canvas;

  public componentDidMount() {
    webGLStart(this.canvas, true);
  }

  public componentWillUnmount() {
    webGLStop();
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
        <div className="main-title" style={{
          top: 'calc( 50% - 230px)',
          lineHeight: '50px',
          fontSize: '30px',
          textAlign: 'center',
          left: 'calc( 50% - 300px )',
          opacity: 0.7,
          height: '100px',
          width: '600px',
          padding: '40px',
          color: 'white',
          background: '#222',
          position: 'absolute',
        }}>3D Programming with JavaScript & WebGL<br/><strong>Lunch & Learn 11.2016</strong></div>
      </div>
    );
  }
}
