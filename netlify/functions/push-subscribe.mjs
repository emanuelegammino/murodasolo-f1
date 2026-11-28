// Iscrive (o disiscrive) un dispositivo alle notifiche dei nuovi muri.
// POST /api/push-subscribe  { subscription }            → iscrizione
// POST /api/push-subscribe  { endpoint, remove: true }  → disiscrizione
import { SUPABASE_URL, json, serviceHeaders, pushConfigured, validSubscription } from '../lib/push-common.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'metodo non consentito' }, 405);
  if (!pushConfigured()) return json({ error: 'notifiche non ancora configurate' }, 503);
  let body = {};
  try { body = await req.json(); } catch (_) { return json({ error: 'richiesta non valida' }, 400); }

  if (body.remove) {
    const endpoint = String(body.endpoint || '');
    if (!/^https:\/\//.test(endpoint)) return json({ error: 'endpoint non valido' }, 400);
    await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
      method: 'DELETE', headers: serviceHeaders()
    });
    return json({ ok: true, removed: true });
  }

  const sub = body.subscription;
  if (!validSubscription(sub)) return json({ error: 'iscrizione non valida' }, 400);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
    method: 'POST',
    headers: serviceHeaders({ 'content-type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
  });
  if (!res.ok) return json({ error: 'salvataggio non riuscito (' + res.status + ')' }, 502);
  return json({ ok: true });
};

export const config = { path: '/api/push-subscribe' };
