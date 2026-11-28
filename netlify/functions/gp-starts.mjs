// Murodasolo F1 - GP disputati per pilota in una stagione.
// Legge l'archivio pubblico Jolpica (ex Ergast) lato server ed evita i blocchi del browser.
// Uso: /api/gp-starts?year=2024
const API = 'https://api.jolpi.ca/ergast/f1';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = n => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

export default async (req) => {
  const year = new URL(req.url).searchParams.get('year') || '';
  if (!/^\d{4}$/.test(year)) {
    return new Response(JSON.stringify({ error: 'anno non valido' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  try {
    const full = {}, family = {};
    const rounds = new Set();
    let offset = 0, total = 1, attempts = 0;
    while (offset < total) {
      const res = await fetch(`${API}/${year}/results.json?limit=100&offset=${offset}`, { headers: { 'user-agent': 'murodasolo-f1' } });
      if (res.status === 429 && attempts < 5) { attempts++; await sleep(1500 * attempts); continue; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const mr = json.MRData || {};
      total = Number(mr.total || 0);
      for (const race of (mr.RaceTable?.Races || [])) {
        rounds.add(race.round);
        for (const r of (race.Results || [])) {
          const st = String(r.status || '').toLowerCase();
          if (/did not start|withdrew|did not qualify|did not prequalify/.test(st)) continue;
          const fn = norm(`${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`);
          const fam = norm(r.Driver?.familyName || '');
          full[fn] = (full[fn] || 0) + 1;
          family[fam] = (family[fam] || 0) + 1;
        }
      }
      offset += 100;
      if (offset < total) await sleep(300);
    }
    const thisYear = new Date().getFullYear();
    const maxAge = Number(year) < thisYear ? 7 * 24 * 3600 : 6 * 3600;
    return new Response(JSON.stringify({ year, races: rounds.size, full, family }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${maxAge}`, 'netlify-cdn-cache-control': `public, max-age=${maxAge}` }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
};

export const config = { path: '/api/gp-starts' };
