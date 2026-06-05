import { CalendarEvent, CalendarResource } from '../../calendar/models/calendar.types';
import { AssetApi, ScheduleSlotApi } from '../models/api.models';

export function slotsToEvents(slots: ScheduleSlotApi[]): CalendarEvent[] {
  return slots.map((s) => ({
    id: s.id,
    resourceId: s.resourceId ?? 'unassigned',
    title: s.title ?? 'Session',
    startTime: new Date(s.startDateTime),
    endTime: new Date(s.endDateTime),
    status: s.status ?? 'PENDING',
    metadata: {
      trainerId: s.trainer?.id,
      trainerName: s.trainer?.name,
      clientId: s.client?.id,
      branchId: s.branchId,
      rejectionReason: s.rejectionReason
    },
    uiStyles: statusStyles(s.status)
  }));
}

function statusStyles(status?: string) {
  switch (status) {
    case 'PENDING':
      return { backgroundColor: '#fff3e0', borderColor: '#ff9800' };
    case 'ACTIVE':
      return { backgroundColor: '#e8f5e9', borderColor: '#4caf50' };
    case 'CANCELLED':
      return { backgroundColor: '#eeeeee', borderColor: '#9e9e9e' };
    default:
      return {};
  }
}

export function assetsToResources(assets: AssetApi[]): CalendarResource[] {
  return assets.map((a) => ({
    id: a.id,
    name: a.name ?? a.id,
    status: 'ACTIVE' as const,
    customProperties: {
      branchId: a.currentBranch?.id,
      type: a.type
    }
  }));
}
