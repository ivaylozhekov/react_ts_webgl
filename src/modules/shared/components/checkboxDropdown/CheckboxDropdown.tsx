import * as React from 'react';
import * as classNames from 'classnames';
import {handleOpenClose} from '../../../../utilities/helpers/HandleOpenClose';
import {DropdownElement} from './models/DropdownElement';

interface PropTypes {
  elements: DropdownElement[];
  noElementsTitle: Object;
  allElementsTitle: Object;
  isOpened?: boolean;
  onChange(project);
  selectAll();
  handleOpenClose?();
}

@handleOpenClose
export class CheckboxDropdown extends React.Component <PropTypes, {}> {
  public render() {
    const {elements, onChange, handleOpenClose, selectAll, noElementsTitle, allElementsTitle} = this.props;
    const selectedElements = this.props.elements.filter((element: DropdownElement) => element.selected);
    const areAllSelected = elements.length === selectedElements.length;
    const selectedElementsNames = selectedElements.map((e: DropdownElement) => e.name).join(', ');
    return (
      <div className="select-dropdown">
        <div className="element-name" onClick={handleOpenClose}>
          {(() => {
            if (elements.length === 0) {
              return noElementsTitle;
            } else {
              return areAllSelected ? allElementsTitle : selectedElementsNames;
            }
          })()}
        </div>
        {(() => {
          if (elements.length !== 0) {
            return (
              <ul
                className={classNames('dropdown-list', {'opened': this.props.isOpened })}>
                <li
                  key="all"
                  className={classNames({'selected': areAllSelected })}
                  onClick={() => selectAll()}>
                  {allElementsTitle}
                </li>
                { elements.map((element: any, index: number) =>
                  <li
                    key={index}
                    className={classNames({'selected': element.selected })}
                    onClick={onChange.bind(null, element)}>
                    {element.name}
                  </li>
                )}
              </ul>
            );
          }
        })()}
      </div>
    );
  }
}
