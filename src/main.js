const TMDB_API_KEY = 'TMDB_API_KEY_PLACEHOLDER';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const LATIN_SCRIPT_LANGS = 'pt|en|es|fr|it|de|nl|sv|no|da|pl|ro|ca|tr|vi';

const GENRE_TV_COMEDY = 35;
const GENRE_TV_ANIMATION = 16;
const KEYWORD_ANIME = 210024;
const KEYWORD_HORROR = 9663;

const filmeModal = new bootstrap.Modal(document.getElementById('filme-modal'));
const limiteModal = new bootstrap.Modal(document.getElementById('limite-modal'));

const FETCH_LIMIT = 5;
const FETCH_COUNT_KEY = 'fetch-count';

async function fetchRandomShow() {
    const onlyRecent = document.getElementById('apenas-recentes').checked;
    const excludeAnime = document.getElementById('excluir-anime').checked;
    const excludeHorror = document.getElementById('excluir-terror').checked;
    const excludeComedy = document.getElementById('excluir-comedia').checked;
    const excludeLowRating = document.getElementById('excluir-nota').checked;
    const hardcoreMode = document.getElementById('modo-hardcore').checked;

    const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'pt-BR',
        sort_by: 'popularity.desc',
    });

    const withoutGenres = [];
    if (excludeComedy) withoutGenres.push(GENRE_TV_COMEDY);
    if (excludeAnime) withoutGenres.push(GENRE_TV_ANIMATION);
    if (withoutGenres.length) params.set('without_genres', withoutGenres.join(','));

    const withoutKeywords = [];
    if (excludeAnime) withoutKeywords.push(KEYWORD_ANIME);
    if (excludeHorror) withoutKeywords.push(KEYWORD_HORROR);
    if (withoutKeywords.length) params.set('without_keywords', withoutKeywords.join(','));

    if (excludeLowRating) {
        params.set('vote_average.gte', '7');
        params.set('vote_count.gte', '100');
    }

    if (!hardcoreMode) {
        params.set('with_original_language', LATIN_SCRIPT_LANGS);
    }

    let minDate = null;
    if (onlyRecent) {
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        minDate = tenYearsAgo.toISOString().slice(0, 10);
        params.set('first_air_date.gte', minDate);
    }

    const firstRes = await fetch(`${TMDB_BASE}/discover/tv?${params}&page=1`);
    if (!firstRes.ok) throw new Error(`TMDB error: ${firstRes.status}`);
    const firstData = await firstRes.json();

    const totalPages = Math.min(firstData.total_pages, 500);
    if (totalPages === 0) throw new Error('Nenhuma série encontrada com esses filtros.');

    for (let attempt = 0; attempt < 5; attempt++) {
        const randomPage = Math.floor(Math.random() * totalPages) + 1;
        params.set('page', randomPage);

        const pageRes = await fetch(`${TMDB_BASE}/discover/tv?${params}`);
        if (!pageRes.ok) throw new Error(`TMDB error: ${pageRes.status}`);
        const pageData = await pageRes.json();

        let shows = pageData.results;
        if (minDate) shows = shows.filter(s => s.first_air_date && s.first_air_date >= minDate);
        if (shows.length) return shows[Math.floor(Math.random() * shows.length)];
    }

    throw new Error('Nenhuma série encontrada com esses filtros.');
}

async function fetchSeasonCount(showId) {
    const res = await fetch(`${TMDB_BASE}/tv/${showId}?api_key=${TMDB_API_KEY}&language=pt-BR`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.number_of_seasons === 'number' ? data.number_of_seasons : null;
}

function formatSeasons(n) {
    if (!n || n < 1) return null;
    return `${n} ${n === 1 ? 'temporada' : 'temporadas'}`;
}

function renderShow(show, seasonCount) {
    document.getElementById('filme-titulo').textContent = show.name;

    const origEl = document.getElementById('filme-titulo-original');
    const showOrig = show.original_name && show.original_name !== show.name;
    origEl.textContent = showOrig ? show.original_name : '';
    origEl.classList.toggle('d-none', !showOrig);

    const seasonsEl = document.getElementById('filme-diretor');
    const seasonsLabel = formatSeasons(seasonCount);
    if (seasonsLabel) {
        seasonsEl.textContent = seasonsLabel;
        seasonsEl.classList.remove('d-none');
    } else {
        seasonsEl.classList.add('d-none');
    }

    const anoEl = document.getElementById('filme-ano');
    anoEl.textContent = show.first_air_date?.slice(0, 4) ?? '';
    anoEl.classList.toggle('d-none', !show.first_air_date);

    const notaEl = document.getElementById('filme-nota');
    if (show.vote_average) {
        notaEl.textContent = `${show.vote_average.toFixed(1)} / 10`;
        notaEl.classList.remove('d-none');
    } else {
        notaEl.classList.add('d-none');
    }

    const posterCol = document.getElementById('filme-poster-col');
    const poster = document.getElementById('filme-poster');
    if (show.poster_path) {
        poster.src = `${IMG_BASE}${show.poster_path}`;
        posterCol.classList.remove('d-none');
    } else {
        posterCol.classList.add('d-none');
    }

    document.getElementById('filme-sinopse').textContent = show.overview || 'Sem sinopse disponível.';
}

function setButtonLoading(btn, loading, label) {
    btn.disabled = loading;
    btn.innerHTML = loading
        ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Buscando...`
        : label;
}

async function buscar(btn, label) {
    const count = Number(sessionStorage.getItem(FETCH_COUNT_KEY) || 0);
    if (count >= FETCH_LIMIT) {
        filmeModal.hide();
        limiteModal.show();
        return;
    }

    setButtonLoading(btn, true, label);
    try {
        const show = await fetchRandomShow();
        const [seasonCount, streaming] = await Promise.all([
            fetchSeasonCount(show.id),
            fetchStreamingProviders(show.id),
        ]);
        sessionStorage.setItem(FETCH_COUNT_KEY, count + 1);
        renderShow(show, seasonCount);
        renderStreaming(streaming);
        filmeModal.show();
    } catch (err) {
        alert(`Erro ao buscar série: ${err.message}`);
        console.error(err);
    } finally {
        setButtonLoading(btn, false, label);
    }
}

document.getElementById('btn-buscar').addEventListener('click', function () {
    buscar(this, 'Buscar série');
});

document.getElementById('btn-buscar-outro').addEventListener('click', function () {
    buscar(this, 'Buscar outra');
});
