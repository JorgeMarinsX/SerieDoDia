const STREAMING_LOGO_BASE = 'https://image.tmdb.org/t/p/w92';
const STREAMING_COUNTRY = 'BR';

async function fetchStreamingProviders(showId) {
    const res = await fetch(`${TMDB_BASE}/tv/${showId}/watch/providers?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    const br = data.results?.[STREAMING_COUNTRY];
    if (!br?.flatrate?.length) return null;
    return { providers: br.flatrate, link: br.link };
}

function renderStreaming(streaming) {
    const wrapper = document.getElementById('filme-streaming');
    const lista = document.getElementById('filme-streaming-lista');
    const jwLink = document.getElementById('filme-justwatch-link');

    lista.innerHTML = '';

    if (!streaming) {
        wrapper.classList.add('d-none');
        return;
    }

    for (const p of streaming.providers) {
        const img = document.createElement('img');
        img.src = `${STREAMING_LOGO_BASE}${p.logo_path}`;
        img.alt = p.provider_name;
        img.title = p.provider_name;
        img.width = 40;
        img.height = 40;
        img.className = 'rounded';
        lista.appendChild(img);
    }

    jwLink.href = streaming.link || '#';
    wrapper.classList.remove('d-none');
}
