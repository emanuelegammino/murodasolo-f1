// Funzioni comuni per le notifiche push di Murodasolo F1.
// Variabili d'ambiente richieste su Netlify:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_SERVICE_KEY
export const SUPABASE_URL = 'https://mhtmdghkvgykheacczvm.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_NmRf6XAOCvPg-kiXp8NvZQ_bCvQ00ez';
export const ADMIN_EMAIL = 'emagammino@gmail.com';

export const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});

// Intestazioni per la chiave di servizio (nuovo formato sb_secret_ o vecchio service_role JWT)
export function serviceHeaders(extra = {}) {
  const key = String(process.env.SUPABASE_SERVICE_KEY || '').trim();
  const h = { apikey: key, ...extra };
  if (key && !key.startsWith('sb_')) h.Authorization = `Bearer ${key}`;
  return h;
}

export function pushConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.SUPABASE_SERVICE_KEY);
}

export function validSubscription(sub) {
  return sub && typeof sub.endpoint === 'string' && /^https:\/\//.test(sub.endpoint)
    && sub.keys && typeof sub.keys.p256dh === 'string' && typeof sub.keys.auth === 'string'
    && sub.endpoint.length < 1000;
}
