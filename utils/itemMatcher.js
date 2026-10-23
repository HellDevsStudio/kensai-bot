/**
 * utils/itemMatcher.js
 * Motor Central de Resolução Canônica, Busca Semântica e Fuzzy Matching do Arsenal Blade Ball.
 * 
 * - Normalização Fonética e Sem Ruído (sem acentos, remoção de 's possessivo, pontuação vira espaço).
 * - Assinatura de Tokens Ordenados (ex: "void dual" == "dual void").
 * - Contenção e Ponderação de Tokens.
 * - Algoritmo Damerau-Levenshtein O(min(N,M)) com transposição de caracteres adjacentes.
 * - Ranking Semântico Multicamada para Autocomplete e Detecção Inteligente de Itens.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'fandom_catalog.json');

// Cache em memória de itens pré-processados
let catalogoCache = null;
let allCatalogFlat = null;

/**
 * Normaliza uma string para comparação fonética/textual pura.
 * Remove acentos, pontuação vira espaço, remove 's possessivo em inglês e colapsa espaços.
 * @param {string} str 
 * @returns {string}
 */
function normalizar(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .toLowerCase()
        .replace(/['’]s\b/g, '')                          // remove possessivo inglês ('s)
        .replace(/[^a-z0-9\s]/g, ' ')                     // pontuação/hífen viram espaço
        .replace(/\s+/g, ' ')                             // colapsa espaços
        .trim();
}

/**
 * Divide uma string normalizada em tokens de palavras significativas.
 * @param {string} str 
 * @returns {string[]}
 */
function tokenizar(str) {
    const clean = normalizar(str);
    return clean ? clean.split(' ').filter(Boolean) : [];
}

/**
 * Gera a assinatura ordenada de tokens alfabeticamente.
 * "Curse Witch" e "Witch's Curse" viram "curse witch".
 * @param {string} str 
 * @returns {string}
 */
function gerarAssinatura(str) {
    const tokens = tokenizar(str);
    return tokens.sort().join(' ');
}

/**
 * Gera um hash determinístico de 16 caracteres hexadecimais para o item.
 * @param {string} nome 
 * @returns {string}
 */
function gerarItemHash(nome) {
    if (!nome || typeof nome !== 'string') return '0000000000000000';
    const norm = normalizar(nome);
    return crypto.createHash('sha256').update(norm).digest('hex').slice(0, 16);
}

const ROW_0 = new Int32Array(64);
const ROW_1 = new Int32Array(64);
const ROW_2 = new Int32Array(64);

/**
 * Calcula a distância de Damerau-Levenshtein entre duas strings.
 * Suporta inserções, deleções, substituições e transposições de caracteres adjacentes.
 * @param {string} a 
 * @param {string} b 
 * @param {number} [maxLimit=Infinity] 
 * @returns {number}
 */
function levenshteinDamerau(a, b, maxLimit = Infinity) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;

    let s1 = a;
    let s2 = b;
    if (s1.length > s2.length) {
        s1 = b;
        s2 = a;
    }

    const len1 = s1.length;
    const len2 = s2.length;

    if (len2 - len1 > maxLimit) return Infinity;
    if (len2 >= 64) {
        // Fallback dinâmico para strings muito longas (> 64 chars)
        const d = [];
        for (let i = 0; i <= len1; i++) d[i] = [i];
        for (let j = 0; j <= len2; j++) d[0][j] = j;

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                d[i][j] = Math.min(
                    d[i - 1][j] + 1,
                    d[i][j - 1] + 1,
                    d[i - 1][j - 1] + cost
                );
                if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
                    d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
                }
            }
        }
        return d[len1][len2];
    }

    // Inicialização da primeira linha
    for (let j = 0; j <= len2; j++) {
        ROW_1[j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        ROW_0[0] = i;
        let minLinha = ROW_0[0];
        const char1 = s1[i - 1];

        for (let j = 1; j <= len2; j++) {
            const char2 = s2[j - 1];
            const cost = char1 === char2 ? 0 : 1;

            let dist = Math.min(
                ROW_1[j] + 1,         // Deleção
                ROW_0[j - 1] + 1,     // Inserção
                ROW_1[j - 1] + cost   // Substituição
            );

            // Transposição adjacente (Damerau)
            if (i > 1 && j > 1 && char1 === s2[j - 2] && s1[i - 2] === char2) {
                dist = Math.min(dist, ROW_2[j - 2] + 1);
            }

            ROW_0[j] = dist;
            if (dist < minLinha) minLinha = dist;
        }

        if (minLinha > maxLimit) return Infinity;

        for (let j = 0; j <= len2; j++) {
            ROW_2[j] = ROW_1[j];
            ROW_1[j] = ROW_0[j];
        }
    }

    return ROW_1[len2];
}

