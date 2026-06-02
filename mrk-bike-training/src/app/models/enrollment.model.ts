export type EnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface EnrollmentModel {
  id: number;
  clientId?: number;
  courseId?: string;
  branchId?: string;
  trainerId?: number;
  assetId?: string;
  totalAmountPaid?: number;
  enrollmentDate?: string;
  status?: EnrollmentStatus;
  bufferDaysAllocated?: number;
  bufferDaysUsed?: number;
}
