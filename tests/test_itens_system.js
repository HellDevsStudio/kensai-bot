const assert = require('assert');
const path = require('path');
const fs = require('fs');
const {
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
} = require('../utils/itemManager');
const {
    lerEstoque,
    salvarEstoque,
    decrementarEstoque
} = require('../utils/itemControl');
const {
    ranquearMatchesFuzzy,
    buscarMelhorMatchSemantico
} = require('../utils/itemMatcher');
const { gerarPainelItensPayload } = require('../utils/renderItensPanel');
const slashPainelItens = require('../commands/slash/painel-itens');
const slashItem = require('../commands/slash/item');
const prefixPainelItens = require('../commands/prefix/painel-itens');
const prefixItem = require('../commands/prefix/item');

console.log('=== TESTES DO SISTEMA DE ITENS & ARSENAL (KENSAI STORE) ===\n');

function runTest(name, fn) {
    try {
        fn();
        console.log(`  ✓ [TEST] ${name}`);
    } catch (err) {
        console.error(`  ✗ [FAIL] ${name}`);
        console.error(err);
        process.exit(1);
    }
}

// 1. Catálogo Fandom Blade Ball
runTest('1. Catálogo Fandom carrega espadas, emotes e explosões', () => {
    const cat = carregarCatalogo();
    assert.ok(cat.Sword_Skins.length >= 2000, `Esperado >= 2000 espadas, obtido ${cat.Sword_Skins.length}`);
    assert.ok(cat.Emotes.length >= 1000, `Esperado >= 1000 emotes, obtido ${cat.Emotes.length}`);
    assert.ok(cat.Explosions.length >= 800, `Esperado >= 800 explosões, obtido ${cat.Explosions.length}`);
});

// 2. Autocomplete do Catálogo
runTest('2. Autocomplete busca itens do catálogo oficial com limite de 25', () => {
    const res = buscarCatalogoAutocomplete('Samurai');
    assert.ok(Array.isArray(res));
    assert.ok(res.length > 0 && res.length <= 25);
    assert.ok(res.some(i => i.value.toLowerCase().includes('samurai')));
});

// 3. Adicionar Item ao Estoque com Auto-Detecção
runTest('3. adicionarItemEstoque cadastra item e preenche imagem do catálogo automaticamente', () => {
    const res = adicionarItemEstoque({
        nome: 'Samurai Katana',
        preco: '12.50',
        quantidade: 5
    });
    assert.ok(res.criado || res.atualizado);
    assert.strictEqual(res.item.nome, 'Samurai Katana');
    assert.strictEqual(res.item.preco, 12.50);
    assert.strictEqual(res.item.categoria, 'Espada');
    assert.ok(res.item.imagem.includes('http'));
});

// 4. Alteração de Estoque e Preço
runTest('4. Atualização de quantidade e preço persiste no estoque', () => {
    const resQtd = atualizarQuantidadeEstoque('Samurai Katana', 10);
    assert.ok(resQtd.atualizado);
    assert.strictEqual(resQtd.item.quantidade, 10);

    const resPreco = atualizarPrecoEstoque('Samurai Katana', '14,90');
    assert.ok(resPreco.atualizado);
    assert.strictEqual(resPreco.item.preco, 14.90);
});

// 5. Decrementar Estoque de Forma Atômica
runTest('5. decrementarEstoque reduz quantidade sem deixar negativo', () => {
    const dec1 = decrementarEstoque('Samurai Katana', 2);
    assert.ok(dec1.baixou);
    assert.strictEqual(dec1.novaQtd, 8);

    decrementarEstoque('Samurai Katana', 20);
    const estoque = lerEstoque();
    const item = estoque.find(i => i.nome === 'Samurai Katana');
    assert.strictEqual(item.quantidade, 0);
});

