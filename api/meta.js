// GET /meta/:type/:id.json

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const TMDB_KEY = process.env.TMDB_API_KEY || process.env.TMDB_KEY || '';
  const { type, id } = req.query;
  const sinatorType = type === 'series' ? 'tv' : 'movie';

  try {
    if (!id || !id.startsWith('tt')) {
      return res.status(200).json({ meta: null });
    }

    const findRes = await fetch(`https://api.themoviedb.org/3/find/${id}?api_key=${TMDB_KEY}&external_source=imdb_id`);
    const found = await findRes.json();

    const result = sinatorType === 'tv'
      ? (found.tv_results && found.tv_results[0])
      : (found.movie_results && found.movie_results[0]);

    if (!result) {
      return res.status(200).json({ meta: null });
    }

    const detailRes = await fetch(`https://api.themoviedb.org/3/${sinatorType}/${result.id}?api_key=${TMDB_KEY}&language=cs-CZ`);
    const detail = await detailRes.json();

    const releaseDate = detail.release_date || detail.first_air_date;

    res.status(200).json({
      meta: {
        id,
        type,
        name: detail.title || detail.name,
        poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : undefined,
        background: detail.backdrop_path ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}` : undefined,
        description: detail.overview || undefined,
        releaseInfo: releaseDate ? String(releaseDate).slice(0, 4) : undefined,
        genres: (detail.genres || []).map(g => g.name)
      }
    });
  } catch (e) {
    res.status(200).json({ meta: null });
  }
};
