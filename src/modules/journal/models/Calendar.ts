import {DayModel} from './Day';

export interface CalendarModel {
  currentWeek: boolean;
  days: DayModel[];
}