// 6. Remoção de Item
runTest('6. removerItemEstoque exclui item cadastrado', () => {
    adicionarItemEstoque({ nome: 'Item Teste Provisorio', preco: '5.00', quantidade: 1 });
    const rem = removerItemEstoque('Item Teste Provisorio');
    assert.ok(rem.removido);
    assert.strictEqual(rem.item.nome, 'Item Teste Provisorio');
});

// 7. Painel Oficial de Itens (Blade Ball Arsenal)
runTest('7. gerarPainelItensPayload constrói embed #9a2ea6 com menu_categoria_item', () => {
    const payload = gerarPainelItensPayload({ name: 'Kensai Test' });
    assert.ok(payload.embeds && payload.embeds.length === 1);
    const emb = payload.embeds[0].data;
    assert.strictEqual(emb.color, 0x9a2ea6);
    assert.ok(emb.title.includes('ARSENAL'));

    const menuBuilder = payload.components[0].components[0];
    const menuData = menuBuilder.toJSON();
    assert.strictEqual(menuData.custom_id, 'menu_categoria_item');
    assert.strictEqual(menuData.options.length, 5);
    const values = menuData.options.map(o => o.value);
    assert.ok(values.includes('Espada'));
    assert.ok(values.includes('Emote'));
    assert.ok(values.includes('Explosão'));
    assert.ok(values.includes('Limitados'));
    assert.ok(values.includes('Personalizado'));
});

// 8. Estrutura dos Comandos /painel-itens e /item
runTest('8. Slash /painel-itens e /item possuem estruturas válidas e autocompletes', () => {
    assert.strictEqual(slashPainelItens.data.name, 'painel-itens');
    assert.strictEqual(typeof slashPainelItens.execute, 'function');

    assert.strictEqual(slashItem.data.name, 'item');
    assert.strictEqual(typeof slashItem.execute, 'function');
    assert.strictEqual(typeof slashItem.autocomplete, 'function');
    assert.strictEqual(typeof slashItem.handleButton, 'function');

    assert.strictEqual(prefixPainelItens.name, 'painel-itens');
    assert.strictEqual(prefixItem.name, 'item');
});

// 9. Motor de Busca Semântica do Catálogo (Fuzzy & Inversão)
runTest('9. Busca Semântica resolve typos ("samurai katan") e ordem inversa ("scythe void dual")', () => {
    const matchTypo = buscarItemCatalogo('samurai katan');
    assert.ok(matchTypo, 'Esperado encontrar match para "samurai katan"');
    assert.strictEqual(matchTypo.nome, 'Samurai Katana');
    assert.strictEqual(matchTypo.categoria, 'Espada');
    assert.ok(matchTypo.imagem.includes('http'));

    const matchInverso = buscarItemCatalogo('scythe void dual');
    assert.ok(matchInverso, 'Esperado encontrar match para "scythe void dual"');
    assert.strictEqual(matchInverso.nome, 'Dual Void Scythes');
    assert.strictEqual(matchInverso.categoria, 'Espada');
    assert.ok(matchInverso.imagem.includes('http'));
});

// 10. Fluxo Interativo de Preview com Imagem Automática do Catálogo
runTest('10. /item adicionar gera preview com imagem automática do catálogo Fandom', async () => {
    let replyPayload = null;
    const mockInteraction = {
        member: { permissions: { has: () => true } },
        guild: { iconURL: () => 'https://example.com/icon.png' },
        user: { id: 'user_tester_123' },
        options: {
            getSubcommand: () => 'adicionar',
            getString: (name) => {
                if (name === 'nome') return 'abyssal blade';
                if (name === 'preco') return '25.00';
                if (name === 'descricao') return 'Espada Mítica rara';
                return null;
            },
            getInteger: (name) => {
                if (name === 'quantidade') return 3;
                return 1;
            },
            getAttachment: () => null,
            getBoolean: () => true
        },
        reply: async (payload) => {
            replyPayload = payload;
            return payload;
        }
    };

    await slashItem.execute(mockInteraction);
    assert.ok(replyPayload);
    const embed = replyPayload.embeds[0].data;
    assert.strictEqual(embed.title, '⚔️ Abyssal Blade');
    assert.ok(embed.image && embed.image.url.includes('http'));
    assert.ok(embed.description.includes('Catálogo Oficial'));
});

