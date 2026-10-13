import { createClient } from 'npm:@supabase/supabase-js@2';

// Roda 1x por dia via pg_cron (ver migration correspondente). Varre os
// veículos com revisão vencida/perto de vencer (mesma regra de
// utils/vehicleAlerts.ts no front, portada aqui porque Edge Functions não
// compartilham bundle com o front) e dispara um push por usuário, agrupado.
// Como "revisão vencida" é uma condição persistente (não expira como uma
// conta a pagar), só reenvia depois de 3 dias desde o último aviso pra cada
// veículo (vehicles.last_revision_alert_at).

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

interface LogRow {
  vehicle_id: string;
  date: string;
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

    const { data: logs, error: logsError } = await supabase
      .from('maintenance_logs')
      .select('vehicle_id, date, next_revision_km, next_revision_date')
      .or('next_revision_km.not.is.null,next_revision_date.not.is.null')
      .order('date', { ascending: false });
    if (logsError) throw logsError;

    // Log mais recente por veículo (equivalente a DISTINCT ON vehicle_id, já
    // que `logs` chegou ordenado por date desc).
    const latestLogByVehicle = new Map<string, LogRow>();
    for (const log of (logs ?? []) as LogRow[]) {
      if (!latestLogByVehicle.has(log.vehicle_id)) {
        latestLogByVehicle.set(log.vehicle_id, log);
      }
    }

    const now = Date.now();
    const windowMs = DATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const renotifyMs = RENOTIFY_AFTER_DAYS * 24 * 60 * 60 * 1000;

    type DueVehicle = { vehicle: VehicleRow; reason: 'KM' | 'DATE' | 'BOTH'; dueKm: number | null; dueDate: string | null };
    const dueVehicles: DueVehicle[] = [];

    for (const vehicle of vehicles as VehicleRow[]) {
      const log = latestLogByVehicle.get(vehicle.id);
      if (!log) continue;

      const kmDue = !!log.next_revision_km && vehicle.current_km >= log.next_revision_km;
      const dateDue = !!log.next_revision_date &&
        (new Date(log.next_revision_date).getTime() - now) <= windowMs;
      if (!kmDue && !dateDue) continue;

      const alreadyNotifiedRecently = !!vehicle.last_revision_alert_at &&
        (now - new Date(vehicle.last_revision_alert_at).getTime()) < renotifyMs;
      if (alreadyNotifiedRecently) continue;

      dueVehicles.push({
        vehicle,
        reason: kmDue && dateDue ? 'BOTH' : kmDue ? 'KM' : 'DATE',
        dueKm: log.next_revision_km,
        dueDate: log.next_revision_date,
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
