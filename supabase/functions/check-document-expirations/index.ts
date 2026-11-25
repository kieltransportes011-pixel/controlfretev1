import { createClient } from 'npm:@supabase/supabase-js@2';

// Roda 1x por dia via pg_cron (ver migration
// 20261125f_fleet_fase5_document_cron.sql - so aplicar DEPOIS de deployar
// esta function). Mesmo padrao de check-vehicle-revisions: vencimento de
// documento/CNH e uma condicao persistente, so reenvia depois de
// RENOTIFY_AFTER_DAYS desde o ultimo aviso daquele item.

const RENOTIFY_AFTER_DAYS = 3;

const DOCUMENT_LABELS: Record<string, string> = {
  seguro: 'Seguro',
  licenciamento: 'Licenciamento',
  ipva: 'IPVA',
  outro: 'Documento',
};

function isDue(expiryDate: string, alertDaysBefore: number): boolean {
  const windowMs = alertDaysBefore * 24 * 60 * 60 * 1000;
  return (new Date(expiryDate).getTime() - Date.now()) <= windowMs;
}

function alreadyNotifiedRecently(lastAlertAt: string | null): boolean {
  if (!lastAlertAt) return false;
  const renotifyMs = RENOTIFY_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return (Date.now() - new Date(lastAlertAt).getTime()) < renotifyMs;
}

function formatDateBR(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

interface DocRow {
  id: string;
  user_id: string;
  type: string;
  expiry_date: string;
  alert_days_before: number;
  last_alert_at: string | null;
  vehicles: { plate: string; model: string } | null;
}

interface DriverRow {
  id: string;
  user_id: string;
  name: string;
  cnh_expiry_date: string;
  cnh_alert_days_before: number;
  cnh_alert_at: string | null;
}

Deno.serve(async (req) => {
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

    const { data: docs, error: docsError } = await supabase
      .from('vehicle_documents')
      .select('id, user_id, type, expiry_date, alert_days_before, last_alert_at, vehicles(plate, model)');
    if (docsError) throw docsError;

    const { data: driversData, error: driversError } = await supabase
      .from('drivers')
      .select('id, user_id, name, cnh_expiry_date, cnh_alert_days_before, cnh_alert_at')
      .not('cnh_expiry_date', 'is', null);
    if (driversError) throw driversError;

    type UserEntry = { texts: string[]; docIds: string[]; driverIds: string[] };
    const byUser = new Map<string, UserEntry>();

    for (const doc of (docs ?? []) as unknown as DocRow[]) {
      if (!isDue(doc.expiry_date, doc.alert_days_before)) continue;
      if (alreadyNotifiedRecently(doc.last_alert_at)) continue;

      const label = DOCUMENT_LABELS[doc.type] ?? doc.type;
      const vehicleLabel = doc.vehicles ? `${doc.vehicles.plate} - ${doc.vehicles.model}` : 'veículo';
      const entry = byUser.get(doc.user_id) ?? { texts: [], docIds: [], driverIds: [] };
      entry.texts.push(`${label} de ${vehicleLabel} vence em ${formatDateBR(doc.expiry_date)}`);
      entry.docIds.push(doc.id);
      byUser.set(doc.user_id, entry);
    }

    for (const driver of (driversData ?? []) as DriverRow[]) {
      if (!isDue(driver.cnh_expiry_date, driver.cnh_alert_days_before)) continue;
      if (alreadyNotifiedRecently(driver.cnh_alert_at)) continue;

      const entry = byUser.get(driver.user_id) ?? { texts: [], docIds: [], driverIds: [] };
      entry.texts.push(`CNH de ${driver.name} vence em ${formatDateBR(driver.cnh_expiry_date)}`);
      entry.driverIds.push(driver.id);
      byUser.set(driver.user_id, entry);
    }

    if (byUser.size === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`;
    let notified = 0;

    for (const [userId, entry] of byUser) {
      const title = entry.texts.length === 1 ? 'Documento a vencer' : `${entry.texts.length} documentos a vencer`;
      const body = entry.texts.join(' | ');

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
        const now = new Date().toISOString();
        if (entry.docIds.length > 0) {
          await supabase.from('vehicle_documents').update({ last_alert_at: now }).in('id', entry.docIds);
        }
        if (entry.driverIds.length > 0) {
          await supabase.from('drivers').update({ cnh_alert_at: now }).in('id', entry.driverIds);
        }
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
