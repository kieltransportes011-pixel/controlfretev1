import { createClient } from 'npm:@supabase/supabase-js@2';

// Roda 1x por dia via pg_cron (ver migration correspondente). Varre os
// veículos com revisão vencida/perto de vencer (mesma regra de
// utils/vehicleAlerts.ts no front, portada aqui porque Edge Functions não
// compartilham bundle com o front) e dispara um push por usuário, agrupado.
// Como "revisão vencida" é uma condição persistente (não expira como uma
// conta a pagar), só reenvia depois de 3 dias desde o último aviso pra cada
// veículo (vehicles.last_revision_alert_at).
//
// Fonte do vencimento: vehicle_maintenance_plans (1 linha por veiculo,
// formalizado na Fase 2 da profissionalizacao da Frota). Antes isso vinha de
// um scan em maintenance_logs a cada execucao - a condicao de disparo
// continua EXATAMENTE a mesma (kmDue / dateDue dentro de 15 dias), so a
// origem do dado mudou.

const DATE_WINDOW_DAYS = 15;
const RENOTIFY_AFTER_DAYS = 3;

interface VehicleRow {
  id: string;
  user_id: string;
  plate: string;
  model: string;
  current_km: number;
  last_revision_alert_at: string | null;
}

interface PlanRow {
  vehicle_id: string;
  next_revision_km: number | null;
  next_revision_date: string | null;
}

function formatDateBR(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

Deno.serve(async (req) => {
  // Só o próprio pg_cron chama essa função, mesmo padrão de check-due-bills.
  const authHeader = req.headers.get('Authorization') ?? '';
  const bearerToken = authHeader.replace('Bearer ', '');
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const cronAuthKey = secretKeys['controlfrete_1_0'];

  if (!cronAuthKey || bearerToken !== cronAuthKey) {
    return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, cronAuthKey);

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, user_id, plate, model, current_km, last_revision_alert_at');
    if (vehiclesError) throw vehiclesError;

    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: plans, error: plansError } = await supabase
      .from('vehicle_maintenance_plans')
      .select('vehicle_id, next_revision_km, next_revision_date');
    if (plansError) throw plansError;

    const planByVehicle = new Map<string, PlanRow>();
    for (const plan of (plans ?? []) as PlanRow[]) {
      planByVehicle.set(plan.vehicle_id, plan);
    }

    const now = Date.now();
    const windowMs = DATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const renotifyMs = RENOTIFY_AFTER_DAYS * 24 * 60 * 60 * 1000;

    type DueVehicle = { vehicle: VehicleRow; reason: 'KM' | 'DATE' | 'BOTH'; dueKm: number | null; dueDate: string | null };
    const dueVehicles: DueVehicle[] = [];

    for (const vehicle of vehicles as VehicleRow[]) {
      const plan = planByVehicle.get(vehicle.id);
      if (!plan) continue;

      const kmDue = !!plan.next_revision_km && vehicle.current_km >= plan.next_revision_km;
      const dateDue = !!plan.next_revision_date &&
        (new Date(plan.next_revision_date).getTime() - now) <= windowMs;
      if (!kmDue && !dateDue) continue;

      const alreadyNotifiedRecently = !!vehicle.last_revision_alert_at &&
        (now - new Date(vehicle.last_revision_alert_at).getTime()) < renotifyMs;
      if (alreadyNotifiedRecently) continue;

      dueVehicles.push({
        vehicle,
        reason: kmDue && dateDue ? 'BOTH' : kmDue ? 'KM' : 'DATE',
        dueKm: plan.next_revision_km,
        dueDate: plan.next_revision_date,
      });
    }

    if (dueVehicles.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const byUser = new Map<string, DueVehicle[]>();
    for (const dv of dueVehicles) {
      const list = byUser.get(dv.vehicle.user_id) ?? [];
      list.push(dv);
      byUser.set(dv.vehicle.user_id, list);
    }

    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`;
    let notified = 0;

    for (const [userId, userVehicles] of byUser) {
      const describe = (dv: DueVehicle) => {
        if (dv.reason !== 'DATE' && dv.dueKm) return `revisão aos ${dv.dueKm.toLocaleString('pt-BR')} KM`;
        if (dv.dueDate) return `revisão em ${formatDateBR(dv.dueDate)}`;
        return 'revisão pendente';
      };

      const title = userVehicles.length === 1 ? 'Revisão pendente' : `${userVehicles.length} veículos com revisão pendente`;
      const body = userVehicles.length === 1
        ? `${userVehicles[0].vehicle.plate} - ${userVehicles[0].vehicle.model}: ${describe(userVehicles[0])}.`
        : userVehicles.map(dv => `${dv.vehicle.plate} - ${dv.vehicle.model}`).join(', ');

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cronAuthKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, title, body }),
      });

      if (res.ok) {
        notified++;
        await supabase
          .from('vehicles')
          .update({ last_revision_alert_at: new Date().toISOString() })
          .in('id', userVehicles.map(dv => dv.vehicle.id));
      }
    }

    return new Response(JSON.stringify({ notified }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
