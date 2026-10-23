const assert = require('assert');
const pix = require('../utils/pix');
const slashPix = require('../commands/slash/pix');
const prefixPix = require('../commands/prefix/pix');

async function testPixSystem() {
    console.log('🧪 Iniciando Testes do Sistema Pix - Kensai Store');

    // 1. Teste de CRC16
    console.log('Testando CRC16 BACEN...');
    const payloadTeste = '00020126520014br.gov.bcb.pix0130kensai.store.oficial@gmail.com520400005303986540515.505802BR5919CAROLLINA FERNANDEZ6009SAO PAULO62070503***6304';
    const crc = pix.crc16(payloadTeste);
    console.log('  CRC16 calculado:', crc);
    assert.strictEqual(typeof crc, 'string');
    assert.strictEqual(crc.length, 4);
    assert.strictEqual(/^[0-9A-F]{4}$/.test(crc), true);

    // 2. Teste de Geração de Payload Pix com Beneficiário Carollina Fernandez
    console.log('Testando geração de BR Code com Carollina Fernandez e Mercado Pago...');
    const dados1 = pix.gerarPixPayload({ chave: 'kensai.store.oficial@gmail.com', valor: '15.50' });
    console.log('  Payload 15.50:', dados1.payloadPix);
    assert.strictEqual(dados1.valorFormatado, '15.50');
    assert.strictEqual(dados1.chave, 'kensai.store.oficial@gmail.com');
    assert.strictEqual(dados1.nome, 'Carollina Fernandez');
    assert.strictEqual(dados1.nomeEmv, 'CAROLLINA FERNANDEZ');
    assert.strictEqual(dados1.banco, 'Mercado Pago');
    assert.strictEqual(dados1.payloadPix.includes('kensai.store.oficial@gmail.com'), true);
    assert.strictEqual(dados1.payloadPix.includes('5919CAROLLINA FERNANDEZ'), true);
    assert.strictEqual(dados1.payloadPix.includes('540515.50'), true);
    assert.strictEqual(dados1.payloadPix.endsWith(pix.crc16(dados1.payloadPix.slice(0, -4))), true);

    // 3. Teste do QR Code Buffer
    console.log('Testando geração de buffer PNG do QR Code...');
    const buffer = await pix.gerarQrCodeBuffer(dados1.payloadPix);
    assert.strictEqual(Buffer.isBuffer(buffer), true);
    assert.ok(buffer.length > 500, 'Buffer deve ter tamanho considerável');
    assert.strictEqual(buffer[0], 0x89);
    assert.strictEqual(buffer[1], 0x50);
    assert.strictEqual(buffer[2], 0x4E);
    assert.strictEqual(buffer[3], 0x47);
    console.log(`  Buffer PNG válido gerado (${buffer.length} bytes)`);

    // 4. Teste de Auto-Identificação do Criador do Ticket
    console.log('Testando identificação automática do pagador...');
    const mockChannelId = '1563292609013882943';
    const pagador = pix.identificarPagadorTicket(mockChannelId);
    console.log('  Pagador identificado automaticamente:', pagador);
    assert.ok(pagador !== null);
    assert.strictEqual(pagador.userId, '481153760865812482');
    assert.strictEqual(pagador.protocolo, 'KS-AM6VH0');

    // 5. Teste de Montagem de Cobrança Visual
    console.log('Testando montagem de cobrança visual com Beneficiário e Banco...');
    const cobranca = await pix.gerarCobrancaPixPayload({
        valor: '15.50',
        targetUserId: '481153760865812482',
        channelId: mockChannelId
    });
    assert.ok(cobranca.embeds && cobranca.embeds.length === 1);
    assert.ok(cobranca.files && cobranca.files.length === 1);
    assert.ok(cobranca.components && cobranca.components.length === 1);
    const embedData = cobranca.embeds[0].data;
    assert.strictEqual(embedData.title, '💳 Cobrança Pix • R$ 15,50');
    assert.ok(embedData.description.includes('kensai.store.oficial@gmail.com'));
    assert.ok(embedData.description.includes('Carollina Fernandez'));
    assert.ok(embedData.description.includes('Mercado Pago'));
    assert.ok(embedData.description.includes('<@481153760865812482>'));
    console.log('  Embed e botões montados com sucesso.');

    // 6. Teste da Estrutura dos Comandos
    console.log('Testando estrutura do comando Slash /pix...');
    assert.strictEqual(slashPix.data.name, 'pix');
    assert.strictEqual(typeof slashPix.execute, 'function');
    assert.strictEqual(typeof slashPix.handleButton, 'function');

    console.log('Testando estrutura do comando Prefixo k!pix...');
    assert.strictEqual(prefixPix.name, 'pix');
    assert.ok(prefixPix.aliases.includes('gerarpix'));
    assert.ok(prefixPix.aliases.includes('cobrar'));
    assert.strictEqual(typeof prefixPix.execute, 'function');

    console.log('\n🎉 TODOS OS TESTES DO SISTEMA PIX PASSARAM COM 100% DE SUCESSO!');
}

testPixSystem().catch(err => {
    console.error('❌ Falha nos testes:', err);
    process.exit(1);
});