const fs = require('fs');
const path = require('path');
const { lerEstoque, salvarEstoque } = require('./itemControl');

const CATALOGO_PATH = path.join(__dirname, '..', 'data', 'fandom_catalog.json');
let catalogoCache = null;

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
 * Busca sugestões no catálogo oficial para o Autocomplete do Discord (até 25 opções)
 */
function buscarCatalogoAutocomplete(query, categoriaFiltro = null) {
    const cat = carregarCatalogo();
    const queryLimpa = (query || '').toLowerCase().trim();

    let pool = [];
    if (!categoriaFiltro || categoriaFiltro === 'Espada') {
        pool.push(...(cat.Sword_Skins || []).map(i => ({ nome: i.nome, tipo: 'Espada', imagem: i.imagem })));
    }
    if (!categoriaFiltro || categoriaFiltro === 'Emote') {
        pool.push(...(cat.Emotes || []).map(i => ({ nome: i.nome, tipo: 'Emote', imagem: i.imagem })));
    }
    if (!categoriaFiltro || categoriaFiltro === 'Explosão') {
        pool.push(...(cat.Explosions || []).map(i => ({ nome: i.nome, tipo: 'Explosão', imagem: i.imagem })));
    }

    if (!queryLimpa) {
        return pool.slice(0, 25).map(i => ({
            name: `[${i.tipo}] ${i.nome}`.slice(0, 100),
            value: i.nome.slice(0, 100)
        }));
    }

    // Prioriza itens que começam com a query, depois os que contêm
    const comecam = [];
    const contem = [];

    for (const item of pool) {
        const n = item.nome.toLowerCase();
        if (n.startsWith(queryLimpa)) {
            comecam.push(item);
        } else if (n.includes(queryLimpa)) {
            contem.push(item);
        }
        if (comecam.length >= 25) break;
    }

    const resultado = [...comecam, ...contem].slice(0, 25);
    return resultado.map(i => ({
        name: `[${i.tipo}] ${i.nome}`.slice(0, 100),
        value: i.nome.slice(0, 100)
    }));
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
    const cat = carregarCatalogo();

    let imagemFinal = imagem;
    let categoriaFinal = categoria || 'Espada';

    // Auto-completar categoria e imagem oficial se estiver no catálogo
    const nomeBusca = nome.toLowerCase().trim();
    const espadaMatch = (cat.Sword_Skins || []).find(i => i.nome.toLowerCase() === nomeBusca);
    const emoteMatch = (cat.Emotes || []).find(i => i.nome.toLowerCase() === nomeBusca);
    const explodMatch = (cat.Explosions || []).find(i => i.nome.toLowerCase() === nomeBusca);

    if (espadaMatch) {
        if (!imagemFinal) imagemFinal = espadaMatch.imagem;
        if (!categoria) categoriaFinal = 'Espada';
    } else if (emoteMatch) {
        if (!imagemFinal) imagemFinal = emoteMatch.imagem;
        if (!categoria) categoriaFinal = 'Emote';
    } else if (explodMatch) {
        if (!imagemFinal) imagemFinal = explodMatch.imagem;
        if (!categoria) categoriaFinal = 'Explosão';
    }

    const precoNum = typeof preco === 'string' 
        ? parseFloat(preco.replace(/[^0-9,\.]/g, '').replace(',', '.')) 
        : Number(preco);

    // Se o item já existir no estoque, soma a quantidade e atualiza preço
    const existente = estoque.find(i => i.nome.toLowerCase() === nomeBusca);
    if (existente) {
        existente.quantidade = Number(existente.quantidade || 0) + Number(quantidade || 1);
        if (!isNaN(precoNum) && precoNum > 0) existente.preco = precoNum;
        if (imagemFinal) existente.imagem = imagemFinal;
        if (descricao) existente.descricao = descricao;
        salvarEstoque(estoque);
        return { atualizado: true, item: existente };
    }

    const novoItem = {
        id: Date.now().toString(),
        nome: nome.trim(),
        categoria: categoriaFinal,
        preco: isNaN(precoNum) ? 10.0 : precoNum,
        quantidade: Math.max(0, parseInt(quantidade, 10) || 1),
        imagem: imagemFinal || '',
        descricao: descricao || ''
    };

    estoque.push(novoItem);
    salvarEstoque(estoque);
    return { criado: true, item: novoItem };
}

/**
 * Remove um item do estoque por ID ou nome
 */
function removerItemEstoque(idOuNome) {
    const estoque = lerEstoque();
    const termo = String(idOuNome).toLowerCase().trim();
    const idx = estoque.findIndex(i => String(i.id).toLowerCase() === termo || i.nome.toLowerCase() === termo);
    if (idx === -1) return { removido: false };

    const removido = estoque.splice(idx, 1)[0];
    salvarEstoque(estoque);
    return { removido: true, item: removido };
}

/**
 * Atualiza quantidade de estoque de um item
 */
function atualizarQuantidadeEstoque(idOuNome, novaQuantidade) {
    const estoque = lerEstoque();
    const termo = String(idOuNome).toLowerCase().trim();
    const item = estoque.find(i => String(i.id).toLowerCase() === termo || i.nome.toLowerCase() === termo);
    if (!item) return { atualizado: false };

    item.quantidade = Math.max(0, parseInt(novaQuantidade, 10) || 0);
    salvarEstoque(estoque);
    return { atualizado: true, item };
}

/**
 * Atualiza preço de um item
 */
function atualizarPrecoEstoque(idOuNome, novoPreco) {
    const estoque = lerEstoque();
    const termo = String(idOuNome).toLowerCase().trim();
    const item = estoque.find(i => String(i.id).toLowerCase() === termo || i.nome.toLowerCase() === termo);
    if (!item) return { atualizado: false };

    const precoNum = typeof novoPreco === 'string'
        ? parseFloat(novoPreco.replace(/[^0-9,\.]/g, '').replace(',', '.'))
        : Number(novoPreco);

    if (isNaN(precoNum) || precoNum <= 0) return { atualizado: false, motivo: 'preco_invalido' };

    item.preco = precoNum;
    salvarEstoque(estoque);
    return { atualizado: true, item };
}

module.exports = {
    carregarCatalogo,
    buscarCatalogoAutocomplete,
    buscarEstoqueAutocomplete,
    adicionarItemEstoque,
    removerItemEstoque,
    atualizarQuantidadeEstoque,
    atualizarPrecoEstoque
};
