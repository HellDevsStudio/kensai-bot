/**
 * gifHelper.js
 * Utilitário para busca dinâmica de GIFs de anime e reações sociais.
 * Suporta otakugifs.xyz e nekos.best com fallbacks automáticos.
 */

const FALLBACK_GIFS = {
    highfive: [
        'https://nekos.best/api/v2/highfive/fd896b88-d900-44b4-bfc5-6c0682395670.gif',
        'https://nekos.best/api/v2/highfive/8f8e0bef-35ce-4625-bf0c-888b134e1f0a.gif',
        'https://cdn.otakugifs.xyz/gifs/brofist/14f01db51999d44f.gif'
    ],
    hug: [
        'https://cdn.otakugifs.xyz/gifs/hug/825610ec7fdc1e8c.gif',
        'https://cdn.otakugifs.xyz/gifs/hug/60927361c059c503.gif'
    ],
    kiss: [
        'https://cdn.otakugifs.xyz/gifs/kiss/W2zxPFRkrd.gif',
        'https://cdn.otakugifs.xyz/gifs/kiss/NGLVWgfzrI.gif'
    ],
    slap: [
        'https://cdn.otakugifs.xyz/gifs/slap/aiEPmjYF5D.gif',
        'https://cdn.otakugifs.xyz/gifs/slap/bec6d0d98bd68398.gif'
    ],
    pat: [
        'https://cdn.otakugifs.xyz/gifs/pat/c88e6bcc70232d91.gif',
        'https://cdn.otakugifs.xyz/gifs/pat/87562e094ccfabb1.gif'
    ]
};

async function getRoleplayGif(reaction) {
    const key = (reaction || '').toLowerCase();

    // 1. Highfive: consulta nekos.best (especializada) e otakugifs (brofist)
    if (key === 'highfive') {
        try {
            const res = await fetch('https://nekos.best/api/v2/highfive', { signal: AbortSignal.timeout(3000) });
            const data = await res.json();
            if (data?.results?.[0]?.url) {
                return data.results[0].url;
            }
        } catch (e) {}

        try {
            const res = await fetch('https://api.otakugifs.xyz/gif?reaction=brofist&format=gif', { signal: AbortSignal.timeout(3000) });
            const data = await res.json();
            if (data?.url) return data.url;
        } catch (e) {}

        const list = FALLBACK_GIFS.highfive;
        return list[Math.floor(Math.random() * list.length)];
    }

    // 2. Demais reações: otakugifs.xyz (hug, kiss, slap, pat, etc.)
    try {
        const res = await fetch('https://api.otakugifs.xyz/gif?reaction=' + encodeURIComponent(key) + '&format=gif', { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        if (data?.url) return data.url;
    } catch (e) {}

    const list = FALLBACK_GIFS[key] || FALLBACK_GIFS.highfive;
    return list[Math.floor(Math.random() * list.length)];
}

module.exports = {
    getRoleplayGif,
    FALLBACK_GIFS
};
