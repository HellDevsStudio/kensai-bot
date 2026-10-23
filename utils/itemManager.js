const fs = require('fs');
const path = require('path');
const { lerEstoque, salvarEstoque } = require('./itemControl');
const { ranquearMatchesFuzzy, buscarMelhorMatchSemantico } = require('./itemMatcher');

const CATALOGO_PATH = path.join(__dirname, '..', 'data', 'fandom_catalog.json');
let catalogoCache = null;

// Mapa em memória para confirmações pendentes de cadastro de itens
const pendenciasCadastro = new Map();

/**
 * Armazena uma pendência de cadastro com expiração em 10 minutos
 */
function armazenarPendenciaCadastro(tempId, dados) {
    pendenciasCadastro.set(tempId, {
        ...dados,
        expiraEm: Date.now() + 10 * 60 * 1000
    });
}

/**
 * Recupera uma pendência de cadastro se ainda válida
 */
function obterPendenciaCadastro(tempId) {
    const p = pendenciasCadastro.get(tempId);
    if (!p) return null;
    if (Date.now() > p.expiraEm) {
        pendenciasCadastro.delete(tempId);
        return null;
    }
    return p;
}

/**
 * Remove uma pendência de cadastro
 */
function removerPendenciaCadastro(tempId) {
    return pendenciasCadastro.delete(tempId);
}

/**
 * Carrega o catálogo Fandom com cache em memória
 */
function carregarCatalogo() {
    if (catalogoCache) return catalogoCache;
    try {
        if (fs.existsSync(CATALOGO_PATH)) {
            catalogoCache = JSON.parse(fs.readFileSync(CATALOGO_PATH, 'utf8'));
            return catalogoCache;
        }
    } catch (e) {
        console.error('Erro ao ler fandom_catalog.json:', e);
    }
    return { Sword_Skins: [], Emotes: [], Explosions: [] };
}

/**
 * Busca sugestões no catálogo oficial via Busca Semântica e Fuzzy Matching para o Autocomplete do Discord (até 25 opções)
 */
function buscarCatalogoAutocomplete(query, categoriaFiltro = null) {
    const itensRanqueados = ranquearMatchesFuzzy(query, 25, categoriaFiltro);

    return itensRanqueados.map(i => {
        const catTag = i.categoria === 'Espada' ? '⚔️ Espada' : (i.categoria === 'Emote' ? '🎭 Emote' : '💥 Explosão');
        return {
            name: `[${catTag}] ${i.nome}`.slice(0, 100),
            value: i.nome.slice(0, 100)
        };
    });
}

/**
 * Localiza um item no catálogo oficial com busca semântica profunda
 */
function buscarItemCatalogo(query, categoriaFiltro = null) {
    if (!query || typeof query !== 'string') return null;
    return buscarMelhorMatchSemantico(query, categoriaFiltro);
}

/**
 * Busca sugestões dos itens atualmente cadastrados no estoque para autocomplete
 */
function buscarEstoqueAutocomplete(query) {
    const estoque = lerEstoque();
    const queryLimpa = (query || '').toLowerCase().trim();

    const filtrados = estoque.filter(i => {
        if (!queryLimpa) return true;
        return i.nome.toLowerCase().includes(queryLimpa) || String(i.id).includes(queryLimpa);
    });

    return filtrados.slice(0, 25).map(i => ({
        name: `[${i.categoria}] ${i.nome} — R$ ${Number(i.preco).toFixed(2).replace('.', ',')} (${i.quantidade} em estoque)`.slice(0, 100),
        value: String(i.id).slice(0, 100)
    }));
}

/**
 * Adiciona um item ao estoque (detectando automaticamente categoria e imagem se presente no catálogo)
 */