/**
 * Realiza o casamento flexível palavra-a-palavra entre tokens de busca e tokens de um item.
 */
function casamentoTokenAToken(tokensQuery, tokensItem) {
    if (!tokensQuery.length) return { matched: false, distTotal: 0 };

    let distTotal = 0;
    const itemTokensRestantes = tokensItem.slice();

    for (const tQ of tokensQuery) {
        let melhorDist = Infinity;
        let melhorIdx = -1;

        // Limite de tolerância proporcional ao tamanho da palavra
        const maxTol = tQ.length <= 3 ? 0 : (tQ.length <= 6 ? 1 : 2);

        for (let i = 0; i < itemTokensRestantes.length; i++) {
            const tI = itemTokensRestantes[i];
            
            // Match exato ou de prefixo do token
            if (tI === tQ) {
                melhorDist = 0;
                melhorIdx = i;
                break;
            }
            if (tI.startsWith(tQ) && tQ.length >= 3) {
                melhorDist = 0;
                melhorIdx = i;
                break;
            }

            const dist = levenshteinDamerau(tQ, tI, maxTol);
            if (dist <= maxTol && dist < melhorDist) {
                melhorDist = dist;
                melhorIdx = i;
            }
        }

        if (melhorIdx !== -1) {
            distTotal += melhorDist;
            itemTokensRestantes.splice(melhorIdx, 1);
        } else {
            return { matched: false, distTotal: Infinity };
        }
    }

    return { matched: true, distTotal };
}

/**
 * Carrega a lista completa e plana de itens do Fandom
 */
function carregarCatalogoFlat() {
    if (allCatalogFlat) return allCatalogFlat;
    try {
        if (fs.existsSync(CATALOG_PATH)) {
            const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
            allCatalogFlat = [
                ...(raw.Sword_Skins || []).map(i => ({ ...i, tipo: 'Sword_Skins', categoria: 'Espada', emoji: '⚔️' })),
                ...(raw.Emotes || []).map(i => ({ ...i, tipo: 'Emotes', categoria: 'Emote', emoji: '🎭' })),
                ...(raw.Explosions || []).map(i => ({ ...i, tipo: 'Explosions', categoria: 'Explosão', emoji: '💥' }))
            ];
            return allCatalogFlat;
        }
    } catch (e) {
        console.error('Erro ao ler catalogo flat em itemMatcher.js:', e);
    }
    allCatalogFlat = [];
    return allCatalogFlat;
}

/**
 * Obtém o cache de itens pré-processados para busca rápida
 */
function obterCatalogoCache() {
    if (catalogoCache) return catalogoCache;

    const lista = carregarCatalogoFlat();
    catalogoCache = lista.map(item => {
        const nomeNorm = normalizar(item.nome);
        const tokens = tokenizar(item.nome);
        return {
            itemOriginal: item,
            nomeOriginal: item.nome,
            categoria: item.categoria,
            imagem: item.imagem,
            emoji: item.emoji,
            nomeNormalizado: nomeNorm,
            tokens: tokens,
            tokensSet: new Set(tokens),
            assinatura: tokens.slice().sort().join(' '),
            hash: gerarItemHash(item.nome)
        };
    });

    return catalogoCache;
}

function limparCacheCatalogo() {
    catalogoCache = null;
    allCatalogFlat = null;
}

/**
 * Ranqueia itens para o Autocomplete do Discord e buscas inteligentes.
 * Retorna os itens ordenados por score de relevância semântica.
 * 
 * @param {string} query 
 * @param {number} [limite=25] 
 * @param {string} [categoriaFiltro=null]
 * @returns {Array} Itens ordenados por relevância
 */
