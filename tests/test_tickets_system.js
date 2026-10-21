const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { 
    getSuporteConfig, setSuporteConfig,
    getTokensConfig, setTokensConfig,
    getItensConfig, setItensConfig
} = require('../utils/ticketConfigs');

const { 
    gerarPainelSuportePayload, 
    gerarPainelTokensPayload, 
    gerarPainelItensPayload 
} = require('../utils/ticketPanels');

const ticketCore = require('../utils/ticketCore');
const slashConfig = require('../commands/slash/config');
const prefixConfig = require('../commands/prefix/config');

let passed = 0;
let total = 0;

function runTest(desc, fn) {
    total++;
    try {
        fn();
        passed++;
        console.log(`  ✓ [TICKET TEST ${total}] ${desc}`);
    } catch (e) {
        console.error(`  ❌ [TICKET TEST ${total}] ${desc} -> ${e.message}`);
    }
}

console.log('=== TESTES DO SISTEMA DE TICKETS E CONFIGS (KENSAI STORE) ===\n');

// 1. Arquivos de Configuração Atômicos
runTest('1. Leitura de suporte.json retorna estrutura padrão válida', () => {
    const cfg = getSuporteConfig();
    assert.ok(typeof cfg === 'object');
    assert.ok('categoria_id' in cfg);
    assert.ok('canal_logs_id' in cfg);
    assert.ok('cargo_staff_id' in cfg);
});

runTest('2. Atualização de suporte.json persiste campos de forma atômica', () => {
    const updated = setSuporteConfig({ categoria_id: '123456789012345678' });
    assert.strictEqual(updated.categoria_id, '123456789012345678');
    const reread = getSuporteConfig();
    assert.strictEqual(reread.categoria_id, '123456789012345678');
});

runTest('3. Leitura e escrita de tokens.json mantém preço por 1k e chave Pix', () => {
    setTokensConfig({ preco_por_1k: 22.50, chave_pix: 'pix@kensaistore.com' });
    const tok = getTokensConfig();
    assert.strictEqual(tok.preco_por_1k, 22.50);
    assert.strictEqual(tok.chave_pix, 'pix@kensaistore.com');
});

runTest('4. Leitura e catálogo de itens.json contém produtos cadastrados', () => {
    const itn = getItensConfig();
    assert.ok(Array.isArray(itn.itens));
    assert.ok(itn.itens.length >= 3);
    assert.ok(itn.itens.some(i => i.id === 'katana_kensai'));
});

// 2. Painéis Interativos
runTest('5. Painel de Suporte gera embed com cor #9a2ea6 e botão ticket_abrir_suporte', () => {
    const payload = gerarPainelSuportePayload();
    assert.ok(payload.embeds && payload.embeds.length > 0);
    const emb = payload.embeds[0].data;
    assert.strictEqual(emb.color, 0x9a2ea6);
    assert.ok(emb.title.includes('Suporte'));
    assert.strictEqual(payload.components[0].components[0].data.custom_id, 'ticket_abrir_suporte');
});

runTest('6. Painel de Tokens reflete preço dinâmico e opções de compra', () => {
    const payload = gerarPainelTokensPayload();
    assert.ok(payload.embeds && payload.embeds.length > 0);
    const emb = payload.embeds[0].data;
    assert.strictEqual(emb.color, 0x9a2ea6);
    assert.ok(emb.description.includes('R$ 22,50'));
    // Select menu e botão de customizado
    const select = payload.components[0].components[0];
    assert.strictEqual(select.data.custom_id, 'token_comprar_select');
    const btn = payload.components[1].components[0];
    assert.strictEqual(btn.data.custom_id, 'token_comprar_custom');
});

runTest('7. Painel de Itens gera Select com opções ativas do catálogo', () => {
    const payload = gerarPainelItensPayload();
    const select = payload.components[0].components[0];
    assert.strictEqual(select.data.custom_id, 'item_comprar_select');
    assert.ok(select.options.length >= 3);
});

// 3. Funções do Ticket Core
runTest('8. ticketCore expõe todas as 4 operações vitais', () => {
    assert.strictEqual(typeof ticketCore.abrirTicket, 'function');
    assert.strictEqual(typeof ticketCore.fecharTicket, 'function');
    assert.strictEqual(typeof ticketCore.assumirTicket, 'function');
    assert.strictEqual(typeof ticketCore.chamarCliente, 'function');
});

// 4. Comandos /config e k!config
runTest('9. Slash /config possui todos os 5 subcomandos (ver, painel, suporte, tokens, itens)', () => {
    assert.strictEqual(slashConfig.data.name, 'config');
    const subs = slashConfig.data.options.map(o => o.name);
    assert.ok(subs.includes('ver'));
    assert.ok(subs.includes('painel'));
    assert.ok(subs.includes('suporte'));
    assert.ok(subs.includes('tokens'));
    assert.ok(subs.includes('itens'));
});

runTest('10. Prefix k!config possui aliases necessários incluindo h!config', () => {
    assert.strictEqual(prefixConfig.name, 'config');
    assert.ok(prefixConfig.aliases.includes('h!config'));
    assert.ok(prefixConfig.aliases.includes('setup'));
});

console.log(`\n=======================================================`);
console.log(`   RESULTADO DOS TESTES DE TICKET: ${passed}/${total} PASSADOS`);
console.log(`=======================================================\n`);

setSuporteConfig({ categoria_id: null });
setTokensConfig({ preco_por_1k: 18.5, chave_pix: null });
if (passed !== total) {
    process.exit(1);
}
