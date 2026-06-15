import { CalendarEvent, CalendarResource } from '../../calendar/models/calendar.types';
import { AssetApi, ScheduleSlotApi } from '../models/api.models';

export function slotsToEvents(slots: ScheduleSlotApi[]): CalendarEvent[] {
  return slots.map((s) => ({
    id: s.id,
    resourceId: s.resourceId ?? 'unassigned',
    title: s.title ?? buildTitle(s),
    startTime: new Date(s.startDateTime),
    endTime: new Date(s.endDateTime),
    status: s.status ?? 'PENDING',
    metadata: {
      trainerId: s.trainer?.id,
      trainerName: s.trainer?.name,
      clientId: s.client?.id,
      clientName: s.client?.name,
      branchId: s.branchId,
      rejectionReason: s.rejectionReason,
      type: s.type
    },
    uiStyles: statusStyles(s.status)
  }));
}

/** Build a meaningful title from slot data if title is missing */
function buildTitle(slot: ScheduleSlotApi): string {
  const parts: string[] = [];
  if (slot.type) parts.push(slot.type.replace(/_/g, ' '));
  if (slot.client?.name) parts.push(slot.client.name);
  return parts.length > 0 ? parts.join(' - ') : 'Session';
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
  // Group assets by type to create virtual parent categories
  const typeSet = new Set(assets.map(a => a.vehicleType?.type).filter(Boolean));
  const categoryResources: CalendarResource[] = Array.from(typeSet).map(type => ({
    id: `__cat__${type}`,
    name: type!,
    status: 'ACTIVE' as const,
    colorTheme: assetTypeColor(type!),
    customProperties: { isCategory: true }
  }));

  const assetResources: CalendarResource[] = assets.map((a) => ({
    id: a.id,
    name: a.name ?? a.id,
    parentId: `__cat__${a.vehicleType?.type}`,
    status: (a.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE') as CalendarResource['status'],
    colorTheme: assetTypeColor(a.vehicleType?.type ?? ''),
    customProperties: {
      branchId: a.currentBranch?.id,
      type: a.vehicleType?.type
    }
  }));

  return [...categoryResources, ...assetResources];
}

function assetTypeColor(type: string): string {
  const palette: Record<string, string> = {
    BIKE: '#1976D2',
    BICYCLE: '#388E3C',
    SCOOTER: '#7B1FA2',
    CAR: '#F57C00',
    MAINTENANCE: '#616161'
  };
  return palette[type?.toUpperCase()] ?? '#1976D2';
}
