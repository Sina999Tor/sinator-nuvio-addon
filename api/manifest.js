// GET /manifest.json (přepsáno přes vercel.json rewrite z /api/manifest)

const SINATOR_BASE = 'https://sinator-backend.vercel.app/api';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const KEY = process.env.SINATOR_BACKEND_KEY || '';
  const catalogs = [
    { type: 'movie', id: 'watchlist', name: 'Sinator: Watchlist' },
    { type: 'series', id: 'watchlist', name: 'Sinator: Watchlist' }
  ];

  try {
    const r = await fetch(`${SINATOR_BASE}/lists`, { headers: { 'x-api-key': KEY } });
    const lists = await r.json();

    if (Array.isArray(lists)) {
      for (const item of lists) {
        if (!item || item.id == null) continue;
        const name = item.name || item.id;
        catalogs.push({ type: 'movie', id: `list:${item.id}`, name: `Sinator: ${name}` });
        catalogs.push({ type: 'series', id: `list:${item.id}`, name: `Sinator: ${name}` });
      }
    }
  } catch (e) {
    // Když seznamy nejdou načíst, vracejí se alespoň základy
  }

  res.status(200).json({
    id: 'cz.sinator.addon',
    version: '1.0.0',
    name: 'Sinator',
    description: 'Tvoje seznamy a watchlist ze Sinatoru přímo v Nuviu/Stremiu.',
    resources: ['catalog'],
    types: ['movie', 'series'],
    catalogs,
    idPrefixes: ['tt']
  });
};
