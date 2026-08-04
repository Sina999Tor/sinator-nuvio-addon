// GET /catalog/:type/:id.json

const SINATOR_BASE = 'https://sinator-backend.vercel.app/api';
const KEY = 'f3a9c7e2b6d4185e0c9a2f7b3e6d1c8a4f0b7e3d9c2a5f1b8e4d7c0a3f6b9e2d';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const TMDB_KEY = process.env.TMDB_API_KEY || process.env.TMDB_KEY || '';
  const { type, id } = req.query;
  const sinatorType = type === 'series' ? 'tv' : 'movie';

  try {
    let rawItems = [];
    const headers = {
      'x-api-key': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    };

    if (id === 'watchlist') {
      const r = await fetch(`${SINATOR_BASE}/watchlist`, { headers });
      rawItems = await r.json();
    } else if (typeof id === 'string' && id.startsWith('list:')) {
      const listId = id.slice(5);
      const r = await fetch(`${SINATOR_BASE}/lists/${encodeURIComponent(listId)}/items`, { headers });
      rawItems = await r.json();
    }

    const items = Array.isArray(rawItems) ? rawItems : (rawItems.items || rawItems.data || []);

    const filteredItems = items.filter(it => {
      if (!it) return false;
      const itType = (it.type === 'shows' || it.type === 'tv' || it.media_type === 'tv') ? 'tv' : 'movie';
      return itType === sinatorType;
    });

    const metas = [];
    const queue = filteredItems.slice();

    async function worker() {
      while (queue.length) {
        const it = queue.shift();
        try {
          const tmdbId = it.id || it.tmdb_id;
          if (!tmdbId) continue;

          const extRes = await fetch(`https://api.themoviedb.org/3/${sinatorType}/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=external_ids`);
          const ext = await extRes.json();
          const imdbId = ext.external_ids?.imdb_id || ext.imdb_id;

          if (!imdbId) continue;

          const releaseDate = ext.release_date || ext.first_air_date || it.year;

          metas.push({
            id: imdbId,
            type,
            name: ext.title || ext.name || it.title || it.name || (`#` + tmdbId),
            poster: ext.poster_path ? `https://image.tmdb.org/t/p/w500${ext.poster_path}` : undefined,
            releaseInfo: releaseDate ? String(releaseDate).slice(0, 4) : undefined
          });
        } catch (e) {
          // Chybu jedné položky přeskočíme
        }
      }
    }

    await Promise.all(Array.from({ length: 5 }, worker));

    res.status(200).json({ metas });
  } catch (e) {
    res.status(200).json({ metas: [] });
  }
};
