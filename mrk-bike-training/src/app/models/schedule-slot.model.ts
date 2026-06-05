export type ScheduleType = 'REGULAR_TRAINING' | 'BUFFER_SESSION' | 'TRIP' | 'MAINTENANCE';
export type ScheduleStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED';

export interface ScheduleSlotModel {
  id: number;
  enrollmentId?: number;
  resourceId?: string;
  trainerId?: number;
  clientId?: number;
  branchId?: string;
  title?: string;
  startDateTime?: string;
  endDateTime?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
}