function adicionarItemEstoque({ nome, categoria, preco, quantidade = 1, imagem = null, descricao = '' }) {
    const estoque = lerEstoque();

    let imagemFinal = imagem;
    let categoriaFinal = categoria || 'Espada';

    // Auto-completar categoria e imagem oficial via busca semântica
    const match = buscarItemCatalogo(nome, categoria);
    if (match) {
        if (!imagemFinal) imagemFinal = match.imagem;
        if (!categoria) categoriaFinal = match.categoria;
    }

    const precoNum = typeof preco === 'string' 
        ? parseFloat(preco.replace(/[^0-9,\.]/g, '').replace(',', '.')) 
        : Number(preco);

    const nomeBusca = (nome || '').toLowerCase().trim();
    // Se o item já existir no estoque, soma a quantidade e atualiza preço
    const existente = estoque.find(i => i.nome.toLowerCase() === nomeBusca);

    if (existente) {
        existente.quantidade = Number(existente.quantidade || 0) + Number(quantidade);
        if (!isNaN(precoNum) && precoNum > 0) existente.preco = precoNum;
        if (imagemFinal) existente.imagem = imagemFinal;
        if (descricao) existente.descricao = descricao;
        if (categoriaFinal) existente.categoria = categoriaFinal;

        salvarEstoque(estoque);
        return { atualizado: true, item: existente };
    }

    // Gera ID único determinístico ou sequencial amigável
    const novoId = 'ks_' + Math.random().toString(36).substring(2, 9);
    const novoItem = {
        id: novoId,
        nome: match ? match.nome : nome.trim(),
        categoria: categoriaFinal,
        preco: (!isNaN(precoNum) && precoNum > 0) ? precoNum : 15.00,
        quantidade: Math.max(0, Number(quantidade)),
        imagem: imagemFinal || null,
        descricao: descricao ? descricao.trim() : '',
        criadoEm: new Date().toISOString()
    };

    estoque.push(novoItem);
    salvarEstoque(estoque);
    return { criado: true, item: novoItem };
}

/**
 * Remove um item do estoque por ID ou Nome
 */
function removerItemEstoque(idOuNome) {
    const estoque = lerEstoque();
    const termo = (idOuNome || '').toLowerCase().trim();
    const idx = estoque.findIndex(i => String(i.id).toLowerCase() === termo || i.nome.toLowerCase() === termo);

    if (idx === -1) return { removido: false };

    const removido = estoque.splice(idx, 1)[0];
    salvarEstoque(estoque);
    return { removido: true, item: removido };
}

/**
 * Atualiza a quantidade em estoque de um item
 */
function atualizarQuantidadeEstoque(idOuNome, novaQuantidade) {
    const estoque = lerEstoque();
    const termo = (idOuNome || '').toLowerCase().trim();
    const item = estoque.find(i => String(i.id).toLowerCase() === termo || i.nome.toLowerCase() === termo);

    if (!item) return { atualizado: false };

    item.quantidade = Math.max(0, Number(novaQuantidade));
    salvarEstoque(estoque);
    return { atualizado: true, item };
}

/**
 * Atualiza o preço de venda de um item
 */
function atualizarPrecoEstoque(idOuNome, novoPreco) {
    const estoque = lerEstoque();
    const termo = (idOuNome || '').toLowerCase().trim();
    const item = estoque.find(i => String(i.id).toLowerCase() === termo || i.nome.toLowerCase() === termo);

    if (!item) return { atualizado: false };

    const precoNum = typeof novoPreco === 'string'
        ? parseFloat(novoPreco.replace(/[^0-9,\.]/g, '').replace(',', '.'))
        : Number(novoPreco);

    if (isNaN(precoNum) || precoNum <= 0) return { atualizado: false };

    item.preco = precoNum;
    salvarEstoque(estoque);
    return { atualizado: true, item };
}

module.exports = {
    carregarCatalogo,
    buscarCatalogoAutocomplete,
    buscarEstoqueAutocomplete,
    buscarItemCatalogo,
    armazenarPendenciaCadastro,
    obterPendenciaCadastro,
    removerPendenciaCadastro,
    adicionarItemEstoque,
    removerItemEstoque,
    atualizarQuantidadeEstoque,
    atualizarPrecoEstoque
};
