// GET /manifest.json (přepsáno přes vercel.json rewrite z /api/manifest)

const SINATOR_BASE = 'https://sinator-backend.vercel.app/api';
const KEY = 'F3a9c7e2b6d4185e0c9a2f7b3e6d1c8a4f0b7e3d9c2a5f1b8e4d7c0a3f6b9e2d';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const catalogs = [
    { type: 'movie', id: 'watchlist', name: 'Sinator: Watchlist' },
    { type: 'series', id: 'watchlist', name: 'Sinator: Watchlist' }
  ];

  try {
    const r = await fetch(`${SINATOR_BASE}/lists`, {
      headers: {
        'x-api-key': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json'
      }
    });

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
    // V případě výpadku se vrátí základní Watchlist
  }

  res.status(200).json({
    id: 'cz.sinator.addon',
    version: '1.0.0',
    name: 'Sinator',
    description: 'Tvoje seznamy a watchlist ze Sinatoru v Nuviu.',
    resources: ['catalog'],
    types: ['movie', 'series'],
    catalogs,
    idPrefixes: ['tt']
  });
};
