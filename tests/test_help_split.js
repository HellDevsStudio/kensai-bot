const assert = require('assert');
const path = require('path');

const root = 'C:\\Users\\kaleb\\Downloads\\HellDevs Bots\\kensai-bot';
const slashHelp = require(path.join(root, 'commands/slash/help'));
const prefixHelp = require(path.join(root, 'commands/prefix/help'));
const slashHelpStaff = require(path.join(root, 'commands/slash/helpstaff'));
const prefixHelpStaff = require(path.join(root, 'commands/prefix/helpstaff'));

async function testHelpSplit() {
    console.log('🧪 Iniciando Testes de Separação de /help (Clientes) e /helpstaff (Staff)...');

    // 1. Teste do /help (Clientes)
    console.log('1. Testando /help normal para clientes (sem comandos de adm)...');
    assert.strictEqual(slashHelp.data.name, 'help');
    assert.strictEqual(typeof slashHelp.execute, 'function');
    assert.strictEqual(typeof slashHelp.handleSelect, 'function');

    let replyHelp = null;
    const mockInteractionCliente = {
        reply: async (obj) => { replyHelp = obj; }
    };
    await slashHelp.execute(mockInteractionCliente);
    assert.ok(replyHelp !== null);
    const menuOptions = replyHelp.components[0].components[0].options;
    const optionValues = menuOptions.map(o => o.data.value);
    console.log('  Categorias do /help de Clientes:', optionValues);

    // Garante que são APENAS as categorias de clientes e NÃO contém staff
    assert.strictEqual(optionValues.includes('staff'), false, 'Menu de clientes NÃO pode conter categoria staff');
    assert.strictEqual(optionValues.includes('mod'), false, 'Menu de clientes NÃO pode conter categoria mod');
    assert.strictEqual(optionValues.includes('adm'), false, 'Menu de clientes NÃO pode conter categoria adm');
    assert.deepStrictEqual(optionValues, ['util', 'loja', 'fun', 'rp']);

    // Teste de handleSelect de clientes
    let updateHelp = null;
    await slashHelp.handleSelect({
        update: async (obj) => { updateHelp = obj; }
    }, 'loja');
    assert.ok(updateHelp !== null);
    assert.ok(updateHelp.embeds[0].data.description.includes('/avaliar'));
    console.log('  /help para clientes validado com sucesso!');

    // 2. Teste do prefixo k!help
    console.log('2. Testando prefixo k!help para clientes...');
    assert.strictEqual(prefixHelp.name, 'help');
    assert.ok(prefixHelp.aliases.includes('ajuda'));
    let replyPrefixHelp = null;
    await prefixHelp.execute({
        reply: async (obj) => { replyPrefixHelp = obj; }
    });
    assert.ok(replyPrefixHelp !== null);
    const prefixMenuOptions = replyPrefixHelp.components[0].components[0].options.map(o => o.data.value);
    assert.strictEqual(prefixMenuOptions.includes('staff'), false);
    console.log('  k!help para clientes validado com sucesso!');

    // 3. Teste do /helpstaff (Bloqueio para não-staff)
    console.log('3. Testando bloqueio de não-staff em /helpstaff...');
    assert.strictEqual(slashHelpStaff.data.name, 'helpstaff');
    let replyNaoStaff = null;
    const mockNaoStaff = {
        member: { permissions: { has: () => false }, roles: { cache: new Map() } },
        reply: async (obj) => { replyNaoStaff = obj; }
    };
    await slashHelpStaff.execute(mockNaoStaff);
    assert.ok(replyNaoStaff !== null);
    assert.ok(replyNaoStaff.content.includes('Acesso negado'));
    console.log('  Bloqueio de segurança em /helpstaff validado!');

    // 4. Teste do /helpstaff para membro Staff
    console.log('4. Testando execução de /helpstaff para membro Staff...');
    let replyStaff = null;
    const mockStaff = {
        member: { permissions: { has: () => true }, roles: { cache: new Map() } },
        reply: async (obj) => { replyStaff = obj; }
    };
    await slashHelpStaff.execute(mockStaff);
    assert.ok(replyStaff !== null);
    assert.strictEqual(replyStaff.flags.length, 1, 'Deve ser efêmero para privacidade');
    const staffOptions = replyStaff.components[0].components[0].options.map(o => o.data.value);
    console.log('  Categorias do /helpstaff:', staffOptions);
    assert.deepStrictEqual(staffOptions, ['vendas', 'adm', 'mod']);

    // Teste de seleção de categoria vendas no helpstaff
    let updateStaff = null;
    await slashHelpStaff.handleSelect({
        member: { permissions: { has: () => true }, roles: { cache: new Map() } },
        update: async (obj) => { updateStaff = obj; }
    }, 'vendas');
    assert.ok(updateStaff !== null);
    assert.ok(updateStaff.embeds[0].data.description.includes('/pix'));
    assert.ok(updateStaff.embeds[0].data.description.includes('/avaliar'));
    assert.ok(updateStaff.embeds[0].data.description.includes('/item'));
    console.log('  Comandos de vendas e finanças presentes no /helpstaff!');

    // 5. Teste do prefixo k!helpstaff
    console.log('5. Testando prefixo k!helpstaff...');
    assert.strictEqual(prefixHelpStaff.name, 'helpstaff');
    assert.ok(prefixHelpStaff.aliases.includes('staffhelp'));
    let replyPrefixStaff = null;
    await prefixHelpStaff.execute({
        member: { permissions: { has: () => true }, roles: { cache: new Map() } },
        reply: async (obj) => { replyPrefixStaff = obj; }
    });
    assert.ok(replyPrefixStaff !== null);
    console.log('  k!helpstaff validado com sucesso!');

    console.log('\n🎉 TODOS OS TESTES DE /help E /helpstaff PASSARAM COM 100% DE SUCESSO!');
}

testHelpSplit().catch(err => {
    console.error('❌ Falha nos testes:', err);
    process.exit(1);
});
