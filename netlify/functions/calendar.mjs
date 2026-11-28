// Murodasolo F1 - calendario ufficiale di una stagione dall'archivio Jolpica (ex Ergast).
// Uso: /api/calendar?year=2028  →  { year, races: [{ round, gp, circuit }] }
export default async (req) => {
  const year = new URL(req.url).searchParams.get('year') || '';
  const json = (body, status = 200, maxAge = 0) => new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${maxAge}`, 'netlify-cdn-cache-control': `public, max-age=${maxAge}` }
  });
  if (!/^\d{4}$/.test(year)) return json({ error: 'anno non valido' }, 400);
  try {
    const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json?limit=100`, { headers: { 'user-agent': 'murodasolo-f1' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const races = (data.MRData?.RaceTable?.Races || []).map(r => ({
      round: Number(r.round),
      gp: r.raceName,
      circuit: r.Circuit?.circuitName || ''
    }));
    return json({ year, races }, 200, races.length ? 24 * 3600 : 3600);
  } catch (e) {
    return json({ error: String(e.message || e), races: [] }, 502);
  }
};

export const config = { path: '/api/calendar' };
