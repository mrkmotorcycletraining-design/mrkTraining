import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {
  AdminClientApi,
  AssetApi,
  BranchApi,
  ClientProfileApi,
  CourseApi,
  EnrollmentApi,
  LedgerSummaryApi,
  NotificationApi,
  ScheduleSlotApi,
  ScheduleSlotListResponse,
  TimeIntervalApi,
  TrainerApi,
  TrainerAvailabilityApi,
  VehicleTypeConfigApi,
  EnrollmentStatus,
  ScheduleStatus
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TrainingApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  // Auth handled by interceptor
  login(body: { emailUsername: string; password: string }) {
    return this.http.post<{ token: string; role: string; userId: number }>('/api/auth/login', body);
  }

  // Clients
  getClientMe() {
    return this.http.get<ClientProfileApi>('/api/clients/me');
  }
  updateClientMe(body: Partial<ClientProfileApi>) {
    return this.http.put<ClientProfileApi>('/api/clients/me', body);
  }
  changeClientPassword(currentPassword: string, newPassword: string) {
    return this.http.put<void>('/api/clients/me/password', { currentPassword, newPassword });
  }
  listClients() {
    return this.http.get<AdminClientApi[]>('/api/clients');
  }
  getClient(id: number) {
    return this.http.get<AdminClientApi>(`/api/clients/${id}`);
  }
  createClient(body: unknown) {
    return this.http.post<AdminClientApi>('/api/clients', body);
  }
  updateClientAllowance(id: number, allowedNumOfTrainings: number) {
    return this.http.put<void>(`/api/clients/${id}/trainings-allowance`, { allowedNumOfTrainings });
  }
  deactivateClient(id: number) {
    return this.http.put<void>(`/api/clients/${id}/deactivate`, {});
  }
  resetClientPassword(id: number, password: string) {
    return this.http.put<void>(`/api/clients/${id}/reset-password`, { password });
  }

  // Trainers
  listTrainers() {
    return this.http.get<TrainerApi[]>('/api/trainers');
  }
  getTrainer(id: number) {
    return this.http.get<TrainerApi>(`/api/trainers/${id}`);
  }
  getTrainerMe() {
    return this.http.get<TrainerApi>('/api/trainers/me');
  }
  createTrainer(body: unknown) {
    return this.http.post<TrainerApi>('/api/trainers', body);
  }
  deleteTrainer(id: number) {
    return this.http.delete<void>(`/api/trainers/${id}`);
  }
  deactivateTrainer(id: number) {
    return this.http.put<void>(`/api/trainers/${id}/deactivate`, {});
  }
  resetTrainerPassword(id: number, password: string) {
    return this.http.put<void>(`/api/trainers/${id}/reset-password`, { password });
  }

  // Branches & assets & courses
  listBranches() {
    return this.http.get<BranchApi[]>('/api/branches');
  }
  getBranch(id: string) {
    return this.http.get<BranchApi>(`/api/branches/${id}`);
  }
  createBranch(body: BranchApi) {
    // Fallback: attach Authorization header explicitly if available
    try {
      const token = (this.auth && this.auth.token) ? this.auth.token() : null;
      const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
      return this.http.post<BranchApi>('/api/branches', body, headers ? { headers } : {});
    } catch (e) {
      return this.http.post<BranchApi>('/api/branches', body);
    }
  }
  updateBranch(id: string, body: { name?: string; locationAddress?: string }) {
    return this.http.put<BranchApi>(`/api/branches/${id}`, { id, ...body });
  }
  listAssets(branchId?: string, type?: string) {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    if (type) params = params.set('type', type);
    return this.http.get<AssetApi[]>('/api/vehicles', { params });
  }
  createAsset(body: {
    id: string;
    typeId: number;
    name?: string;
    currentBranchId?: string;
    color?: string | null;
    nextMaintenanceDate?: string | null;
    clientVehicle?: boolean;
    clientVehicleDetails?: string | null;
  }) {
    return this.http.post<AssetApi>('/api/vehicles', body);
  }
  updateAsset(id: string, body: { typeId?: number; name?: string; currentBranchId?: string }) {
    return this.http.put<AssetApi>(`/api/vehicles/${id}`, body);
  }
  setAssetMaintenance(id: string) {
    return this.http.put<void>(`/api/vehicles/${id}/maintenance`, {});
  }
  listVehicleTypes() {
    return this.http.get<VehicleTypeConfigApi[]>('/api/vehicles/types');
  }
  createVehicleType(body: {
    type: string;
    label?: string;
    minHt?: number | null;
    maxHt?: number | null;
    minWt?: number | null;
    maxWt?: number | null;
    engineCc?: number | null;
    isElectric?: boolean;
    mileage?: number | null;
    maintenanceIntervalKm?: number | null;
  }) {
    return this.http.post<VehicleTypeConfigApi>('/api/vehicles/types', body);
  }
  listCourses() {
    return this.http.get<CourseApi[]>('/api/courses');
  }
  createCourse(body: { id: string; name: string; category: string; hoursPerDay: number; totalDays: number }) {
    return this.http.post<CourseApi>('/api/courses', body);
  }
  updateCourse(id: string, body: Partial<CourseApi>) {
    return this.http.put<CourseApi>(`/api/courses/${id}`, body);
  }
  updateCourseImage(id: string, imageUrl: string) {
    return this.http.put<CourseApi>(`/api/courses/${id}/image`, { imageUrl });
  }

  // Slots
  listSlots(opts: {
    clientId?: string;
    trainerId?: string;
    branchId?: string;
    status?: ScheduleStatus;
    from?: string;
    to?: string;
  }) {
    let params = new HttpParams();
    Object.entries(opts).forEach(([k, v]) => {
      if (v != null) params = params.set(k, String(v));
    });
    return this.http.get<ScheduleSlotListResponse>('/api/slots', { params });
  }
  listPendingSlots() {
    return this.http.get<ScheduleSlotApi[]>('/api/slots/pending');
  }
  approveSlot(id: number, assetId: string, trainerId: number) {
    return this.http.put<ScheduleSlotApi>(`/api/slots/${id}/approve`, { assetId, trainerId });
  }
  rejectSlot(id: number, reason?: string) {
    return this.http.put<ScheduleSlotApi>(`/api/slots/${id}/reject`, { reason });
  }
  recordSlotAbsence(id: number) {
    return this.http.post<void>(`/api/slots/${id}/absence`, {});
  }

  // Enrollments
  listMyEnrollments() {
    return this.http.get<EnrollmentApi[]>('/api/enrollments/mine');
  }
  listEnrollments(opts?: { clientId?: number; status?: EnrollmentStatus; from?: string; to?: string }) {
    let params = new HttpParams();
    if (opts?.clientId) params = params.set('clientId', opts.clientId);
    if (opts?.status) params = params.set('status', opts.status);
    if (opts?.from) params = params.set('from', opts.from);
    if (opts?.to) params = params.set('to', opts.to);
    return this.http.get<EnrollmentApi[]>('/api/enrollments', { params });
  }
  getEnrollment(id: number) {
    return this.http.get<EnrollmentApi>(`/api/enrollments/${id}`);
  }
  getEnrollmentSlots(id: number) {
    return this.http.get<ScheduleSlotApi[]>(`/api/enrollments/${id}/slots`);
  }
  submitEnrollment(body: unknown) {
    return this.http.post<EnrollmentApi>('/api/enrollments', body);
  }
  pauseEnrollment(id: number) {
    return this.http.put<EnrollmentApi>(`/api/enrollments/${id}/pause`, {});
  }

  // Scheduler
  availableIntervals(body: unknown) {
    return this.http.post<{ intervals: TimeIntervalApi[] }>('/api/scheduler/available-intervals', body);
  }

  // Trainer availability
  listTrainerAvailability(trainerId?: number) {
    const params = trainerId ? new HttpParams().set('trainerId', trainerId) : undefined;
    return this.http.get<TrainerAvailabilityApi[]>('/api/trainer-availability', { params });
  }
  addTrainerAvailability(body: unknown) {
    return this.http.post<TrainerAvailabilityApi>('/api/trainer-availability', body);
  }
  removeTrainerAvailability(id: number) {
    return this.http.delete<void>(`/api/trainer-availability/${id}`);
  }
  markTrainerAbsence(trainerId: number, date: string) {
    return this.http.post<TrainerAvailabilityApi>(
      `/api/trainer-availability/absence?trainerId=${trainerId}&date=${date}`,
      {}
    );
  }

  // Notifications
  listNotifications() {
    return this.http.get<NotificationApi[]>('/api/notifications');
  }
  markNotificationRead(id: number) {
    return this.http.put<void>(`/api/notifications/${id}/read`, {});
  }

  // Ledger
  ledgerSummary(branchId: string | null, from: string, to: string) {
    let params = new HttpParams().set('from', from).set('to', to);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<LedgerSummaryApi>('/api/ledger/summary', { params });
  }
  addExpense(body: unknown) {
    return this.http.post<unknown>('/api/ledger/expense', body);
  }
}
