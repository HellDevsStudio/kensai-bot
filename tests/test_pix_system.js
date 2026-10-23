const assert = require('assert');
const path = require('path');
const fs = require('fs');
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

    // 5. Teste de Montagem de Cobrança Visual e Botão de Confirmação
    console.log('Testando montagem de cobrança com os 3 botões (Copiar Código, Copiar Chave, Confirmar Pix)...');
    const cobranca = await pix.gerarCobrancaPixPayload({
        valor: '15.50',
        targetUserId: '481153760865812482',
        channelId: mockChannelId
    });
    assert.ok(cobranca.embeds && cobranca.embeds.length === 1);
    assert.ok(cobranca.files && cobranca.files.length === 1);
    assert.ok(cobranca.components && cobranca.components.length === 1);
    const buttons = cobranca.components[0].components;
    assert.strictEqual(buttons.length, 3, 'Deve conter 3 botões');
    assert.ok(buttons[0].data.custom_id.startsWith('btn_copiar_pix_'));
    assert.ok(buttons[1].data.custom_id.startsWith('btn_chave_pix_'));
    assert.ok(buttons[2].data.custom_id.startsWith('btn_confirmar_pix_'));
    assert.strictEqual(buttons[2].data.label, 'Confirmar Pix');

    const embedData = cobranca.embeds[0].data;
    assert.strictEqual(embedData.title, '💳 Cobrança Pix • R$ 15,50');
    assert.ok(embedData.description.includes('kensai.store.oficial@gmail.com'));
    assert.ok(embedData.description.includes('Carollina Fernandez'));
    assert.ok(embedData.description.includes('Mercado Pago'));
    assert.ok(embedData.description.includes('<@481153760865812482>'));
    assert.strictEqual(embedData.description.includes('```'), false, 'Não deve conter bloco de código no embed');
    console.log('  Embed e os 3 botões montados com sucesso.');

    // 6. Teste da Imagem Oficial de Confirmação
    console.log('Verificando asset de confirmação do Pix...');
    const assetPath = path.join(__dirname, '../kensai_assets/Desire_for_him_and_money_20261023185045.png');
    assert.ok(fs.existsSync(assetPath), 'Arquivo Desire_for_him_and_money_20261023185045.png deve existir');
    console.log('  Asset de confirmação verificado com sucesso.');

    // 7. Teste de Permissão de Staff no Botão Confirmar Pix
    console.log('Testando bloqueio de não-staff no botão Confirmar Pix...');
    let replyContent = null;
    const mockInteractionNaoStaff = {
        customId: buttons[2].data.custom_id,
        member: { permissions: { has: () => false }, roles: { cache: new Map() } },
        reply: async (obj) => { replyContent = obj.content; }
    };
    await pix.handlePixButton(mockInteractionNaoStaff);
    assert.ok(replyContent && replyContent.includes('Apenas membros da Staff'), 'Membro não-staff deve ser bloqueado');
    console.log('  Bloqueio de segurança para não-staff validado!');

    // 8. Teste de Confirmação por Membro Staff (Admin)
    console.log('Testando confirmação por membro Staff (substituição por imagem oficial)...');
    let updatedPayload = null;
    let channelMsgSent = null;
    const mockInteractionStaff = {
        customId: buttons[2].data.custom_id,
        member: { permissions: { has: () => true }, roles: { cache: new Map() } },
        user: { id: '999888777', username: 'StaffAdmin' },
        channelId: mockChannelId,
        guild: { iconURL: () => null },
        update: async (obj) => { updatedPayload = obj; },
        channel: { send: async (obj) => { channelMsgSent = obj; } }
    };
    await pix.handlePixButton(mockInteractionStaff);
    assert.ok(updatedPayload !== null, 'Mensagem deve ter sido atualizada com update()');
    assert.strictEqual(updatedPayload.embeds[0].data.title, '✅ Pagamento Confirmado • R$ 15,50');
    assert.strictEqual(updatedPayload.embeds[0].data.image.url, 'attachment://pix_confirmado.png');
    assert.strictEqual(updatedPayload.files[0].name, 'pix_confirmado.png');
    assert.strictEqual(updatedPayload.components[0].components[0].data.disabled, true);
    assert.ok(channelMsgSent !== null, 'Notificação no canal deve ser enviada');
    console.log('  Confirmação Staff com substituição da imagem pelo banner oficial validada!');

    // 9. Teste da Estrutura dos Comandos
    console.log('Testando comandos Slash e Prefixo...');
    assert.strictEqual(slashPix.data.name, 'pix');
    assert.strictEqual(prefixPix.name, 'pix');

    console.log('\n🎉 TODOS OS TESTES DO SISTEMA PIX PASSARAM COM 100% DE SUCESSO!');
}

testPixSystem().catch(err => {
    console.error('❌ Falha nos testes:', err);
    process.exit(1);
});