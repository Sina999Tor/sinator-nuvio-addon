// GET /catalog/:type/:id.json (přepsáno přes vercel.json rewrite z /api/catalog)
// type = 'movie' | 'series'
// id = 'watchlist' nebo 'list:<ID_SEZNAMU_Z_SINATORU>'

const SINATOR_BASE = 'https://sinator-backend.vercel.app/api';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const KEY = process.env.SINATOR_BACKEND_KEY || '';
  const TMDB_KEY = process.env.TMDB_API_KEY || process.env.TMDB_KEY || '';
  const { type, id } = req.query;
  const sinatorType = type === 'series' ? 'tv' : 'movie';

  try {
    let items = [];
    if (id === 'watchlist') {
      const r = await fetch(`${SINATOR_BASE}/watchlist`, { headers: { 'x-api-key': KEY } });
      items = await r.json();
    } else if (typeof id === 'string' && id.startsWith('list:')) {
      const listId = id.slice(5);
      const r = await fetch(`${SINATOR_BASE}/lists/${encodeURIComponent(listId)}`, { headers: { 'x-api-key': KEY } });
      items = await r.json();
    }

    if (!Array.isArray(items)) items = [];

    items = items.filter(it => {
      const itType = (it.type === 'shows' || it.type === 'tv') ? 'tv' : 'movie';
      return itType === sinatorType;
    });

    // Vyřešit IMDb ID a postery z TMDB s omezenou souběžností
    const metas = [];
    const queue = items.slice();

    async function worker() {
      while (queue.length) {
        const it = queue.shift();
        try {
          const extRes = await fetch(`https://api.themoviedb.org/3/${sinatorType}/${it.id}?api_key=${TMDB_KEY}&append_to_response=external_ids`);
          const ext = await extRes.json();
          const imdbId = ext.external_ids?.imdb_id || ext.imdb_id;

          if (!imdbId) continue;

          metas.push({
            id: imdbId,
            type,
            name: it.title || (`#` + it.id),
            poster: ext.poster_path ? `https://image.tmdb.org/t/p/w500${ext.poster_path}` : undefined,
            releaseInfo: it.year ? String(it.year) : undefined
          });
        } catch (e) {
          // Jednu položku přeskočit, zbytek katalogu ať se načte
        }
      }
    }

    await Promise.all(Array.from({ length: 5 }, worker));

    res.status(200).json({ metas });
  } catch (e) {
    res.status(200).json({ metas: [] });
  }
};
