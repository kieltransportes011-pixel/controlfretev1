import { Vehicle, VehicleMaintenancePlan } from '../types';

// Mesmas janelas usadas no cron (supabase/functions/check-vehicle-revisions)
// - duplicado la de proposito, Edge Functions nao compartilham bundle com o
// front. Se mudar aqui, mudar la tambem.
export const DATE_WINDOW_DAYS = 15;
export const KM_WINDOW = 1000; // "em breve" se faltar <= 1000km pra vencer

export type RevisionLevel = 'OK' | 'SOON' | 'OVERDUE';

export interface VehicleAlert {
  vehicle: Vehicle;
  reason: 'KM' | 'DATE' | 'BOTH';
  level: RevisionLevel; // sempre SOON ou OVERDUE aqui (OK nao gera alerta)
  dueKm?: number | null;
  dueDate?: string | null;
}

function kmLevel(nextKm: number | null | undefined, currentKm: number): RevisionLevel {
  if (!nextKm) return 'OK';
  if (currentKm >= nextKm) return 'OVERDUE';
  if (nextKm - currentKm <= KM_WINDOW) return 'SOON';
  return 'OK';
}

// Generico: usado tambem pra vencimento de documento/CNH (Fase 5), com
// janela configuravel por item em vez da janela fixa de 15 dias da revisao.
export function getExpiryLevel(date: string | null | undefined, windowDays: number): RevisionLevel {
  if (!date) return 'OK';
  const diffMs = new Date(date).getTime() - Date.now();
  if (diffMs <= 0) return 'OVERDUE';
  if (diffMs <= windowDays * 24 * 60 * 60 * 1000) return 'SOON';
  return 'OK';
}

function dateLevel(nextDate: string | null | undefined): RevisionLevel {
  return getExpiryLevel(nextDate, DATE_WINDOW_DAYS);
}

function worse(a: RevisionLevel, b: RevisionLevel): RevisionLevel {
  const rank: Record<RevisionLevel, number> = { OK: 0, SOON: 1, OVERDUE: 2 };
  return rank[a] >= rank[b] ? a : b;
}

// Estado de revisao de um veiculo (OK/SOON/OVERDUE), pra exibir mesmo quando
// nao ha nada vencido ainda (ex: selo "Em dia" no detalhe do veiculo).
export function getRevisionLevel(
  plan: Pick<VehicleMaintenancePlan, 'next_revision_km' | 'next_revision_date'> | undefined,
  currentKm: number
): RevisionLevel {
  if (!plan) return 'OK';
  return worse(kmLevel(plan.next_revision_km, currentKm), dateLevel(plan.next_revision_date));
}

export function getVehiclesNeedingAttention(
  vehicles: Vehicle[],
  plans: VehicleMaintenancePlan[]
): VehicleAlert[] {
  const planByVehicle = new Map(plans.map(p => [p.vehicle_id, p]));

  return vehicles.reduce<VehicleAlert[]>((acc, vehicle) => {
    const plan = planByVehicle.get(vehicle.id);
    if (!plan) return acc;

    const km = kmLevel(plan.next_revision_km, vehicle.current_km);
    const date = dateLevel(plan.next_revision_date);
    const level = worse(km, date);
    if (level === 'OK') return acc;

    acc.push({
      vehicle,
      reason: km !== 'OK' && date !== 'OK' ? 'BOTH' : km !== 'OK' ? 'KM' : 'DATE',
      level,
      dueKm: plan.next_revision_km,
      dueDate: plan.next_revision_date,
    });
    return acc;
  }, []);
}
