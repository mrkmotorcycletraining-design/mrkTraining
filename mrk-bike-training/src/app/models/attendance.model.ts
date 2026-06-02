export type PersonType = 'CLIENT' | 'TRAINER';
export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export interface AttendanceModel {
  id: number;
  slotId?: number;
  personId?: string;
  personType?: PersonType;
  dateTime?: string;
  status?: AttendanceStatus;
}
