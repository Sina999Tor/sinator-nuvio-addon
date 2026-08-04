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
    const { type, id } = req.query;
    const sinatorType = type === 'series' ? 'tv' : 'movie';

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
                    const extRes = await fetch(`https://api.themoviedb.org/3/${sinatorType}/${it.id}/external_ids?api_key=${TMDB_KEY}`);
                    const ext = await extRes.json();
                    if (!ext || !ext.imdb_id) continue;
                    metas.push({
                        id: ext.imdb_id,
                        type,
                        name: it.title || ('#' + it.id),
                        poster: it.poster_path ? `https://image.tmdb.org/t/p/w500${it.poster_path}` : undefined,
                        releaseInfo: it.year ? String(it.year) : undefined,
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
