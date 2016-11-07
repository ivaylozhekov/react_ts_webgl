import {WorklogModel} from './WorkLog';

export interface ActivityModel {
  name: string;
  worklogs: WorklogModel[];
  isNew: boolean;
}
