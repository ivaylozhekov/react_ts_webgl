import * as React from 'react';
import { FormattedMessage as T} from 'react-intl';

export class DataLoader extends React.Component<{}, {}> {
  public render() {
    return (
      <div className="load-view">
        <i className="fa fa-gear fa-spin" />
        <br />
        <T id="shared.loader.loading" /> ...
      </div>
    );
  }
}
