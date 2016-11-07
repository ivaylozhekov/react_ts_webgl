import * as React from 'react';

interface PropTypes {
  searchPerson(queryText: any);
}

export class SearchPanel extends React.Component<PropTypes, {}> {
  public render() {
    return (
      <div className="search-panel">
        <input
          type="search"
          className="uui-form-element uui-search"
          onChange={(e: any) => this.props.searchPerson(e.target.value)}>
        </input>
      </div>
    );
  }
}
