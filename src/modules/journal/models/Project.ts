import {TaskModel} from './Task';
import {TimelockModel} from './TimeLock';

export interface ProjectModel {
  active: boolean;
  id: number;
  name: string;
  tasks: TaskModel[];
  timelocks?: TimelockModel[];
}
