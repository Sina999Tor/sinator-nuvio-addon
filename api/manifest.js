// GET /manifest.json (přepsáno přes vercel.json rewrite z /api/manifest)

const SINATOR_BASE = 'https://sinator-backend.vercel.app/api';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Načtení klíče z Environment Variables na Vercelu
  const KEY = process.env.SINATOR_BACKEND_KEY || '';

  const catalogs = [
    { type: 'movie', id: 'watchlist', name: 'Sinator: Watchlist - Filmy' },
    { type: 'series', id: 'watchlist', name: 'Sinator: Watchlist - Seriály' }
  ];

  try {
    // Volání backendu s předaným x-api-key hlavičkou
    const r = await fetch(`${SINATOR_BASE}/lists`, {
      headers: {
        'x-api-key': KEY,
        'Content-Type': 'application/json'
      }
    });

    if (r.ok) {
      const lists = await r.json();

      if (Array.isArray(lists)) {
        for (const item of lists) {
          if (!item) continue;
          
          // Podpora pro různé struktury (id / slug / name)
          const listId = item.id || item.slug;
          const listName = item.name || item.title || listId;

          if (listId) {
            catalogs.push({
              type: 'movie',
              id: `list:${listId}`,
              name: `Sinator: ${listName} (Filmy)`
            });
            catalogs.push({
              type: 'series',
              id: `list:${listId}`,
              name: `Sinator: ${listName} (Seriály)`
            });
          }
        }
      }
    }
  } catch (e) {
    // V případě výpadku backendu vrátí alespoň Watchlist
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
