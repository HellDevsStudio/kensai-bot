/**
 * translator.js
 * Motor de tradução multilíngue resiliente para a Kensai Store.
 * Utiliza o cliente de extensão do Google Translate com fallback para MyMemory.
 * Protegido contra falhas 429 de HTML e bloqueios de JSON.parse.
 */

const LANG_MAP = {
    'ingles': 'en',
    'inglês': 'en',
    'english': 'en',
    'en': 'en',
    'portugues': 'pt',
    'português': 'pt',
    'pt': 'pt',
    'espanhol': 'es',
    'spanish': 'es',
    'es': 'es',
    'japones': 'ja',
    'japonês': 'ja',
    'japanese': 'ja',
    'ja': 'ja',
    'frances': 'fr',
    'francês': 'fr',
    'french': 'fr',
    'fr': 'fr',
    'alemao': 'de',
    'alemão': 'de',
    'german': 'de',
    'de': 'de',
    'italiano': 'it',
    'italian': 'it',
    'it': 'it',
    'russo': 'ru',
    'russian': 'ru',
    'ru': 'ru',
    'chines': 'zh',
    'chinês': 'zh',
    'chinese': 'zh',
    'zh': 'zh',
    'coreano': 'ko',
    'korean': 'ko',
    'ko': 'ko'
};

function normalizeLang(lang) {
    if (!lang) return 'pt';
    const clean = lang.trim().toLowerCase();
    return LANG_MAP[clean] || clean.slice(0, 5);
}

async function translateText(text, targetInput) {
    if (!text || !text.trim()) {
        return { text: '', target: 'pt', success: false };
    }

    const target = normalizeLang(targetInput);

    // 1. Tentativa principal: Google Translate via dict-chrome-ex (estável contra 429)
    try {
        const url = 'https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=auto&tl=' +
            encodeURIComponent(target) + '&dt=t&q=' + encodeURIComponent(text);

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(4000)
        });

        if (res.ok) {
            const body = await res.text();
            try {
                const json = JSON.parse(body);
                if (json && json[0]) {
                    const result = json[0].map(function(s) { return s[0]; }).join('');
                    if (result && result.trim()) {
                        return { text: result, target: target, success: true };
                    }
                }
            } catch (jsonErr) {
                // Se o corpo não for JSON válido (ex: página HTML), ignora e vai pro fallback
            }
        }
    } catch (e) {}

    // 2. Fallback: MyMemory Translation API
    try {
        const myMemoryUrl = 'https://api.mymemory.translated.net/get?q=' +
            encodeURIComponent(text) + '&langpair=autodetect|' + encodeURIComponent(target);

        const res = await fetch(myMemoryUrl, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
            const data = await res.json();
            if (data && data.responseData && data.responseData.translatedText) {
                return { text: data.responseData.translatedText, target: target, success: true };
            }
        }
    } catch (e) {}

    // Se ambas as APIs falharem, retorna o texto original sem quebrar o bot
    return { text: text, target: target, success: false };
}

module.exports = {
    translateText,
    normalizeLang
};