function ranquearMatchesFuzzy(query, limite = 25, categoriaFiltro = null) {
    const catalogo = obterCatalogoCache();
    let pool = catalogo;
    if (categoriaFiltro) {
        pool = pool.filter(c => c.categoria === categoriaFiltro);
    }

    if (!query || !query.trim()) {
        return pool.slice(0, limite).map(c => c.itemOriginal);
    }

    const cleanQuery = query.trim();
    const queryNorm = normalizar(cleanQuery);
    const tokensQuery = tokenizar(queryNorm);
    const queryAssinatura = tokensQuery.slice().sort().join(' ');

    const pontuados = [];

    for (const c of pool) {
        let score = 0;

        if (c.nomeNormalizado === queryNorm) {
            score = 1000;
        } else if (c.assinatura === queryAssinatura) {
            score = 900;
        } else if (c.nomeNormalizado.startsWith(queryNorm)) {
            score = 800 - (c.nomeNormalizado.length - queryNorm.length);
        } else if (c.nomeNormalizado.includes(queryNorm)) {
            score = 650 - (c.nomeNormalizado.length - queryNorm.length);
        } else if (tokensQuery.every(t => c.tokensSet.has(t))) {
            // Contenção de tokens
            score = 500 - (c.tokens.length - tokensQuery.length) * 20;
        } else {
            // Fuzzy token-a-token
            const { matched, distTotal } = casamentoTokenAToken(tokensQuery, c.tokens);
            if (matched && distTotal <= 3) {
                score = 400 - distTotal * 50;
            } else {
                // Pontuação parcial por tokens que casam
                let matchesPalavra = 0;
                for (const tQ of tokensQuery) {
                    if (tQ.length >= 2 && c.tokens.some(tI => tI.includes(tQ) || levenshteinDamerau(tQ, tI, 1) <= 1)) {
                        matchesPalavra++;
                    }
                }
                if (matchesPalavra > 0) {
                    score = matchesPalavra * 60;
                }
            }
        }

        if (score > 0) {
            pontuados.push({ item: c.itemOriginal, score });
        }
    }

    pontuados.sort((a, b) => b.score - a.score);
    return pontuados.slice(0, limite).map(p => p.item);
}

/**
 * Busca o melhor item no catálogo oficial com busca semântica
 * @param {string} query 
 * @param {string} [categoriaFiltro=null]
 * @returns {object|null}
 */
/**
 * Retorna os matches fuzzy junto com seus scores
 */
function ranquearMatchesComScores(query, limite = 25, categoriaFiltro = null) {
    const catalogo = obterCatalogoCache();
    let pool = catalogo;
    if (categoriaFiltro) {
        pool = pool.filter(c => c.categoria === categoriaFiltro);
    }

    if (!query || !query.trim()) {
        return pool.slice(0, limite).map(c => ({ item: c.itemOriginal, score: 100 }));
    }

    const cleanQuery = query.trim();
    const queryNorm = normalizar(cleanQuery);
    const tokensQuery = tokenizar(queryNorm);
    const queryAssinatura = tokensQuery.slice().sort().join(' ');

    const pontuados = [];

    for (const c of pool) {
        let score = 0;

        if (c.nomeNormalizado === queryNorm) {
            score = 1000;
        } else if (c.assinatura === queryAssinatura) {
            score = 900;
        } else if (c.nomeNormalizado.startsWith(queryNorm)) {
            score = 800 - (c.nomeNormalizado.length - queryNorm.length);
        } else if (c.nomeNormalizado.includes(queryNorm)) {
            score = 650 - (c.nomeNormalizado.length - queryNorm.length);
        } else if (tokensQuery.length > 0 && tokensQuery.every(t => c.tokensSet.has(t))) {
            // Contenção de tokens
            score = 500 - (c.tokens.length - tokensQuery.length) * 20;
        } else {
            // Fuzzy token-a-token
            const { matched, distTotal } = casamentoTokenAToken(tokensQuery, c.tokens);
            if (matched && distTotal <= 3) {
                score = 400 - distTotal * 50;
            } else {
                let matchesPalavra = 0;
                for (const tQ of tokensQuery) {
                    if (tQ.length >= 2 && c.tokens.some(tI => tI.includes(tQ) || levenshteinDamerau(tQ, tI, 1) <= 1)) {
                        matchesPalavra++;
                    }
                }
                if (matchesPalavra > 0) {
                    score = matchesPalavra * 60;
                }
            }
        }

        if (score > 0) {
            pontuados.push({ item: c.itemOriginal, score });
        }
    }

    pontuados.sort((a, b) => b.score - a.score);
    return pontuados.slice(0, limite);
}

/**
 * Busca o melhor item no catálogo oficial com busca semântica de alta confiança (score >= 350)
 * @param {string} query 
 * @param {string} [categoriaFiltro=null]
 * @param {number} [minScore=350]
 * @returns {object|null}
 */
function buscarMelhorMatchSemantico(query, categoriaFiltro = null, minScore = 350) {
    if (!query || !query.trim()) return null;
    const resultados = ranquearMatchesComScores(query, 1, categoriaFiltro);
    if (resultados.length > 0 && resultados[0].score >= minScore) {
        return resultados[0].item;
    }
    return null;
}

module.exports = {
    ranquearMatchesComScores,
    normalizar,
    tokenizar,
    gerarAssinatura,
    gerarItemHash,
    levenshteinDamerau,
    casamentoTokenAToken,
    carregarCatalogoFlat,
    obterCatalogoCache,
    limparCacheCatalogo,
    ranquearMatchesFuzzy,
    buscarMelhorMatchSemantico
};
