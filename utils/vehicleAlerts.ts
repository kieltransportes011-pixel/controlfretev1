import { Vehicle, MaintenanceLog } from '../types';

export interface VehicleAlert {
  vehicle: Vehicle;
  reason: 'KM' | 'DATE' | 'BOTH';
  dueKm?: number;
  dueDate?: string;
}

const DATE_WINDOW_DAYS = 15;

export function getVehiclesNeedingAttention(
  vehicles: Vehicle[],
  logs: MaintenanceLog[]
): VehicleAlert[] {
  const now = Date.now();
  const windowMs = DATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return vehicles.reduce<VehicleAlert[]>((acc, vehicle) => {
    const relevantLog = logs
      .filter(l => l.vehicle_id === vehicle.id && (l.next_revision_km || l.next_revision_date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (!relevantLog) return acc;

    const kmDue = !!relevantLog.next_revision_km && vehicle.current_km >= relevantLog.next_revision_km;
    const dateDue = !!relevantLog.next_revision_date &&
      (new Date(relevantLog.next_revision_date).getTime() - now) <= windowMs;

    if (kmDue || dateDue) {
      acc.push({
        vehicle,
        reason: kmDue && dateDue ? 'BOTH' : kmDue ? 'KM' : 'DATE',
        dueKm: relevantLog.next_revision_km,
        dueDate: relevantLog.next_revision_date,
      });
    }
    return acc;
  }, []);
}