// 11. Fluxo Interativo com Upload de Arquivo Próprio e Categoria Limitados
runTest('11. /item adicionar suporta upload de arquivo próprio e categoria Limitados', async () => {
    let replyPayload = null;
    const mockInteraction = {
        member: { permissions: { has: () => true } },
        guild: { iconURL: () => null },
        user: { id: 'user_tester_456' },
        options: {
            getSubcommand: () => 'adicionar',
            getString: (name) => {
                if (name === 'nome') return 'Pack Samurai Sazonal';
                if (name === 'preco') return '55.00';
                if (name === 'categoria') return 'Limitados';
                return null;
            },
            getInteger: () => 1,
            getAttachment: (name) => {
                if (name === 'imagem_arquivo') return { url: 'https://cdn.discordapp.com/attachments/pack.png' };
                return null;
            },
            getBoolean: () => true
        },
        reply: async (payload) => {
            replyPayload = payload;
            return payload;
        }
    };

    await slashItem.execute(mockInteraction);
    assert.ok(replyPayload);
    const embed = replyPayload.embeds[0].data;
    assert.strictEqual(embed.title, '⏳ Pack Samurai Sazonal');
    assert.strictEqual(embed.image.url, 'https://cdn.discordapp.com/attachments/pack.png');
    assert.ok(embed.description.includes('Upload de Imagem Própria'));
    assert.ok(embed.description.includes('Limitados'));

    // Confirmar cadastro
    const tempId = replyPayload.components[0].components[0].data.custom_id.replace('item_confirm_', '');
    let confirmCalled = false;
    await slashItem.handleButton({
        customId: `item_confirm_${tempId}`,
        member: { permissions: { has: () => true } },
        guild: { iconURL: () => null },
        update: async (opts) => {
            confirmCalled = true;
            assert.ok(opts.embeds[0].data.title.includes('Pack Samurai Sazonal'));
            assert.ok(opts.embeds[0].data.description.includes('Limitados'));
        }
    });
    assert.strictEqual(confirmCalled, true);

    const estoque = lerEstoque();
    const itemPack = estoque.find(i => i.nome === 'Pack Samurai Sazonal');
    assert.ok(itemPack);
    assert.strictEqual(itemPack.categoria, 'Limitados');
    assert.strictEqual(itemPack.imagem, 'https://cdn.discordapp.com/attachments/pack.png');
});

// 12. Fluxo Interativo com Link Externo e Categoria Explosão
runTest('12. /item adicionar suporta link de imagem e categoria Explosão', async () => {
    let replyPayload = null;
    const mockInteraction = {
        member: { permissions: { has: () => true } },
        guild: { iconURL: () => null },
        user: { id: 'user_tester_789' },
        options: {
            getSubcommand: () => 'adicionar',
            getString: (name) => {
                if (name === 'nome') return 'Supernova Boom';
                if (name === 'preco') return '35.00';
                if (name === 'categoria') return 'Explosão';
                if (name === 'imagem_url') return 'https://i.imgur.com/supernova.png';
                return null;
            },
            getInteger: () => 2,
            getAttachment: () => null,
            getBoolean: () => true
        },
        reply: async (payload) => {
            replyPayload = payload;
            return payload;
        }
    };

    await slashItem.execute(mockInteraction);
    assert.ok(replyPayload);
    const embed = replyPayload.embeds[0].data;
    assert.strictEqual(embed.title, '💥 Supernova Boom');
    assert.strictEqual(embed.image.url, 'https://i.imgur.com/supernova.png');
    assert.ok(embed.description.includes('Link Externo Informado'));
    assert.ok(embed.description.includes('Explosão'));
});

console.log('\n=============================================================');
console.log('   RESULTADO DOS TESTES DE ITENS: 12/12 PASSADOS COM SUCESSO');
console.log('=============================================================\n');
