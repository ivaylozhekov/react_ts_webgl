import {ActivityModel} from './Activity';

export interface TaskModel {
  activities: ActivityModel[];
  id: number;
  name: string;
}
