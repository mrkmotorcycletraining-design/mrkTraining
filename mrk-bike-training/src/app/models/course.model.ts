export type CourseCategory = 'NORMAL' | 'PREMIUM' | 'TRIP' | 'OTHER';

export interface CourseModel {
  id: string;
  name?: string;
  category?: CourseCategory;
  hoursPerDay?: number;
  totalDays?: number;
  preferredDaysOfWeek?: string[] | string;
}
