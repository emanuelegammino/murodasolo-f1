// Invia la notifica di un nuovo muro a tutti gli iscritti.
// Solo l'admin può chiamarla, e solo per muri del weekend di gara in corso o appena concluso
// (da 3 giorni prima della gara a 7 giorni dopo): gli inserimenti di stagioni passate non notificano.
import webpush from 'web-push';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ADMIN_EMAIL, json, serviceHeaders, pushConfigured } from '../lib/push-common.mjs';

const DAY = 24 * 3600 * 1000;

async function raceDate(year, round) {
  try {
    const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/${round}.json`, { headers: { 'user-agent': 'murodasolo-f1' } });
    if (!res.ok) return null;
    const race = (await res.json()).MRData?.RaceTable?.Races?.[0];
    return race?.date ? new Date(`${race.date}T${race.time || '12:00:00Z'}`) : null;
  } catch (_) { return null; }
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'metodo non consentito' }, 405);
  if (!pushConfigured()) return json({ ok: false, skipped: 'notifiche non configurate' });

  // 1) solo l'admin
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'non autorizzato' }, 401);
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } });
  const user = who.ok ? await who.json() : null;
  if (!user || String(user.email || '').toLowerCase() !== ADMIN_EMAIL) return json({ error: 'non autorizzato' }, 403);

  let ep = {};
  try { ep = await req.json(); } catch (_) { return json({ error: 'richiesta non valida' }, 400); }
  const year = String(ep.year || ''), round = Number(ep.round || 0);
  if (!/^\d{4}$/.test(year) || !ep.driverName) return json({ error: 'episodio non valido' }, 400);

  // 2) solo il weekend di gara in corso o appena concluso
  const now = Date.now();
  let inWindow = false;
  const date = round ? await raceDate(year, round) : null;
  if (date) {
    inWindow = now >= date.getTime() - 3 * DAY && now <= date.getTime() + 7 * DAY;
  } else {
    // calendario non ancora nell'archivio: solo stagione dell'anno corrente e GP più recente registrato
    inWindow = Number(year) === new Date().getUTCFullYear() && ep.isLatestRound === true;
  }
  if (!inWindow) return json({ ok: true, skipped: 'fuori dal weekend di gara in corso' });

  // 3) invio a tutti gli iscritti
  webpush.setVapidDetails(`mailto:${ADMIN_EMAIL}`, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const subsRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth`, { headers: serviceHeaders() });
  if (!subsRes.ok) return json({ error: 'lettura iscritti non riuscita (' + subsRes.status + ')' }, 502);
  const subs = await subsRes.json();

  const title = ep.noDamage ? '🧱 Nuovo muro (senza danni)' : '🧱 Nuovo muro da solo!';
  const body = [ep.driverName, ep.gpLabel, ep.sessionLabel].filter(Boolean).join(' · ') + (ep.wet ? ' 🌧️' : '');
  const payload = JSON.stringify({ title, body, url: '/', tag: `muro-${year}-${round}-${ep.driverName}-${ep.sessionLabel || ''}` });

  let sent = 0;
  const gone = [];
  await Promise.all(subs.map(async s => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600 });
      sent += 1;
    } catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) gone.push(s.endpoint);
    }
  }));
  // pulizia iscrizioni scadute
  for (const endpoint of gone) {
    await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: 'DELETE', headers: serviceHeaders() }).catch(() => {});
  }
  return json({ ok: true, sent, removed: gone.length });
};

export const config = { path: '/api/push-notify' };
