declare var require: any;
import * as React from 'react';

interface PropTypes {
  title: string;
}

export class Header extends React.Component<PropTypes, {}> {

  public render() {
    return (
      <header className="app-header">
        <div className="uui-header">
          <nav role="navigation">
            <a className="brand-logo">
              <img src="http://www.qualium-systems.com/wp-content/uploads/2015/07/icon-reactjs.svg" alt="" />
              <span>React</span>
            </a>
            <a className="brand-logo">
              <img src="data:image/png;base64,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" alt="" />
              <span>TypeScript</span>
            </a>
            <a className="brand-logo">
              <img style={{ width: 70}}src="https://filonik.github.io/bdva2015/slides/webgl/img/webgl_logo.png" alt="" />
              <span>WebGL</span>
            </a>
            <a className="brand-logo">
              <img src="https://worldvectorlogo.com/logos/webpack.svg" alt="" />
              <span>Webpack</span>
            </a>
            <a className="brand-logo main">
              <img src="https://www.epam.com/etc/designs/epam-core/images/common/logo.png" alt="" />
            </a>
          </nav>
        </div>
      </header>
    );
  }
}
