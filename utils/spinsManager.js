const { getSpinsPassesConfig, setSpinsPassesConfig } = require('./ticketConfigs');
const { gerarPainelSpinsPassesPayload } = require('./ticketPanels');

/**
 * Retorna todos os produtos cadastrados de spins e passes
 */
function listarProdutosSpins() {
    const config = getSpinsPassesConfig();
    return config.produtos || [];
}

/**
 * Formata o preço de forma padronizada em R$ ou texto
 */
function formatarPrecoProduto(preco) {
    if (typeof preco === 'number') {
        return 'R$ ' + preco.toFixed(2).replace('.', ',');
    }
    const num = parseFloat(String(preco).replace(/[^\d,\.]/g, '').replace(',', '.'));
    if (!isNaN(num) && !/[a-zA-Z]/.test(String(preco))) {
        return 'R$ ' + num.toFixed(2).replace('.', ',');
    }
    return String(preco || 'A Combinar');
}

/**
 * Adiciona um novo produto ao catálogo de spins/passes
 */
function adicionarProdutoSpins(guildOrClient, dados) {
    const config = getSpinsPassesConfig();
    const produtos = config.produtos || [];

    const tipo = (dados.tipo || 'spin').toLowerCase().trim() === 'passe' ? 'passe' : 'spin';
    const id = dados.id || (tipo + '_' + Date.now().toString(36));
    const nome = dados.nome.trim();

    let preco = dados.preco;
    if (typeof preco === 'string') {
        const limpo = preco.replace(/[^\d,\.]/g, '').trim();
        const num = parseFloat(limpo.replace(',', '.'));
        if (!isNaN(num) && num >= 0 && !/[a-zA-Z]/.test(preco)) {
            preco = num;
        } else {
            preco = preco.trim() || 'A Combinar';
        }
    }

    const emoji = dados.emoji && dados.emoji.trim() ? dados.emoji.trim() : (tipo === 'spin' ? '🌀' : '🎟️');
    const descricao = dados.descricao && dados.descricao.trim() 
        ? dados.descricao.trim() 
        : (tipo === 'spin' ? 'Pacote de spins oficiais com entrega imediata' : 'Passe/Gamepass oficial para sua conta');

    const novoProduto = { id, tipo, nome, preco, emoji, descricao };
    produtos.push(novoProduto);

    const updated = setSpinsPassesConfig({ produtos });
    sincronizarPainelSpinsAoVivo(guildOrClient, updated);
    return novoProduto;
}

/**
 * Remove um produto do catálogo de spins/passes por ID
 */
function removerProdutoSpins(guildOrClient, id) {
    const config = getSpinsPassesConfig();
    const produtos = config.produtos || [];
    const index = produtos.findIndex(p => p.id === id);
    if (index === -1) return null;

    const removido = produtos.splice(index, 1)[0];
    const updated = setSpinsPassesConfig({ produtos });
    sincronizarPainelSpinsAoVivo(guildOrClient, updated);
    return removido;
}

/**
 * Atualiza o preço de um produto existente
 */
function atualizarPrecoSpins(guildOrClient, id, novoPrecoRaw) {
    const config = getSpinsPassesConfig();
    const produtos = config.produtos || [];
    const prod = produtos.find(p => p.id === id);
    if (!prod) return null;

    let preco = novoPrecoRaw;
    if (typeof preco === 'string') {
        const limpo = preco.replace(/[^\d,\.]/g, '').trim();
        const num = parseFloat(limpo.replace(',', '.'));
        if (!isNaN(num) && num >= 0 && !/[a-zA-Z]/.test(preco)) {
            preco = num;
        } else {
            preco = preco.trim() || 'A Combinar';
        }
    }
    prod.preco = preco;

    const updated = setSpinsPassesConfig({ produtos });
    sincronizarPainelSpinsAoVivo(guildOrClient, updated);
    return prod;
}

/**
 * Sincroniza a mensagem ativa do painel no Discord em tempo real
 */
async function sincronizarPainelSpinsAoVivo(guildOrClient, config) {
    if (!config || !config.canal_painel_id || !config.mensagem_painel_id) return;
    try {
        let canal = null;
        if (guildOrClient && guildOrClient.channels) {
            canal = guildOrClient.channels.cache?.get(config.canal_painel_id) 
                || (guildOrClient.channels.fetch ? await guildOrClient.channels.fetch(config.canal_painel_id).catch(() => null) : null);
        }
        if (canal && canal.isTextBased && canal.isTextBased()) {
            const msg = await canal.messages.fetch(config.mensagem_painel_id).catch(() => null);
            if (msg) {
                const payload = gerarPainelSpinsPassesPayload();
                await msg.edit(payload).catch(() => {});
            }
        }
    } catch (e) {
        console.error('[SpinsManager] Erro ao sincronizar mensagem ao vivo:', e.message);
    }
}


