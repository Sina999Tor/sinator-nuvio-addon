// GET /manifest.json

const SINATOR_BASE = 'https://sinator-backend.vercel.app/api';
const KEY = process.env.SINATOR_BACKEND_KEY || '';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const catalogs = [
    { type: 'movie', id: 'watchlist', name: 'Sinator: Watchlist' },
    { type: 'series', id: 'watchlist', name: 'Sinator: Watchlist' }
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const r = await fetch(`${SINATOR_BASE}/lists`, {
      headers: {
        'x-api-key': KEY
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (r.ok) {
      const lists = await r.json();

      if (Array.isArray(lists)) {
        for (const item of lists) {
          if (!item) continue;
          const listId = item.id || item.slug;
          const listName = item.name || item.title || listId;

          if (listId) {
            catalogs.push({
              type: 'movie',
              id: `list:${listId}`,
              name: `Sinator: ${listName}`
            });
            catalogs.push({
              type: 'series',
              id: `list:${listId}`,
              name: `Sinator: ${listName}`
            });
          }
        }
      }
    }
  } catch (e) {
    // V případě výpadku zachováme alespoň Watchlist
  }

  res.status(200).json({
    id: 'cz.sinator.addon',
    version: '1.0.0',
    name: 'Sinator',
    description: 'Automatické seznamy ze Sinator backendu.',
    resources: ['catalog', 'meta'],
    types: ['movie', 'series'],
    catalogs,
    idPrefixes: ['tt']
  });
};
