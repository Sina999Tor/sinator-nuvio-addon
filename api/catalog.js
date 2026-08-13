// GET /catalog/:type/:id.json (přepsáno přes vercel.json rewrite z /api/catalog?type=..&id=..)
// type = 'movie' | 'series'
// id   = 'watchlist'  nebo  'list:<ID_SEZNAMU_Z_SINATORU>'
//
// Stremio/Nuvio potřebuje IMDb id (tt1234567) u každé položky, aby na ni
// dokázaly navázat ostatní addony (Cinemeta na detail, streamovací addony
// na přehrání). Sinator má u položek TMDB id, takže se tu k němu přes TMDB
// dotáhne odpovídající IMDb id (external_ids). Položky, u kterých se IMDb id
// nenajde, se v katalogu prostě přeskočí.

const SINATOR_BASE = 'https://sinator-backend.vercel.app/api';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const KEY = process.env.SINATOR_BACKEND_KEY || '';
    const TMDB_KEY = process.env.TMDB_API_KEY || '';
    const { type, id, extra } = req.query;
    const sinatorType = type === 'series' ? 'tv' : 'movie';

    // Stránkování: první stránka (bez extra, nebo skip=0) vrací VŠECHNY položky
    // najednou, takže na jakoukoliv další stránku (skip=100, skip=200, ...)
    // stačí vrátit prázdný seznam - žádná další data k dodání není.
    if (typeof extra === 'string') {
        const m = extra.match(/skip=(\d+)/);
        if (m && parseInt(m[1], 10) > 0) {
            return res.status(200).json({ metas: [] });
        }
    }

    try {
        let items = [];
        if (id === 'watchlist') {
            const r = await fetch(`${SINATOR_BASE}/watchlist`, { headers: { 'x-api-key': KEY } });
            items = await r.json();
        } else if (typeof id === 'string' && id.startsWith('list:')) {
            const listId = id.slice(5);
            const r = await fetch(`${SINATOR_BASE}/lists/${encodeURIComponent(listId)}/items`, { headers: { 'x-api-key': KEY } });
            items = await r.json();
        }
        if (!Array.isArray(items)) items = [];

        items = items.filter(it => {
            const itType = (it.type === 'shows' || it.type === 'tv') ? 'tv' : 'movie';
            return itType === sinatorType;
        });

        // Vyřešit IMDb id pro každou položku s omezenou souběžností (5 najednou),
        // ať se to zbytečně nezasekává na desítkách sekvenčních requestů na TMDB.
        const metas = [];
        const queue = items.slice();
        async function worker() {
            while (queue.length) {
                const it = queue.shift();
                try {
                    const detRes = await fetch(`https://api.themoviedb.org/3/${sinatorType}/${it.id}?api_key=${TMDB_KEY}&append_to_response=external_ids`);
                    const det = await detRes.json();
                    const imdbId = det && det.external_ids && det.external_ids.imdb_id;
                    if (!imdbId) continue;
                    const title = det.title || det.name || it.title || ('#' + it.id);
                    const posterPath = det.poster_path || it.poster_path;
                    const releaseDate = det.release_date || det.first_air_date;
                    metas.push({
                        id: imdbId,
                        type,
                        name: title,
                        poster: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : undefined,
                        releaseInfo: releaseDate ? releaseDate.slice(0, 4) : (it.year ? String(it.year) : undefined),
                    });
                } catch (e) {
                    // Jednu položku přeskočit, zbytek katalogu ať se načte dál.
                }
            }
        }
        await Promise.all(Array.from({ length: 5 }, worker));

        res.status(200).json({ metas });
    } catch (e) {
        res.status(200).json({ metas: [] });
    }
};
