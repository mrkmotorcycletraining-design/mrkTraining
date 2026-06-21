export type ScheduleStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED';
export type ScheduleType = 'REGULAR_TRAINING' | 'BUFFER_SESSION' | 'TRIP' | 'MAINTENANCE';
export type EnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type CourseCategory = 'NORMAL' | 'PREMIUM' | 'TRIP' | 'OTHER';

export interface ScheduleSlotApi {
  id: number;
  enrollmentId?: number;
  resourceId?: string;
  trainer?: { id: number; name?: string };
  client?: { id: number; name?: string };
  branchId?: string;
  title?: string;
  startDateTime: string;
  endDateTime: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  rejectionReason?: string;
}

export interface ScheduleSlotListResponse {
  slots: ScheduleSlotApi[];
  total: number;
  hasData: boolean;
}

export interface EnrollmentApi {
  id: number;
  client?: { id: number; name?: string };
  course?: { id: string; name?: string; category?: CourseCategory; totalDays?: number; hoursPerDay?: number; bufferDays?: number };
  branch?: { id: string; name?: string };
  status?: EnrollmentStatus;
  enrollmentDate?: string;
  totalAmountPaid?: number;
  bufferDaysAllocated?: number;
  bufferDaysUsed?: number;
}

export interface CourseApi {
  id: string;
  name?: string;
  category?: CourseCategory;
  hoursPerDay?: number;
  totalDays?: number;
  preferredDaysOfWeek?: string;
  bufferDays?: number;
  templateImage?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  status?: string;
}

export interface BranchApi {
  id: string;
  name?: string;
  locationAddress?: string;
}

export interface VehicleTypeConfigApi {
  typeId: number;
  type: string;
  label?: string;
  minHtFt?: number;
  maxHtFt?: number;
  minWt?: number;
  maxWt?: number;
  engineCc?: number;
  isElectric?: boolean;
  mileage?: number;
  maintenanceIntervalKm?: number;
  status?: boolean;
}

export interface AssetApi {
  id: string;
  vehicleType?: VehicleTypeConfigApi;
  name?: string;
  color?: string;
  nextMaintenanceDate?: string;
  status?: string;
  clientVehicle?: boolean;
  clientVehicleDetails?: string;
  currentBranch?: BranchApi;
}

export interface ClientProfileApi {
  id: number;
  name?: string;
  username?: string;
  email?: string;
  heightFt?: number;
  weightKg?: number;
  dateOfBirth?: string;
  profilePicture?: string;
}

export interface AdminClientApi extends ClientProfileApi {
  allowedNumOfTrainings?: number;
  active?: boolean;
}

export interface TrainerApi {
  id: number;
  name?: string;
  username?: string;
  startDate?: string;
  salary?: number;
  available?: boolean;
  /** true if user account is active */
  active?: boolean;
  /** current branch assignment, if any */
  currentBranch?: BranchApi | null;
  /** Comma-separated 2-letter day codes: Mo,Tu,We,Th,Fr,Sa,Su */
  preferredDays?: string;
  /** HH:mm format */
  preferredTime?: string;
  /** Comma-separated location/branch references */
  preferredLocations?: string;
}

export interface TrainerAvailabilityApi {
  id: number;
  trainer?: TrainerApi;
  branchId: string;
  availableDays: string;
  slotStartTime: string;
  slotEndTime: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
}

export interface TimeIntervalApi {
  start: string;
  end: string;
}

export interface NotificationApi {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface LedgerSummaryApi {
  totalIncome: number;
  totalExpense: number;
  byBranch: Record<string, { income: number; expense: number }>;
}
