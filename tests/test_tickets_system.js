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

const {
    gerarPainelPrincipal,
    gerarPainelSuporteConfig,
    gerarPainelTokensConfig,
    gerarPainelItensConfig,
    gerarPainelDespachoPaineis,
    gerarModalConfigTokens
} = require('../utils/configDashboard');

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

console.log('=== TESTES DO SISTEMA DE TICKETS E DASHBOARD INTERATIVO (KENSAI STORE) ===\n');

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

// 2. Painéis Oficiais de Atendimento
runTest('5. Painel de Suporte gera embed com cor #9a2ea6 e botão ticket_abrir_suporte', () => {
    const payload = gerarPainelSuportePayload();
    assert.ok(payload.embeds && payload.embeds.length > 0);
    const emb = payload.embeds[0].data;
    assert.strictEqual(emb.color, 0x9a2ea6);
    assert.ok(emb.title.toLowerCase().includes('suporte'));
    const btnIds = payload.components[0].components.map(c => c.data.custom_id);
    assert.ok(btnIds.includes('ticket_abrir_compra'));
    assert.ok(btnIds.includes('ticket_abrir_suporte'));
    assert.ok(btnIds.includes('ticket_abrir_denuncia'));
});

runTest('6. Painel de Tokens reflete preço dinâmico e opções de compra', () => {
    const payload = gerarPainelTokensPayload();
    assert.ok(payload.embeds && payload.embeds.length > 0);
    const emb = payload.embeds[0].data;
    assert.strictEqual(emb.color, 0x9a2ea6);
    assert.ok(emb.description.includes('R$ 22,50'));
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

// 3. Funções do Ticket Core & Formatação de Logs de Staff
runTest('8. ticketCore expõe todas as operações e contém lógica de Contagem de Mensagens Staff', () => {
    assert.strictEqual(typeof ticketCore.abrirTicket, 'function');
    assert.strictEqual(typeof ticketCore.fecharTicket, 'function');
    assert.strictEqual(typeof ticketCore.assumirTicket, 'function');
    assert.strictEqual(typeof ticketCore.chamarCliente, 'function');
    
    // Verifica presença da formatação exigida pelo usuário
    const coreSource = fs.readFileSync(path.join(__dirname, '..', 'utils', 'ticketCore.js'), 'utf8');
    assert.ok(coreSource.includes('Contagem de Mensagens Staff'));
    assert.ok(coreSource.includes('staffMsgCounts'));
    assert.ok(coreSource.includes('s.mention'));
});

// 4. Painel Central Interativo de Configuração (Dashboard)
runTest('9. Painel Central Interativo (/config) gera botões de navegação sem comandos longos', () => {
    const painel = gerarPainelPrincipal();
    assert.ok(painel.embeds && painel.embeds.length > 0);
    assert.strictEqual(painel.embeds[0].data.color, 0x9a2ea6);
    assert.ok(painel.embeds[0].data.title.includes('Painel Central de Configurações'));
    
    const botoesRow1 = painel.components[0].components.map(c => c.data.custom_id);
    assert.ok(botoesRow1.includes('cfg_nav_suporte'));
    assert.ok(botoesRow1.includes('cfg_nav_tokens'));
    assert.ok(botoesRow1.includes('cfg_nav_itens'));
    
    const botoesRow2 = painel.components[1].components.map(c => c.data.custom_id);
    assert.ok(botoesRow2.includes('cfg_nav_paineis'));
    assert.ok(botoesRow2.includes('cfg_btn_refresh'));
});

runTest('10. Subtelas interativas de Suporte, Tokens e Itens contêm Selects de Categoria, Logs e Cargo', () => {
    const telaSup = gerarPainelSuporteConfig();
    assert.strictEqual(telaSup.components[0].components[0].data.custom_id, 'cfg_sel_sup_cat');
    assert.strictEqual(telaSup.components[1].components[0].data.custom_id, 'cfg_sel_sup_logs');
    assert.strictEqual(telaSup.components[2].components[0].data.custom_id, 'cfg_sel_sup_role');

    const telaTok = gerarPainelTokensConfig();
    assert.strictEqual(telaTok.components[0].components[0].data.custom_id, 'cfg_open_modal_tokens');
    assert.strictEqual(telaTok.components[1].components[0].data.custom_id, 'cfg_sel_tok_cat');

    const telaItn = gerarPainelItensConfig();
    assert.strictEqual(telaItn.components[0].components[0].data.custom_id, 'cfg_sel_itn_cat');

    const modal = gerarModalConfigTokens();
    assert.strictEqual(modal.data.custom_id, 'modal_cfg_tokens');
});

// Cleanup
setSuporteConfig({ categoria_id: null });
setTokensConfig({ preco_por_1k: 18.5, chave_pix: null });

console.log(`\n=======================================================`);
console.log(`   RESULTADO DOS TESTES DE TICKET: ${passed}/${total} PASSADOS`);
console.log(`=======================================================\n`);

if (passed !== total) {
    process.exit(1);
}