/**
 * Extrai valor numérico de preço para ordenação
 */
function obterValorNumericoPreco(preco) {
    if (typeof preco === 'number') return preco;
    const limpo = String(preco || '').replace(/[^\d,\.]/g, '').replace(',', '.');
    const num = parseFloat(limpo);
    return isNaN(num) ? 999999 : num;
}

/**
 * Move um produto para uma posição específica (1-indexada)
 */
function moverPosicaoProdutoSpins(guildOrClient, id, novaPosicao) {
    const config = getSpinsPassesConfig();
    const produtos = config.produtos || [];
    const idx = produtos.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const [item] = produtos.splice(idx, 1);
    const targetIdx = Math.max(0, Math.min(produtos.length, parseInt(novaPosicao, 10) - 1));
    produtos.splice(targetIdx, 0, item);

    const updated = setSpinsPassesConfig({ produtos });
    sincronizarPainelSpinsAoVivo(guildOrClient, updated);
    return {
        produto: item,
        antigaPosicao: idx + 1,
        novaPosicao: targetIdx + 1,
        produtos
    };
}

/**
 * Move um produto um passo ou diretamente para o topo/fim
 * @param {'up'|'down'|'top'|'bottom'} acao 
 */
function trocarPosicaoProdutoSpins(guildOrClient, id, acao) {
    const config = getSpinsPassesConfig();
    const produtos = config.produtos || [];
    const idx = produtos.findIndex(p => p.id === id);
    if (idx === -1) return null;

    let targetIdx = idx;
    if (acao === 'up') {
        targetIdx = Math.max(0, idx - 1);
    } else if (acao === 'down') {
        targetIdx = Math.min(produtos.length - 1, idx + 1);
    } else if (acao === 'top') {
        targetIdx = 0;
    } else if (acao === 'bottom') {
        targetIdx = produtos.length - 1;
    }

    if (targetIdx !== idx) {
        const [item] = produtos.splice(idx, 1);
        produtos.splice(targetIdx, 0, item);
    }

    const updated = setSpinsPassesConfig({ produtos });
    sincronizarPainelSpinsAoVivo(guildOrClient, updated);
    return {
        produto: produtos[targetIdx],
        antigaPosicao: idx + 1,
        novaPosicao: targetIdx + 1,
        produtos
    };
}

/**
 * Reordena todos os produtos com base em um critério
 * @param {'spins_primeiro'|'passes_primeiro'|'menor_preco'|'maior_preco'|'alfabetico'} modo
 */
function reordenarProdutosSpins(guildOrClient, modo) {
    const config = getSpinsPassesConfig();
    let produtos = [...(config.produtos || [])];

    if (modo === 'spins_primeiro') {
        const spins = produtos.filter(p => p.tipo === 'spin').sort((a, b) => obterValorNumericoPreco(a.preco) - obterValorNumericoPreco(b.preco));
        const passes = produtos.filter(p => p.tipo === 'passe').sort((a, b) => obterValorNumericoPreco(a.preco) - obterValorNumericoPreco(b.preco));
        produtos = [...spins, ...passes];
    } else if (modo === 'passes_primeiro') {
        const passes = produtos.filter(p => p.tipo === 'passe').sort((a, b) => obterValorNumericoPreco(a.preco) - obterValorNumericoPreco(b.preco));
        const spins = produtos.filter(p => p.tipo === 'spin').sort((a, b) => obterValorNumericoPreco(a.preco) - obterValorNumericoPreco(b.preco));
        produtos = [...passes, ...spins];
    } else if (modo === 'menor_preco') {
        produtos.sort((a, b) => obterValorNumericoPreco(a.preco) - obterValorNumericoPreco(b.preco));
    } else if (modo === 'maior_preco') {
        produtos.sort((a, b) => obterValorNumericoPreco(b.preco) - obterValorNumericoPreco(a.preco));
    } else if (modo === 'alfabetico') {
        produtos.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    const updated = setSpinsPassesConfig({ produtos });
    sincronizarPainelSpinsAoVivo(guildOrClient, updated);
    return { modo, produtos };
}

module.exports = {
    listarProdutosSpins,
    formatarPrecoProduto,
    adicionarProdutoSpins,
    removerProdutoSpins,
    atualizarPrecoSpins,
    moverPosicaoProdutoSpins,
    trocarPosicaoProdutoSpins,
    reordenarProdutosSpins,
    sincronizarPainelSpinsAoVivo
};
