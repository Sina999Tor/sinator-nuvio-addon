// GET /manifest.json (přepsáno přes vercel.json rewrite z /api/manifest)
// Vrací Stremio/Nuvio addon manifest — jeden katalog za Watchlist + jeden
// za každý tvůj Sinator seznam (filmy i seriály zvlášť, jak to Stremio čeká).

const SINATOR_BASE = 'https://sinator-backend.vercel.app/api';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const KEY = process.env.SINATOR_BACKEND_KEY || '';
    const catalogs = [
        { type: 'movie', id: 'watchlist', name: 'Sinator: Watchlist' },
        { type: 'series', id: 'watchlist', name: 'Sinator: Watchlist' },
    ];

    // Živě natáhnout aktuální seznamy ze Sinator backendu, ať se v Nuviu
    // objeví i nově vytvořené seznamy bez nutnosti cokoliv přeinstalovat
    // (Nuvio si manifest čas od času znovu stáhne).
    try {
        const r = await fetch(`${SINATOR_BASE}/lists`, { headers: { 'x-api-key': KEY } });
        const lists = await r.json();
        if (Array.isArray(lists)) {
            for (const l of lists) {
                if (!l || l.id == null) continue;
                catalogs.push({ type: 'movie', id: `list:${l.id}`, name: `Sinator: ${l.name || l.id}` });
                catalogs.push({ type: 'series', id: `list:${l.id}`, name: `Sinator: ${l.name || l.id}` });
            }
        }
    } catch (e) {
        // Když seznamy zrovna nejdou natáhnout, addon aspoň nabídne Watchlist.
    }

    res.status(200).json({
        id: 'cz.sinator.addon',
        version: '1.0.0',
        name: 'Sinator',
        description: 'Tvoje seznamy a watchlist ze Sinatoru přímo v Nuviu/Stremiu.',
        resources: ['catalog'],
        types: ['movie', 'series'],
        catalogs,
        idPrefixes: ['tt'],
    });
};
