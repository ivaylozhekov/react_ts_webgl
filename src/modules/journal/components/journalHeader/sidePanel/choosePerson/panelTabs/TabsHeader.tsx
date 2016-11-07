import * as React from 'react';
import * as classNames from 'classnames';

interface PropTypes {
  tabs: any[];
  activeTab: number;
  setActiveTab(tabIndex: number);
}

export class TabsHeader extends React.Component<PropTypes, {}> {
  public render() {
    let {tabs, activeTab} = this.props;
    return (
      <div className="tabs-header">
        {(() => {
          return tabs.map((tab, index) => {
            return (
              <a
                key={index}
                className={classNames('tab', { 'active': index === activeTab })}
                onClick={() => {this.props.setActiveTab(index);}}>
                <span>{tab}</span>
              </a>
            );
          });
        })()}
      </div>
    );
  }
}
